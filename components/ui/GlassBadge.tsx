import type { ReactNode } from 'react';
import {
  CATEGORIES,
  RARITY_TIER_STYLES,
  getChainDescriptor,
} from '@/lib/constants';
import { calculateRarityTier, cn } from '@/lib/utils';
import type { AssetCategory, ChainNetwork, RarityTier } from '@/types/marketplace';

export type GlassBadgeTone = 'neutral' | 'neon' | 'accent';

export interface GlassBadgeProps {
  children?: ReactNode;
  tone?: GlassBadgeTone;
  /** Leading dot indicator. */
  dot?: boolean;
  /** Animates the neon pulse — reserved for "live" style badges. */
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
  'data-testid'?: string;
}

const TONE_CLASSES: Record<GlassBadgeTone, string> = {
  neutral: 'border-white/15 bg-slate-900/70 text-slate-300',
  neon: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
  accent: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
};

const SIZE_CLASSES = {
  sm: 'min-h-[24px] px-2 text-[10px]',
  md: 'min-h-[28px] px-2.5 text-xs',
} as const;

/** Base translucent pill used by every badge variant below. */
export function GlassBadge({
  children,
  tone = 'neutral',
  dot = false,
  pulse = false,
  size = 'sm',
  className,
  ...rest
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium backdrop-blur-md',
        'leading-none whitespace-nowrap',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 shrink-0 rounded-full bg-current',
            pulse && 'animate-[neon-pulse_2.8s_ease-in-out_infinite]'
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export interface CategoryBadgeProps {
  category: AssetCategory;
  className?: string;
  'data-testid'?: string;
}

/** Resolves a category key to its human label, falling back to the raw key. */
export function CategoryBadge({ category, className, ...rest }: CategoryBadgeProps) {
  const descriptor = CATEGORIES.find((entry) => entry.value === category);
  return (
    <GlassBadge tone="neon" dot className={className} title={descriptor?.description} {...rest}>
      {descriptor?.label ?? category}
    </GlassBadge>
  );
}

export interface ChainBadgeProps {
  chain: ChainNetwork;
  className?: string;
  'data-testid'?: string;
}

/** Network pill using the chain-specific accent defined in `CHAIN_NETWORKS`. */
export function ChainBadge({ chain, className, ...rest }: ChainBadgeProps) {
  const descriptor = getChainDescriptor(chain);
  return (
    <span
      className={cn(
        'inline-flex min-h-[24px] items-center gap-1.5 rounded-full border px-2',
        'text-[10px] font-medium leading-none whitespace-nowrap backdrop-blur-md',
        descriptor.accentClass,
        className
      )}
      {...rest}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {descriptor.label}
    </span>
  );
}

export interface RarityBadgeProps {
  rarityScore: number;
  /** Overrides the tier derived from the score (e.g. for aggregate badges). */
  tier?: RarityTier;
  className?: string;
  'data-testid'?: string;
}

/** Rarity pill; the tier is derived from `calculateRarityTier(rarityScore)`. */
export function RarityBadge({ rarityScore, tier, className, ...rest }: RarityBadgeProps) {
  const resolvedTier = tier ?? calculateRarityTier(rarityScore);
  return (
    <span
      className={cn(
        'inline-flex min-h-[24px] items-center gap-1 rounded-full border px-2',
        'text-[10px] font-semibold uppercase leading-none tracking-wide backdrop-blur-md',
        RARITY_TIER_STYLES[resolvedTier],
        className
      )}
      {...rest}
    >
      {resolvedTier}
    </span>
  );
}