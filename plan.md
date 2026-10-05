# Implementation Plan: Digital Asset Marketplace (OpenSea/Envato Hybrid)

## 1. Data Schema & Pure TypeScript Interfaces

```typescript
export type AssetCategory = 
  | '3d_models' 
  | 'ui_templates' 
  | 'vector_graphics' 
  | 'generative_nft' 
  | 'audio_tracks' 
  | 'motion_graphics';

export type ChainNetwork = 'ethereum' | 'polygon' | 'solana' | 'arbitrum';

export type LicenseType = 
  | 'standard_commercial' 
  | 'extended_commercial' 
  | 'exclusive_nft' 
  | 'editorial_only';

export type ListingType = 'fixed_price' | 'timed_auction' | 'open_for_offers';

export interface CreatorProfile {
  id: string;
  walletAddress: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  verified: boolean;
  totalSalesVolumeEth: number;
  joinedAt: string;
}

export interface AssetTrait {
  traitType: string;
  value: string | number;
  rarityScore: number;
  frequencyPercent: number;
}

export interface MediaPayload {
  previewUrl: string;
  highResUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  dimensions?: {
    width: number;
    height: number;
  };
  durationSeconds?: number;
  modelFormat?: 'gltf' | 'glb' | 'obj' | 'fbx';
}

export interface DigitalAsset {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: AssetCategory;
  tags: string[];
  chain: ChainNetwork;
  contractAddress: string;
  tokenId: string;
  license: LicenseType;
  listingType: ListingType;
  priceCrypto: number;
  priceFiatUsd: number;
  currencySymbol: 'ETH' | 'MATIC' | 'SOL';
  creator: CreatorProfile;
  currentOwner: CreatorProfile;
  media: MediaPayload;
  traits: AssetTrait[];
  royaltiesPercentage: number;
  likesCount: number;
  viewsCount: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AssetCategory;
  bannerUrl: string;
  logoUrl: string;
  creatorId: string;
  contractAddress: string;
  assetIds: string[];
  floorPriceEth: number;
  totalVolumeEth: number;
  itemCount: number;
  ownersCount: number;
  verified: boolean;
  createdAt: string;
}

export interface CartItem {
  assetId: string;
  asset: DigitalAsset;
  selectedLicense: LicenseType;
  quantity: number;
  priceCrypto: number;
  priceFiatUsd: number;
  addedAt: number;
}

export interface CartState {
  items: CartItem[];
  subtotalCrypto: number;
  subtotalFiatUsd: number;
  estimatedGasFeeEth: number;
  platformFeeEth: number;
  totalCrypto: number;
  totalFiatUsd: number;
}

export interface FilterState {
  searchQuery: string;
  categories: AssetCategory[];
  chains: ChainNetwork[];
  licenseTypes: LicenseType[];
  priceRange: {
    min: number;
    max: number;
  };
  listingTypes: ListingType[];
  verifiedOnly: boolean;
  sortBy: 
    | 'recently_listed' 
    | 'price_asc' 
    | 'price_desc' 
    | 'most_viewed' 
    | 'highest_rarity';
}

export interface TransactionRecord {
  id: string;
  txHash: string;
  assetId: string;
  assetTitle: string;
  assetThumbnail: string;
  buyerAddress: string;
  sellerAddress: string;
  amountCrypto: number;
  amountFiatUsd: number;
  currency: 'ETH' | 'MATIC' | 'SOL';
  chain: ChainNetwork;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  timestamp: string;
  gasUsedGwei: number;
}

export interface WalletState {
  address: string | null;
  ensName: string | null;
  chainId: number;
  balanceEth: number;
  balanceUsd: number;
  chain: ChainNetwork;
  isConnected: boolean;
  isConnecting: boolean;
}
```

---

## 2. Component Architecture

### Architecture & Import Rules
- Direct context imports only: No barrel `index.ts` files inside `context/` or `components/features/` to eliminate circular dependency hazards.
- Explicit Client Boundary: Every interactive component or hook using React state, effects, or browser APIs must declare `"use client"` at the top of the file.
- Server Component Boundary: Page shells and static read-only containers must omit `"use client"` to preserve React Server Component (RSC) rendering benefits.

