import type {
  AssetCategory,
  CategoryDescriptor,
  ChainDescriptor,
  ChainNetwork,
  CheckoutStep,
  LicenseDescriptor,
  LicenseType,
  ListingType,
  SortOption,
  WalletProviderDescriptor,
} from '@/types/marketplace';

/**
 * Economics
 * ---------------------------------------------------------------------------
 * The marketplace quotes every listing in ETH regardless of the settlement
 * network so that totals remain comparable inside the cart. Network-native
 * pricing is derived through {@link CHAIN_RATES} when a transfer settles.
 */
export const PLATFORM_FEE_RATE = 0.025;
export const ESTIMATED_GAS_PER_TX_ETH = 0.0035;
export const MAX_CART_QUANTITY = 25;
export const FALLBACK_ETH_USD_RATE = 3200;

/**
 * Network routing
 * ---------------------------------------------------------------------------
 * Solana uses a non-EVM chain id; the simulation keeps `101` as the sentinel
 * value so the wallet chip can render a stable numeric id.
 */
export const CHAIN_ID_MAP: Record<ChainNetwork, number> = {
  ethereum: 1,
  polygon: 137,
  solana: 101,
  arbitrum: 42161,
};

export const CHAIN_NETWORKS: ChainDescriptor[] = [
  {
    label: 'Ethereum',
    value: 'ethereum',
    chainId: CHAIN_ID_MAP.ethereum,
    nativeSymbol: 'ETH',
    explorerUrl: 'https://etherscan.io',
    accentClass: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
  },
  {
    label: 'Polygon',
    value: 'polygon',
    chainId: CHAIN_ID_MAP.polygon,
    nativeSymbol: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    accentClass: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-500/10',
  },
  {
    label: 'Solana',
    value: 'solana',
    chainId: CHAIN_ID_MAP.solana,
    nativeSymbol: 'SOL',
    explorerUrl: 'https://solscan.io',
    accentClass: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  },
  {
    label: 'Arbitrum',
    value: 'arbitrum',
    chainId: CHAIN_ID_MAP.arbitrum,
    nativeSymbol: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    accentClass: 'text-sky-300 border-sky-400/30 bg-sky-500/10',
  },
];

/** Indicative ETH price used for network-native conversions. */
export const CHAIN_RATES: Record<ChainNetwork, number> = {
  ethereum: 1,
  polygon: 1,
  solana: 145,
  arbitrum: 1,
};

export const DEFAULT_CHAIN: ChainNetwork = 'ethereum';

export function getChainDescriptor(chain: ChainNetwork): ChainDescriptor {
  return (
    CHAIN_NETWORKS.find((descriptor) => descriptor.value === chain) ?? CHAIN_NETWORKS[0]
  );
}

/**
 * Facet vocabulary
 * ---------------------------------------------------------------------------
 */
export const CATEGORIES: CategoryDescriptor[] = [
  {
    label: '3D Models',
    value: '3d_models',
    description: 'Production-ready meshes, glTF scenes and hard-surface kits.',
  },
  {
    label: 'UI Templates',
    value: 'ui_templates',
    description: 'Design systems, dashboards and product interface kits.',
  },
  {
    label: 'Vector Graphics',
    value: 'vector_graphics',
    description: 'Illustration packs, icon sets and brand-ready vectors.',
  },
  {
    label: 'Generative NFT',
    value: 'generative_nft',
    description: 'On-chain generative collections with verifiable provenance.',
  },
  {
    label: 'Audio Tracks',
    value: 'audio_tracks',
    description: 'Loops, stems, sound kits and cinematic beds.',
  },
  {
    label: 'Motion Graphics',
    value: 'motion_graphics',
    description: 'Animated titles, transitions and looping visual systems.',
  },
];

export const CATEGORY_VALUES: AssetCategory[] = CATEGORIES.map((category) => category.value);

