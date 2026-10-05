'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { CHECKOUT_STEPS, CHECKOUT_STEP_DELAY_MS, PLATFORM_FEE_RATE } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import { useWallet } from '@/context/WalletContext';
import type { SettlementLineInput } from '@/context/WalletContext';
import { cn, formatCryptoNumber, formatDateTime, formatFiat } from '@/lib/utils';
import type { CheckoutStepId, TransactionRecord } from '@/types/marketplace';

export type CheckoutStage =
  | 'idle'
  | 'review'
  | 'processing'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface CheckoutProcessorProps {
  /** Begins the state machine when flipped true. */
  isActive: boolean;
  onClose: () => void;
  /** Fired once a purchase is confirmed, carrying the on-chain record. */
  onSettled?: (records: TransactionRecord[]) => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Step-by-step checkout state machine.
 *
 * Drives `review -> authorization -> gas_estimate -> signing -> broadcast ->
 * confirmation`, then settles the order through the atomic batch API so the
 * wallet is debited exactly `subtotal + platform fee + gas` in a single write.
 * Cancel is honoured at any step and a failed settlement leaves state untouched.
 */
export function CheckoutProcessor({
  isActive,
  onClose,
  onSettled,
  className,
  ...rest
}: CheckoutProcessorProps) {
  const { cart, clearCart } = useCart();
  const { wallet, recordOrderSettlement } = useWallet();

  const [stage, setStage] = useState<CheckoutStage>('idle');
  const [currentStep, setCurrentStep] = useState<CheckoutStepId>('review');
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [settledRecords, setSettledRecords] = useState<TransactionRecord[]>([]);
  const [chargeSummary, setChargeSummary] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const runningRef = useRef(false);

  // Reset whenever the processor is deactivated.
  useEffect(() => {
    if (!isActive) {
      cancelledRef.current = false;
      runningRef.current = false;
      setStage('idle');
      setCurrentStep('review');
      setFailureReason(null);
      setSettledRecords([]);
      setChargeSummary(null);
    }
  }, [isActive]);

  const steps = CHECKOUT_STEPS;
  const activeStepIndex = steps.findIndex((step) => step.id === currentStep);

  /**
   * FIN-01: one atomic call settles every line. `totalRequiredCrypto` is the
   * cart total (subtotal + platform fee + gas) so the wallet is never debited
   * by a stale per-line amount and the fee is never omitted.
   */
  const settle = useCallback(async () => {
    const snapshot = cart;

    if (!wallet.isConnected) {
      setFailureReason('Wallet disconnected before settlement could complete.');
      setStage('failed');
      return;
    }

    const lines: SettlementLineInput[] = snapshot.items.map((item) => {
      const units = item.selectedLicense === 'exclusive_nft' ? 1 : item.quantity;
      return {
        assetId: item.assetId,
        assetTitle: item.asset.title,
        assetThumbnail: item.asset.media.thumbnailUrl,
        amountCrypto: Number((item.priceCrypto * units).toFixed(6)),
        amountFiatUsd: Number((item.priceFiatUsd * units).toFixed(2)),
        chain: wallet.chain,
        currency: 'ETH' as const,
        sellerAddress: item.asset.creator.walletAddress,
      };
    });

    try {
      const result = await recordOrderSettlement({
        lines,
        totalRequiredCrypto: snapshot.totalCrypto,
        platformFeeCrypto: snapshot.platformFeeEth,
        gasFeeCrypto: snapshot.estimatedGasFeeEth,
      });

      setSettledRecords(result.records);
      setChargeSummary(
        `${formatCryptoNumber(result.chargedCrypto)} ETH (balance ${formatCryptoNumber(
          result.balanceBeforeEth
        )} -> ${formatCryptoNumber(result.balanceAfterEth)})`
      );
      setFailureReason(null);
      setStage('confirmed');
      onSettled?.(result.records);
      clearCart();
    } catch (settlementError) {
      // The atomic update rolled back, so the cart and wallet are both intact.
      const message =
        settlementError instanceof Error
          ? settlementError.message
          : 'Settlement failed for an unknown reason.';
      setFailureReason(message);
      setStage('failed');
    }
  }, [cart, clearCart, onSettled, recordOrderSettlement, wallet.chain, wallet.isConnected]);

  const run = useCallback(async () => {
    if (runningRef.current || cart.items.length === 0) return;
    runningRef.current = true;
    cancelledRef.current = false;
    setFailureReason(null);
    setStage('processing');

    const sequence: CheckoutStepId[] = [
      'authorization',
      'gas_estimate',
      'signing',
      'broadcast',
    ];

    for (const step of sequence) {
      if (cancelledRef.current) {
        runningRef.current = false;
        setStage('cancelled');
        return;
      }
      setCurrentStep(step);
      // eslint-disable-next-line no-await-in-loop -- step pacing is sequential by design
      await new Promise((resolve) => setTimeout(resolve, CHECKOUT_STEP_DELAY_MS));
    }

    if (cancelledRef.current) {
      runningRef.current = false;
      setStage('cancelled');
      return;
    }

    setCurrentStep('confirmation');
    // eslint-disable-next-line no-await-in-loop -- settlement is sequential per line
    await settle();
    runningRef.current = false;
  }, [cart.items.length, settle]);

  // Kick off the machine the moment it becomes active with a populated cart.
  useEffect(() => {
    if (isActive && stage === 'idle' && cart.items.length > 0 && wallet.isConnected) {
      run();
    }
  }, [isActive, stage, cart.items.length, wallet.isConnected, run]);

  const handleCancel = () => {
    cancelledRef.current = true;
    setStage('cancelled');
  };

  const handleRetry = () => {
    setFailureReason(null);
    setStage('idle');
    setCurrentStep('review');
  };

  const isPending = stage === 'processing';

  const statusConfig = useMemo(() => {
    switch (stage) {
      case 'confirmed':
        return {
          icon: <CheckCircle2 aria-hidden="true" className="size-6 text-emerald-300" />,
          title: 'Purchase confirmed',
          tone: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
        };
      case 'failed':
        return {
          icon: <XCircle aria-hidden="true" className="size-6 text-red-300" />,
          title: 'Transaction failed',
          tone: 'border-red-400/30 bg-red-500/10 text-red-200',
        };
      case 'cancelled':
        return {
          icon: <AlertTriangle aria-hidden="true" className="size-6 text-amber-300" />,
          title: 'Transaction cancelled',
          tone: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
        };
      default:
        return null;
    }
  }, [stage]);

  return (
    <div
      className={cn('flex flex-col gap-5', className)}
      data-testid="checkout-processor"
      data-stage={stage}
      {...rest}
    >
      {statusConfig ? (
        <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3.5', statusConfig.tone)} role="status" data-testid="checkout-status">
          {statusConfig.icon}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{statusConfig.title}</p>
            {failureReason ? <p className="mt-0.5 text-xs opacity-90">{failureReason}</p> : null}
            {stage === 'confirmed' && settledRecords.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {settledRecords.map((record) => (
                  <li key={record.id} className="truncate font-mono text-[11px] opacity-90">
                    {record.txHash.slice(0, 12)}… · {record.assetTitle}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Step tracker */}
      <ol className="flex flex-col gap-2" data-testid="checkout-steps">
        {steps.map((step, index) => {
          const isDone = isPending && index < activeStepIndex;
          const isActive = isPending && index === activeStepIndex;
          const reached = !isPending && stage === 'confirmed' ? true : index <= activeStepIndex && stage !== 'idle';

          return (
            <li key={step.id} className="flex items-start gap-3" data-step={step.id} data-state={isActive ? 'active' : isDone || (reached && stage === 'confirmed') ? 'done' : 'pending'}>
              <span
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                  isDone || (reached && stage === 'confirmed')
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    : isActive
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                      : 'border-white/10 text-slate-600'
                )}
              >
                {isActive ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : isDone || (reached && stage === 'confirmed') ? <CheckCircle2 aria-hidden="true" className="size-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-sm font-medium', isActive || isDone || (reached && stage === 'confirmed') ? 'text-slate-100' : 'text-slate-500')}>
                  {step.label}
                </span>
                <span className="block text-xs text-slate-500">{step.description}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Order summary */}
      {cart.items.length > 0 && stage !== 'confirmed' ? (
        <dl className="space-y-1.5 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm">
          {cart.items.map((item) => (
            <div key={item.assetId} className="flex justify-between gap-3">
              <dt className="truncate text-slate-400">
                {item.asset.title}
                <span className="ml-1 text-slate-600">×{item.selectedLicense === 'exclusive_nft' ? 1 : item.quantity}</span>
              </dt>
              <dd className="shrink-0 font-mono text-slate-200">
                {formatCryptoNumber(item.priceCrypto)} ETH
              </dd>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-xs text-slate-500">
            <dt>Platform fee {(PLATFORM_FEE_RATE * 100).toFixed(1)}%</dt>
            <dd className="font-mono">{formatCryptoNumber(cart.platformFeeEth)} ETH</dd>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <dt className="font-semibold text-slate-100">Total</dt>
            <dd className="font-mono font-semibold text-cyan-300">
              {formatCryptoNumber(cart.totalCrypto)} ETH · {formatFiat(cart.totalFiatUsd)}
            </dd>
          </div>
        </dl>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2">
        {isPending ? (
          <GlassButton variant="danger" className="flex-1" onClick={handleCancel} data-testid="checkout-cancel">
            Cancel transaction
          </GlassButton>
        ) : stage === 'confirmed' ? (
          <GlassButton variant="primary-neon" block onClick={onClose} data-testid="checkout-done">
            Done
          </GlassButton>
        ) : stage === 'cancelled' || stage === 'failed' ? (
          <>
            <GlassButton variant="ghost" onClick={onClose} data-testid="checkout-close">
              Close
            </GlassButton>
            <GlassButton variant="primary-neon" className="flex-1" onClick={handleRetry} data-testid="checkout-retry">
              Retry purchase
            </GlassButton>
          </>
        ) : (
          <GlassButton variant="ghost" block onClick={onClose}>
            Keep browsing
          </GlassButton>
        )}
      </div>

      {settledRecords.length > 0 ? (
        <div
          className="flex flex-col gap-1 text-center text-[11px] text-slate-600"
          data-testid="settlement-summary"
        >
          <p>
            Recorded {settledRecords.length} transaction
            {settledRecords.length === 1 ? '' : 's'} at {formatDateTime(settledRecords[0].timestamp)}
          </p>
          {chargeSummary ? (
            <p className="font-mono" data-testid="settlement-charge">
              Charged {chargeSummary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}