'use client';

import { calculateRarityTier, cn, formatTraitValue, truncate } from '@/lib/utils';
import { RARITY_TIER_STYLES } from '@/lib/constants';
import type { AssetTrait } from '@/types/marketplace';

export interface TraitMatrixProps {
  traits: AssetTrait[];
  /** Upper bound for truncated values before the ellipsis is applied. */
  valueMaxLength?: number;
  className?: string;
  'data-testid'?: string;
}

const MAX_VALUE_LENGTH = 26;

/**
 * Renders every trait value through `formatTraitValue()` so numeric and string
 * traits share one canonical representation. Long values truncate with the
 * full text preserved in the `title` tooltip.
 */
export function TraitMatrix({
  traits,
  valueMaxLength = MAX_VALUE_LENGTH,
  className,
  ...rest
}: TraitMatrixProps) {
  if (traits.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-white/15 bg-slate-950/40 p-6 text-center',
          className
        )}
        data-testid="trait-matrix-empty"
        {...rest}
      >
        <p className="text-sm text-slate-400">No traits recorded for this asset.</p>
      </div>
    );
  }

  return (
    <ul
      // Single column on the narrowest phones; two columns from 480px up.
      className={cn('grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2', className)}
      data-testid="trait-matrix"
      {...rest}
    >
      {traits.map((trait) => {
        const fullValue = formatTraitValue(trait.value);
        const tier = calculateRarityTier(trait.rarityScore);
        return (
          <li
            key={`${trait.traitType}-${fullValue}`}
            className="group flex min-w-0 flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/60 p-3 transition-colors hover:border-cyan-400/30"
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {trait.traitType}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-1.5 text-[9px] font-semibold uppercase leading-4',
                  RARITY_TIER_STYLES[tier]
                )}
                title={`Rarity score ${trait.rarityScore} · ${tier}`}
              >
                {tier}
              </span>
            </div>

            <span
              data-testid="trait-value"
              title={fullValue}
              className="truncate font-mono text-sm text-slate-100"
            >
              {truncate(fullValue, valueMaxLength)}
            </span>

            <div className="flex items-center gap-2">
              <div
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/5"
                role="img"
                aria-label={`${trait.traitType} rarity ${trait.rarityScore} out of 100`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400"
                  style={{ width: `${Math.min(Math.max(trait.rarityScore, 0), 100)}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-[10px] text-slate-500">
                {trait.frequencyPercent}%
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}