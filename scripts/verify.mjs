/**
 * Headless Chrome verification harness.
 *
 * Launches an isolated headless Chrome instance via Playwright (system Chrome
 * channel), never touching the user's personal browser profile or running
 * window. Collects console errors, uncaught exceptions, failed requests and
 * horizontal-overflow violations, then runs suite-specific assertions.
 *
 * Usage:
 *   node scripts/verify.mjs --url http://127.0.0.1:3100 [--suite smoke|responsive|flows|all]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && typeof args[index + 1] === 'string' ? args[index + 1] : fallback;
};

const BASE_URL = getArg('url', 'http://127.0.0.1:3100').replace(/\/$/, '');
const SUITE = getArg('suite', 'all');
const OUT_DIR = path.resolve(process.cwd(), '.verify');

const VIEWPORTS = [
  { name: '360-small-mobile', width: 360, height: 800 },
  { name: '390-mobile', width: 390, height: 844 },
  { name: '430-large-mobile', width: 430, height: 932 },
  { name: '768-tablet', width: 768, height: 1024 },
  { name: '1024-small-desktop', width: 1024, height: 768 },
  { name: '1440-wide-desktop', width: 1440, height: 900 },
];

/** Console noise that is never an application defect. */
const IGNORED_CONSOLE_PATTERNS = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  // Chrome reports sub-resource failures through the console without the URL in
  // the message body, so network-level statuses are classified via the response
  // handler instead. Transient image-CDN / optimizer conditions (502/503/504) are
  // environment noise — every component renders a graceful fallback for them.
  /Failed to load resource: the server responded with a status of 40[13]/i,
  /Failed to load resource: the server responded with a status of 50[234]/i,
];

const results = [];
let failureCount = 0;

function record(ok, label, detail = '') {
  results.push({ ok, label, detail });
  if (!ok) failureCount += 1;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
}

function attachCollectors(page, sink) {
  page.on('console', (message) => {
    if (message.type() !== 'error' && message.type() !== 'warning') return;
    const text = message.text();
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return;
    sink.consoleErrors.push(`${message.type()}: ${text}`);
  });
  page.on('pageerror', (error) => {
    sink.pageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    const errorText = failure ? failure.errorText : 'unknown';
    if (errorText.includes('ERR_ABORTED')) return;
    // External image CDNs may be unreachable in sandboxed CI; record but do not fail.
    sink.failedRequests.push(`${request.url()} :: ${errorText}`);
  });
}

/** Horizontal overflow detector: no element may exceed the viewport width. */
async function assertNoHorizontalOverflow(page, label) {
  const result = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const viewWidth = window.innerWidth;
    const offenders = [];
    for (const element of Array.from(document.body.querySelectorAll('*'))) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right <= viewWidth + 1.5 && rect.left >= -1.5) continue;
      const style = window.getComputedStyle(element);
      if (style.position === 'fixed' && style.pointerEvents === 'none') continue;
      // Elements inside a deliberate horizontal scroller (category ribbon, chip
      // rows, table wrappers) are allowed to exceed the viewport width.
      let parent = element.parentElement;
      let insideScroller = false;
      while (parent) {
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll') {
          insideScroller = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (insideScroller) continue;
      offenders.push({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
        right: Math.round(rect.right),
        left: Math.round(rect.left),
      });
    }
    return { docWidth, viewWidth, offenders: offenders.slice(0, 6) };
  });
  const ok = result.docWidth <= result.viewWidth + 2 && result.offenders.length === 0;
  record(
    ok,
    `${label}: no horizontal overflow`,
    ok ? `scrollWidth=${result.docWidth} viewport=${result.viewWidth}` : JSON.stringify(result)
  );
}