### Atomic UI Primitives (`components/ui/`)
- `GlassPanel`: Container styled using Tailwind v4 theme variables: `backdrop-blur-xl bg-slate-950/75 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]`.
- `GlassButton`: Kinetic button with variants (`primary-neon`, `glass-outline`, `ghost`, `danger`) maintaining a minimum 44px tap target.
- `GlassInput`: Form control with search/clear adornments, blur states, and focus glow ring (`focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50`).
- `GlassBadge`: Category, chain, and rarity indicators with translucent pill backgrounds and network-specific accents.
- `GlassModal`: Native HTML `<dialog>` wrapper managed via `useEffect` imperative calls (`showModal()` / `close()`). Inner wrapper strictly enforces `max-h-[90dvh] overflow-y-auto overscroll-contain`.
- `GlassTabs`: Accessible segment controller with sliding neon active underline.
- `RangeSlider`: Touch-optimized dual thumb slider with touch-action isolation.
- `SkeletonCard`: Zero-layout-shift skeleton loader replicating asset card dimensions.

### Compound Molecules (`components/molecules/`)
- `AssetCard`: Visual card with lazy image renderer, audio/3D badge, creator attribution, price readout, and direct touch-accessible quick-add button.
- `CollectionPill`: Stat badge displaying floor price and 24-hour volume changes.
- `SearchAutocomplete`: Live debounced input with keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- `FilterSheetMobile`: Slide-over bottom drawer constrained to viewport width for devices under 1024px.
- `FilterSidebarDesktop`: Sticky, vertically scrolling faceted filter sidebar for viewports 1024px and wider.
- `CartSlideOver`: Slide-out panel constrained to `w-full max-w-[calc(100vw-1rem)] sm:max-w-md` to avoid mobile overflow, displaying order breakdown and checkout trigger.
- `WalletConnectDialog`: Web3 modal simulating wallet connections (MetaMask, Coinbase, Phantom, Ledger) with network switching and balance updates.
- `TraitMatrix`: Trait grid rendering `grid-cols-1` below 480px and `grid-cols-2` from 480px upwards. Formats values via `formatTraitValue()` with `truncate` and `title` tooltip fallback.
- `AudioPreviewPlayer`: Interactive audio player with scrubber, waveform representation, and duration display.
- `ThreePreviewCanvas`: Interactive 3D model viewport fallback featuring touch/drag orbit controls.

### Domain Features (`components/features/`)
- `AssetExplorer`: Orchestrator receiving initial asset datasets from the server page; binds `useAssetFilter`, filter sheets, active tag chips, and responsive asset grids.
- `AssetInspectModal`: Detailed inspection modal with media magnification, interactive 3D/audio preview, traits rendered via `formatTraitValue()`, and direct checkout actions.
- `CheckoutProcessor`: Step-by-step transaction state machine managing authorizations, gas calculation, signing, and handling states (`pending`, `confirmed`, `failed`, `cancelled`).
- `CreatorHeader`: Profile banner, verification badge, volume metrics, and follow toggles.
- `ProvenanceTimeline`: Chronological blockchain ledger view displaying mint events, secondary sales, and local simulated transactions.
- `RoyaltySplitCalculator`: Interactive creator tool showing earnings distributions after platform fees and secondary royalties.

### Responsive Layout Shell (`components/layout/`)
- `NavigationHeader`: Responsive sticky glass header. At mobile (<640px), search expands to a full-width overlay via `isSearchOpen` state, the wallet chip collapses to an avatar icon with network pip, and the cart retains an icon-only counter badge.
- `CategorySubNav`: Horizontal overflow-scrolling category ribbon utilizing `scrollbar-hide` and CSS snap alignments for smooth touch gestures.
- `Footer`: Multi-column links, network status indicator, and contract security disclaimers.

---

## 3. Core Feature Logic

