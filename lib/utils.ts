import { RARITY_THRESHOLDS } from '@/lib/constants';
import type { RarityTier } from '@/types/marketplace';

/** Joins conditional class names, dropping falsy entries. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/**
 * Truncates a wallet address to its `0x1234...abcd` display form. Solana
 * addresses and short handles are returned untouched because slicing a base58
 * address removes its only meaningful prefix.
 */
export function formatAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length < 10) return address;
  if (address.startsWith('0x')) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Full, untruncated address for `title` tooltips and copy targets. */
export function formatAddressLong(address: string | null | undefined): string {
  return address ?? '';
}

export function formatCrypto(amount: number, symbol = 'ETH'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const maximumFractionDigits = safeAmount !== 0 && Math.abs(safeAmount) < 0.01 ? 6 : 4;
  const numeric = safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: safeAmount === 0 ? 0 : 2,
    maximumFractionDigits,
  });
  return `${numeric} ${symbol}`;
}

export function formatCryptoNumber(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: safeAmount === 0 ? 0 : 2,
    maximumFractionDigits: Math.abs(safeAmount) < 0.01 ? 6 : 4,
  });
}

export function formatFiat(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatCompactNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(safeValue);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(fractionDigits)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown timestamp';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
];

/** Human relative time with an absolute-date fallback for future timestamps. */
export function formatRelativeTime(dateString: string, now: number = Date.now()): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const deltaMs = date.getTime() - now;
  const absolute = Math.abs(deltaMs);
  if (absolute < 60_000) return 'just now';
  for (const { unit, ms } of RELATIVE_UNITS) {
    if (absolute >= ms) {
      const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
      return formatter.format(Math.round(deltaMs / ms), unit);
    }
  }
  return 'just now';
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

/** Seconds to a spoken clock, e.g. `2:04`. Alias kept for player components. */
export function formatClock(seconds: number): string {
  return formatDuration(seconds);
}

/**
 * Canonical trait rendering. Every trait surface in the app routes through this
 * helper so numeric and string traits format identically.
 */
export function formatTraitValue(value: string | number): string {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value)
      : String(value);
  }
  return String(value);
}

export function calculateRarityTier(rarityScore: number): RarityTier {
  const score = Number.isFinite(rarityScore) ? rarityScore : 0;
  const match = RARITY_THRESHOLDS.find((threshold) => score >= threshold.min);
  return match ? match.tier : 'Common';
}

/** Highest rarity score carried by an asset, used for `highest_rarity` sort. */
export function maxRarityScore(traits: ReadonlyArray<{ rarityScore: number }>): number {
  return traits.reduce((max, trait) => Math.max(max, trait.rarityScore), 0);
}

/** Truncates for tight layouts while preserving the full value in `title`. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Deterministic pseudo-random in [0,1) derived from a string seed. */
export function seededRandom(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}