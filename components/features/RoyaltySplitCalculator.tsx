'use client';

import { useMemo } from 'react';
import { PLATFORM_FEE_RATE } from '@/lib/constants';
import { ETH_USD_RATE } from '@/lib/mock-data';
import { cn, formatCryptoNumber, formatFiat, formatPercent } from '@/lib/utils';

export interface RoyaltySplitCalculatorProps {
  salePriceCrypto: number;
  royaltiesPercentage: number;
  className?: string;
  'data-testid'?: string;
}

/**
 * Creator earnings breakdown.
 *
 * Splits a sale between the platform fee, the creator's secondary royalty and
 * the current holder's proceeds. Values stay consistent with the cart engine —
 * the platform fee is the same `PLATFORM_FEE_RATE` the totals are built from.
 */
export function RoyaltySplitCalculator({
  salePriceCrypto,
  royaltiesPercentage,
  className,
  ...rest
}: RoyaltySplitCalculatorProps) {
  const breakdown = useMemo(() => {
    const gross = Number.isFinite(salePriceCrypto) ? Math.max(salePriceCrypto, 0) : 0;
    const platformFee = gross * PLATFORM_FEE_RATE;
    const royaltyRate = Math.min(Math.max(royaltiesPercentage, 0), 100) / 100;
    // Royalties are charged on the post-fee remainder, matching common marketplaces.
    const royaltyBase = gross - platformFee;
    const creatorRoyalty = royaltyBase * royaltyRate;
    const holderProceeds = royaltyBase - creatorRoyalty;

    return { gross, platformFee, royaltyBase, creatorRoyalty, holderProceeds };
  }, [salePriceCrypto, royaltiesPercentage]);

  const rows = [
    {
      id: 'gross',
      label: 'Sale price',
      valueCrypto: breakdown.gross,
      barPercent: 100,
      barClass: 'bg-slate-500',
      textClass: 'text-slate-200',
    },
    {
      id: 'platform',
      label: `Platform fee (${formatPercent(PLATFORM_FEE_RATE * 100, 1)})`,
      valueCrypto: breakdown.platformFee,
      barPercent: (breakdown.platformFee / (breakdown.gross || 1)) * 100,
      barClass: 'bg-violet-500/70',
      textClass: 'text-violet-200',
    },
    {
      id: 'royalty',
      label: `Creator royalty (${formatPercent(royaltiesPercentage, 1)})`,
      valueCrypto: breakdown.creatorRoyalty,
      barPercent: (breakdown.creatorRoyalty / (breakdown.gross || 1)) * 100,
      barClass: 'bg-cyan-500',
      textClass: 'text-cyan-200',
    },
    {
      id: 'holder',
      label: 'Holder proceeds',
      valueCrypto: breakdown.holderProceeds,
      barPercent: (breakdown.holderProceeds / (breakdown.gross || 1)) * 100,
      barClass: 'bg-emerald-500/70',
      textClass: 'text-emerald-200',
    },
  ];

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-slate-900/50 p-4',
        className
      )}
      data-testid="royalty-split-calculator"
      {...rest}
    >
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Royalty split
      </h3>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800" role="img" aria-label="Fee distribution bar">
        {rows.slice(1).map((row) => (
          <span
            key={row.id}
            className={cn('h-full', row.barClass)}
            style={{ width: `${Math.max(row.barPercent, 0)}%` }}
          />
        ))}
      </div>

      <dl className="mt-3.5 flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3">
            <dt className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
              <span className={cn('size-2 shrink-0 rounded-full', row.barClass)} aria-hidden="true" />
              <span className="truncate">{row.label}</span>
            </dt>
            <dd className={cn('shrink-0 font-mono text-xs', row.textClass)}>
              {formatCryptoNumber(row.valueCrypto)} ETH
              <span className="ml-2 text-slate-600">
                {formatFiat(row.valueCrypto * ETH_USD_RATE)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}