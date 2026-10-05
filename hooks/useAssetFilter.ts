'use client';

import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_FILTER_STATE } from '@/lib/constants';
import { maxRarityScore } from '@/lib/utils';
import type {
  AssetCategory,
  ChainNetwork,
  DigitalAsset,
  FilterState,
  LicenseType,
  ListingType,
  SortOption,
} from '@/types/marketplace';

export interface ActiveFilterChip {
  id: string;
  group: 'search' | 'category' | 'chain' | 'license' | 'listing' | 'price' | 'verified';
  label: string;
  /** Removes just this facet; identity filters pass a no-op. */
  onRemove: () => void;
}

/**
 * Faceted search across a single in-memory catalogue.
 *
 * Every facet intersects (AND) while values inside a facet union (OR), which
 * is the behaviour users expect from an e-commerce sidebar.
 */
export function filterAndSortAssets(
  assets: DigitalAsset[],
  filters: FilterState
): DigitalAsset[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = assets.filter((asset) => {
    if (query.length > 0) {
      const matchesTitle = asset.title.toLowerCase().includes(query);
      const matchesDescription = asset.description.toLowerCase().includes(query);
      const matchesCreator =
        asset.creator.displayName.toLowerCase().includes(query) ||
        asset.creator.handle.toLowerCase().includes(query);
      const matchesTags = asset.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesTokenId = asset.tokenId.toLowerCase().includes(query);
      if (
        !matchesTitle &&
        !matchesDescription &&
        !matchesCreator &&
        !matchesTags &&
        !matchesTokenId
      ) {
        return false;
      }
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

    if (asset.priceCrypto < filters.priceRange.min || asset.priceCrypto > filters.priceRange.max) {
      return false;
    }

    return true;
  });

  return sortAssets(filtered, filters.sortBy);
}

export function sortAssets(assets: DigitalAsset[], sortBy: SortOption): DigitalAsset[] {
  const sorted = [...assets];
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.priceCrypto - b.priceCrypto);
    case 'price_desc':
      return sorted.sort((a, b) => b.priceCrypto - a.priceCrypto);
    case 'most_viewed':
      return sorted.sort((a, b) => b.viewsCount - a.viewsCount);
    case 'highest_rarity':
      return sorted.sort((a, b) => maxRarityScore(b.traits) - maxRarityScore(a.traits));
    case 'recently_listed':
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export function countActiveFacets(filters: FilterState): number {
  return (
    (filters.searchQuery.trim().length > 0 ? 1 : 0) +
    filters.categories.length +
    filters.chains.length +
    filters.licenseTypes.length +
    filters.listingTypes.length +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.priceRange.min !== DEFAULT_FILTER_STATE.priceRange.min ||
    filters.priceRange.max !== DEFAULT_FILTER_STATE.priceRange.max
      ? 1
      : 0)
  );
}

/** Toggles a value inside an array facet without mutating the current state. */
function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export interface UseAssetFilterResult {
  filters: FilterState;
  results: DigitalAsset[];
  activeChips: ActiveFilterChip[];
  activeFacetCount: number;
  isFiltered: boolean;
  setSearchQuery: (query: string) => void;
  toggleCategory: (category: AssetCategory) => void;
  toggleChain: (chain: ChainNetwork) => void;
  toggleLicense: (license: LicenseType) => void;
  toggleListing: (listing: ListingType) => void;
  setPriceRange: (range: [number, number]) => void;
  setVerifiedOnly: (value: boolean) => void;
  setSortBy: (sort: SortOption) => void;
  /** Replaces the whole state — used by the mobile filter sheet's draft model. */
  applyFilters: (next: FilterState) => void;
  removeChip: (chipId: string) => void;
  resetFilters: () => void;
}

