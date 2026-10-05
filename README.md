# Next.js Digital Asset Marketplace

An enterprise-grade digital asset exchange combining OpenSea's Web3 provenance model with Envato's commercial asset licensing architecture. Built with Next.js App Router, Tailwind CSS v4, and TypeScript, featuring a dark glassmorphic layout, simulated on-chain settlement, multi-format media inspectors, and audited zero-drift 60/120 FPS scrolling performance.

- **Repository**: [https://github.com/mmy-lana/nextjs-digital-asset-marketplace](https://github.com/mmy-lana/nextjs-digital-asset-marketplace)
- **Live Demo**: [https://nextjs-digital-asset-marketplace.vercel.app/](https://nextjs-digital-asset-marketplace.vercel.app/)

---

## Overview

The platform provides a unified marketplace for procedural 3D models, interface design systems, vector illustrations, generative on-chain editions, cleared audio stems, and motion graphics packages. Every listing integrates verifiable contract addresses, token IDs, licensing tiers, royalty distributions, and provenance ledgers.

---

## Key Features

### 1. Faceted Discovery & Live Search
- Multi-facet intersection filtering across categories, networks (Ethereum, Polygon, Solana, Arbitrum), licenses, and price intervals.
- Debounced search combobox querying titles, creator names, handles, and tags with keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- Shared filter controller synchronizing category ribbons, desktop facet sidebars, and mobile drawer sheets from a single source of truth.

### 2. Multi-Format Interactive Previews
- **3D Assets**: Interactive 2D canvas wireframe projection supporting pointer/touch orbital controls, auto-spin, and full-screen modes.
- **Audio Assets**: Deterministic waveform visualization with interactive scrubbing, time display, volume controls, and unmount cleanup.
- **Inspection Modal**: Native `<dialog>` modal with high-resolution image zoom, format metadata, and dynamic re-pricing.

### 3. Commercial Licensing & Dynamic Pricing
- **Standard Commercial**: Single end-product deployment (1.0x baseline).
- **Extended Commercial**: Multi-seat client work with resale rights (2.4x multiplier).
- **Exclusive NFT**: Transfer of sole ownership, single-unit cart constraint, and inventory availability locking (6.5x multiplier).
- **Editorial Only**: Commentary and educational rights (0.6x baseline).

### 4. Atomic Web3 Wallet & Checkout Simulation
- Simulated wallet connections for MetaMask, Coinbase Wallet, Phantom, and Ledger with network switching and balance tracking.
- Multi-step transaction pipeline: Review, Allowance Authorization, Gas Estimation, Payload Signing, Network Broadcast, and Block Receipt.
- Atomic balance deduction enforcing full order costs (`subtotal + 2.5% platform fee + 0.0035 ETH gas`) with strict solvency verification (`InsufficientFundsError`).
- Real-time order ledger displaying transaction hashes, counterparties, amounts, and settlement statuses (`confirmed`, `pending`, `failed`, `cancelled`).

---

## Enterprise Security & Integrity Hardening

The application was audited and certified against Tier-1 enterprise benchmarks:

| Control ID | Classification | Resolution Summary | Status |
| :--- | :--- | :--- | :--- |
| **SEC-01** | SSRF Mitigation | Next.js image optimization restricted to `images.unsplash.com`. Open wildcards eliminated. | `[PASS]` |
| **SEC-02** | Security Headers | Enforced Content Security Policy, HSTS, `X-Frame-Options: DENY`, and strict Permissions Policy. | `[PASS]` |
| **SEC-03** | Storage Boundaries | Implemented runtime boundary validators (`arrayOfObjects`, `objectWithKeys`) quarantining malformed `localStorage` entries. | `[PASS]` |
| **RUN-01** | Media Architecture | Decoupled audio stream endpoints from visual poster properties, preventing optimizer MIME timeouts. | `[PASS]` |
| **DATA-01** | Concurrency Safety | Replaced stale component closures with synchronous ref-backed state updaters (`commitWallet`). | `[PASS]` |
| **DATA-02** | Lock State Derivation | Derived exclusive-asset lock states synchronously from committed cart lines. | `[PASS]` |
| **FIN-01** | Comprehensive Settlement | Consolidated fees into atomic balance deductions with solvency verification before persistence. | `[PASS]` |
| **ARCH-01** | SPA Integrity | Replaced hard browser reloads in collection views with Next.js client-side router transitions. | `[PASS]` |
| **DEF-01** | Defensive APIs | Added fallback mechanisms using hidden textareas for clipboard operations in restricted environments. | `[PASS]` |
| **PERF-01** | Media Disposal | Bound explicit pause and source teardown effects to audio players on unmount. | `[PASS]` |
| **PERF-02** | Scroll Stability | GPU layer promotion (`.gpu-layer`) and CSS layout containment eliminating main-thread blur redraws. | `[PASS]` |
| **UI-01** | Touch Accessibility | Upgraded all mobile interactive targets to meet minimum 44x44px specifications (WCAG 2.2 Level AA). | `[PASS]` |
| **UI-02** | Core Web Vitals | Preloaded above-the-fold catalog cards selectively using `priority={index < 4}` to optimize LCP. | `[PASS]` |
| **TYPE-01** | Network Validation | Enforced runtime network enum validation with descriptive logging for invalid chain IDs. | `[PASS]` |

---

## Performance Architecture (60/120 FPS Scrolling)

To ensure frame stability across desktop and high-refresh mobile displays:

1. **Hardware Composite Promotion**: Sticky glass surfaces (`NavigationHeader`, `CategorySubNav`) utilize `.gpu-layer` (`transform: translateZ(0); backface-visibility: hidden; will-change: transform;`). This retains blurred backdrops as cached GPU textures instead of recalculating Gaussian shaders on the main thread during scroll events.
2. **Layout & Paint Containment**: Asset cards declare `contain: layout style paint;`, isolating layout recalculations to individual card boundaries.
3. **Zero Layout Drift**: Avoids unconstrained `content-visibility: auto` on variable-height responsive grids, preventing document height changes and scrollbar jumps. Full-page scrolling verifies 0px layout drift.
4. **Natural Delta Scrolling**: Avoids global `scroll-behavior: smooth` on the root HTML element, allowing direct hardware delta mapping without input latency.

---

## Tech Stack

- **Framework**: Next.js (App Router, Server and Client Components, Turbopack)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS v4 (`@theme` directive, CSS custom properties, zero legacy config)
- **Icons**: Lucide React
- **Testing & Verification**: Playwright (Headless Chromium)

---

## Project Structure

```text
├── app/
│   ├── asset/[slug]/page.tsx      # Asset detail route (Server Component, dynamic metadata)
│   ├── collections/[slug]/page.tsx# Collection detail route with relational joins
│   ├── design-system/page.tsx     # Atomic component smoke test surface
│   ├── orders/page.tsx            # Order ledger and transaction history
│   ├── globals.css                # Tailwind v4 theme, keyframes, utilities
│   ├── layout.tsx                 # Root layout and global context providers
│   └── page.tsx                   # Marketplace explore page (Server Component)
├── components/
│   ├── features/                  # Domain-specific composite features
│   ├── layout/                    # Header, sub-navigation, footer, shell
│   ├── molecules/                 # Compound interactive controls and cards
│   └── ui/                        # Primitives (GlassPanel, GlassButton, GlassModal, etc.)
├── context/
│   ├── CartContext.tsx            # Cart state, fee calculations, and exclusive locking
│   └── WalletContext.tsx          # Web3 connection states and atomic settlement
├── hooks/
│   └── useAssetFilter.ts          # Faceted intersection search engine
├── lib/
│   ├── constants.ts               # Network configurations, fees, categories, licenses
│   ├── mock-data.ts               # Deterministic catalogue dataset and relational records
│   ├── storage.ts                 # Validated SSR-safe browser persistence wrappers
│   └── utils.ts                   # Currency, rarity, and address formatters
├── scripts/
│   ├── lib/server-manager.mjs     # Self-provisioning lifecycle manager for tests
│   ├── verify.mjs                 # Headless browser verification suite
│   └── verify-design-system.mjs   # Design system visual contract verification
├── types/
│   └── marketplace.ts             # Domain interfaces and union types
├── next.config.ts                 # Image origins, headers, and security rules
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or Node.js 20+
- pnpm (Strictly enforced: `corepack enable pnpm`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mmy-lana/nextjs-digital-asset-marketplace.git
   cd nextjs-digital-asset-marketplace
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

### Development

Run the local development server with Turbopack:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Compile and generate static pages:
```bash
pnpm build
pnpm start
```

---

## Verification & Testing

The repository contains an automated Playwright headless verification harness that runs without requiring an external browser instance:

```bash
# Typecheck TypeScript codebase
pnpm typecheck

# Execute visual design system tests
pnpm verify:design-system

# Run complete end-to-end audit (responsive, flows, security, settlement, performance)
pnpm verify:all

# Run specific testing suites
pnpm verify --suite responsive
pnpm verify --suite performance
pnpm verify --suite security
pnpm verify --suite settlement
```

The verification harness automatically builds the project if needed, provisions an internal server on port 3100, executes Chromium assertions, and tears down the process on completion.

---

## Responsive Breakpoints

Interactive features, modals, and grids are validated across:
- **360px**: Small Mobile (single column, collapsed search, touch targets >= 44px)
- **390px / 430px**: Standard / Large Mobile (touch-optimized filters, horizontal snap subnav)
- **768px**: Tablet (two-column grid, expanded cart slide-over)
- **1024px**: Small Desktop (three-column grid, sticky faceted sidebar)
- **1440px+**: Wide Desktop (four-column layout, detailed provenance panes)

---

## License

MIT License. See [LICENSE](LICENSE) for details.
