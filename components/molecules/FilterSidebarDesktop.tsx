'use client';

import { useMemo } from 'react';
import { FilterFacets } from '@/components/molecules/FilterFacets';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { DEFAULT_FILTER_STATE } from '@/lib/constants';
import { countActiveFacets } from '@/hooks/useAssetFilter';
import { cn } from '@/lib/utils';
import type {
  AssetCategory,
  ChainNetwork,
  DigitalAsset,
  FilterState,
  LicenseType,
  ListingType,
} from '@/types/marketplace';

export interface FilterSidebarDesktopProps {
  assets: DigitalAsset[];
  filters: FilterState;
  onToggleCategory: (category: AssetCategory) => void;
  onToggleChain: (chain: ChainNetwork) => void;
  onToggleLicense: (license: LicenseType) => void;
  onToggleListing: (listing: ListingType) => void;
  onPriceChange: (range: [number, number]) => void;
  onVerifiedChange: (value: boolean) => void;
  onReset: () => void;
  /** Total matches for the current facet selection. */
  resultCount: number;
  className?: string;
  'data-testid'?: string;
}

/**
 * Sticky, independently scrolling faceted filter rail for viewports at and
 * above `lg` (1024px). Hidden below that breakpoint by the mobile sheet.
 */
export function FilterSidebarDesktop({
  assets,
  filters,
  onToggleCategory,
  onToggleChain,
  onToggleLicense,
  onToggleListing,
  onPriceChange,
  onVerifiedChange,
  onReset,
  resultCount,
  className,
  ...rest
}: FilterSidebarDesktopProps) {
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<AssetCategory, number>> = {};
    for (const asset of assets) {
      counts[asset.category] = (counts[asset.category] ?? 0) + 1;
    }
    return counts;
  }, [assets]);

  const activeCount = countActiveFacets(filters);
  const priceCeiling = Math.max(DEFAULT_FILTER_STATE.priceRange.max, 1);

  return (
    <GlassPanel
      as="aside"
      aria-label="Asset filters"
      tone="raised"
      padding="md"
      className={cn(
        'sticky top-[calc(var(--header-height)+1.5rem)]',
        'hidden max-h-[calc(100dvh-var(--header-height)-3rem)] lg:block lg:overflow-y-auto lg:overscroll-contain',
        className
      )}
      data-testid="filter-sidebar-desktop"
      {...rest}
    >
      <FilterFacets
        filters={filters}
        onToggleCategory={onToggleCategory}
        onToggleChain={onToggleChain}
        onToggleLicense={onToggleLicense}
        onToggleListing={onToggleListing}
        onPriceChange={onPriceChange}
        onVerifiedChange={onVerifiedChange}
        onReset={onReset}
        categoryCounts={categoryCounts}
        priceCeiling={priceCeiling}
      />

      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-white/10 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
        <p className="text-xs text-slate-400">
          <span className="font-mono text-slate-200" data-testid="filter-result-count">
            {resultCount}
          </span>{' '}
          {resultCount === 1 ? 'result' : 'results'}
          {activeCount > 0 ? ` · ${activeCount} active` : ''}
        </p>
      </div>
    </GlassPanel>
  );
}