export function useAssetFilter(
  assets: DigitalAsset[],
  initialFilters: FilterState = DEFAULT_FILTER_STATE
): UseAssetFilterResult {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const results = useMemo(
    () => filterAndSortAssets(assets, filters),
    [assets, filters]
  );

  const setSearchQuery = useCallback((query: string) => {
    setFilters((current) => ({ ...current, searchQuery: query }));
  }, []);

  const toggleCategory = useCallback((category: AssetCategory) => {
    setFilters((current) => ({ ...current, categories: toggleValue(current.categories, category) }));
  }, []);

  const toggleChain = useCallback((chain: ChainNetwork) => {
    setFilters((current) => ({ ...current, chains: toggleValue(current.chains, chain) }));
  }, []);

  const toggleLicense = useCallback((license: LicenseType) => {
    setFilters((current) => ({
      ...current,
      licenseTypes: toggleValue(current.licenseTypes, license),
    }));
  }, []);

  const toggleListing = useCallback((listing: ListingType) => {
    setFilters((current) => ({
      ...current,
      listingTypes: toggleValue(current.listingTypes, listing),
    }));
  }, []);

  const setPriceRange = useCallback((range: [number, number]) => {
    setFilters((current) => ({ ...current, priceRange: { min: range[0], max: range[1] } }));
  }, []);

  const setVerifiedOnly = useCallback((value: boolean) => {
    setFilters((current) => ({ ...current, verifiedOnly: value }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setFilters((current) => ({ ...current, sortBy }));
  }, []);

  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTER_STATE, sortBy: filters.sortBy });
  }, [filters.sortBy]);

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.searchQuery.trim().length > 0) {
      chips.push({
        id: 'search',
        group: 'search',
        label: `“${filters.searchQuery.trim()}”`,
        onRemove: () => setFilters((current) => ({ ...current, searchQuery: '' })),
      });
    }

    filters.categories.forEach((category) => {
      chips.push({
        id: `category:${category}`,
        group: 'category',
        label: CATEGORY_LABELS[category] ?? category,
        onRemove: () => toggleCategory(category),
      });
    });

    filters.chains.forEach((chain) => {
      chips.push({
        id: `chain:${chain}`,
        group: 'chain',
        label: CHAIN_LABELS[chain] ?? chain,
        onRemove: () => toggleChain(chain),
      });
    });

    filters.licenseTypes.forEach((license) => {
      chips.push({
        id: `license:${license}`,
        group: 'license',
        label: LICENSE_LABELS[license] ?? license,
        onRemove: () => toggleLicense(license),
      });
    });

    filters.listingTypes.forEach((listing) => {
      chips.push({
        id: `listing:${listing}`,
        group: 'listing',
        label: LISTING_LABELS[listing] ?? listing,
        onRemove: () => toggleListing(listing),
      });
    });

    if (filters.verifiedOnly) {
      chips.push({
        id: 'verified',
        group: 'verified',
        label: 'Verified creators',
        onRemove: () => setVerifiedOnly(false),
      });
    }

    const { min, max } = filters.priceRange;
    if (
      min !== DEFAULT_FILTER_STATE.priceRange.min ||
      max !== DEFAULT_FILTER_STATE.priceRange.max
    ) {
      chips.push({
        id: 'price',
        group: 'price',
        label: `${min} – ${max} ETH`,
        onRemove: () => setPriceRange([DEFAULT_FILTER_STATE.priceRange.min, DEFAULT_FILTER_STATE.priceRange.max]),
      });
    }

    return chips;
  }, [filters, setPriceRange, setVerifiedOnly, toggleCategory, toggleChain, toggleLicense, toggleListing]);

  const removeChip = useCallback(
    (chipId: string) => {
      const chip = activeChips.find((entry) => entry.id === chipId);
      chip?.onRemove();
    },
    [activeChips]
  );

  const activeFacetCount = useMemo(() => countActiveFacets(filters), [filters]);

  return {
    filters,
    results,
    activeChips,
    activeFacetCount,
    isFiltered: activeFacetCount > 0,
    setSearchQuery,
    toggleCategory,
    toggleChain,
    toggleLicense,
    toggleListing,
    setPriceRange,
    setVerifiedOnly,
    setSortBy,
    applyFilters,
    removeChip,
    resetFilters,
  };
}

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  '3d_models': '3D Models',
  ui_templates: 'UI Templates',
  vector_graphics: 'Vector Graphics',
  generative_nft: 'Generative NFT',
  audio_tracks: 'Audio Tracks',
  motion_graphics: 'Motion Graphics',
};

const CHAIN_LABELS: Record<ChainNetwork, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
  arbitrum: 'Arbitrum',
};

const LICENSE_LABELS: Record<LicenseType, string> = {
  standard_commercial: 'Standard Commercial',
  extended_commercial: 'Extended Commercial',
  exclusive_nft: 'Exclusive NFT',
  editorial_only: 'Editorial Only',
};

const LISTING_LABELS: Record<ListingType, string> = {
  fixed_price: 'Fixed Price',
  timed_auction: 'Timed Auction',
  open_for_offers: 'Open for Offers',
};