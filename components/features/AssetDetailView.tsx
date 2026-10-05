'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AudioPreviewPlayer } from '@/components/molecules/AudioPreviewPlayer';
import { CollectionPill } from '@/components/molecules/CollectionPill';
import { ThreePreviewCanvas } from '@/components/molecules/ThreePreviewCanvas';
import { TraitMatrix } from '@/components/molecules/TraitMatrix';
import { CreatorHeader } from '@/components/features/CreatorHeader';
import { ProvenanceTimeline } from '@/components/features/ProvenanceTimeline';
import { RoyaltySplitCalculator } from '@/components/features/RoyaltySplitCalculator';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { getChainDescriptor, getLicenseDescriptor } from '@/lib/constants';
import { getCollectionForAsset } from '@/lib/mock-data';
import {
  cn,
  formatCompactNumber,
  formatCryptoNumber,
  formatFiat,
  formatRelativeTime,
} from '@/lib/utils';
import { fiatForLicense, priceForLicense } from '@/context/CartContext';
import type { DigitalAsset, LicenseType } from '@/types/marketplace';

export interface AssetDetailViewProps {
  asset: DigitalAsset;
  className?: string;
}

type DetailTab = 'overview' | 'provenance' | 'royalty';

const TABS: { value: DetailTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'provenance', label: 'Provenance' },
  { value: 'royalty', label: 'Royalty' },
];

/**
 * Interactive body of the asset detail screen: creator banner, media preview,
 * licence switcher, tabbed panels and related listings.
 */
export function AssetDetailView({ asset, className }: AssetDetailViewProps) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const chain = getChainDescriptor(asset.chain);
  const collection = getCollectionForAsset(asset.id);
  const license = getLicenseDescriptor(asset.license);

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <CreatorHeader creator={asset.creator} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Media */}
        <div className="flex flex-col gap-4">
          {asset.category === 'audio_tracks' ? (
            <AudioPreviewPlayer
              src={asset.media.audioUrl ?? asset.media.previewUrl}
              posterUrl={asset.media.previewUrl}
              durationSeconds={asset.media.durationSeconds}
              title={asset.title}
            />
          ) : null}
          {asset.media.modelFormat ? (
            <div className="h-72 sm:h-96">
              <ThreePreviewCanvas
                modelFormat={asset.media.modelFormat}
                title={asset.title}
                className="h-full w-full"
              />
            </div>
          ) : null}

          <div className="relative aspect-[4/3] overflow-hidden rounded-glass border border-white/10 bg-slate-900">
            <Image
              src={asset.media.highResUrl}
              alt={asset.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              priority
            />
          </div>

          {collection ? (
            <CollectionPill
              collection={collection}
              volumeChangePercent={2.6}
              floorChangePercent={-0.9}
            />
          ) : null}
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">{asset.title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Listed by <span className="text-slate-200">{asset.creator.displayName}</span>{' '}
              <span className="text-slate-600">·</span>{' '}
              <time dateTime={asset.createdAt}>{formatRelativeTime(asset.createdAt)}</time>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{asset.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {asset.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?q=${encodeURIComponent(tag)}`}
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-slate-900/70 px-3 text-xs text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Price panel */}
          <div className="rounded-glass border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Price</p>
                <p className="font-mono text-2xl font-semibold text-cyan-300">
                  {formatCryptoNumber(asset.priceCrypto)} ETH
                </p>
                <p className="text-xs text-slate-500">{formatFiat(asset.priceFiatUsd)}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Views {formatCompactNumber(asset.viewsCount)}</p>
                <p className="mt-0.5">Likes {formatCompactNumber(asset.likesCount)}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-500">{license.summary}</p>
            <p className="mt-2 text-[11px] text-slate-600">
              {chain.label} · chain {chain.chainId} · token #{asset.tokenId}
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed panels */}
      <GlassPanel padding="none" className="overflow-hidden">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <GlassTabs
            items={TABS}
            value={tab}
            onChange={(value) => setTab(value as DetailTab)}
            label="Asset detail sections"
            stretch
          />
        </div>

        <div className="p-4 sm:p-5">
          {tab === 'overview' ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-200">Traits</h2>
                <TraitMatrix traits={asset.traits} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-500">Format</dt>
                  <dd className="mt-0.5 font-mono text-slate-200">
                    {asset.media.mimeType.split('/')[1]?.toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Network</dt>
                  <dd className="mt-0.5 text-slate-200">{chain.label}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Royalty</dt>
                  <dd className="mt-0.5 font-mono text-slate-200">{asset.royaltiesPercentage}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">License</dt>
                  <dd className="mt-0.5 truncate text-slate-200">{license.label}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {tab === 'provenance' ? (
            <ProvenanceTimeline asset={asset} />
          ) : null}

          {tab === 'royalty' ? (
            <RoyaltySplitCalculator
              salePriceCrypto={priceForLicense(asset, asset.license as LicenseType)}
              royaltiesPercentage={asset.royaltiesPercentage}
            />
          ) : null}
        </div>
      </GlassPanel>
    </div>
  );
}