export const LICENSE_OPTIONS: LicenseDescriptor[] = [
  {
    label: 'Standard Commercial',
    value: 'standard_commercial',
    summary: 'Single end product, unlimited impressions, no resale of the source file.',
    multiplier: 1,
    seatLimit: 1,
  },
  {
    label: 'Extended Commercial',
    value: 'extended_commercial',
    summary: 'Unlimited client work, resale inside products, and up to 250k impressions.',
    multiplier: 2.4,
    seatLimit: 5,
  },
  {
    label: 'Exclusive NFT',
    value: 'exclusive_nft',
    summary: 'Sole on-chain ownership. Single unit, transferable through secondary markets.',
    multiplier: 6.5,
    seatLimit: 1,
  },
  {
    label: 'Editorial Only',
    value: 'editorial_only',
    summary: 'News, commentary and educational contexts. No promotional or commercial use.',
    multiplier: 0.6,
    seatLimit: null,
  },
];

export const LICENSE_VALUES: LicenseType[] = LICENSE_OPTIONS.map((license) => license.value);

export function getLicenseDescriptor(license: LicenseType): LicenseDescriptor {
  return LICENSE_OPTIONS.find((option) => option.value === license) ?? LICENSE_OPTIONS[0];
}

export const LISTING_OPTIONS: { label: string; value: ListingType; description: string }[] = [
  {
    label: 'Fixed Price',
    value: 'fixed_price',
    description: 'Buy now at the listed price while supply remains.',
  },
  {
    label: 'Timed Auction',
    value: 'timed_auction',
    description: 'Open bidding window closing at the listed reserve.',
  },
  {
    label: 'Open for Offers',
    value: 'open_for_offers',
    description: 'Price is indicative — sellers accept buyer proposals.',
  },
];

export const LISTING_VALUES: ListingType[] = LISTING_OPTIONS.map((option) => option.value);

/** Rarity bands applied to `AssetTrait.rarityScore`. */
export const RARITY_THRESHOLDS: { tier: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'; min: number }[] = [
  { tier: 'Legendary', min: 90 },
  { tier: 'Epic', min: 75 },
  { tier: 'Rare', min: 55 },
  { tier: 'Uncommon', min: 35 },
  { tier: 'Common', min: 0 },
];

export const RARITY_TIER_STYLES: Record<
  'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary',
  string
> = {
  Common: 'text-slate-300 border-slate-400/25 bg-slate-400/10',
  Uncommon: 'text-emerald-300 border-emerald-400/25 bg-emerald-500/10',
  Rare: 'text-sky-300 border-sky-400/25 bg-sky-500/10',
  Epic: 'text-violet-300 border-violet-400/25 bg-violet-500/10',
  Legendary: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
};

/**
 * Sorting
 * ---------------------------------------------------------------------------
 */
export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Recently listed', value: 'recently_listed' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
  { label: 'Most viewed', value: 'most_viewed' },
  { label: 'Highest rarity', value: 'highest_rarity' },
];

/**
 * Default filter state — also the canonical reset payload.
 * ---------------------------------------------------------------------------
 */
export const PRICE_RANGE_FLOOR = 0;
export const PRICE_RANGE_CEILING = 10;

export const DEFAULT_FILTER_STATE = {
  searchQuery: '',
  categories: [] as AssetCategory[],
  chains: [] as ChainNetwork[],
  licenseTypes: [] as LicenseType[],
  priceRange: {
    min: PRICE_RANGE_FLOOR,
    max: PRICE_RANGE_CEILING,
  },
  listingTypes: [] as ListingType[],
  verifiedOnly: false,
  sortBy: 'recently_listed' as SortOption,
} as const;

/**
 * Wallet simulation
 * ---------------------------------------------------------------------------
 */
