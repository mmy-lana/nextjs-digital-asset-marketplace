'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FilterFacets } from '@/components/molecules/FilterFacets';
import { GlassButton } from '@/components/ui/GlassButton';
import { DEFAULT_FILTER_STATE } from '@/lib/constants';
import { filterAndSortAssets } from '@/hooks/useAssetFilter';
import { cn } from '@/lib/utils';
import type {
  AssetCategory,
  ChainNetwork,
  DigitalAsset,
  FilterState,
  LicenseType,
  ListingType,
} from '@/types/marketplace';

export interface FilterSheetMobileProps {
  isOpen: boolean;
  onClose: () => void;
  assets: DigitalAsset[];
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  className?: string;
  'data-testid'?: string;
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/**
 * Bottom drawer filter surface for viewports below `lg` (1024px).
 *
 * Edits a draft copy of the filter state so the grid behind the drawer is not
 * thrashed while the user toggles facets; the draft is committed on "Show
 * results" and discarded on dismiss.
 */
export function FilterSheetMobile({
  isOpen,
  onClose,
  assets,
  filters,
  onApply,
  className,
  ...rest
}: FilterSheetMobileProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<FilterState>(filters);

  // Re-seed the draft each time the sheet opens.
  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus moves into the drawer for keyboard users.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  const draftResultCount = useMemo(
    () => filterAndSortAssets(assets, draft).length,
    [assets, draft]
  );

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<AssetCategory, number>> = {};
    for (const asset of assets) counts[asset.category] = (counts[asset.category] ?? 0) + 1;
    return counts;
  }, [assets]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_FILTER_STATE, sortBy: draft.sortBy });
  };

  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 z-50 lg:hidden', className)} {...rest}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter assets"
        tabIndex={-1}
        data-testid="filter-sheet-mobile"
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[88dvh] w-full flex-col',
          'rounded-t-2xl border-t border-white/10 bg-slate-950/95 shadow-[0_-8px_32px_0_rgba(0,0,0,0.5)]',
          'backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-bottom'
        )}
      >
        {/* Grab handle */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1 w-10 rounded-full bg-white/20" />
            <h2 className="ml-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
              <SlidersHorizontal aria-hidden="true" className="size-4 text-cyan-300" />
              Filters
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-xl text-slate-400',
              'transition-colors hover:bg-white/10 hover:text-slate-100',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
            )}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {/* Scrollable facets */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <FilterFacets
            filters={draft}
            onToggleCategory={(category: AssetCategory) =>
              setDraft((current) => ({ ...current, categories: toggleIn(current.categories, category) }))
            }
            onToggleChain={(chain: ChainNetwork) =>
              setDraft((current) => ({ ...current, chains: toggleIn(current.chains, chain) }))
            }
            onToggleLicense={(license: LicenseType) =>
              setDraft((current) => ({
                ...current,
                licenseTypes: toggleIn(current.licenseTypes, license),
              }))
            }
            onToggleListing={(listing: ListingType) =>
              setDraft((current) => ({
                ...current,
                listingTypes: toggleIn(current.listingTypes, listing),
              }))
            }
            onPriceChange={(range) =>
              setDraft((current) => ({ ...current, priceRange: { min: range[0], max: range[1] } }))
            }
            onVerifiedChange={(value) => setDraft((current) => ({ ...current, verifiedOnly: value }))}
            onReset={handleReset}
            categoryCounts={categoryCounts}
            priceCeiling={Math.max(DEFAULT_FILTER_STATE.priceRange.max, 1)}
          />
        </div>

        {/* Sticky confirmation bar */}
        <div className="border-t border-white/10 bg-slate-900/90 p-4 backdrop-blur-md">
          <GlassButton variant="primary-neon" block onClick={handleApply} data-testid="filter-apply">
            Show {draftResultCount} {draftResultCount === 1 ? 'result' : 'results'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}