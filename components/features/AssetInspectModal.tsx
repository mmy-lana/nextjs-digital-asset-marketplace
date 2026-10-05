'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Copy,
  Eye,
  FileType2,
  HardDrive,
  Heart,
  Maximize2,
  ShoppingCart,
} from 'lucide-react';
import { AudioPreviewPlayer } from '@/components/molecules/AudioPreviewPlayer';
import { ThreePreviewCanvas } from '@/components/molecules/ThreePreviewCanvas';
import { TraitMatrix } from '@/components/molecules/TraitMatrix';
import { CategoryBadge, ChainBadge, GlassBadge } from '@/components/ui/GlassBadge';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassModal } from '@/components/ui/GlassModal';
import { RoyaltySplitCalculator } from '@/components/features/RoyaltySplitCalculator';
import { getChainDescriptor, getLicenseDescriptor, LICENSE_OPTIONS } from '@/lib/constants';
import { getCollectionForAsset } from '@/lib/mock-data';
import {
  cn,
  formatCompactNumber,
  formatCryptoNumber,
  formatDate,
  formatFiat,
  formatFileSize,
  formatTraitValue,
  maxRarityScore,
} from '@/lib/utils';
import { fiatForLicense, priceForLicense } from '@/context/CartContext';
import type { DigitalAsset, LicenseType } from '@/types/marketplace';

