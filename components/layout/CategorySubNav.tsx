'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { useAssetFilter } from '@/hooks/useAssetFilter';
import type { UseAssetFilterResult } from '@/hooks/useAssetFilter';
import { cn } from '@/lib/utils';
import type { AssetCategory, DigitalAsset } from '@/types/marketplace';

export interface CategorySubNavProps {
  assets: DigitalAsset[];
  /**
   * Optional externally-owned filter state. The layout shell injects the same
   * controller the explorer uses so ribbon and grid never diverge.
   */
  filterApi?: UseAssetFilterResult;
  className?: string;
  'data-testid'?: string;
}

/**
 * Horizontally scrolling category ribbon.
 *
 * Uses CSS scroll-snap for touch gestures and `.scrollbar-hide` so the strip
 * reads as a single clean row. Selecting a category toggles that facet; the
 * active pill auto-scrolls into view.
 */
export function CategorySubNav({ assets, filterApi, className, ...rest }: CategorySubNavProps) {
  const owned = useAssetFilter(assets);
  const { filters, toggleCategory, resetFilters } = filterApi ?? owned;
  const stripRef = useRef<HTMLDivElement>(null);
  const [isActiveVisible, setIsActiveVisible] = useState(false);

  const activeCategory = filters.categories.length === 1 ? filters.categories[0] : null;

  const handleSelect = useCallback(
    (category: AssetCategory) => {
      // Tapping the already-active category clears the facet.
      if (filters.categories.length === 1 && filters.categories[0] === category) {
        toggleCategory(category);
      } else {
        resetFilters();
        if (category) toggleCategory(category);
      }
    },
    [filters.categories, toggleCategory, resetFilters]
  );

  useEffect(() => {
    if (!isActiveVisible) return;
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [isActiveVisible, activeCategory]);

  return (
    <div
      className={cn('sticky top-[var(--header-height)] z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl', className)}
      data-testid="category-subnav"
      {...rest}
    >
      <div
        ref={stripRef}
        role="tablist"
        aria-label="Asset categories"
        onFocus={() => setIsActiveVisible(true)}
        className="scrollbar-hide mx-auto flex max-w-[1600px] snap-x snap-mandatory items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filters.categories.length === 0}
          data-active={filters.categories.length === 0}
          onClick={resetFilters}
          className={cn(
            'min-h-[44px] shrink-0 snap-start rounded-full border px-4 text-sm font-medium transition-colors',
            filters.categories.length === 0
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
              : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/25',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          )}
          data-testid="category-all"
        >
          All assets
        </button>

        {CATEGORIES.map((category) => {
          const isActive = filters.categories.includes(category.value);
          return (
            <button
              key={category.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive}
              data-testid={`category-tab-${category.value}`}
              onClick={() => handleSelect(category.value)}
              title={category.description}
              className={cn(
                'min-h-[44px] shrink-0 snap-start rounded-full border px-4 text-sm font-medium transition-colors',
                isActive
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                  : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/25',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}