export const WALLET_PROVIDERS: WalletProviderDescriptor[] = [
  {
    kind: 'metamask',
    name: 'MetaMask',
    description: 'Browser extension wallet with the broadest network coverage.',
    recommended: true,
    supportedChains: ['ethereum', 'polygon', 'arbitrum'],
  },
  {
    kind: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Smart wallet supporting EVM and Solana settlement.',
    recommended: false,
    supportedChains: ['ethereum', 'polygon', 'solana', 'arbitrum'],
  },
  {
    kind: 'phantom',
    name: 'Phantom',
    description: 'Solana-first wallet for high throughput mints.',
    recommended: false,
    supportedChains: ['solana'],
  },
  {
    kind: 'ledger',
    name: 'Ledger',
    description: 'Hardware signer for cold custody of collectibles.',
    recommended: false,
    supportedChains: ['ethereum', 'arbitrum'],
  },
];

export function getWalletProvider(kind: WalletProviderDescriptor['kind']): WalletProviderDescriptor {
  return WALLET_PROVIDERS.find((provider) => provider.kind === kind) ?? WALLET_PROVIDERS[0];
}

/** Deterministic connection outcomes so the simulation is reproducible. */
export const WALLET_PROFILES: Record<
  WalletProviderDescriptor['kind'],
  { address: string; ensName: string | null; balanceEth: number; failRate: number }
> = {
  metamask: {
    address: '0x38F24cB7e0A1D9bF52A5C3f3C19A8dE4B4a92C771',
    ensName: 'collector.eth',
    balanceEth: 4.85,
    failRate: 0.08,
  },
  coinbase: {
    address: '0x9A17d5Cb30E6f4A8c1B7D2e6F53a0b6C4D8214fE',
    ensName: null,
    balanceEth: 2.42,
    failRate: 0.12,
  },
  phantom: {
    address: '7Xb2Cq9KQmYvF3nT8pLdR5wZsA1eH6jG4uC9oN2sVxKp',
    ensName: null,
    balanceEth: 18.36,
    failRate: 0.15,
  },
  ledger: {
    address: '0x4D8e11F0a9C37b52E6A0d8C41Bf9E7a53c6021Bd',
    ensName: 'vault.eth',
    balanceEth: 12.08,
    failRate: 0.1,
  },
};

export const CONNECT_HANDSHAKE_DELAY_MS = 650;
export const CHAIN_SWITCH_DELAY_MS = 420;
export const CHECKOUT_STEP_DELAY_MS = 700;

/**
 * Checkout transaction state machine
 * ---------------------------------------------------------------------------
 */
export const CHECKOUT_STEPS: CheckoutStep[] = [
  {
    id: 'review',
    label: 'Review order',
    description: 'Confirm line items, licenses and the quoted fiat conversion.',
  },
  {
    id: 'authorization',
    label: 'Authorize spending',
    description: 'Grant the marketplace contract an allowance for this purchase.',
  },
  {
    id: 'gas_estimate',
    label: 'Estimate gas',
    description: 'Simulate the transfer to lock in the network fee.',
  },
  {
    id: 'signing',
    label: 'Sign payload',
    description: 'Sign the typed-data order with the connected wallet.',
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Submit the signed order to the settlement network.',
  },
  {
    id: 'confirmation',
    label: 'Confirm on-chain',
    description: 'Wait for the block inclusion receipt.',
  },
];

/**
 * Persistence keys
 * ---------------------------------------------------------------------------
 */
export const STORAGE_KEYS = {
  cart: 'ns_asset_market_cart_v1',
  unavailableAssets: 'ns_asset_market_unavailable_v1',
  wallet: 'ns_asset_market_wallet_v1',
  transactions: 'ns_asset_market_transactions_v1',
  walletProviderKind: 'ns_asset_market_wallet_provider_v1',
  favorites: 'ns_asset_market_favorites_v1',
} as const;

export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Digital Asset Marketplace';
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Minimum pointer target enforced across every interactive control. */
export const MIN_TOUCH_TARGET_PX = 44;