export interface AssetInspectModalProps {
  asset: DigitalAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (asset: DigitalAsset, license: LicenseType) => void;
  isInCart?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Full-bleed inspection modal.
 *
 * Media magnification, a live 3D or audio preview where the category warrants
 * it, the trait matrix (every value routed through `formatTraitValue()`) and a
 * licence selector that re-prices the listing in place.
 */
export function AssetInspectModal({
  asset,
  isOpen,
  onClose,
  onAddToCart,
  isInCart = false,
  className,
  ...rest
}: AssetInspectModalProps) {
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | null>(null);
  const [isMagnified, setIsMagnified] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset per-asset view state whenever the target changes.
  useEffect(() => {
    setSelectedLicense(asset ? asset.license : null);
    setIsMagnified(false);
    setImageFailed(false);
    setCopied(false);
  }, [asset]);

  const effectiveLicense = useMemo<LicenseType>(
    () => selectedLicense ?? asset?.license ?? 'standard_commercial',
    [selectedLicense, asset]
  );

  const pricedCrypto = useMemo(
    () => (asset ? priceForLicense(asset, effectiveLicense) : 0),
    [asset, effectiveLicense]
  );
  const pricedFiat = useMemo(
    () => (asset ? fiatForLicense(asset, effectiveLicense) : 0),
    [asset, effectiveLicense]
  );

  const copyContract = useCallback(async () => {
    if (!asset) return;
    try {
      await navigator.clipboard.writeText(asset.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [asset]);

  if (!asset) return null;

  const chain = getChainDescriptor(asset.chain);
  const collection = getCollectionForAsset(asset.id);
  const license = getLicenseDescriptor(effectiveLicense);
  const showAudio = asset.category === 'audio_tracks';
  const showModel = Boolean(asset.media.modelFormat);
  const unavailable = !asset.isAvailable;

  return (
    <>
      <GlassModal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={asset.title}
        description={`${asset.creator.displayName} · Listed ${formatDate(asset.createdAt)}`}
        className={className}
        data-testid="inspect-modal"
        {...rest}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Media column */}
          <div className="flex flex-col gap-3">
            {showAudio ? (
              <AudioPreviewPlayer
                src={asset.media.previewUrl}
                durationSeconds={asset.media.durationSeconds}
                title={asset.title}
              />
            ) : showModel ? (
              <div className="h-64 sm:h-80">
                <ThreePreviewCanvas
                  modelFormat={asset.media.modelFormat}
                  title={asset.title}
                  className="h-full w-full"
                />
              </div>
            ) : null}

            <div
              className={cn(
                'group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900',
                showAudio || showModel ? 'aspect-[16/10]' : 'aspect-[4/3]'
              )}
            >
              {imageFailed ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-sm text-slate-500">
                  Preview unavailable
                </div>
              ) : (
                <Image
                  src={isMagnified ? asset.media.highResUrl : asset.media.previewUrl}
                  alt={asset.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className={cn(
                    'object-cover transition-transform duration-300',
                    isMagnified ? 'scale-125 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                  )}
                  onError={() => setImageFailed(true)}
                  priority
                />
              )}

              <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 bg-gradient-to-b from-slate-950/85 to-transparent p-3">
                <CategoryBadge category={asset.category} />
                <ChainBadge chain={asset.chain} />
                <GlassBadge tone="accent" size="sm">
                  Max rarity {maxRarityScore(asset.traits)}
                </GlassBadge>
              </div>

              <button
                type="button"
                onClick={() => setIsMagnified((value) => !value)}
                aria-label={isMagnified ? 'Reduce preview' : 'Magnify preview'}
                aria-pressed={isMagnified}
                className={cn(
                  'absolute bottom-3 right-3 inline-flex size-11 items-center justify-center rounded-xl',
                  'border border-white/15 bg-slate-950/85 text-slate-200 backdrop-blur-md',
                  'transition-colors hover:bg-slate-950 hover:text-cyan-300',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                )}
              >
                <Maximize2 aria-hidden="true" className="size-4" />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <FileType2 aria-hidden="true" className="size-3.5" /> Format
                </dt>
                <dd className="mt-0.5 truncate font-mono text-slate-200">
                  {asset.media.mimeType.split('/')[1]?.toUpperCase() ?? asset.media.mimeType}
                </dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <HardDrive aria-hidden="true" className="size-3.5" /> Size
                </dt>
                <dd className="mt-0.5 font-mono text-slate-200">
                  {formatFileSize(asset.media.fileSizeBytes)}
                </dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <Eye aria-hidden="true" className="size-3.5" /> Views
                </dt>
                <dd className="mt-0.5 font-mono text-slate-200">
                  {formatCompactNumber(asset.viewsCount)}
                </dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <Heart aria-hidden="true" className="size-3.5" /> Likes
                </dt>
                <dd className="mt-0.5 font-mono text-slate-200">
                  {formatCompactNumber(asset.likesCount)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Detail column */}
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-relaxed text-slate-400">{asset.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map((tag) => (
                <GlassBadge key={tag} size="sm">
                  {tag}
                </GlassBadge>
              ))}
            </div>

            {/* Licence selector */}
            <fieldset>
              <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                License
              </legend>
              <div className="flex flex-col gap-1.5" data-testid="license-selector">
                {LICENSE_OPTIONS.map((option) => {
                  const isSelected = option.value === effectiveLicense;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex min-h-[56px] cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                        isSelected
                          ? 'border-cyan-400/50 bg-cyan-500/10'
                          : 'border-white/10 bg-slate-900/40 hover:border-white/25'
                      )}
                    >
                      <input
                        type="radio"
                        name="inspect-license"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setSelectedLicense(option.value)}
                        className="mt-0.5 size-[18px] shrink-0 cursor-pointer appearance-none rounded-full border border-white/25 bg-slate-950 checked:border-cyan-400 checked:bg-cyan-400 checked:shadow-[inset_0_0_0_4px_#020617] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-100">{option.label}</span>
                          <span className="shrink-0 font-mono text-xs text-cyan-300">
                            {formatCryptoNumber(priceForLicense(asset, option.value))} ETH
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {option.summary}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Price + action */}
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Total</p>
                  <p className="font-mono text-2xl font-semibold text-cyan-300">
                    {formatCryptoNumber(pricedCrypto)} ETH
                  </p>
                  <p className="text-xs text-slate-500">{formatFiat(pricedFiat)}</p>
                </div>
                <p className="text-right text-xs text-slate-500">
                  Royalty
                  <span className="block font-mono text-slate-300">{asset.royaltiesPercentage}%</span>
                </p>
              </div>

              <GlassButton
                variant="primary-neon"
                block
                className="mt-4"
                disabled={unavailable || isInCart}
                onClick={() => onAddToCart(asset, effectiveLicense)}
                iconLeft={<ShoppingCart aria-hidden="true" className="size-4" />}
                data-testid="inspect-add-to-cart"
              >
                {unavailable ? 'Asset unavailable' : isInCart ? 'Already in cart' : 'Add to cart'}
              </GlassButton>
              <p className="mt-2 text-center text-[11px] text-slate-600">{license.summary}</p>
            </div>

            {/* On-chain identity */}
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                On-chain
              </p>
              <button
                type="button"
                onClick={copyContract}
                className="flex min-h-[40px] items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                data-testid="copy-contract"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] text-slate-500">Contract</span>
                  <span className="block truncate font-mono text-xs text-slate-300">
                    {asset.contractAddress}
                  </span>
                </span>
                {copied ? (
                  <span className="shrink-0 text-[10px] text-emerald-300">Copied</span>
                ) : (
                  <Copy aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
                )}
              </button>
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <dt className="text-slate-500">Token ID</dt>
                  <dd className="font-mono text-slate-300">#{asset.tokenId}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Network</dt>
                  <dd className="text-slate-300">
                    {chain.label} · {chain.chainId}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Owner</dt>
                  <dd className="flex items-center gap-1.5 text-slate-300">
                    {asset.currentOwner.displayName}
                    {collection ? (
                      <a
                        href={`/collections/${collection.slug}`}
                        className="inline-flex items-center gap-0.5 text-cyan-300 hover:underline"
                      >
                        {collection.name}
                        <ArrowUpRight aria-hidden="true" className="size-3" />
                      </a>
                    ) : null}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Traits */}
            <div>
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Traits
              </h3>
              <TraitMatrix traits={asset.traits} />
            </div>

            {/* Royalty split */}
            <RoyaltySplitCalculator
              salePriceCrypto={pricedCrypto}
              royaltiesPercentage={asset.royaltiesPercentage}
            />
          </div>
        </div>
      </GlassModal>
    </>
  );
}