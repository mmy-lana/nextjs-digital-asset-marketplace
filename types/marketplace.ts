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
  /** Always a renderable image poster. Never an audio stream. */
  previewUrl: string;
  /** Always a renderable image source. Never an audio stream. */
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
  /**
   * RUN-01: decoupled audio stream endpoint.
   *
   * Audio used to be written into `previewUrl`, so `<Image>` handed an
   * `audio/mpeg` URL to the image optimizer. That produced upstream MIME-type
   * mismatches, hard crashes and multi-second optimizer timeouts. The visual
   * fields now always carry a real image and audio players read this field.
   */
  audioUrl?: string;
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

// ---------------------------------------------------------------------------
// Supporting domain contracts used by the presentation and orchestration
// layers. These intentionally extend (never mutate) the contracts above.
// ---------------------------------------------------------------------------

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export type SortOption = FilterState['sortBy'];

export type WalletProviderKind = 'metamask' | 'coinbase' | 'phantom' | 'ledger';

export interface WalletProviderDescriptor {
  kind: WalletProviderKind;
  name: string;
  description: string;
  recommended: boolean;
  /** Networks the provider can route a simulated connection through. */
  supportedChains: ChainNetwork[];
}

export type ProvenanceEventKind = 'mint' | 'listing' | 'transfer' | 'sale' | 'settlement';

export interface ProvenanceEvent {
  id: string;
  kind: ProvenanceEventKind;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  priceCrypto: number | null;
  priceFiatUsd: number | null;
  currency: DigitalAsset['currencySymbol'];
  note: string;
}

export type CheckoutStepId =
  | 'review'
  | 'authorization'
  | 'gas_estimate'
  | 'signing'
  | 'broadcast'
  | 'confirmation';

export type CheckoutStatus = 'idle' | 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface CheckoutStep {
  id: CheckoutStepId;
  label: string;
  description: string;
}

export interface CategoryDescriptor {
  label: string;
  value: AssetCategory;
  description: string;
}

export interface ChainDescriptor {
  label: string;
  value: ChainNetwork;
  chainId: number;
  nativeSymbol: DigitalAsset['currencySymbol'];
  explorerUrl: string;
  accentClass: string;
}

export interface LicenseDescriptor {
  label: string;
  value: LicenseType;
  summary: string;
  multiplier: number;
  seatLimit: number | null;
}
