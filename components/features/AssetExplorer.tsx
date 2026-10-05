'use client';

import { useCallback, useMemo, useState } from 'react';
import { PackageOpen, SlidersHorizontal, X } from 'lucide-react';
import { AssetCard } from '@/components/molecules/AssetCard';
import { CollectionPill } from '@/components/molecules/CollectionPill';
import { FilterSheetMobile } from '@/components/molecules/FilterSheetMobile';
import { FilterSidebarDesktop } from '@/components/molecules/FilterSidebarDesktop';
import { SearchAutocomplete } from '@/components/molecules/SearchAutocomplete';
import { AssetInspectModal } from '@/components/features/AssetInspectModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { SORT_OPTIONS } from '@/lib/constants';
import { useAssetFilter } from '@/hooks/useAssetFilter';
import type { UseAssetFilterResult } from '@/hooks/useAssetFilter';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import type { CollectionSummary, DigitalAsset, FilterState, SortOption } from '@/types/marketplace';

export interface AssetExplorerProps {
  /** Initial dataset hydrated from the server page. */
  assets: DigitalAsset[];
  collections?: CollectionSummary[];
  initialFilters?: FilterState;
  /**
   * Optional externally-owned filter state. When omitted the explorer creates
   * and owns its own `useAssetFilter` instance; when supplied by the layout
   * shell the category ribbon and the grid share one source of truth.
   */
  filterApi?: UseAssetFilterResult;
  className?: string;
  'data-testid'?: string;
}

/**
 * Uses the injected filter controller when the shell provides one, otherwise
 * falls back to an instance owned by the explorer itself.
 */
function useFilterController(
  assets: DigitalAsset[],
  initialFilters: FilterState | undefined,
  injected: UseAssetFilterResult | undefined
): UseAssetFilterResult {
  const owned = useAssetFilter(assets, initialFilters);
  return injected ?? owned;
}

/**
 * Explore orchestrator. Binds the filter hook, responsive filter surfaces,
 * active facet chips and the responsive asset grid, and coordinates the
 * inspect modal and cart affordances.
 */
export function AssetExplorer({
  assets,
  collections = [],
  initialFilters,
  filterApi,
  className,
  ...rest
}: AssetExplorerProps) {
  const {
    filters,
    results,
    activeChips,
    activeFacetCount,
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
  } = useFilterController(assets, initialFilters, filterApi);

  const { addToCart, updateLicense, isAssetInCart, isAssetAvailable } = useCart();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [inspectedAsset, setInspectedAsset] = useState<DigitalAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickAdd = useCallback(
    (asset: DigitalAsset) => {
      addToCart(asset, asset.license);
    },
    [addToCart]
  );

  const handleInspect = useCallback((asset: DigitalAsset) => {
    setInspectedAsset(asset);
  }, []);

  const handleSearchSelect = useCallback(
    (asset: DigitalAsset) => {
      setInspectedAsset(asset);
    },
    []
  );

  const resultsLabel = useMemo(
    () => `${results.length} ${results.length === 1 ? 'asset' : 'assets'}`,
    [results.length]
  );

  return (
    <section
      className={cn('flex flex-col gap-6', className)}
      data-testid="asset-explorer"
      {...rest}
    >
      {/* Collection strip */}
      {collections.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Featured collections
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {collections.map((collection) => (
              <CollectionPill
                key={collection.id}
                collection={collection}
                volumeChangePercent={collection.id === 'col-02' ? 11.4 : 3.1}
                floorChangePercent={collection.id === 'col-02' ? 6.2 : -1.4}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Toolbar */}
      <GlassPanel padding="md" className="flex flex-col gap-4" data-testid="explorer-toolbar">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchAutocomplete
              assets={assets}
              value={filters.searchQuery}
              onChange={setSearchQuery}
              onSelect={handleSearchSelect}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter trigger */}
            <GlassButton
              variant="glass-outline"
              onClick={() => setIsFilterSheetOpen(true)}
              iconLeft={<SlidersHorizontal aria-hidden="true" className="size-4" />}
              className="lg:hidden"
              data-testid="open-filter-sheet"
              aria-label={`Open filters${activeFacetCount > 0 ? `, ${activeFacetCount} active` : ''}`}
            >
              Filters
              {activeFacetCount > 0 ? (
                <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                  {activeFacetCount}
                </span>
              ) : null}
            </GlassButton>

            <label htmlFor="asset-sort" className="sr-only">
              Sort assets
            </label>
            <select
              id="asset-sort"
              data-testid="sort-select"
              value={filters.sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className={cn(
                'min-h-[44px] w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 sm:w-auto',
                'backdrop-blur-md transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50'
              )}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active chips */}
        {activeChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2" data-testid="active-filter-chips">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => removeChip(chip.id)}
                data-testid="active-filter-chip"
                className={cn(
                  'inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-cyan-400/30',
                  'bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 transition-colors',
                  'hover:border-cyan-400/60 hover:bg-cyan-500/20',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                )}
              >
                <span className="max-w-[16ch] truncate">{chip.label}</span>
                <X aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[32px] rounded-full px-2.5 py-1 text-xs text-slate-400 underline-offset-2 transition-colors hover:text-slate-100 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              data-testid="clear-all-filters"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </GlassPanel>

      {/* Grid + sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <FilterSidebarDesktop
          assets={assets}
          filters={filters}
          onToggleCategory={toggleCategory}
          onToggleChain={toggleChain}
          onToggleLicense={toggleLicense}
          onToggleListing={toggleListing}
          onPriceChange={setPriceRange}
          onVerifiedChange={setVerifiedOnly}
          onReset={resetFilters}
          resultCount={results.length}
          className="lg:w-72 lg:shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400" data-testid="result-count" aria-live="polite">
              {resultsLabel}
              {activeFacetCount > 0 ? ' matching your filters' : ' available now'}
            </p>
          </div>

          {isLoading ? (
            <SkeletonCard count={8} />
          ) : results.length === 0 ? (
            <GlassPanel
              padding="lg"
              className="flex flex-col items-center justify-center gap-3 text-center"
              data-testid="empty-state"
            >
              <PackageOpen aria-hidden="true" className="size-10 text-slate-700" />
              <div>
                <p className="text-base font-semibold text-slate-200">No assets match your filters</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Try widening the price range, removing a facet, or searching for a different
                  creator or tag.
                </p>
              </div>
              <GlassButton variant="glass-outline" onClick={resetFilters} data-testid="empty-state-reset">
                Reset all filters
              </GlassButton>
            </GlassPanel>
          ) : (
            <div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              data-testid="asset-grid"
            >
              {results.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isInCart={isAssetInCart(asset.id)}
                  isAvailable={isAssetAvailable(asset.id) && asset.isAvailable}
                  onQuickAdd={handleQuickAdd}
                  onInspect={handleInspect}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <FilterSheetMobile
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        assets={assets}
        filters={filters}
        onApply={applyFilters}
      />

      {/* Inspect modal */}
      <AssetInspectModal
        asset={inspectedAsset}
        isOpen={inspectedAsset !== null}
        onClose={() => setInspectedAsset(null)}
        onAddToCart={(asset, license) => {
          // DATA-02: when the asset already has a line, a licence change updates
          // that line (and its exclusive lock) rather than creating a duplicate.
          if (isAssetInCart(asset.id)) {
            updateLicense(asset.id, license);
            return;
          }
          addToCart(asset, license);
        }}
        isInCart={inspectedAsset ? isAssetInCart(inspectedAsset.id) : false}
      />
    </section>
  );
}