### A. Faceted Search & Filtering Engine
```typescript
export function filterAndSortAssets(
  assets: DigitalAsset[],
  filters: FilterState
): DigitalAsset[] {
  return assets
    .filter((asset) => {
      if (filters.searchQuery.trim().length > 0) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = asset.title.toLowerCase().includes(query);
        const matchesCreator = 
          asset.creator.displayName.toLowerCase().includes(query) ||
          asset.creator.handle.toLowerCase().includes(query);
        const matchesTags = asset.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCreator && !matchesTags) return false;
      }

      if (filters.categories.length > 0 && !filters.categories.includes(asset.category)) {
        return false;
      }

      if (filters.chains.length > 0 && !filters.chains.includes(asset.chain)) {
        return false;
      }

      if (filters.licenseTypes.length > 0 && !filters.licenseTypes.includes(asset.license)) {
        return false;
      }

      if (filters.listingTypes.length > 0 && !filters.listingTypes.includes(asset.listingType)) {
        return false;
      }

      if (filters.verifiedOnly && !asset.creator.verified) {
        return false;
      }

      if (
        asset.priceCrypto < filters.priceRange.min ||
        asset.priceCrypto > filters.priceRange.max
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.priceCrypto - b.priceCrypto;
        case 'price_desc':
          return b.priceCrypto - a.priceCrypto;
        case 'most_viewed':
          return b.viewsCount - a.viewsCount;
        case 'highest_rarity': {
          const maxRarityA = a.traits.reduce((max, t) => Math.max(max, t.rarityScore), 0);
          const maxRarityB = b.traits.reduce((max, t) => Math.max(max, t.rarityScore), 0);
          return maxRarityB - maxRarityA;
        }
        case 'recently_listed':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
}
```

### B. Cart & Fee Calculation Engine
```typescript
export const PLATFORM_FEE_RATE = 0.025; // 2.5%
export const ESTIMATED_GAS_PER_TX_ETH = 0.0035;

export function calculateCartTotals(items: CartItem[]): {
  subtotalCrypto: number;
  subtotalFiatUsd: number;
  platformFeeEth: number;
  estimatedGasFeeEth: number;
  totalCrypto: number;
  totalFiatUsd: number;
} {
  const subtotalCrypto = items.reduce((acc, curr) => {
    const qty = curr.selectedLicense === 'exclusive_nft' ? 1 : Math.max(1, curr.quantity);
    return acc + curr.priceCrypto * qty;
  }, 0);

  const subtotalFiatUsd = items.reduce((acc, curr) => {
    const qty = curr.selectedLicense === 'exclusive_nft' ? 1 : Math.max(1, curr.quantity);
    return acc + curr.priceFiatUsd * qty;
  }, 0);
  
  const platformFeeEth = Number((subtotalCrypto * PLATFORM_FEE_RATE).toFixed(6));
  const estimatedGasFeeEth = items.length > 0 ? ESTIMATED_GAS_PER_TX_ETH : 0;
  
  const totalCrypto = Number((subtotalCrypto + platformFeeEth + estimatedGasFeeEth).toFixed(6));
  const conversionRate = subtotalCrypto > 0 ? subtotalFiatUsd / subtotalCrypto : 3200;
  const totalFiatUsd = Number((totalCrypto * conversionRate).toFixed(2));

  return {
    subtotalCrypto: Number(subtotalCrypto.toFixed(6)),
    subtotalFiatUsd: Number(subtotalFiatUsd.toFixed(2)),
    platformFeeEth,
    estimatedGasFeeEth,
    totalCrypto,
    totalFiatUsd,
  };
}
```

