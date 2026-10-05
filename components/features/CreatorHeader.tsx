'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Bell, BellOff, CalendarDays, Wallet } from 'lucide-react';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassButton } from '@/components/ui/GlassButton';
import { STORAGE_KEYS } from '@/lib/constants';
import { getAssetsByCreator, getCollectionsForCreator } from '@/lib/mock-data';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { cn, formatCryptoNumber, formatDate, formatFiat } from '@/lib/utils';
import { ETH_USD_RATE } from '@/lib/mock-data';
import type { CreatorProfile } from '@/types/marketplace';

export interface CreatorHeaderProps {
  creator: CreatorProfile;
  className?: string;
  'data-testid'?: string;
}

/**
 * Creator profile banner with verification state, cumulative volume and a
 * follow toggle persisted to storage.
 */
export function CreatorHeader({ creator, className, ...rest }: CreatorHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  // Storage reads happen post-mount to keep the server render deterministic.
  useEffect(() => {
    const favorites = getStorageItem<string[]>(STORAGE_KEYS.favorites, []);
    setIsFollowing(favorites.includes(creator.id));
  }, [creator.id]);

  const toggleFollow = useCallback(() => {
    setIsFollowing((current) => {
      const next = !current;
      const favorites = new Set(getStorageItem<string[]>(STORAGE_KEYS.favorites, []));
      if (next) favorites.add(creator.id);
      else favorites.delete(creator.id);
      setStorageItem(STORAGE_KEYS.favorites, Array.from(favorites));
      return next;
    });
  }, [creator.id]);

  const assets = getAssetsByCreator(creator.id);
  const collections = getCollectionsForCreator(creator.id);
  const volumeUsd = creator.totalSalesVolumeEth * ETH_USD_RATE;

  return (
    <div
      className={cn('overflow-hidden rounded-glass border border-white/10 bg-slate-950/75 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]', className)}
      data-testid="creator-header"
      {...rest}
    >
      {/* Banner */}
      <div className="relative h-32 w-full sm:h-44">
        <Image
          src={creator.bannerUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
          <div className="relative shrink-0">
            <Image
              src={creator.avatarUrl}
              alt={`${creator.displayName} avatar`}
              width={104}
              height={104}
              className="size-24 rounded-2xl border-2 border-slate-950 object-cover sm:size-28"
            />
            {creator.verified ? (
              <span
                aria-label="Verified creator"
                title="Verified creator"
                className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500 text-slate-950"
              >
                <BadgeCheck aria-hidden="true" className="size-4" />
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-slate-50">{creator.displayName}</h1>
              {creator.verified ? <GlassBadge tone="neon" dot>Verified</GlassBadge> : null}
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{creator.handle}</p>
          </div>

          <GlassButton
            variant={isFollowing ? 'glass-outline' : 'primary-neon'}
            onClick={toggleFollow}
            iconLeft={
              isFollowing ? (
                <BellOff aria-hidden="true" className="size-4" />
              ) : (
                <Bell aria-hidden="true" className="size-4" />
              )
            }
            aria-pressed={isFollowing}
            data-testid="creator-follow-toggle"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </GlassButton>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">{creator.bio}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">Lifetime volume</dt>
            <dd className="mt-1 font-mono text-sm text-cyan-300">
              {formatCryptoNumber(creator.totalSalesVolumeEth)} ETH
            </dd>
            <dd className="text-[11px] text-slate-500">{formatFiat(volumeUsd)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">Listings</dt>
            <dd className="mt-1 font-mono text-sm text-slate-200" data-testid="creator-listing-count">
              {assets.length}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">Collections</dt>
            <dd className="mt-1 font-mono text-sm text-slate-200">{collections.length}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              <CalendarDays aria-hidden="true" className="size-3" /> Joined
            </dt>
            <dd className="mt-1 text-sm text-slate-200">{formatDate(creator.joinedAt)}</dd>
          </div>
        </dl>

        <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
          <Wallet aria-hidden="true" className="size-3.5" />
          {creator.walletAddress}
        </p>
      </div>
    </div>
  );
}