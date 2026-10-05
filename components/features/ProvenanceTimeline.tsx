'use client';

import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CircleDot, Hammer, Repeat2, Tag } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { buildProvenanceForAsset } from '@/lib/mock-data';
import { cn, formatAddress, formatDateTime, formatFiat, formatRelativeTime } from '@/lib/utils';
import type { DigitalAsset, ProvenanceEvent, ProvenanceEventKind } from '@/types/marketplace';

export interface ProvenanceTimelineProps {
  asset: DigitalAsset;
  /** Appends the connected wallet's local transactions to the ledger. */
  includeWalletActivity?: boolean;
  className?: string;
  'data-testid'?: string;
}

const KIND_META: Record<
  ProvenanceEventKind,
  { label: string; icon: typeof CircleDot; tone: string }
> = {
  mint: { label: 'Mint', icon: CircleDot, tone: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10' },
  listing: { label: 'Listed', icon: Tag, tone: 'text-sky-300 border-sky-400/30 bg-sky-500/10' },
  transfer: {
    label: 'Transfer',
    icon: ArrowUpRight,
    tone: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
  },
  sale: { label: 'Sale', icon: Hammer, tone: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' },
  settlement: {
    label: 'Settlement',
    icon: Repeat2,
    tone: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
  },
};

/**
 * Chronological blockchain ledger for an asset. Seeded provenance is generated
 * deterministically from the catalogue; any locally recorded purchases from
 * the connected wallet are merged in and sorted by block/timestamp.
 */
export function ProvenanceTimeline({
  asset,
  includeWalletActivity = true,
  className,
  ...rest
}: ProvenanceTimelineProps) {
  const { transactions, wallet } = useWallet();

  const localEvents = useMemo<ProvenanceEvent[]>(() => {
    if (!includeWalletActivity) return [];
    return transactions
      .filter((record) => record.assetId === asset.id)
      .map((record) => ({
        id: record.id,
        kind: record.status === 'confirmed' ? ('settlement' as const) : ('sale' as const),
        txHash: record.txHash,
        blockNumber: 0,
        timestamp: record.timestamp,
        fromAddress: record.sellerAddress,
        toAddress: record.buyerAddress,
        priceCrypto: record.amountCrypto,
        priceFiatUsd: record.amountFiatUsd,
        currency: record.currency,
        note:
          record.status === 'confirmed'
            ? `Local settlement recorded in this session${wallet.isConnected ? ` for ${formatAddress(wallet.address)}` : ''}.`
            : `Local ${record.status} order from this session.`,
      }));
  }, [asset.id, includeWalletActivity, transactions, wallet.isConnected, wallet.address]);

  const events = useMemo(() => {
    const seeded = buildProvenanceForAsset(asset);
    return [...seeded, ...localEvents].sort(
      (first, second) =>
        new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()
    );
  }, [asset, localEvents]);

  return (
    <div
      className={cn('flex flex-col', className)}
      data-testid="provenance-timeline"
      {...rest}
    >
      <ol className="relative flex flex-col gap-0">
        {events.map((event, index) => {
          const meta = KIND_META[event.kind];
          const Icon = meta.icon;
          const isLast = index === events.length - 1;
          return (
            <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Rail */}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-white/15 to-white/5"
                />
              ) : null}

              <span
                className={cn(
                  'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border',
                  meta.tone
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-slate-100">{meta.label}</span>
                  <time
                    dateTime={event.timestamp}
                    title={formatDateTime(event.timestamp)}
                    className="text-xs text-slate-500"
                  >
                    {formatRelativeTime(event.timestamp)}
                  </time>
                  {event.blockNumber > 0 ? (
                    <span className="font-mono text-[10px] text-slate-600">
                      #{event.blockNumber}
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                      local
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-slate-400">{event.note}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-slate-600">
                  {event.priceCrypto !== null ? (
                    <span className="text-cyan-400/80">
                      {event.priceCrypto} {event.currency}
                      {event.priceFiatUsd !== null
                        ? ` · ${formatFiat(event.priceFiatUsd)}`
                        : ''}
                    </span>
                  ) : (
                    <span>no consideration</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <ArrowDownLeft aria-hidden="true" className="size-3" />
                    {formatAddress(event.fromAddress)}
                  </span>
                  <span aria-hidden="true">→</span>
                  <span className="inline-flex items-center gap-1">
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                    {formatAddress(event.toAddress)}
                  </span>
                </div>

                <p className="mt-1 truncate font-mono text-[10px] text-slate-700" title={event.txHash}>
                  {event.txHash}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
          No recorded activity for this asset yet.
        </p>
      ) : null}
    </div>
  );
}