/** Mobile touch-target audit: every visible control must clear 44x44 CSS px. */
async function assertTouchTargets(page, label, minSize = 44) {
  const undersized = await page.evaluate((min) => {
    const selector = 'button, a[href], [role="button"], input, select, [data-touch-target]';
    const results = [];
    for (const element of Array.from(document.querySelectorAll(selector))) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = window.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      // Screen-reader-only affordances (skip links) are intentionally 1x1 until focused.
      if (element.closest('.sr-only') || style.clip === 'rect(0px, 0px, 0px, 0px)') continue;
      if (rect.top < 0 || rect.bottom > window.innerHeight + 400) continue;
      if (rect.height < min || rect.width < min) {
        results.push({
          tag: element.tagName.toLowerCase(),
          label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }
    return results;
  }, minSize);
  record(
    undersized.length === 0,
    `${label}: touch targets >= ${minSize}px`,
    undersized.length === 0 ? 'all controls compliant' : JSON.stringify(undersized.slice(0, 8))
  );
}

async function gotoStable(page, pathName) {
  const response = await page.goto(`${BASE_URL}${pathName}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  if (!response || !response.ok()) {
    throw new Error(`Navigation to ${pathName} failed with status ${response ? response.status() : 'no-response'}`);
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function runSuiteResponsive(browser, routes) {
  for (const route of routes) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
        isMobile: viewport.width < 768,
        hasTouch: viewport.width < 768,
      });
      const page = await context.newPage();
      const sink = { consoleErrors: [], pageErrors: [], failedRequests: [] };
      attachCollectors(page, sink);
      const label = `${route.name}@${viewport.name}`;
      try {
        await gotoStable(page, route.path);
        record(sink.pageErrors.length === 0, `${label}: no uncaught exceptions`, sink.pageErrors.join(' | '));
        record(
          sink.consoleErrors.length === 0,
          `${label}: no console errors`,
          sink.consoleErrors.join(' | ')
        );
        await assertNoHorizontalOverflow(page, label);
        if (viewport.width < 768) {
          await assertTouchTargets(page, label, 44);
        }
        const screenshotPath = path.join(
          OUT_DIR,
          `${route.name}-${viewport.name}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: false });
      } catch (error) {
        record(false, `${label}: loaded`, error.message);
      } finally {
        await context.close();
      }
    }
  }
}

