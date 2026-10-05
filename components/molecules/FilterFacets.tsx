'use client';

import { RotateCcw } from 'lucide-react';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { CATEGORIES, CHAIN_NETWORKS, LISTING_OPTIONS, LICENSE_OPTIONS } from '@/lib/constants';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn, formatCryptoNumber } from '@/lib/utils';
import type {
  AssetCategory,
  ChainNetwork,
  FilterState,
  LicenseType,
  ListingType,
} from '@/types/marketplace';

export interface FilterFacetsProps {
  filters: FilterState;
  onToggleCategory: (category: AssetCategory) => void;
  onToggleChain: (chain: ChainNetwork) => void;
  onToggleLicense: (license: LicenseType) => void;
  onToggleListing: (listing: ListingType) => void;
  onPriceChange: (range: [number, number]) => void;
  onVerifiedChange: (value: boolean) => void;
  onReset: () => void;
  /** Per-facet result counts, keyed by category value. */
  categoryCounts?: Partial<Record<AssetCategory, number>>;
  priceCeiling: number;
  className?: string;
}

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/5 py-4 first:pt-0 last:border-b-0">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FacetRow({
  label,
  checked,
  onChange,
  count,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
  id: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={cn(
          'size-[18px] shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-slate-950',
          'transition-colors checked:border-cyan-400 checked:bg-cyan-500',
          'checked:bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\' fill=\'none\' stroke=\'%23020617\' stroke-width=\'2.5\' stroke-linecap=\'round\'%3E%3Cpath d=\'m3.5 8 3 3 6-6\'/%3E%3C/svg%3E")]',
          'checked:bg-center checked:bg-no-repeat',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
        )}
        style={{ backgroundSize: '14px 14px' }}
      />
      <label
        htmlFor={id}
        className="flex min-h-[32px] flex-1 cursor-pointer items-center justify-between gap-2 text-sm text-slate-300 transition-colors hover:text-slate-100"
      >
        <span className="truncate">{label}</span>
        {count !== undefined ? (
          <span className="shrink-0 font-mono text-[11px] text-slate-600">{count}</span>
        ) : null}
      </label>
    </div>
  );
}

/**
 * The shared facet body used by both the desktop sidebar and the mobile sheet,
 * guaranteeing the two filtering surfaces can never drift apart.
 */
export function FilterFacets({
  filters,
  onToggleCategory,
  onToggleChain,
  onToggleLicense,
  onToggleListing,
  onPriceChange,
  onVerifiedChange,
  onReset,
  categoryCounts,
  priceCeiling,
  className,
}: FilterFacetsProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-slate-100">Filters</h2>
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={onReset}
          iconLeft={<RotateCcw aria-hidden="true" className="size-3.5" />}
          data-testid="filter-reset"
        >
          Reset
        </GlassButton>
      </div>

      <FacetGroup title="Category">
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((category) => (
            <FacetRow
              key={category.value}
              id={`facet-category-${category.value}`}
              label={category.label}
              checked={filters.categories.includes(category.value)}
              onChange={() => onToggleCategory(category.value)}
              count={categoryCounts?.[category.value]}
            />
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Network">
        <div className="flex flex-col gap-1.5">
          {CHAIN_NETWORKS.map((chain) => (
            <FacetRow
              key={chain.value}
              id={`facet-chain-${chain.value}`}
              label={chain.label}
              checked={filters.chains.includes(chain.value)}
              onChange={() => onToggleChain(chain.value)}
            />
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Price">
        <RangeSlider
          min={0}
          max={priceCeiling}
          step={0.05}
          value={[filters.priceRange.min, filters.priceRange.max]}
          onChange={onPriceChange}
          label="Price range"
          formatValue={(value) => `${formatCryptoNumber(value)} ETH`}
          data-testid="filter-price-slider"
        />
      </FacetGroup>

      <FacetGroup title="License">
        <div className="flex flex-col gap-1.5">
          {LICENSE_OPTIONS.map((license) => (
            <FacetRow
              key={license.value}
              id={`facet-license-${license.value}`}
              label={license.label}
              checked={filters.licenseTypes.includes(license.value)}
              onChange={() => onToggleLicense(license.value)}
            />
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Listing type">
        <div className="flex flex-col gap-1.5">
          {LISTING_OPTIONS.map((listing) => (
            <FacetRow
              key={listing.value}
              id={`facet-listing-${listing.value}`}
              label={listing.label}
              checked={filters.listingTypes.includes(listing.value)}
              onChange={() => onToggleListing(listing.value)}
            />
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Trust">
        <FacetRow
          id="facet-verified"
          label="Verified creators only"
          checked={filters.verifiedOnly}
          onChange={() => onVerifiedChange(!filters.verifiedOnly)}
        />
      </FacetGroup>
    </div>
  );
}