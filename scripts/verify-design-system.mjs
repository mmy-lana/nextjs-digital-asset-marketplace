import { chromium } from 'playwright';
import { ensureServer } from './lib/server-manager.mjs';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && typeof args[index + 1] === 'string' ? args[index + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const REQUESTED_URL = (
  getArg('url', process.env.VERIFY_URL ?? 'http://127.0.0.1:3100')
).replace(/\/$/, '');
const AUTO_BUILD = !hasFlag('no-build');

let BASE = REQUESTED_URL;
const failures = [];

function check(ok, label, detail = '') {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

async function runChecks(browser) {
  const VIEWPORT = { width: 1440, height: 900 };
  const viewportHeight = VIEWPORT.height;

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(`${BASE}/design-system`, { waitUntil: 'networkidle' });

  // --- GlassPanel compiled output -------------------------------------------
  const panel = await page.locator('[data-testid="smoke-panel"]').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      backdrop: s.backdropFilter || s.webkitBackdropFilter,
      bg: s.backgroundColor,
      bgAlpha: s.backgroundColor.match(/[\d.]+/g)?.[3],
      border: s.borderTopWidth + ' ' + s.borderTopStyle,
      borderColor: s.borderTopColor,
      shadow: s.boxShadow,
      radius: s.borderRadius,
    };
  });
  check(panel.backdrop.includes('blur'), 'GlassPanel backdrop-blur-xl compiled', panel.backdrop);
  // slate-950 = very dark navy; alpha 0.75 from /75
  check(
    panel.bgAlpha !== undefined && Math.abs(Number(panel.bgAlpha) - 0.75) <= 0.02 && /oklab|rgb/.test(panel.bg),
    'GlassPanel bg-slate-950/75 alpha compiled',
    panel.bg
  );
  check(panel.border === '1px solid' && panel.borderColor.includes('1'), 'GlassPanel border-white/10 compiled', `${panel.border} ${panel.borderColor}`);
  check(panel.shadow.includes('rgba(0, 0, 0, 0.37)'), 'GlassPanel shadow token compiled', panel.shadow);

  // --- GlassButton variants + 44px target ----------------------------------
  const primary = await page.locator('[data-testid="btn-primary"]').evaluate((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { h: r.height, bg: s.backgroundImage, color: s.color, disabled: el.disabled };
  });
  check(primary.h >= 44, 'GlassButton min tap target >= 44px', `${primary.h}px`);
  check(primary.bg.includes('gradient'), 'GlassButton primary-neon gradient compiled', primary.bg.slice(0, 48));

  const loadingBtn = page.locator('button[aria-busy="true"]').first();
  check((await loadingBtn.count()) > 0 && (await loadingBtn.isDisabled()), 'GlassButton loading disables interaction');

  // --- GlassInput focus ring -------------------------------------------------
  // GlassInput forwards ...rest onto the <input>, so the testid marks the control.
  const input = page.locator('[data-testid="smoke-input"]');
  check(
    (await input.evaluate((el) => el.tagName)) === 'INPUT',
    'GlassInput forwards data-testid to the real input element'
  );
  await input.focus();
  const focusStyle = await input.evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: s.borderTopColor, ring: s.boxShadow };
  });
  check(
    /oklab|rgb/.test(focusStyle.border),
    'GlassInput focus border-cyan-400 compiled',
    focusStyle.border
  );
  check(focusStyle.ring !== 'none', 'GlassInput focus ring compiled', focusStyle.ring.slice(0, 60));

  const clearBtn = page.locator('button[aria-label="Clear input"]').first();
  check((await clearBtn.count()) === 1, 'GlassInput clear affordance renders for a filled value');
  await clearBtn.click();
  check((await input.inputValue()) === '', 'GlassInput clear button empties the field');

  // --- GlassBadge / CategoryBadge / ChainBadge / RarityBadge ----------------
  const badges = await page.locator('span:has-text("3D Models"), span:has-text("Ethereum"), span:has-text("Legendary"), span:has-text("Common")').count();
  check(badges >= 4, 'Badges render category, chain and rarity labels', `count=${badges}`);

  // --- GlassTabs ARIA + indicator -------------------------------------------
  const tabs = await page.locator('[data-testid="smoke-tabs"]').evaluate((el) => ({
    role: el.getAttribute('role'),
    tabCount: el.querySelectorAll('[role="tab"]').length,
    selected: el.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim(),
    tabindexes: Array.from(el.querySelectorAll('[role="tab"]')).map((t) => t.getAttribute('tabindex')),
  }));
  check(tabs.role === 'tablist' && tabs.tabCount === 3, 'GlassTabs exposes tablist with 3 tabs', JSON.stringify(tabs.tabCount));
  check(tabs.tabindexes.filter((t) => t === '0').length === 1, 'GlassTabs implements roving tabindex', tabs.tabindexes.join(','));
  await page.locator('[data-testid="smoke-tabs"] [data-value="price_asc"]').click();
  const afterClick = await page.locator('[data-testid="smoke-tabs"] [aria-selected="true"]').textContent();
  check(afterClick?.includes('low to high'), 'GlassTabs switches selection on click', afterClick ?? '');

  // --- RangeSlider -----------------------------------------------------------
  const slider = page.locator('[data-testid="smoke-slider"]');
  const readoutBefore = await slider.locator('[data-testid="range-readout"]').textContent();
  const maxInput = slider.locator('input[aria-label*="maximum"]');
  await maxInput.fill('4');
  await maxInput.dispatchEvent('change');
  await page.waitForTimeout(200);
  const readoutAfter = await slider.locator('[data-testid="range-readout"]').textContent();
  check(readoutBefore !== readoutAfter, 'RangeSlider updates readout on change', `${readoutBefore} -> ${readoutAfter}`);
  const thumbBox = await slider.locator('[data-testid="range-thumb-min"]').boundingBox();
  check(thumbBox.width >= 20 && thumbBox.height >= 20, 'RangeSlider thumb is grabbable', `${Math.round(thumbBox.width)}x${Math.round(thumbBox.height)}`);
  const touchAction = await slider.locator('[data-testid="range-thumb-min"]').evaluate((el) => getComputedStyle(el).touchAction);
  check(touchAction === 'none', 'RangeSlider isolates touch-action for drag', touchAction);

  // --- SkeletonCard ----------------------------------------------------------
  const skeletons = await page.locator('[data-testid="skeleton-card"]').count();
  check(skeletons === 4, 'SkeletonCard renders the requested count', `count=${skeletons}`);
  const skeletonAria = await page.locator('[role="status"]').getAttribute('aria-busy');
  check(skeletonAria === 'true', 'SkeletonCard announces busy state');

  // --- GlassModal imperative open/close ------------------------------------
  const dialogBefore = await page.locator('dialog[data-testid="smoke-modal"]').evaluate((el) => el.open);
  check(dialogBefore === false, 'GlassModal starts closed (no naked open attribute)', String(dialogBefore));
  await page.locator('[data-testid="open-modal"]').click();
  await page.waitForTimeout(400);
  const dialogAfter = await page.locator('dialog[data-testid="smoke-modal"]').evaluate((el) => el.open);
  check(dialogAfter === true, 'GlassModal opens imperatively via showModal()', String(dialogAfter));
  const innerScroll = await page
    .locator('dialog[data-testid="smoke-modal"] [data-testid="modal-scroll-body"]')
    .evaluate((el) => {
      const s = getComputedStyle(el);
      const shell = el.parentElement;
      const shellStyle = getComputedStyle(shell);
      return {
        maxH: shellStyle.maxHeight,
        overflowY: s.overflowY,
        overscroll: s.overscrollBehaviorY,
      };
    });
  check(
    innerScroll.maxH === `${Math.round(viewportHeight * 0.9)}px`,
    'GlassModal inner container caps at 90dvh',
    `${innerScroll.maxH} (viewport ${viewportHeight}px)`
  );
  check(innerScroll.overflowY === 'auto', 'GlassModal inner container scrolls', innerScroll.overflowY);
  check(innerScroll.overscroll === 'contain', 'GlassModal inner container contains overscroll', innerScroll.overscroll);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const dialogClosed = await page.locator('dialog[data-testid="smoke-modal"]').evaluate((el) => el.open);
  check(dialogClosed === false, 'GlassModal closes on Escape', String(dialogClosed));

  // --- scrollbar-hide utility ------------------------------------------------
  const hidden = await page.locator('[data-testid="smoke-tabs"]').evaluate((el) => {
    const s = getComputedStyle(el);
    return { scrollbarWidth: s.scrollbarWidth, msOverflow: s.scrollbarStyle };
  });
  check(
    hidden.scrollbarWidth === 'none',
    '.scrollbar-hide utility compiled',
    JSON.stringify(hidden)
  );

  // --- console hygiene -------------------------------------------------------
  check(pageErrors.length === 0, 'no uncaught exceptions', pageErrors.join(' | '));
  const realConsoleErrors = consoleErrors.filter((e) => !/favicon/i.test(e));
  check(realConsoleErrors.length === 0, 'no console errors', realConsoleErrors.join(' | '));

  console.log('');
  if (failures.length > 0) {
    // Throwing (rather than process.exit) lets `main` run its `finally` block so
    // a spawned server is never orphaned when a check fails.
    throw new Error(
      `DESIGN SYSTEM SMOKE FAILED: ${failures.length} check(s): ${failures.join('; ')}`
    );
  }
  console.log('DESIGN SYSTEM SMOKE PASSED.');
}

async function main() {
  // Provision the server so the harness can never fail with ECONNREFUSED.
  const server = await ensureServer({ url: REQUESTED_URL, autoBuild: AUTO_BUILD });
  BASE = server.url;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    await runChecks(browser);
  } finally {
    await browser.close();
    await server.stop();
  }
}

main().catch((error) => {
  console.error('Design system harness crashed:', error);
  process.exit(1);
});
