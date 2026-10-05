import type {
  AssetCategory,
  AssetTrait,
  ChainNetwork,
  CollectionSummary,
  CreatorProfile,
  DigitalAsset,
  LicenseType,
  ListingType,
  MediaPayload,
  ProvenanceEvent,
  TransactionRecord,
} from '@/types/marketplace';

/**
 * Curated seed catalogue for the marketplace simulation.
 *
 * Everything here is deterministic: no `Math.random()`, no `Date.now()` at
 * module scope, no network calls. The same tree is produced identically on the
 * server and on the client so React Server Component payloads stay cacheable
 * and hydration never mismatches.
 */

// ---------------------------------------------------------------------------
// Media helpers
// ---------------------------------------------------------------------------

const UNSPLASH_ORIGIN = 'https://images.unsplash.com/photo-';

function unsplash(photoId: string, width: number, quality = 80): string {
  return `${UNSPLASH_ORIGIN}${photoId}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/** Public-domain sample beds used by the audio preview player. */
const SAMPLE_AUDIO_ORIGIN = 'https://www.soundhelix.com/examples/mp3';

function sampleAudio(songNumber: number): string {
  return `${SAMPLE_AUDIO_ORIGIN}/SoundHelix-Song-${songNumber}.mp3`;
}

/** Indicative ETH spot used to derive every fiat quote in the catalogue. */
export const ETH_USD_RATE = 3247.18;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Creators
// ---------------------------------------------------------------------------

export const creators: CreatorProfile[] = [
  {
    id: 'c-01',
    walletAddress: '0x71C4b0e9A2f5D83a6E1b47c9D0f2A35b8e6C1470',
    displayName: 'AetherStudio',
    handle: '@aether_arch',
    avatarUrl: unsplash('1618005182384-a83a8bd57fbe', 160),
    bannerUrl: unsplash('1634017839464-5c339ebe3cb4', 1400),
    bio: 'Hard-surface and volumetric environment artist building high-dimensional digital environments for realtime pipelines.',
    verified: true,
    totalSalesVolumeEth: 142.85,
    joinedAt: '2023-01-15T00:00:00.000Z',
  },
  {
    id: 'c-02',
    walletAddress: '0x3F9a2b8C5d7E104fa62B8C3D90e5A7c1F4b2D6890',
    displayName: 'Neon Foundry',
    handle: '@neonfoundry',
    avatarUrl: unsplash('1633356122544-f134324a6cee', 160),
    bannerUrl: unsplash('1614812513172-567d2fe96a75', 1400),
    bio: 'Generative studio minting verifiable on-chain editions from constraint-driven drawing systems.',
    verified: true,
    totalSalesVolumeEth: 964.4,
    joinedAt: '2022-06-02T00:00:00.000Z',
  },
  {
    id: 'c-03',
    walletAddress: '0x9D4c17B2e8F035a9C6D1b84E2f7A0c3D5b9E24618',
    displayName: 'Voxel Loom',
    handle: '@voxel_loom',
    avatarUrl: unsplash('1523474253046-8cd2748b5fd2', 160),
    bannerUrl: unsplash('1502920917128-1aa500764cbd', 1400),
    bio: 'Motion designer cutting kinetic type systems and seamless broadcast loops for product storytelling.',
    verified: true,
    totalSalesVolumeEth: 318.27,
    joinedAt: '2023-03-21T00:00:00.000Z',
  },
  {
    id: 'c-04',
    walletAddress: '0x2E8b5D1a9C0f4376B2d4A8e1C5F7b3D906A1c4E73',
    displayName: 'Priya Raman',
    handle: '@priya_builds',
    avatarUrl: unsplash('1494790108377-be9c29b29330', 160),
    bannerUrl: unsplash('1497366754035-f200968a6e72', 1400),
    bio: 'Product designer shipping dark-first interface systems with documented tokens and accessible primitives.',
    verified: true,
    totalSalesVolumeEth: 87.62,
    joinedAt: '2023-08-09T00:00:00.000Z',
  },
  {
    id: 'c-05',
    walletAddress: '0x7A1c3E9b5D0f2864C7aB9e2D1F5c8B3a6E0d9471',
    displayName: 'Sonar Dept.',
    handle: '@sonar_dept',
    avatarUrl: unsplash('1472099645785-5658abf4ff4e', 160),
    bannerUrl: unsplash('1511379938547-c1f69419868d', 1400),
    bio: 'Sound department publishing stems, loops and modular kits cleared for commercial sync.',
    verified: true,
    totalSalesVolumeEth: 54.09,
    joinedAt: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'c-06',
    walletAddress: '0x5C8e2F4a1B7d0396E3c5A8b1D4F76029aC3e8B514',
    displayName: 'Miko Tanaka',
    handle: '@mikotangent',
    avatarUrl: unsplash('1500648767791-00dcc994a43e', 160),
    bannerUrl: unsplash('1523240795612-9a054b0db644', 1400),
    bio: 'Illustrator drawing geometric icon families and editorial spot systems for independent publications.',
    verified: false,
    totalSalesVolumeEth: 12.44,
    joinedAt: '2024-05-27T00:00:00.000Z',
  },
  {
    id: 'c-07',
    walletAddress: '0x4B6d19E3a7C052f8D1e4B6a90F3c7D2E85A1bF39',
    displayName: 'Holo Bureau',
    handle: '@holo_bureau',
    avatarUrl: unsplash('1560250097-0b93528c311a', 160),
    bannerUrl: unsplash('1519681393784-d120267933ba', 1400),
    bio: 'Boutique studio producing volumetric captures, scan-derived props and mixed-reality environments.',
    verified: true,
    totalSalesVolumeEth: 231.18,
    joinedAt: '2022-11-30T00:00:00.000Z',
  },
  {
    id: 'c-08',
    walletAddress: '0x8E3a7B2c1D5f0946A7bC0d2E9F4a6B8c3D1e7052',
    displayName: 'Lumen Press',
    handle: '@lumenpress',
    avatarUrl: unsplash('1534528741775-53994a69daeb', 160),
    bannerUrl: unsplash('1524178232363-1fb2b075b655', 1400),
    bio: 'Independent press producing long-form editorial illustration and archival vector facsimiles.',
    verified: false,
    totalSalesVolumeEth: 7.31,
    joinedAt: '2024-09-16T00:00:00.000Z',
  },
];

const creatorIndex = new Map(creators.map((creator) => [creator.id, creator]));

export function getCreatorById(id: string): CreatorProfile {
  const creator = creatorIndex.get(id);
  if (!creator) {
    throw new Error(`Unknown creator reference: ${id}`);
  }
  return creator;
}

// ---------------------------------------------------------------------------
// Asset seeds
// ---------------------------------------------------------------------------

interface AssetSeed {
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
  creatorId: string;
  holderId: string;
  photoId: string;
  mimeType: string;
  fileSizeBytes: number;
  dimensions?: { width: number; height: number };
  durationSeconds?: number;
  modelFormat?: MediaPayload['modelFormat'];
  audioSongNumber?: number;
  traits: AssetTrait[];
  royaltiesPercentage: number;
  likesCount: number;
  viewsCount: number;
  isAvailable: boolean;
  createdAt: string;
}

function buildMedia(seed: AssetSeed): MediaPayload {
  return {
    // RUN-01: the visual fields always carry a real image poster, even for
    // audio listings. The stream lives in `audioUrl`.
    previewUrl: unsplash(seed.photoId, 900),
    highResUrl: unsplash(seed.photoId, 1920, 90),
    thumbnailUrl: unsplash(seed.photoId, 480),
    mimeType: seed.mimeType,
    fileSizeBytes: seed.fileSizeBytes,
    ...(seed.dimensions ? { dimensions: seed.dimensions } : {}),
    ...(seed.durationSeconds === undefined ? {} : { durationSeconds: seed.durationSeconds }),
    ...(seed.modelFormat ? { modelFormat: seed.modelFormat } : {}),
    ...(seed.audioSongNumber === undefined
      ? {}
      : { audioUrl: sampleAudio(seed.audioSongNumber) }),
  };
}

function buildAsset(seed: AssetSeed): DigitalAsset {
  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    tags: seed.tags,
    chain: seed.chain,
    contractAddress: seed.contractAddress,
    tokenId: seed.tokenId,
    license: seed.license,
    listingType: seed.listingType,
    priceCrypto: seed.priceCrypto,
    priceFiatUsd: round(seed.priceCrypto * ETH_USD_RATE, 2),
    currencySymbol: 'ETH',
    creator: getCreatorById(seed.creatorId),
    currentOwner: getCreatorById(seed.holderId),
    media: buildMedia(seed),
    traits: seed.traits,
    royaltiesPercentage: seed.royaltiesPercentage,
    likesCount: seed.likesCount,
    viewsCount: seed.viewsCount,
    isAvailable: seed.isAvailable,
    createdAt: seed.createdAt,
    updatedAt: seed.createdAt,
  };
}

const assetSeeds: AssetSeed[] = [
  // --- 3D models (5) -------------------------------------------------------
  {
    id: 'ast-01',
    slug: 'chroma-void-3d',
    title: 'Chroma Void Fragment #04',
    description:
      'A procedurally warped prismatic monolith with an emissive core, authored as a single-draw-call glTF binary with LOD chain baked in.',
    category: '3d_models',
    tags: ['3D', 'Crystalline', 'Procedural', 'Realtime', 'Hard Surface'],
    chain: 'ethereum',
    contractAddress: '0x2953399124f0cbb46d2cbacd8a89cf0599974963',
    tokenId: '10482',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.85,
    creatorId: 'c-01',
    holderId: 'c-01',
    photoId: '1634017839464-5c339ebe3cb4',
    mimeType: 'model/gltf-binary',
    fileSizeBytes: 24500000,
    dimensions: { width: 1920, height: 1080 },
    modelFormat: 'glb',
    traits: [
      { traitType: 'Refraction Index', value: 1.84, rarityScore: 88, frequencyPercent: 4 },
      { traitType: 'Surface Finish', value: 'Vitreous Glass', rarityScore: 65, frequencyPercent: 12 },
      { traitType: 'Emission', value: 'Bioluminescent Cyan', rarityScore: 92, frequencyPercent: 2 },
      { traitType: 'Polygon Budget', value: 184000, rarityScore: 41, frequencyPercent: 34 },
    ],
    royaltiesPercentage: 5,
    likesCount: 342,
    viewsCount: 1890,
    isAvailable: true,
    createdAt: '2024-03-01T12:00:00.000Z',
  },
  {
    id: 'ast-02',
    slug: 'holographic-standby-unit',
    title: 'Holographic Standby Unit',
    description:
      'Volumetric sci-fi terminal captured as a scan-derived mesh with baked 4K albedo, roughness and normal maps.',
    category: '3d_models',
    tags: ['3D', 'Sci-Fi', 'Scan', 'Volumetric'],
    chain: 'arbitrum',
    contractAddress: '0x8c1d5f2a4b9e0736d2f8a1c4b7e0d9f6a3c5b81e',
    tokenId: '2207',
    license: 'extended_commercial',
    listingType: 'timed_auction',
    priceCrypto: 1.9,
    creatorId: 'c-07',
    holderId: 'c-07',
    photoId: '1614728263952-84ea256f9679',
    mimeType: 'model/gltf-binary',
    fileSizeBytes: 68200000,
    dimensions: { width: 2048, height: 1152 },
    modelFormat: 'glb',
    traits: [
      { traitType: 'Capture Rig', value: 'Photogrammetry 128-shot', rarityScore: 74, frequencyPercent: 9 },
      { traitType: 'Texture Set', value: '4K PBR', rarityScore: 58, frequencyPercent: 21 },
      { traitType: 'Emissive Channels', value: 6, rarityScore: 36, frequencyPercent: 44 },
    ],
    royaltiesPercentage: 6,
    likesCount: 519,
    viewsCount: 3420,
    isAvailable: true,
    createdAt: '2024-03-11T09:20:00.000Z',
  },
  {
    id: 'ast-03',
    slug: 'terrain-modular-drift',
    title: 'Terrain Modular: Drift Set',
    description:
      'Forty-two modular cliff and strata pieces that interlock seamlessly, shipped with Substance Painter source graphs.',
    category: '3d_models',
    tags: ['3D', 'Environment', 'Modular', 'Game Ready'],
    chain: 'polygon',
    contractAddress: '0x3fa92b7c5e18d0460a7b9c2d5e8f1a4c6b0d3975',
    tokenId: '6612',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.42,
    creatorId: 'c-01',
    holderId: 'c-07',
    photoId: '1444703686981-a3abbc4d4fe3',
    mimeType: 'model/gltf-binary',
    fileSizeBytes: 41200000,
    dimensions: { width: 1600, height: 900 },
    modelFormat: 'gltf',
    traits: [
      { traitType: 'Piece Count', value: 42, rarityScore: 62, frequencyPercent: 16 },
      { traitType: 'Trim Sheet Layout', value: 'Atlas 2048', rarityScore: 47, frequencyPercent: 28 },
      { traitType: 'Biome', value: 'Coastal Drift', rarityScore: 81, frequencyPercent: 6 },
    ],
    royaltiesPercentage: 5,
    likesCount: 208,
    viewsCount: 1244,
    isAvailable: true,
    createdAt: '2024-02-22T16:45:00.000Z',
  },
  {
    id: 'ast-04',
    slug: 'kinetic-gear-array',
    title: 'Kinetic Gear Array',
    description:
      'Rigged mechanical gear cluster with working rotation constraints, exported as FBX with animation-ready pivots.',
    category: '3d_models',
    tags: ['3D', 'Mechanical', 'Rigged', 'Animation'],
    chain: 'ethereum',
    contractAddress: '0xa04c7f3e9b6d21508c7a3e9b1d4f60c2a5b8e137',
    tokenId: '3390',
    license: 'editorial_only',
    listingType: 'open_for_offers',
    priceCrypto: 0.18,
    creatorId: 'c-07',
    holderId: 'c-07',
    photoId: '1487017159836-4e23ece2e4cf',
    mimeType: 'model/fbx',
    fileSizeBytes: 29800000,
    dimensions: { width: 1400, height: 1400 },
    modelFormat: 'fbx',
    traits: [
      { traitType: 'Gear Count', value: 18, rarityScore: 55, frequencyPercent: 23 },
      { traitType: 'Constraint Type', value: 'Driver Chain', rarityScore: 86, frequencyPercent: 5 },
      { traitType: 'Material', value: 'Brushed Brass', rarityScore: 39, frequencyPercent: 37 },
    ],
    royaltiesPercentage: 3,
    likesCount: 96,
    viewsCount: 702,
    isAvailable: true,
    createdAt: '2024-04-02T11:10:00.000Z',
  },
  {
    id: 'ast-05',
    slug: 'nebula-lattice-tower',
    title: 'Nebula Lattice Tower',
    description:
      'A 12-storey lattice structure built for parallax compositing, with separate emissive shells for realtime fog.',
    category: '3d_models',
    tags: ['3D', 'Architecture', 'Lattice', 'Environment'],
    chain: 'arbitrum',
    contractAddress: '0xd71b4e0c8a293f6d5c1e8b740a3f6d9c2b5e0a48',
    tokenId: '9071',
    license: 'extended_commercial',
    listingType: 'fixed_price',
    priceCrypto: 2.35,
    creatorId: 'c-01',
    holderId: 'c-01',
    photoId: '1451187580459-43490279c0fa',
    mimeType: 'model/obj',
    fileSizeBytes: 91500000,
    dimensions: { width: 2400, height: 1350 },
    modelFormat: 'obj',
    traits: [
      { traitType: 'Structural Depth', value: 12, rarityScore: 79, frequencyPercent: 7 },
      { traitType: 'Emissive Shells', value: 4, rarityScore: 68, frequencyPercent: 11 },
      { traitType: 'Render Target', value: 'Realtime + Offline', rarityScore: 33, frequencyPercent: 51 },
    ],
    royaltiesPercentage: 6.5,
    likesCount: 671,
    viewsCount: 4180,
    isAvailable: true,
    createdAt: '2024-01-19T08:00:00.000Z',
  },

  // --- UI templates (4) ----------------------------------------------------
  {
    id: 'ast-06',
    slug: 'synth-nexus-ui',
    title: 'SynthNexus Design System',
    description:
      'A dark-glass interface architecture with 240 documented components, Figma variables and a matching React token package.',
    category: 'ui_templates',
    tags: ['UI Kit', 'Figma', 'React', 'Dark Mode', 'Design System'],
    chain: 'polygon',
    contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    tokenId: '4881',
    license: 'extended_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.15,
    creatorId: 'c-04',
    holderId: 'c-04',
    photoId: '1504384308090-c894fdcc538d',
    mimeType: 'application/zip',
    fileSizeBytes: 148000000,
    dimensions: { width: 1600, height: 1000 },
    traits: [
      { traitType: 'Component Count', value: 240, rarityScore: 78, frequencyPercent: 8 },
      { traitType: 'Token Layers', value: 3, rarityScore: 52, frequencyPercent: 19 },
      { traitType: 'Accessibility', value: 'WCAG 2.2 AA audited', rarityScore: 71, frequencyPercent: 13 },
    ],
    royaltiesPercentage: 2.5,
    likesCount: 890,
    viewsCount: 4210,
    isAvailable: true,
    createdAt: '2024-03-02T15:30:00.000Z',
  },
  {
    id: 'ast-07',
    slug: 'helios-analytics-dashboard',
    title: 'Helios Analytics Dashboard',
    description:
      'A responsive analytics surface with 46 chart compositions, a themable token layer and print-ready export presets.',
    category: 'ui_templates',
    tags: ['Dashboard', 'Charts', 'Responsive', 'Figma'],
    chain: 'polygon',
    contractAddress: '0x1b9c5e7a3d820f46b7c9e2a4d8f0b1c6e3a7d529',
    tokenId: '5120',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.34,
    creatorId: 'c-04',
    holderId: 'c-04',
    photoId: '1551288049-bebda4e38f71',
    mimeType: 'application/zip',
    fileSizeBytes: 86000000,
    dimensions: { width: 1920, height: 1200 },
    traits: [
      { traitType: 'Chart Compositions', value: 46, rarityScore: 64, frequencyPercent: 14 },
      { traitType: 'Breakpoints', value: 6, rarityScore: 43, frequencyPercent: 31 },
      { traitType: 'Theming', value: 'Multi-brand tokens', rarityScore: 59, frequencyPercent: 18 },
    ],
    royaltiesPercentage: 2.5,
    likesCount: 402,
    viewsCount: 2380,
    isAvailable: true,
    createdAt: '2024-02-08T10:15:00.000Z',
  },
  {
    id: 'ast-08',
    slug: 'monolith-mobile-kit',
    title: 'Monolith Mobile Kit',
    description:
      'A production mobile kit covering onboarding, checkout, settings and offline states across 390px and 430px targets.',
    category: 'ui_templates',
    tags: ['Mobile', 'iOS', 'Android', 'Prototype'],
    chain: 'arbitrum',
    contractAddress: '0x6e2d4f8b1a09c7358d2f1b6e4a7c093d5b8f2a61',
    tokenId: '1733',
    license: 'standard_commercial',
    listingType: 'open_for_offers',
    priceCrypto: 0.09,
    creatorId: 'c-04',
    holderId: 'c-01',
    photoId: '1512941937669-90a1b58e7e9c',
    mimeType: 'application/zip',
    fileSizeBytes: 52000000,
    dimensions: { width: 1290, height: 2796 },
    traits: [
      { traitType: 'Flow Count', value: 11, rarityScore: 49, frequencyPercent: 24 },
      { traitType: 'Offline States', value: 'Included', rarityScore: 66, frequencyPercent: 15 },
      { traitType: 'Handoff Spec', value: 'Full annotated', rarityScore: 37, frequencyPercent: 39 },
    ],
    royaltiesPercentage: 2.5,
    likesCount: 178,
    viewsCount: 1102,
    isAvailable: true,
    createdAt: '2024-04-18T13:05:00.000Z',
  },
  {
    id: 'ast-09',
    slug: 'orbit-commerce-shell',
    title: 'Orbit Commerce Shell',
    description:
      'A storefront shell with faceted filtering, quick-view drawers and a checkout surface already wired to typed contracts.',
    category: 'ui_templates',
    tags: ['E-commerce', 'Next.js', 'Filters', 'Checkout'],
    chain: 'ethereum',
    contractAddress: '0x5d3a9c17e4b802f6a1c9e35d7b240af8c61e3d952',
    tokenId: '7788',
    license: 'extended_commercial',
    listingType: 'timed_auction',
    priceCrypto: 1.15,
    creatorId: 'c-04',
    holderId: 'c-04',
    photoId: '1556742049-0cfed4f6a45d',
    mimeType: 'application/zip',
    fileSizeBytes: 134000000,
    dimensions: { width: 1920, height: 1080 },
    traits: [
      { traitType: 'Facet Dimensions', value: 7, rarityScore: 72, frequencyPercent: 10 },
      { traitType: 'Checkout Depth', value: '3 step-ups', rarityScore: 84, frequencyPercent: 4 },
      { traitType: 'Test Coverage', value: '92%', rarityScore: 95, frequencyPercent: 1 },
    ],
    royaltiesPercentage: 4,
    likesCount: 733,
    viewsCount: 5240,
    isAvailable: true,
    createdAt: '2024-01-07T17:40:00.000Z',
  },

  // --- Vector graphics (4) -------------------------------------------------
  {
    id: 'ast-10',
    slug: 'prism-icon-family',
    title: 'Prism Icon Family',
    description:
      'A 640-icon optical grid family drawn on a 24px base with 1.5px stroke discipline and variable-weight variants.',
    category: 'vector_graphics',
    tags: ['Icons', 'SVG', 'Optical Grid', 'Variable'],
    chain: 'polygon',
    contractAddress: '0xa17c4e9b2d6035f8e1a7c4b9d2e60f83a5c17b40',
    tokenId: '3044',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.06,
    creatorId: 'c-06',
    holderId: 'c-06',
    photoId: '1550684848-fac1c5b4e853',
    mimeType: 'image/svg+xml',
    fileSizeBytes: 8400000,
    dimensions: { width: 2048, height: 2048 },
    traits: [
      { traitType: 'Icon Count', value: 640, rarityScore: 88, frequencyPercent: 5 },
      { traitType: 'Stroke Discipline', value: '1.5px optical', rarityScore: 61, frequencyPercent: 16 },
      { traitType: 'Weight Variants', value: 3, rarityScore: 44, frequencyPercent: 29 },
    ],
    royaltiesPercentage: 2,
    likesCount: 312,
    viewsCount: 2870,
    isAvailable: true,
    createdAt: '2024-04-27T09:50:00.000Z',
  },
  {
    id: 'ast-11',
    slug: 'archive-illustration-vol-i',
    title: 'Archive Illustration Vol. I',
    description:
      'One hundred archival spot illustrations redrawn from public-domain engravings, supplied as layered vector masters.',
    category: 'vector_graphics',
    tags: ['Illustration', 'Editorial', 'Spot Art', 'Print Ready'],
    chain: 'ethereum',
    contractAddress: '0x2b8e0d47f1a936c5b70e9d284f3a6c15d8b740e92',
    tokenId: '1190',
    license: 'editorial_only',
    listingType: 'open_for_offers',
    priceCrypto: 0.12,
    creatorId: 'c-08',
    holderId: 'c-08',
    photoId: '1577083552431-6e5fd01aa342',
    mimeType: 'application/zip',
    fileSizeBytes: 96000000,
    dimensions: { width: 3000, height: 2000 },
    traits: [
      { traitType: 'Plate Count', value: 100, rarityScore: 76, frequencyPercent: 9 },
      { traitType: 'Source', value: 'Public domain 1880s', rarityScore: 69, frequencyPercent: 12 },
      { traitType: 'Colour Modes', value: 2, rarityScore: 30, frequencyPercent: 47 },
    ],
    royaltiesPercentage: 3,
    likesCount: 154,
    viewsCount: 980,
    isAvailable: true,
    createdAt: '2024-05-06T14:25:00.000Z',
  },
  {
    id: 'ast-12',
    slug: 'isometric-brand-marks',
    title: 'Isometric Brand Marks',
    description:
      'Eighty isometric logo constructions on a 30° grid, each supplied with flat, duotone and outline lockups.',
    category: 'vector_graphics',
    tags: ['Branding', 'Isometric', 'Logo', 'Vector'],
    chain: 'solana',
    contractAddress: '0x4f81a3d9c2b705e61a4d8c3b97f0e2615a8d3c74',
    tokenId: '5512',
    license: 'extended_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.24,
    creatorId: 'c-06',
    holderId: 'c-01',
    photoId: '1561070791-2526d30994b5',
    mimeType: 'application/zip',
    fileSizeBytes: 41000000,
    dimensions: { width: 2400, height: 1600 },
    traits: [
      { traitType: 'Construction Count', value: 80, rarityScore: 67, frequencyPercent: 14 },
      { traitType: 'Grid Angle', value: '30° isometric', rarityScore: 58, frequencyPercent: 18 },
      { traitType: 'Lockup Variants', value: 3, rarityScore: 51, frequencyPercent: 21 },
    ],
    royaltiesPercentage: 3,
    likesCount: 267,
    viewsCount: 1655,
    isAvailable: true,
    createdAt: '2024-03-29T12:00:00.000Z',
  },
  {
    id: 'ast-13',
    slug: 'terrain-contour-atlas',
    title: 'Terrain Contour Atlas',
    description:
      'Vector contour overlays for 120 real-world regions, clipped and labelled, ready for cartographic compositions.',
    category: 'vector_graphics',
    tags: ['Cartography', 'Contours', 'Data Viz', 'Map'],
    chain: 'polygon',
    contractAddress: '0x6f2a4c8e1b903d75a6e0c4f28d1b93a7c5e046d1',
    tokenId: '8023',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.28,
    creatorId: 'c-08',
    holderId: 'c-08',
    photoId: '1526778548025-fa2f459cd5c1',
    mimeType: 'application/zip',
    fileSizeBytes: 73000000,
    dimensions: { width: 2200, height: 2200 },
    traits: [
      { traitType: 'Region Count', value: 120, rarityScore: 73, frequencyPercent: 11 },
      { traitType: 'Contour Interval', value: '50 m', rarityScore: 46, frequencyPercent: 26 },
      { traitType: 'Label Support', value: 'Auto-generated', rarityScore: 82, frequencyPercent: 6 },
    ],
    royaltiesPercentage: 3.5,
    likesCount: 198,
    viewsCount: 1330,
    isAvailable: true,
    createdAt: '2024-06-01T08:30:00.000Z',
  },

  // --- Generative NFT (4) --------------------------------------------------
  {
    id: 'ast-14',
    slug: 'chromatic-mint-0091',
    title: 'Chromatic Mint #0091',
    description:
      'Constraint-driven colour field minted on-chain; the seed hash is embedded in the contract and re-derivable by anyone.',
    category: 'generative_nft',
    tags: ['Generative', 'On-Chain', 'Edition', 'Verifiable'],
    chain: 'ethereum',
    contractAddress: '0xc7d8a3f1e6b04d92a5c8f0371e4b9d26a0c5f813',
    tokenId: '91',
    license: 'exclusive_nft',
    listingType: 'timed_auction',
    priceCrypto: 3.4,
    creatorId: 'c-02',
    holderId: 'c-02',
    photoId: '1550745165-9bc0b252726f',
    mimeType: 'image/png',
    fileSizeBytes: 4200000,
    dimensions: { width: 2000, height: 2000 },
    traits: [
      { traitType: 'Hue Drift', value: 137.4, rarityScore: 91, frequencyPercent: 2 },
      { traitType: 'Layer Count', value: 24, rarityScore: 64, frequencyPercent: 15 },
      { traitType: 'Seed Hash', value: '0x8f3a…c921', rarityScore: 97, frequencyPercent: 1 },
      { traitType: 'Palette', value: 'Bichrome Complementary', rarityScore: 55, frequencyPercent: 20 },
    ],
    royaltiesPercentage: 7.5,
    likesCount: 1841,
    viewsCount: 11230,
    isAvailable: true,
    createdAt: '2024-02-14T19:00:00.000Z',
  },
  {
    id: 'ast-15',
    slug: 'chromatic-mint-0147',
    title: 'Chromatic Mint #0147',
    description:
      'A wide-band interference study from the Chromatic Mint series, minted with a permanently frozen generator version.',
    category: 'generative_nft',
    tags: ['Generative', 'On-Chain', 'Chromatic'],
    chain: 'ethereum',
    contractAddress: '0xc7d8a3f1e6b04d92a5c8f0371e4b9d26a0c5f813',
    tokenId: '147',
    license: 'exclusive_nft',
    listingType: 'fixed_price',
    priceCrypto: 2.75,
    creatorId: 'c-02',
    holderId: 'c-01',
    photoId: '1579546929518-9e396f3cc809',
    mimeType: 'image/png',
    fileSizeBytes: 3900000,
    dimensions: { width: 2000, height: 2000 },
    traits: [
      { traitType: 'Hue Drift', value: 298.1, rarityScore: 76, frequencyPercent: 9 },
      { traitType: 'Band Spacing', value: 'Tight', rarityScore: 68, frequencyPercent: 13 },
      { traitType: 'Seed Hash', value: '0x21d7…4b08', rarityScore: 97, frequencyPercent: 1 },
    ],
    royaltiesPercentage: 7.5,
    likesCount: 1204,
    viewsCount: 8620,
    isAvailable: true,
    createdAt: '2024-02-14T19:00:00.000Z',
  },
  {
    id: 'ast-16',
    slug: 'field-notes-token-003',
    title: 'Field Notes Token #003',
    description:
      'Hand-annotated plot output from a year-long generative field study, packaged with the underlying dataset.',
    category: 'generative_nft',
    tags: ['Generative', 'Data', 'Dataset', 'Edition'],
    chain: 'solana',
    contractAddress: '0x9d3b7e2a5c840f169a2d6b3e8c15047fa9d26b53',
    tokenId: '3',
    license: 'standard_commercial',
    listingType: 'open_for_offers',
    priceCrypto: 0.65,
    creatorId: 'c-02',
    holderId: 'c-02',
    photoId: '1541701494587-cb58502866ab',
    mimeType: 'image/png',
    fileSizeBytes: 6100000,
    dimensions: { width: 1800, height: 2400 },
    traits: [
      { traitType: 'Study Length', value: '12 months', rarityScore: 86, frequencyPercent: 4 },
      { traitType: 'Plot Count', value: 365, rarityScore: 79, frequencyPercent: 8 },
      { traitType: 'Annotation Density', value: 'High', rarityScore: 57, frequencyPercent: 17 },
    ],
    royaltiesPercentage: 5,
    likesCount: 389,
    viewsCount: 2540,
    isAvailable: true,
    createdAt: '2024-05-22T20:15:00.000Z',
  },
  {
    id: 'ast-17',
    slug: 'void-sigil-edition-042',
    title: 'Void Sigil Edition #042',
    description:
      'A structured sigil from a closed generative run; the run manifest and renderer version ship with the token.',
    category: 'generative_nft',
    tags: ['Generative', 'Sigil', 'Manifest'],
    chain: 'arbitrum',
    contractAddress: '0xe35c8a1d7f209b4360a9c4e72d58b103f7a6c294',
    tokenId: '42042',
    license: 'exclusive_nft',
    listingType: 'fixed_price',
    priceCrypto: 1.55,
    creatorId: 'c-02',
    holderId: 'c-07',
    photoId: '1518770660439-4636190af475',
    mimeType: 'image/png',
    fileSizeBytes: 2800000,
    dimensions: { width: 1600, height: 1600 },
    traits: [
      { traitType: 'Glyph Count', value: 17, rarityScore: 71, frequencyPercent: 12 },
      { traitType: 'Run Length', value: 500, rarityScore: 62, frequencyPercent: 15 },
      { traitType: 'Renderer', value: 'v2.4.1 frozen', rarityScore: 88, frequencyPercent: 3 },
    ],
    royaltiesPercentage: 7.5,
    likesCount: 622,
    viewsCount: 3980,
    isAvailable: false,
    createdAt: '2024-01-30T22:00:00.000Z',
  },

  // --- Audio tracks (4) ----------------------------------------------------
  {
    id: 'ast-18',
    slug: 'sonar-drift-bed',
    title: 'Sonar Drift Bed',
    description:
      'A nine-minute evolving ambient bed with six seamless loop points, delivered as 24-bit WAV and MP3 stems.',
    category: 'audio_tracks',
    tags: ['Ambient', 'Loop', 'Stems', 'Cinematic'],
    chain: 'ethereum',
    contractAddress: '0x1f7c4a9e2b60d835c7a4e109f6b3d285a0c7e194',
    tokenId: '6401',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.22,
    creatorId: 'c-05',
    holderId: 'c-05',
    photoId: '1493225457124-a3eb161ffa5f',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 48000000,
    durationSeconds: 372,
    audioSongNumber: 1,
    traits: [
      { traitType: 'Loop Points', value: 6, rarityScore: 58, frequencyPercent: 18 },
      { traitType: 'Master', value: '24-bit WAV', rarityScore: 74, frequencyPercent: 9 },
      { traitType: 'Stem Count', value: 8, rarityScore: 47, frequencyPercent: 25 },
    ],
    royaltiesPercentage: 3,
    likesCount: 147,
    viewsCount: 980,
    isAvailable: true,
    createdAt: '2024-03-15T07:45:00.000Z',
  },
  {
    id: 'ast-19',
    slug: 'modular-pulse-kit',
    title: 'Modular Pulse Kit',
    description:
      'A 180-sample modular percussion kit with velocity-layered one-shots and a tempo-locked noise sweep.',
    category: 'audio_tracks',
    tags: ['Percussion', 'Modular', 'One-Shots', 'DAW'],
    chain: 'polygon',
    contractAddress: '0xb82d5f1a9c370e46b7d2f0158a3e9c40d6b7f852',
    tokenId: '6418',
    license: 'extended_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.14,
    creatorId: 'c-05',
    holderId: 'c-06',
    photoId: '1505740420928-5e560c06d30e',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 92000000,
    durationSeconds: 480,
    audioSongNumber: 8,
    traits: [
      { traitType: 'Sample Count', value: 180, rarityScore: 66, frequencyPercent: 14 },
      { traitType: 'Velocity Layers', value: 4, rarityScore: 81, frequencyPercent: 7 },
      { traitType: 'Format', value: '24-bit WAV', rarityScore: 52, frequencyPercent: 20 },
    ],
    royaltiesPercentage: 3,
    likesCount: 263,
    viewsCount: 1470,
    isAvailable: true,
    createdAt: '2024-02-27T11:20:00.000Z',
  },
  {
    id: 'ast-20',
    slug: 'choir-texture-vol-ii',
    title: 'Choir Texture Vol. II',
    description:
      'Granular choir textures recorded in a decommissioned chapel, released with separated vowel and breath layers.',
    category: 'audio_tracks',
    tags: ['Choir', 'Granular', 'Texture', 'Cinematic'],
    chain: 'ethereum',
    contractAddress: '0x1f7c4a9e2b60d835c7a4e109f6b3d285a0c7e194',
    tokenId: '6425',
    license: 'standard_commercial',
    listingType: 'open_for_offers',
    priceCrypto: 0.31,
    creatorId: 'c-05',
    holderId: 'c-05',
    photoId: '1511379938547-c1f69419868d',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 61000000,
    durationSeconds: 421,
    audioSongNumber: 9,
    traits: [
      { traitType: 'Recording Space', value: 'Chapel 1911', rarityScore: 93, frequencyPercent: 2 },
      { traitType: 'Layer Count', value: 14, rarityScore: 60, frequencyPercent: 17 },
      { traitType: 'Reverb Tail', value: '6.2 s', rarityScore: 77, frequencyPercent: 8 },
    ],
    royaltiesPercentage: 3.5,
    likesCount: 218,
    viewsCount: 1310,
    isAvailable: true,
    createdAt: '2024-05-11T18:05:00.000Z',
  },
  {
    id: 'ast-21',
    slug: 'synthwave-archive-mix',
    title: 'Synthwave Archive Mix',
    description:
      'A restored 1987 session re-mixed at 96kHz, including the original tape-hiss bed and a modern sidechain pass.',
    category: 'audio_tracks',
    tags: ['Synthwave', 'Retro', 'Remaster', 'Full Track'],
    chain: 'solana',
    contractAddress: '0x5a0c9e37b1d482f60a7c3e95b8d204f1a6c37e940',
    tokenId: '6432',
    license: 'exclusive_nft',
    listingType: 'fixed_price',
    priceCrypto: 0.95,
    creatorId: 'c-05',
    holderId: 'c-08',
    photoId: '1470225620780-dba8ba36b745',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 112000000,
    durationSeconds: 382,
    audioSongNumber: 10,
    traits: [
      { traitType: 'Source', value: 'Tape 1987', rarityScore: 96, frequencyPercent: 1 },
      { traitType: 'Resolution', value: '96 kHz / 24-bit', rarityScore: 85, frequencyPercent: 4 },
      { traitType: 'Edition', value: 'Numbered master', rarityScore: 98, frequencyPercent: 1 },
    ],
    royaltiesPercentage: 8,
    likesCount: 1044,
    viewsCount: 7340,
    isAvailable: true,
    createdAt: '2024-01-25T16:30:00.000Z',
  },

  // --- Motion graphics (3) -------------------------------------------------
  {
    id: 'ast-22',
    slug: 'kinetic-title-system',
    title: 'Kinetic Title System',
    description:
      'A modular title sequence system with 18 typographic entrances, drop-safe mattes and 4K ProRes masters.',
    category: 'motion_graphics',
    tags: ['Titles', 'Typography', '4K', 'Modular'],
    chain: 'arbitrum',
    contractAddress: '0x3a9d5e71c804b26f0e3a8c154d7b6092f4e18a35',
    tokenId: '9120',
    license: 'extended_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.68,
    creatorId: 'c-03',
    holderId: 'c-03',
    photoId: '1534972195531-d756b9bfa9f2',
    mimeType: 'video/quicktime',
    fileSizeBytes: 1420000000,
    dimensions: { width: 3840, height: 2160 },
    durationSeconds: 74,
    traits: [
      { traitType: 'Entrance Count', value: 18, rarityScore: 69, frequencyPercent: 13 },
      { traitType: 'Master Format', value: 'ProRes 4444', rarityScore: 76, frequencyPercent: 9 },
      { traitType: 'Mattes', value: 'Drop-safe included', rarityScore: 55, frequencyPercent: 19 },
    ],
    royaltiesPercentage: 4,
    likesCount: 421,
    viewsCount: 2760,
    isAvailable: true,
    createdAt: '2024-03-08T15:00:00.000Z',
  },
  {
    id: 'ast-23',
    slug: 'seamless-transition-pack',
    title: 'Seamless Transition Pack',
    description:
      'Sixty loop-safe morph transitions with matched optical flow, delivered in After Effects and as alpha ProRes.',
    category: 'motion_graphics',
    tags: ['Transitions', 'Loop Safe', 'Alpha', 'After Effects'],
    chain: 'polygon',
    contractAddress: '0xe47b0c2f9a1538d60c4b7e291a5d038f6c2a91b4',
    tokenId: '9144',
    license: 'standard_commercial',
    listingType: 'open_for_offers',
    priceCrypto: 0.27,
    creatorId: 'c-03',
    holderId: 'c-03',
    photoId: '1526374965328-7f61d4dc18c5',
    mimeType: 'video/quicktime',
    fileSizeBytes: 860000000,
    dimensions: { width: 3840, height: 2160 },
    durationSeconds: 58,
    traits: [
      { traitType: 'Transition Count', value: 60, rarityScore: 72, frequencyPercent: 11 },
      { traitType: 'Alpha Channel', value: 'Included', rarityScore: 64, frequencyPercent: 15 },
      { traitType: 'Loop Length', value: '2 s', rarityScore: 41, frequencyPercent: 33 },
    ],
    royaltiesPercentage: 4,
    likesCount: 188,
    viewsCount: 1240,
    isAvailable: true,
    createdAt: '2024-05-30T10:50:00.000Z',
  },
  {
    id: 'ast-24',
    slug: 'hologram-loop-sequence',
    title: 'Hologram Loop Sequence',
    description:
      'A ten-second hologram flicker cycle designed for identity screens, with alpha channel and scanline variants.',
    category: 'motion_graphics',
    tags: ['Loop', 'Hologram', 'Alpha', 'Identity'],
    chain: 'solana',
    contractAddress: '0x7d0c4b9e2f81a365c9b4e072d8a3f615c0b9d274',
    tokenId: '9160',
    license: 'standard_commercial',
    listingType: 'fixed_price',
    priceCrypto: 0.19,
    creatorId: 'c-03',
    holderId: 'c-07',
    photoId: '1519681393784-d120267933ba',
    mimeType: 'video/quicktime',
    fileSizeBytes: 410000000,
    dimensions: { width: 1920, height: 1080 },
    durationSeconds: 10,
    traits: [
      { traitType: 'Loop Length', value: '10 s', rarityScore: 58, frequencyPercent: 18 },
      { traitType: 'Flicker Modes', value: 4, rarityScore: 63, frequencyPercent: 15 },
      { traitType: 'Scanline Pass', value: 'Detachable', rarityScore: 80, frequencyPercent: 6 },
    ],
    royaltiesPercentage: 4,
    likesCount: 276,
    viewsCount: 1590,
    isAvailable: true,
    createdAt: '2024-06-08T14:40:00.000Z',
  },
];

export const mockAssets: DigitalAsset[] = assetSeeds.map(buildAsset);

const assetBySlug = new Map(mockAssets.map((asset) => [asset.slug, asset]));
const assetById = new Map(mockAssets.map((asset) => [asset.id, asset]));

export function getAssetBySlug(slug: string): DigitalAsset | undefined {
  return assetBySlug.get(slug);
}

export function getAssetById(id: string): DigitalAsset | undefined {
  return assetById.get(id);
}

export function getAllAssetSlugs(): string[] {
  return mockAssets.map((asset) => asset.slug);
}

export function getAssetsByCreator(creatorId: string): DigitalAsset[] {
  return mockAssets.filter((asset) => asset.creator.id === creatorId);
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

interface CollectionSeed {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AssetCategory;
  bannerPhotoId: string;
  logoPhotoId: string;
  creatorId: string;
  verified: boolean;
  createdAt: string;
}

const collectionSeeds: CollectionSeed[] = [
  {
    id: 'col-01',
    slug: 'aether-specimens',
    name: 'Aether Specimens',
    description:
      'A curated index of synthetic dimensional assets, modular environments and volumetric props.',
    category: '3d_models',
    bannerPhotoId: '1634017839464-5c339ebe3cb4',
    logoPhotoId: '1618005182384-a83a8bd57fbe',
    creatorId: 'c-01',
    verified: true,
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'col-02',
    slug: 'chromatic-mint',
    name: 'Chromatic Mint',
    description:
      'On-chain generative editions with embedded seeds, frozen renderers and verifiable run manifests.',
    category: 'generative_nft',
    bannerPhotoId: '1579546929518-9e396f3cc809',
    logoPhotoId: '1550745165-9bc0b252726f',
    creatorId: 'c-02',
    verified: true,
    createdAt: '2023-11-02T00:00:00.000Z',
  },
  {
    id: 'col-03',
    slug: 'sonar-archive',
    name: 'Sonar Archive',
    description:
      'Cleared stems, beds and modular kits from the Sonar Dept. sound library.',
    category: 'audio_tracks',
    bannerPhotoId: '1493225457124-a3eb161ffa5f',
    logoPhotoId: '1472099645785-5658abf4ff4e',
    creatorId: 'c-05',
    verified: true,
    createdAt: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'col-04',
    slug: 'prism-interface-systems',
    name: 'Prism Interface Systems',
    description:
      'Dark-first interface architecture, analytics surfaces and commerce shells with full handoff specs.',
    category: 'ui_templates',
    bannerPhotoId: '1551288049-bebda4e38f71',
    logoPhotoId: '1494790108377-be9c29b29330',
    creatorId: 'c-04',
    verified: true,
    createdAt: '2024-02-08T00:00:00.000Z',
  },
];

/**
 * Collection membership, floor price, volume and holder counts are derived from
 * the asset catalogue so the relational graph can never drift out of sync with
 * the listings it describes.
 */
const collectionMemberIds: Record<string, string[]> = {
  'col-01': ['ast-01', 'ast-03', 'ast-05', 'ast-02', 'ast-04'],
  'col-02': ['ast-14', 'ast-15', 'ast-17', 'ast-16'],
  'col-03': ['ast-18', 'ast-19', 'ast-20', 'ast-21'],
  'col-04': ['ast-06', 'ast-07', 'ast-08', 'ast-09'],
};

function buildCollection(seed: CollectionSeed): CollectionSummary {
  const members = (collectionMemberIds[seed.id] ?? [])
    .map((id) => assetById.get(id))
    .filter((asset): asset is DigitalAsset => asset !== undefined);

  if (members.length === 0) {
    throw new Error(`Collection ${seed.id} has no resolvable members.`);
  }

  const floorPriceEth = round(
    Math.min(...members.map((asset) => asset.priceCrypto)),
    4
  );

  // Cumulative simulated secondary volume scales with observed demand so the
  // figure stays deterministic while remaining plausible.
  const totalVolumeEth = round(
    members.reduce((total, asset) => total + asset.priceCrypto * (1 + asset.viewsCount / 500), 0),
    4
  );

  const holders = new Set<string>(members.map((asset) => asset.currentOwner.id));

  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    description: seed.description,
    category: seed.category,
    bannerUrl: unsplash(seed.bannerPhotoId, 1400),
    logoUrl: unsplash(seed.logoPhotoId, 200),
    creatorId: seed.creatorId,
    contractAddress: members[0].contractAddress,
    assetIds: members.map((asset) => asset.id),
    floorPriceEth,
    totalVolumeEth,
    itemCount: members.length,
    ownersCount: holders.size,
    verified: seed.verified,
    createdAt: seed.createdAt,
  };
}

export const mockCollections: CollectionSummary[] = collectionSeeds.map(buildCollection);

const collectionBySlug = new Map(mockCollections.map((collection) => [collection.slug, collection]));
const collectionById = new Map(mockCollections.map((collection) => [collection.id, collection]));

export function getCollectionBySlug(slug: string): CollectionSummary | undefined {
  return collectionBySlug.get(slug);
}

export function getCollectionById(id: string): CollectionSummary | undefined {
  return collectionById.get(id);
}

/** The collection a listing belongs to, if any. */
export function getCollectionForAsset(assetId: string): CollectionSummary | undefined {
  return mockCollections.find((collection) => collection.assetIds.includes(assetId));
}

export function getCollectionsForCreator(creatorId: string): CollectionSummary[] {
  return mockCollections.filter((collection) => collection.creatorId === creatorId);
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic ledger for an asset. Block numbers and timestamps are
 * derived from the asset id and its created date so the timeline is stable
 * across server render and client hydration.
 */
export function buildProvenanceForAsset(asset: DigitalAsset): ProvenanceEvent[] {
  const mintDate = new Date(asset.createdAt);
  const blockSeed = Number.parseInt(asset.tokenId.replace(/\D/g, '').slice(0, 4) || '1000', 10);

  const at = (dayOffset: number, hourOffset = 0): string =>
    new Date(mintDate.getTime() + (dayOffset * 24 + hourOffset) * 60 * 60 * 1000).toISOString();

  const events: ProvenanceEvent[] = [
    {
      id: `${asset.id}-mint`,
      kind: 'mint',
      txHash: `0x${asset.id.replace(/\D/g, '').padStart(4, 'a')}${blockSeed.toString(16).padStart(8, '0')}c0ffee`,
      blockNumber: blockSeed,
      timestamp: at(0),
      fromAddress: '0x0000000000000000000000000000000000000000',
      toAddress: asset.creator.walletAddress,
      priceCrypto: null,
      priceFiatUsd: null,
      currency: asset.currencySymbol,
      note: `Minted by ${asset.creator.displayName} into ${asset.contractAddress}.`,
    },
    {
      id: `${asset.id}-listing`,
      kind: 'listing',
      txHash: `0x${asset.id.replace(/\D/g, '').padStart(4, 'b')}${blockSeed.toString(16).padStart(8, '0')}11ce55`,
      blockNumber: blockSeed + 128,
      timestamp: at(1, 4),
      fromAddress: asset.creator.walletAddress,
      toAddress: asset.creator.walletAddress,
      priceCrypto: asset.priceCrypto,
      priceFiatUsd: asset.priceFiatUsd,
      currency: asset.currencySymbol,
      note: `Listed as a ${asset.listingType.replace(/_/g, ' ')} listing at ${asset.priceCrypto} ${asset.currencySymbol}.`,
    },
  ];

  if (asset.creator.id !== asset.currentOwner.id) {
    events.push({
      id: `${asset.id}-transfer`,
      kind: 'transfer',
      txHash: `0x${asset.id.replace(/\D/g, '').padStart(4, 'c')}${blockSeed.toString(16).padStart(8, '0')}7ea5ed`,
      blockNumber: blockSeed + 412,
      timestamp: at(9, 2),
      fromAddress: asset.creator.walletAddress,
      toAddress: asset.currentOwner.walletAddress,
      priceCrypto: null,
      priceFiatUsd: null,
      currency: asset.currencySymbol,
      note: `Transferred to ${asset.currentOwner.displayName} outside the primary market.`,
    });
  }

  if (asset.viewsCount > 1200) {
    events.push({
      id: `${asset.id}-sale`,
      kind: 'sale',
      txHash: `0x${asset.id.replace(/\D/g, '').padStart(4, 'd')}${blockSeed.toString(16).padStart(8, '0')}beef42`,
      blockNumber: blockSeed + 733,
      timestamp: at(21, 6),
      fromAddress: asset.currentOwner.walletAddress,
      toAddress: asset.creator.walletAddress,
      priceCrypto: round(asset.priceCrypto * 1.35, 4),
      priceFiatUsd: round(asset.priceCrypto * 1.35 * ETH_USD_RATE, 2),
      currency: asset.currencySymbol,
      note: `Secondary sale settled at a 35% premium over the original listing.`,
    });
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// ---------------------------------------------------------------------------
// Seeded transaction history
// ---------------------------------------------------------------------------

export const mockTransactions: TransactionRecord[] = [
  {
    id: 'tx-seed-01',
    txHash: '0x4a91c0d7e2b84f1a9c603d58b71e4a2f0c9d6b83',
    assetId: 'ast-01',
    assetTitle: 'Chroma Void Fragment #04',
    assetThumbnail: unsplash('1634017839464-5c339ebe3cb4', 200),
    buyerAddress: '0x38F24cB7e0A1D9bF52A5C3f3C19A8dE4B4a92C771',
    sellerAddress: '0x71C4b0e9A2f5D83a6E1b47c9D0f2A35b8e6C1470',
    amountCrypto: 0.85,
    amountFiatUsd: 2760.1,
    currency: 'ETH',
    chain: 'ethereum',
    status: 'confirmed',
    timestamp: '2024-06-12T18:42:00.000Z',
    gasUsedGwei: 184200,
  },
  {
    id: 'tx-seed-02',
    txHash: '0xb3e7f20a58c946d7b1e0a4c93f6825d7a0b3e194',
    assetId: 'ast-14',
    assetTitle: 'Chromatic Mint #0091',
    assetThumbnail: unsplash('1550745165-9bc0b252726f', 200),
    buyerAddress: '0x9A17d5Cb30E6f4A8c1B7D2e6F53a0b6C4D8214fE',
    sellerAddress: '0x3F9a2b8C5d7E104fa62B8C3D90e5A7c1F4b2D6890',
    amountCrypto: 3.4,
    amountFiatUsd: 11040.41,
    currency: 'ETH',
    chain: 'ethereum',
    status: 'confirmed',
    timestamp: '2024-06-28T09:15:00.000Z',
    gasUsedGwei: 212800,
  },
  {
    id: 'tx-seed-03',
    txHash: '0x7c4a19b3e6d0285fa1c93b740d8e26a5c1f9073b2',
    assetId: 'ast-18',
    assetTitle: 'Sonar Drift Bed',
    assetThumbnail: unsplash('1493225457124-a3eb161ffa5f', 200),
    buyerAddress: '7Xb2Cq9KQmYvF3nT8pLdR5wZsA1eH6jG4uC9oN2sVxKp',
    sellerAddress: '0x7A1c3E9b5D0f2864C7aB9e2D1F5c8B3a6E0d9471',
    amountCrypto: 0.22,
    amountFiatUsd: 714.38,
    currency: 'ETH',
    chain: 'solana',
    status: 'confirmed',
    timestamp: '2024-07-02T21:07:00.000Z',
    gasUsedGwei: 5400,
  },
  {
    id: 'tx-seed-04',
    txHash: '0xd18f5b02c7a94e63f0b5d821c3e7a490d6b2e815',
    assetId: 'ast-22',
    assetTitle: 'Kinetic Title System',
    assetThumbnail: unsplash('1534972195531-d756b9bfa9f2', 200),
    buyerAddress: '0x4D8e11F0a9C37b52E6A0d8C41Bf9E7a53c6021Bd',
    sellerAddress: '0x9D4c17B2e8F035a9C6D1b84E2f7A0c3D5b9E24618',
    amountCrypto: 0.68,
    amountFiatUsd: 2208.08,
    currency: 'ETH',
    chain: 'arbitrum',
    status: 'confirmed',
    timestamp: '2024-07-14T13:52:00.000Z',
    gasUsedGwei: 412000,
  },
  {
    id: 'tx-seed-05',
    txHash: '0xe92c07a4d1b638f5c7e0a93d28b416f0a3c5e7d21',
    assetId: 'ast-10',
    assetTitle: 'Prism Icon Family',
    assetThumbnail: unsplash('1550684848-fac1c5b4e853', 200),
    buyerAddress: '0x8E3a7B2c1D5f0946A7bC0d2E9F4a6B8c3D1e7052',
    sellerAddress: '0x5C8e2F4a1B7d0396E3c5A8b1D4F76029aC3e8B514',
    amountCrypto: 0.06,
    amountFiatUsd: 194.83,
    currency: 'ETH',
    chain: 'polygon',
    status: 'cancelled',
    timestamp: '2024-07-21T08:24:00.000Z',
    gasUsedGwei: 0,
  },
];

// ---------------------------------------------------------------------------
// Catalogue aggregates
// ---------------------------------------------------------------------------

export const catalogStats = {
  assetCount: mockAssets.length,
  creatorCount: creators.length,
  collectionCount: mockCollections.length,
  availableCount: mockAssets.filter((asset) => asset.isAvailable).length,
  totalVolumeEth: round(
    mockCollections.reduce((total, collection) => total + collection.totalVolumeEth, 0),
    2
  ),
} as const;