### C. Constants & Format Utilities
```typescript
export const CHAIN_ID_MAP: Record<ChainNetwork, number> = {
  ethereum: 1,
  polygon: 137,
  solana: 101,
  arbitrum: 42161,
};

export function formatTraitValue(value: string | number): string {
  return String(value);
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

### D. Web3 Wallet Simulation State Machine
- States: `DISCONNECTED` -> `CONNECTING` -> `CONNECTED` -> `SWITCHING_NETWORK` -> `TRANSACTING` -> `ERROR`.
- Storage: Reads and writes are isolated to `useEffect` hooks checking `typeof window !== 'undefined'`.
- Persistence: Simulates EVM balance deductions and appends completed actions to `TransactionRecord[]` in storage.

---

## 4. Layout & Viewport Specifications

| Viewport Width | Target Devices | Layout Specifications |
| :--- | :--- | :--- |
| `360px` | Small Mobile (e.g. Galaxy S8) | 1-column grid; `NavigationHeader` collapses search to full-width toggle (`isSearchOpen`), wallet displays avatar only, cart shows badge only; `CartSlideOver` constrained to `max-w-[calc(100vw-1rem)]`; `TraitMatrix` rendered in single column. |
| `390px` | Standard Mobile (iPhone 12/13/14) | 1-column grid; `CategorySubNav` horizontal scroll with `scrollbar-hide`; touch targets >= 44x44px; sticky mobile action bar. |
| `430px` | Large Mobile (iPhone Pro Max) | 1-column grid with full-bleed media cards; modal inner scroll locked to `max-h-[90dvh] overflow-y-auto overscroll-contain`. |
| `768px` | Tablet (iPad Portrait) | 2-column grid; modal side-by-side inspect panel; slide-over cart panel fixed at `max-w-md`. |
| `1024px` | Small Desktop / Landscape | 3-column grid; persistent left-hand faceted filter sidebar (`FilterSidebarDesktop`); subnav pinned below main header. |
| `1440px+` | Wide Desktop | 4 to 5-column grid; split-screen inspect views; full provenance logs visible in dedicated desktop panes. |

---

## 5. Sequential Execution Queue

### Phase 1: Types, Storage/API Client Config, and Base Utilities
- [ ] Create `types/marketplace.ts` containing all core contracts (`DigitalAsset`, `CollectionSummary`, `CreatorProfile`, `FilterState`, `CartState`, `TransactionRecord`, `WalletState`).
- [ ] Create `lib/constants.ts` with `CHAIN_ID_MAP`, `PLATFORM_FEE_RATE`, `ESTIMATED_GAS_PER_TX_ETH`, category lists, and default filter parameters.
- [ ] Create `lib/storage.ts` [SERVER/CLIENT SAFE] containing safe wrappers for browser storage guarded strictly with `typeof window !== 'undefined'`.
- [ ] Create `lib/mock-data.ts` containing 24 assets across 3D, NFT, audio, templates, and UI components with valid contract addresses and relational links.
- [ ] Create `lib/utils.ts` with formatters (`formatAddress`, `formatCrypto`, `formatFiat`, `formatDate`, `calculateRarityTier`) and `formatTraitValue(val: string | number): string`.

### Phase 2: Design Foundation & Atomic UI Primitives
- [ ] Configure Tailwind v4 tokens directly in `app/globals.css` using `@theme { --color-neon-cyan: #06b6d4; --color-dark-glass: rgba(2, 6, 23, 0.75); }` and register `.scrollbar-hide` utilities.
- [ ] Smoke-test Tailwind v4 output by compiling `components/ui/GlassPanel.tsx` [SERVER] (`backdrop-blur-xl bg-slate-950/75 border border-white/10`).
- [ ] Create `components/ui/GlassButton.tsx` [CLIENT]: Kinetic button supporting variants (`primary-neon`, `glass-outline`, `ghost`, `danger`) and touch target >= 44px.
- [ ] Create `components/ui/GlassInput.tsx` [CLIENT]: Form input with icon slot, clear button, and focus ring.
- [ ] Create `components/ui/GlassBadge.tsx` [SERVER]: Visual badges for category, rarity, and network chains.
- [ ] Create `components/ui/RangeSlider.tsx` [CLIENT]: Dual slider with isolated touch-action boundaries for mobile drag operations.
- [ ] Create `components/ui/SkeletonCard.tsx` [SERVER]: Skeleton loader strictly matching asset card dimensions.
- [ ] Create `components/ui/GlassModal.tsx` [CLIENT]: Dialog component managed via imperative `ref.current.showModal()` and `ref.current.close()` in `useEffect` (never naked `open` attribute), with content container styled `max-h-[90dvh] overflow-y-auto overscroll-contain`.

### Phase 3: Compound Molecules & Feature Components
- [ ] Create `components/molecules/AssetCard.tsx` [CLIENT]: Card with preview media, price tag, quick-buy trigger, and touch-direct inspection action.
- [ ] Create `components/molecules/AudioPreviewPlayer.tsx` [CLIENT]: Audio scrubber, waveform visualization, and duration readout.
- [ ] Create `components/molecules/ThreePreviewCanvas.tsx` [CLIENT]: Interactive 3D wireframe fallback with touch/mouse orbit navigation.
- [ ] Create `components/molecules/TraitMatrix.tsx` [CLIENT]: Responsive trait grid (`grid-cols-1` below 480px, `grid-cols-2` from 480px+) utilizing `formatTraitValue()` and tooltip truncation.
- [ ] Create `components/molecules/SearchAutocomplete.tsx` [CLIENT]: Instant search dropdown with keyboard navigation.
- [ ] Create `components/molecules/FilterSidebarDesktop.tsx` [CLIENT]: Sticky desktop facet sidebar for categories, price ranges, chains, and licenses.
- [ ] Create `components/molecules/FilterSheetMobile.tsx` [CLIENT]: Slide-over bottom drawer with sticky confirmation bar for screens under 1024px.
- [ ] Create `components/molecules/WalletConnectDialog.tsx` [CLIENT]: Web3 modal handling mock network selection, wallet connections, and balance updates.

### Phase 4: Domain Logic, Reactive State, and Specialized APIs
- [ ] Create `context/WalletContext.tsx` [CLIENT]: Direct import context managing `chainId`, connection states, and transaction history. Initialize storage reads exclusively inside `useEffect`.
- [ ] Create `context/CartContext.tsx` [CLIENT]: Direct import context handling item quantity, exclusive NFT single-unit enforcement, and fee recalculation. Initialize storage reads inside `useEffect`. Maintain `unavailableAssetIds: Set<string>` in state; derive asset availability as `!unavailableAssetIds.has(asset.id)` without mutating raw data. Serialize to storage as `string[]` (`Array.from(set)`) and deserialize via `new Set(parsed)` to prevent `{}` serialization bugs.
- [ ] Create `hooks/useAssetFilter.ts` [CLIENT]: Multi-facet intersection filter and sort algorithm using `traits.reduce`.
- [ ] Create `components/features/AssetExplorer.tsx` [CLIENT]: Orchestrator receiving initial asset datasets from `app/page.tsx`; integrates `useAssetFilter`, coordinates responsive filter controls (`FilterSidebarDesktop`, `FilterSheetMobile`), active filter chips, and dynamic card grid with empty/loading fallback states.
- [ ] Create `components/features/CheckoutProcessor.tsx` [CLIENT]: Step-by-step transaction state machine handling `pending`, `confirmed`, `failed`, and `cancelled` states without barrel file imports.
- [ ] Create `components/features/AssetInspectModal.tsx` [CLIENT]: Full-bleed media inspector with license selector, responsive summary, and mandatory usage of `formatTraitValue()` for all trait value rendering.
- [ ] Create `components/features/ProvenanceTimeline.tsx` [CLIENT]: Chronological blockchain ledger view displaying local transaction state and wallet activity.

### Phase 5: Complete Page/Screen Assembly & Responsive Shell
- [ ] Create `components/layout/NavigationHeader.tsx` [CLIENT]: Responsive glass header with condensed mobile state (wallet avatar, cart counter) and mobile full-width search overlay managed via local `const [isSearchOpen, setIsSearchOpen] = useState(false)`.
- [ ] Create `components/layout/CategorySubNav.tsx` [CLIENT]: Horizontal snap-scrolling category ribbon styled with `.scrollbar-hide`.
- [ ] Create `components/layout/Footer.tsx` [SERVER]: Dark glass footer with responsive multi-column links and network indicators.
- [ ] Assemble `app/layout.tsx` [SERVER]: Root layout wrapping the tree in `WalletProvider` and `CartProvider`, global navigation, cart slide-over, and modal portal mounts.
- [ ] Assemble `app/page.tsx` [SERVER]: Root explore page serving as RSC entry point; passes initial asset dataset down to `components/features/AssetExplorer.tsx` [CLIENT] to retain server rendering performance.
- [ ] Assemble `app/asset/[slug]/page.tsx` [SERVER]: Details screen resolving params asynchronously (`const { slug } = await params`) per Next.js 15+ spec, invoking `notFound()` from `next/navigation` for non-matching asset slugs, and generating dynamic metadata via `generateMetadata` using the same `await params` pattern.
- [ ] Assemble `app/orders/page.tsx` [CLIENT]: Order ledger and transaction history view.
- [ ] Perform responsive layout verification across `360px`, `390px`, `430px`, `768px`, and `1024px+` viewports without hover dependencies.