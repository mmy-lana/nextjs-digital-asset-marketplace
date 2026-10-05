'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { AudioLines, Box, Clapperboard, Eye, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { CategoryBadge, ChainBadge, RarityBadge } from '@/components/ui/GlassBadge';
import { GlassButton } from '@/components/ui/GlassButton';
import { LISTING_OPTIONS, getLicenseDescriptor } from '@/lib/constants';
import {
  cn,
  formatCompactNumber,
  formatCryptoNumber,
  formatFiat,
  maxRarityScore,
  truncate,
} from '@/lib/utils';
import type { DigitalAsset } from '@/types/marketplace';

export interface AssetCardProps {
  asset: DigitalAsset;
  /** Drives the quick-add control and its disabled/checked state. */
  isInCart: boolean;
  /** False when an exclusive-NFT line elsewhere locks this asset. */
  isAvailable: boolean;
  onQuickAdd: (asset: DigitalAsset) => void;
  onInspect: (asset: DigitalAsset) => void;
  className?: string;
  'data-testid'?: string;
}

const CATEGORY_ICONS = {
  '3d_models': Box,
  ui_templates: Sparkles,
  vector_graphics: Sparkles,
  generative_nft: Sparkles,
  audio_tracks: AudioLines,
  motion_graphics: Clapperboard,
} as const;

/** Media kind drives the overlay badge shown on the preview. */
function mediaKind(asset: DigitalAsset): string | null {
  if (asset.category === 'audio_tracks') return 'Audio';
  if (asset.category === 'motion_graphics') return 'Motion';
  if (asset.media.modelFormat) return asset.media.modelFormat.toUpperCase();
  return null;
}

export function AssetCard({
  asset,
  isInCart,
  isAvailable,
  onQuickAdd,
  onInspect,
  className,
  ...rest
}: AssetCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[asset.category];
  const kindLabel = mediaKind(asset);
  const rarityScore = maxRarityScore(asset.traits);
  const license = getLicenseDescriptor(asset.license);
  const listingLabel =
    LISTING_OPTIONS.find((option) => option.value === asset.listingType)?.label ?? asset.listingType;

  const handleQuickAdd = useCallback(() => {
    onQuickAdd(asset);
  }, [asset, onQuickAdd]);

  const handleInspect = useCallback(() => {
    onInspect(asset);
  }, [asset, onInspect]);

  const soldOut = !asset.isAvailable || !isAvailable;

  return (
    <article
      data-testid="asset-card"
      data-asset-slug={asset.slug}
      className={cn(
        'group flex flex-col overflow-hidden rounded-glass border border-white/10 bg-slate-950/75',
        'shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-[border-color,transform] duration-300',
        'motion-safe:hover:-translate-y-1 motion-safe:hover:border-cyan-400/40',
        className
      )}
      {...rest}
    >
      {/* Media */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
        {imageFailed ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <CategoryIcon aria-hidden="true" className="size-10 text-slate-700" />
            <span className="sr-only">Preview unavailable for {asset.title}</span>
          </div>
        ) : (
          <Image
            src={asset.media.previewUrl}
            alt={asset.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            onError={() => setImageFailed(true)}
            priority={false}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <CategoryBadge category={asset.category} />
          {kindLabel ? (
            <span className="rounded-full border border-white/15 bg-slate-950/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300 backdrop-blur-md">
              {kindLabel}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950/95 to-transparent p-3 pt-8">
          <ChainBadge chain={asset.chain} />
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden="true" className="size-3.5" />
              {formatCompactNumber(asset.viewsCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart aria-hidden="true" className="size-3.5" />
              {formatCompactNumber(asset.likesCount)}
            </span>
          </div>
        </div>

        {soldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <span className="rounded-full border border-white/20 bg-slate-950/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
              {!asset.isAvailable ? 'Sold' : 'Locked'}
            </span>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- avatar host serves arbitrary user uploads */}
          <img
            src={asset.creator.avatarUrl}
            alt=""
            aria-hidden="true"
            className="size-6 shrink-0 rounded-full border border-white/15 object-cover"
            loading="lazy"
          />
          <span className="truncate text-xs text-slate-400" title={asset.creator.displayName}>
            {asset.creator.displayName}
          </span>
          {asset.creator.verified ? (
            <span
              aria-label="Verified creator"
              title="Verified creator"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300"
            >
              <svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden="true">
                <path d="M6 0.8 7.6 2l2.3-.3.5 2.3L12 6l-1.6 2 .3 2.3-2.3.5L6 11.2 4.4 10l-2.3.5L1.6 8 0 6l1.6-2-.3-2.3L3.6 2 6 0.8Z" />
                <path d="m3.6 6 1.6 1.6L8.6 4.2" stroke="#020617" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          ) : null}
          {rarityScore > 0 ? <RarityBadge rarityScore={rarityScore} className="ml-auto" /> : null}
        </div>

        <div>
          <h3 className="text-[15px] font-semibold leading-snug text-slate-100">
            <Link
              href={`/asset/${asset.slug}`}
              data-testid="asset-detail-link"
              className="transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              {truncate(asset.title, 44)}
            </Link>
          </h3>
          <p
            className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500"
            title={asset.description}
          >
            {asset.description}
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <dt className="sr-only">License</dt>
            <dd title={license.summary}>{license.label}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Listing type</dt>
            <dd>{listingLabel}</dd>
          </div>
        </dl>

        <div className="mt-auto space-y-2.5 border-t border-white/5 pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Price</p>
              <p className="font-mono text-base font-semibold text-cyan-300">
                <span data-testid="asset-price">
                  {formatCryptoNumber(asset.priceCrypto)} {asset.currencySymbol}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">{formatFiat(asset.priceFiatUsd)}</p>
            </div>
            <p className="shrink-0 text-right text-[11px] text-slate-500">
              Royalty
              <br />
              <span className="font-mono text-slate-400">{asset.royaltiesPercentage}%</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="primary-neon"
              size="sm"
              className="flex-1"
              onClick={handleQuickAdd}
              disabled={soldOut || isInCart}
              iconLeft={<ShoppingCart aria-hidden="true" className="size-4" />}
              data-testid="asset-quick-add"
              aria-label={
                soldOut
                  ? `${asset.title} is unavailable`
                  : isInCart
                    ? `${asset.title} is already in your cart`
                    : `Add ${asset.title} to cart`
              }
            >
              {soldOut ? 'Unavailable' : isInCart ? 'In cart' : 'Add to cart'}
            </GlassButton>

            <GlassButton
              variant="glass-outline"
              size="sm"
              className="px-3"
              onClick={handleInspect}
              data-testid="asset-card-inspect"
              aria-label={`Inspect ${asset.title}`}
            >
              Inspect
            </GlassButton>
          </div>
        </div>
      </div>
    </article>
  );
}