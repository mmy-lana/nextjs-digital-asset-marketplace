'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronRight, Loader2, Wallet } from 'lucide-react';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { CHAIN_NETWORKS, WALLET_PROVIDERS, getWalletProvider } from '@/lib/constants';
import { useWallet } from '@/context/WalletContext';
import { cn, formatAddress, formatCryptoNumber, formatFiat } from '@/lib/utils';
import type { ChainNetwork, WalletProviderKind } from '@/types/marketplace';

export interface WalletConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Web3 modal simulating connections across MetaMask, Coinbase, Phantom and
 * Ledger, with network switching and live balance readouts. All handshake,
 * chain-switch and error behaviour is delegated to `WalletContext`.
 */
export function WalletConnectDialog({
  isOpen,
  onClose,
  className,
  ...rest
}: WalletConnectDialogProps) {
  const {
    wallet,
    status,
    error,
    activeProvider,
    connectWallet,
    disconnectWallet,
    switchChain,
    clearError,
  } = useWallet();

  const [pendingProvider, setPendingProvider] = useState<WalletProviderKind | null>(null);
  const [switchingChain, setSwitchingChain] = useState<ChainNetwork | null>(null);

  // Clear transient feedback whenever the dialog closes.
  useEffect(() => {
    if (!isOpen) {
      setPendingProvider(null);
      setSwitchingChain(null);
    }
  }, [isOpen]);

  const handleConnect = async (kind: WalletProviderKind) => {
    clearError();
    setPendingProvider(kind);
    const ok = await connectWallet(kind);
    setPendingProvider(null);
    if (ok) {
      // Keep the dialog open briefly so the connected state is observable.
      setTimeout(onClose, 700);
    }
  };

  const handleSwitch = async (chain: ChainNetwork) => {
    clearError();
    setSwitchingChain(chain);
    await switchChain(chain);
    setSwitchingChain(null);
  };

  const connectedDescriptor = activeProvider ? getWalletProvider(activeProvider) : null;
  const isBusy = status === 'CONNECTING' || status === 'SWITCHING_NETWORK';

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={wallet.isConnected ? 'Wallet connected' : 'Connect a wallet'}
      description={
        wallet.isConnected
          ? 'Manage your network and view your simulated balance.'
          : 'Choose a provider to link your wallet to the marketplace.'
      }
      className={className}
      data-testid="wallet-dialog"
      {...rest}
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200"
          data-testid="wallet-error"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {wallet.isConnected && connectedDescriptor ? (
        <div data-testid="wallet-connected" className="flex flex-col gap-5">
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-cyan-200">
              <Wallet aria-hidden="true" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm text-slate-100" title={wallet.address ?? ''}>
                {formatAddress(wallet.address)}
              </p>
              {wallet.ensName ? (
                <p className="truncate text-xs text-cyan-300">{wallet.ensName}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-400">
                <span className="font-mono text-slate-200">
                  {formatCryptoNumber(wallet.balanceEth)} ETH
                </span>{' '}
                · {formatFiat(wallet.balanceUsd)}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Connected
            </span>
          </div>

          <section>
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Network
            </h3>
            <div className="flex flex-col gap-2">
              {CHAIN_NETWORKS.map((chain) => {
                const isActive = wallet.chain === chain.value;
                const supported = connectedDescriptor.supportedChains.includes(chain.value);
                return (
                  <button
                    key={chain.value}
                    type="button"
                    onClick={() => handleSwitch(chain.value)}
                    disabled={isActive || isBusy || !supported}
                    data-testid={`wallet-chain-${chain.value}`}
                    className={cn(
                      'flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left',
                      'transition-colors',
                      isActive
                        ? 'border-cyan-400/50 bg-cyan-500/10'
                        : supported
                          ? 'border-white/10 bg-slate-900/50 hover:border-white/25'
                          : 'cursor-not-allowed border-white/5 bg-slate-900/30 opacity-45'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('size-2 shrink-0 rounded-full', isActive ? 'bg-cyan-400' : 'bg-slate-600')}
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-100">{chain.label}</span>
                      <span className="block text-xs text-slate-500">
                        Chain ID {chain.chainId} · Native {chain.nativeSymbol}
                      </span>
                    </span>
                    {switchingChain === chain.value ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin text-cyan-300" />
                    ) : isActive ? (
                      <Check aria-hidden="true" className="size-4 text-cyan-300" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <GlassButton variant="danger" block onClick={disconnectWallet} data-testid="wallet-disconnect">
            Disconnect
          </GlassButton>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5" data-testid="wallet-provider-list">
          {WALLET_PROVIDERS.map((provider) => {
            const isPending = pendingProvider === provider.kind;
            return (
              <button
                key={provider.kind}
                type="button"
                onClick={() => handleConnect(provider.kind)}
                disabled={isBusy}
                data-testid="wallet-provider"
                data-provider={provider.kind}
                className={cn(
                  'flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4',
                  'text-left transition-colors hover:border-cyan-400/50 hover:bg-slate-900/80',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg">
                  {provider.kind === 'metamask' ? '🦊' : provider.kind === 'coinbase' ? '🔵' : provider.kind === 'phantom' ? '👻' : '🔒'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-100">{provider.name}</span>
                    {provider.recommended ? (
                      <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-300">
                        Recommended
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {provider.description}
                  </span>
                </span>
                {isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-cyan-300" />
                ) : (
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </GlassModal>
  );
}