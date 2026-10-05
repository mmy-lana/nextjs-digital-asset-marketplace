'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { MAX_CART_QUANTITY, PLATFORM_FEE_RATE, getLicenseDescriptor } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import { useWallet } from '@/context/WalletContext';
import {
  cn,
  formatCryptoNumber,
  formatDateTime,
  formatFiat,
  formatPercent,
} from '@/lib/utils';
import type { CheckoutStage } from '@/components/features/CheckoutProcessor';

export interface CartSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Requests the checkout machine; renders the processor inside the panel. */
  onCheckout?: () => void;
  checkoutStage?: CheckoutStage;
  isCheckingOut?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Slide-out cart panel.
 *
 * Width is clamped with `max-w-[calc(100vw-1rem)]` on the smallest screens so
 * the panel never forces horizontal document overflow at 360px, relaxing to
 * `sm:max-w-md` from 640px up.
 */
export function CartSlideOver({
  isOpen,
  onClose,
  onCheckout,
  checkoutStage = 'idle',
  isCheckingOut = false,
  className,
  ...rest
}: CartSlideOverProps) {
  const { cart, itemCount, removeFromCart, updateQuantity, clearCart, isAssetAvailable } = useCart();
  const { wallet } = useWallet();

  // Lock body scroll and close on Escape while the panel is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const insufficientFunds = wallet.isConnected && wallet.balanceEth < cart.totalCrypto;

  return (
    <div
      className={cn('fixed inset-0 z-50', className)}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
      data-testid="cart-slideover"
      {...rest}
    >
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-[calc(100vw-1rem)] flex-col sm:max-w-md',
          'border-l border-white/10 bg-slate-950/95 shadow-[-8px_0_32px_0_rgba(0,0,0,0.5)]',
          'backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-right'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <ShoppingBag aria-hidden="true" className="size-4 text-cyan-300" />
            Cart
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
              {itemCount}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-xl text-slate-400',
              'transition-colors hover:bg-white/10 hover:text-slate-100',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
            )}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {/* Lines */}
        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center" data-testid="cart-empty">
            <ShoppingBag aria-hidden="true" className="size-10 text-slate-700" />
            <p className="text-sm font-medium text-slate-300">Your cart is empty</p>
            <p className="text-xs text-slate-500">
              Add assets from the explore grid to start a purchase.
            </p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto overscroll-contain px-4 py-3" data-testid="cart-lines">
            {cart.items.map((item) => {
              const exclusive = item.selectedLicense === 'exclusive_nft';
              const lineUnits = exclusive ? 1 : item.quantity;
              return (
                <li
                  key={item.assetId}
                  className="flex gap-3 border-b border-white/5 py-3 last:border-b-0"
                >
                  <Image
                    src={item.asset.media.thumbnailUrl}
                    alt={item.asset.title}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-lg border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100" title={item.asset.title}>
                      {item.asset.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {getLicenseDescriptor(item.selectedLicense).label}
                    </p>
                    {!isAssetAvailable(item.assetId) && item.selectedLicense !== 'exclusive_nft' ? (
                      <p className="mt-0.5 text-[11px] text-amber-300">
                        Asset locked by an exclusive line — remove it to unlock.
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center gap-2">
                      {exclusive ? (
                        <span className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-300">
                          Single unit
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.assetId, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.asset.title}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/10"
                          >
                            <Minus aria-hidden="true" className="size-3.5" />
                          </button>
                          <span className="min-w-[2ch] text-center font-mono text-sm text-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.assetId, item.quantity + 1)}
                            disabled={item.quantity >= MAX_CART_QUANTITY}
                            aria-label={`Increase quantity of ${item.asset.title}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40"
                          >
                            <Plus aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.assetId)}
                        aria-label={`Remove ${item.asset.title} from cart`}
                        className="ml-auto inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/15 hover:text-red-300"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm text-cyan-300">
                      {formatCryptoNumber(item.priceCrypto * lineUnits)} ETH
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFiat(item.priceFiatUsd * lineUnits)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Totals */}
        {cart.items.length > 0 ? (
          <div className="border-t border-white/10 bg-slate-900/60 px-4 py-4" data-testid="cart-totals">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Subtotal</dt>
                <dd className="font-mono text-slate-200">
                  {formatCryptoNumber(cart.subtotalCrypto)} ETH
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Platform fee ({formatPercent(PLATFORM_FEE_RATE * 100, 1)})</dt>
                <dd className="font-mono text-slate-200">
                  {formatCryptoNumber(cart.platformFeeEth)} ETH
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Estimated gas</dt>
                <dd className="font-mono text-slate-200">
                  {formatCryptoNumber(cart.estimatedGasFeeEth)} ETH
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base">
                <dt className="font-semibold text-slate-100">Total</dt>
                <dd className="font-mono font-semibold text-cyan-300">
                  {formatCryptoNumber(cart.totalCrypto)} ETH
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total (USD est.)</dt>
                <dd className="font-mono text-slate-400">{formatFiat(cart.totalFiatUsd)}</dd>
              </div>
            </dl>

            {insufficientFunds ? (
              <p role="alert" className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Connected balance ({formatCryptoNumber(wallet.balanceEth)} ETH) is below the order total.
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              <GlassButton variant="ghost" onClick={clearCart} data-testid="cart-clear" className="shrink-0">
                Clear
              </GlassButton>
              <GlassButton
                variant="primary-neon"
                className="flex-1"
                onClick={onCheckout}
                loading={isCheckingOut}
                disabled={!wallet.isConnected}
                data-testid="cart-checkout"
                aria-label={
                  wallet.isConnected
                    ? 'Proceed to checkout'
                    : 'Connect a wallet before checking out'
                }
              >
                {checkoutStage === 'idle' || checkoutStage === 'cancelled'
                  ? 'Checkout'
                  : 'Processing…'}
              </GlassButton>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-600">
              Settles in ETH · {wallet.isConnected ? 'Wallet connected' : 'Connect wallet to continue'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}