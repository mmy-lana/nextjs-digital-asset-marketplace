'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageOpen } from 'lucide-react';
import { AssetCard } from '@/components/molecules/AssetCard';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SORT_OPTIONS } from '@/lib/constants';
import { sortAssets } from '@/hooks/useAssetFilter';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import type { DigitalAsset, SortOption } from '@/types/marketplace';

export interface CollectionBrowserProps {
  /** Canonical membership list from the collection record. */
  assetIds: string[];
  assets: DigitalAsset[];
  className?: string;
}

/**
 * Renders the members of a single collection with a compact sort control.
 * Membership is resolved from the collection's `assetIds`, so the page can
 * never drift from the relational graph that defines it.
 */
export function CollectionBrowser({
  assetIds,
  assets,
  className,
}: CollectionBrowserProps) {
  const { addToCart, isAssetInCart, isAssetAvailable } = useCart();
  // ARCH-01: client-side navigation preserves the SPA runtime; a full
  // `window.location.href` assignment tears down the document and discards
  // in-memory wallet, cart and filter state.
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('recently_listed');

  const members = useMemo(() => {
    const membership = new Set(assetIds);
    const selected = assets.filter((asset) => membership.has(asset.id));
    return sortAssets(selected, sortBy);
  }, [assetIds, assets, sortBy]);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400" aria-live="polite">
          <span className="font-mono text-slate-200">{members.length}</span>{' '}
          {members.length === 1 ? 'item' : 'items'} in this collection
        </p>
        <label htmlFor="collection-sort" className="sr-only">
          Sort collection
        </label>
        <select
          id="collection-sort"
          data-testid="collection-sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          className={cn(
            'min-h-[44px] rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100',
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

      {members.length === 0 ? (
        <GlassPanel
          padding="lg"
          className="flex flex-col items-center justify-center gap-3 text-center"
          data-testid="collection-empty"
        >
          <PackageOpen aria-hidden="true" className="size-10 text-slate-700" />
          <p className="text-base font-semibold text-slate-200">No items in this collection yet</p>
        </GlassPanel>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          data-testid="collection-grid"
        >
          {members.map((asset, index) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isInCart={isAssetInCart(asset.id)}
              isAvailable={isAssetAvailable(asset.id) && asset.isAvailable}
              onQuickAdd={(target) => addToCart(target, target.license)}
              onInspect={(target) => router.push(`/asset/${target.slug}`)}
              // UI-02: eager-load the first row of the collection grid.
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}