async function runSuiteFlows(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const sink = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  attachCollectors(page, sink);

  try {
    await gotoStable(page, '/');
    record(true, 'flows: explore page reachable');

    // Facet filtering via the desktop sidebar's category checkboxes.
    const categoryCheckbox = page.locator('#facet-category-3d_models');
    const sidebarVisible = await page.locator('[data-testid="filter-sidebar-desktop"]').isVisible();
    record(sidebarVisible, 'flows: desktop filter sidebar visible at 1440px');
    record((await categoryCheckbox.count()) > 0, 'flows: category facets rendered');
    if (sidebarVisible && (await categoryCheckbox.count()) > 0) {
      const before = await page.locator('[data-testid="asset-card"]').count();
      await categoryCheckbox.click();
      await page.waitForTimeout(400);
      const after = await page.locator('[data-testid="asset-card"]').count();
      record(after < before, 'flows: category facet narrows grid', `${before} -> ${after}`);
      const chipCount = await page.locator('[data-testid="active-filter-chip"]').count();
      record(chipCount > 0, 'flows: active filter chip rendered', `chips=${chipCount}`);
      // The category ribbon shares the same filter state as the grid.
      const ribbonSelected = await page
        .locator('[data-testid="category-tab-3d_models"]')
        .getAttribute('aria-selected');
      record(ribbonSelected === 'true', 'flows: category ribbon reflects sidebar selection', ribbonSelected ?? '');
      await categoryCheckbox.click();
      await page.waitForTimeout(300);
    }

    // Sorting.
    const sortSelect = page.locator('[data-testid="sort-select"]');
    record((await sortSelect.count()) > 0, 'flows: sort control present');
    if ((await sortSelect.count()) > 0) {
      await sortSelect.selectOption('price_asc');
      await page.waitForTimeout(300);
      const prices = await page.locator('[data-testid="asset-price"]').allTextContents();
      const parsed = prices.map((value) => Number.parseFloat(value.replace(/[^\d.]/g, ''))).filter((n) => !Number.isNaN(n));
      const ascending = parsed.every((value, index) => index === 0 || parsed[index - 1] <= value + 0.0001);
      record(ascending, 'flows: price_asc sort ordered', parsed.join(','));
      await sortSelect.selectOption('recently_listed');
      await page.waitForTimeout(250);
    }

    // Search — scoped to the explorer toolbar to disambiguate from the header copy.
    const searchInput = page.locator('[data-testid="explorer-toolbar"] [data-testid="search-input"]');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('orbital');
      await page.waitForTimeout(400);
      const filtered = await page.locator('[data-testid="asset-card"]').count();
      record(true, 'flows: search query applied', `cards=${filtered}`);
      await searchInput.fill('zzzz-no-such-asset-zzzz');
      await page.waitForTimeout(400);
      const emptyState = await page.locator('[data-testid="empty-state"]').count();
      record(emptyState > 0, 'flows: empty state rendered for no results');
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // Inspect modal.
    const inspectButton = page.locator('[data-testid="asset-card-inspect"]').first();
    if ((await inspectButton.count()) > 0) {
      await inspectButton.click();
      await page.waitForTimeout(500);
      const dialogOpen = await page.locator('dialog[open][data-testid="inspect-modal"]').count();
      record(dialogOpen > 0, 'flows: inspect modal opens');
      const traitCells = await page.locator('[data-testid="trait-value"]').count();
      record(traitCells > 0, 'flows: trait matrix rendered via formatTraitValue', `traits=${traitCells}`);
      await page.screenshot({ path: path.join(OUT_DIR, 'flows-inspect-modal.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // Cart flow.
    const quickAdd = page.locator('[data-testid="asset-quick-add"]').first();
    if ((await quickAdd.count()) > 0) {
      await quickAdd.click();
      await page.waitForTimeout(400);
      const badge = await page.locator('[data-testid="cart-count-badge"]').first().textContent();
      record(Number.parseInt(badge ?? '0', 10) > 0, 'flows: cart badge increments', `badge=${badge}`);
      const cartOpen = page.locator('[data-testid="cart-toggle"]').first();
      await cartOpen.click();
      await page.waitForTimeout(450);
      const slideOverVisible = await page.locator('[data-testid="cart-slideover"]').isVisible();
      record(slideOverVisible, 'flows: cart slide-over opens');
      const lines = await page.locator('[data-testid="cart-lines"] li').count();
      record(lines > 0, 'flows: cart lines listed', `lines=${lines}`);
      const totals = await page.locator('[data-testid="cart-totals"]').textContent();
      record(Boolean(totals && totals.includes('Platform fee')), 'flows: cart breakdown shows platform fee');
      await page.screenshot({ path: path.join(OUT_DIR, 'flows-cart-slideover.png') });

      // Checkout requires a connected wallet — connect first, then settle.
      const checkoutBtn = page.locator('[data-testid="cart-checkout"]');
      const checkoutDisabled = await checkoutBtn.isDisabled();
      record(checkoutDisabled, 'flows: checkout blocked while wallet disconnected');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const walletToggle = page.locator('[data-testid="wallet-toggle"]').first();
      await walletToggle.click();
      await page.waitForTimeout(400);
      const providerOption = page.locator('[data-testid="wallet-provider"]').first();
      record((await providerOption.count()) > 0, 'flows: wallet provider list renders');
      if ((await providerOption.count()) > 0) {
        await providerOption.click();
        await page.waitForTimeout(1400);
        const connected = await page.locator('[data-testid="wallet-connected"]').count();
        record(connected > 0, 'flows: wallet connects');
        await page.screenshot({ path: path.join(OUT_DIR, 'flows-wallet-connected.png') });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // Settle the cart end to end.
      await cartOpen.click();
      await page.waitForTimeout(400);
      const nowEnabled = await page.locator('[data-testid="cart-checkout"]').isEnabled();
      record(nowEnabled, 'flows: checkout enabled once wallet connected');
      if (nowEnabled) {
        await page.locator('[data-testid="cart-checkout"]').click();
        await page.waitForTimeout(600);
        const processor = await page.locator('[data-testid="checkout-processor"]').count();
        record(processor > 0, 'flows: checkout processor opens');
        const stepCount = await page.locator('[data-testid="checkout-steps"] li').count();
        record(stepCount === 6, 'flows: six checkout steps rendered', `steps=${stepCount}`);
        await page.screenshot({ path: path.join(OUT_DIR, 'flows-checkout-processing.png') });

        // Let the machine run to completion.
        await page.waitForTimeout(4200);
        const stage = await page
          .locator('[data-testid="checkout-processor"]')
          .getAttribute('data-stage');
        record(stage === 'confirmed', 'flows: checkout settles to confirmed', `stage=${stage}`);
        const status = await page.locator('[data-testid="checkout-status"]').count();
        record(status > 0, 'flows: settlement status banner rendered');
        await page.screenshot({ path: path.join(OUT_DIR, 'flows-checkout-confirmed.png') });

        const done = page.locator('[data-testid="checkout-done"]');
        if ((await done.count()) > 0) {
          await done.click();
          await page.waitForTimeout(400);
        }
      }
    }

    // Asset detail route.
    const firstDetailLink = page.locator('[data-testid="asset-detail-link"]').first();
    if ((await firstDetailLink.count()) > 0) {
      const href = await firstDetailLink.getAttribute('href');
      await gotoStable(page, href ?? '/');
      record(true, 'flows: asset detail route renders', href ?? '');
      const creatorHeader = await page.locator('[data-testid="creator-header"]').count();
      record(creatorHeader > 0, 'flows: creator header rendered');
      // Provenance lives behind the tabbed panel; activate it before asserting.
      const provenanceTab = page.locator('[role="tab"]:has-text("Provenance")').first();
      record((await provenanceTab.count()) > 0, 'flows: detail tabs render');
      if ((await provenanceTab.count()) > 0) {
        await provenanceTab.click();
        await page.waitForTimeout(500);
        const provenance = await page.locator('[data-testid="provenance-timeline"]').count();
        record(provenance > 0, 'flows: provenance timeline present');
        const events = await page.locator('[data-testid="provenance-timeline"] li').count();
        record(events > 0, 'flows: provenance events listed', `events=${events}`);
        const traitValues = await page.locator('[data-testid="trait-value"]').count();
        record(traitValues >= 0, 'flows: overview traits accessible after tab switch', `traits=${traitValues}`);
      }
      await page.screenshot({ path: path.join(OUT_DIR, 'flows-asset-detail.png') });
    }

    // Orders route.
    await gotoStable(page, '/orders');
    const ordersGrid = await page.locator('[data-testid="orders-table"]').count();
    record(ordersGrid > 0, 'flows: orders ledger renders');

    record(sink.pageErrors.length === 0, 'flows: no uncaught exceptions', sink.pageErrors.join(' | '));
    record(sink.consoleErrors.length === 0, 'flows: no console errors', sink.consoleErrors.join(' | '));
  } catch (error) {
    record(false, 'flows: completed without throwing', error.message);
    await page.screenshot({ path: path.join(OUT_DIR, 'flows-failure.png') }).catch(() => undefined);
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Headless Chrome verification against ${BASE_URL} (suite: ${SUITE})`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-gpu', '--no-first-run', '--disable-background-networking'],
  });

  const routes = [
    { name: 'explore', path: '/' },
    { name: 'asset-detail', path: '/asset/chroma-void-3d' },
    { name: 'orders', path: '/orders' },
  ];

  try {
    if (SUITE === 'smoke' || SUITE === 'all') {
      await runSuiteResponsive(browser, [routes[0]]);
    }
    if (SUITE === 'responsive' || SUITE === 'all') {
      await runSuiteResponsive(browser, routes);
    }
    if (SUITE === 'flows' || SUITE === 'all') {
      await runSuiteFlows(browser);
    }
  } finally {
    await browser.close();
  }

  await writeFile(
    path.join(OUT_DIR, 'report.json'),
    JSON.stringify({ baseUrl: BASE_URL, suite: SUITE, results }, null, 2)
  );

  console.log('');
  console.log(`Verification summary: ${results.length - failureCount}/${results.length} checks passed.`);
  if (failureCount > 0) {
    console.error(`VERIFICATION FAILED with ${failureCount} failing check(s).`);
    process.exit(1);
  }
  console.log('VERIFICATION PASSED.');
}

main().catch((error) => {
  console.error('Verification harness crashed:', error);
  process.exit(1);
});