import Link from 'next/link';
import Image from 'next/image';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCryptoNumber } from '@/lib/utils';
import type { CollectionSummary } from '@/types/marketplace';

export interface CollectionPillProps {
  collection: CollectionSummary;
  /** 24-hour volume delta as a signed percentage. */
  volumeChangePercent?: number;
  /** Floor price delta as a signed percentage. */
  floorChangePercent?: number;
  className?: string;
  'data-testid'?: string;
}

function DeltaBadge({
  value,
  label,
  testId,
}: {
  value: number;
  label: string;
  testId: string;
}) {
  const isPositive = value >= 0;
  return (
    <span
      data-testid={testId}
      title={`${label}: ${isPositive ? '+' : ''}${value.toFixed(1)}%`}
      className={
        isPositive
          ? 'inline-flex items-center gap-0.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300'
          : 'inline-flex items-center gap-0.5 rounded-full border border-red-400/25 bg-red-500/10 px-1.5 py-0.5 font-mono text-[10px] text-red-300'
      }
    >
      {isPositive ? (
        <TrendingUp aria-hidden="true" className="size-3" />
      ) : (
        <TrendingDown aria-hidden="true" className="size-3" />
      )}
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

/**
 * Collection stat pill showing logo, floor price and 24-hour deltas. A Server
 * Component — it is pure presentation over catalogue data.
 */
export function CollectionPill({
  collection,
  volumeChangePercent = 4.2,
  floorChangePercent = -1.8,
  className,
  ...rest
}: CollectionPillProps) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      data-testid="collection-pill"
      className={
        'group flex items-center gap-3 rounded-glass border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl transition-colors hover:border-cyan-400/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ' +
        (className ?? '')
      }
      {...rest}
    >
      <Image
        src={collection.logoUrl}
        alt={`${collection.name} logo`}
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-xl border border-white/10 object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-100">{collection.name}</span>
          {collection.verified ? (
            <span
              aria-label="Verified collection"
              title="Verified collection"
              className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300"
            >
              <svg viewBox="0 0 12 12" className="size-2.5" fill="currentColor" aria-hidden="true">
                <path d="M6 0.8 7.6 2l2.3-.3.5 2.3L12 6l-1.6 2 .3 2.3-2.3.5L6 11.2 4.4 10l-2.3.5L1.6 8 0 6l1.6-2-.3-2.3L3.6 2 6 0.8Z" />
              </svg>
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-cyan-300">
            {formatCryptoNumber(collection.floorPriceEth)} ETH
          </span>
          <span className="text-slate-600">floor</span>
          <DeltaBadge
            value={floorChangePercent}
            label="Floor price 24h"
            testId="collection-floor-delta"
          />
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block font-mono text-xs text-slate-300">
          {formatCryptoNumber(collection.totalVolumeEth)} ETH
        </span>
        <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
          24h vol
          <DeltaBadge
            value={volumeChangePercent}
            label="Volume 24h"
            testId="collection-volume-delta"
          />
        </span>
      </span>
    </Link>
  );
}