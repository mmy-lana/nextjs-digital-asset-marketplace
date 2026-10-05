'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CHAIN_ID_MAP,
  CHAIN_SWITCH_DELAY_MS,
  CONNECT_HANDSHAKE_DELAY_MS,
  STORAGE_KEYS,
  WALLET_PROFILES,
  getWalletProvider,
} from '@/lib/constants';
import {
  ETH_USD_RATE,
  mockTransactions,
} from '@/lib/mock-data';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/lib/storage';
import type {
  ChainNetwork,
  TransactionRecord,
  WalletProviderKind,
  WalletState,
} from '@/types/marketplace';

/** Lifecycle of the simulated connector, mirroring a real injected provider. */
export type WalletConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'SWITCHING_NETWORK'
  | 'TRANSACTING'
  | 'ERROR';

export interface WalletContextValue {
  wallet: WalletState;
  status: WalletConnectionStatus;
  error: string | null;
  activeProvider: WalletProviderKind | null;
  transactions: TransactionRecord[];
  /** Handshake to the provider; resolves false when the simulation rejects. */
  connectWallet: (provider?: WalletProviderKind) => Promise<boolean>;
  disconnectWallet: () => void;
  switchChain: (chain: ChainNetwork) => Promise<boolean>;
  clearError: () => void;
  /** Settles a purchase: deducts the balance and appends a transaction record. */
  recordPurchase: (input: RecordPurchaseInput) => Promise<TransactionRecord>;
  resetHistory: () => void;
}

export interface RecordPurchaseInput {
  assetId: string;
  assetTitle: string;
  assetThumbnail: string;
  amountCrypto: number;
  amountFiatUsd: number;
  chain: ChainNetwork;
  currency: TransactionRecord['currency'];
  sellerAddress: string;
  gasUsedGwei?: number;
}

const INITIAL_WALLET: WalletState = {
  address: null,
  ensName: null,
  chainId: CHAIN_ID_MAP.ethereum,
  balanceEth: 0,
  balanceUsd: 0,
  chain: 'ethereum',
  isConnected: false,
  isConnecting: false,
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/** Deterministic pseudo-hex for simulated transaction hashes. */
function makeTxHash(seed: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const tail = hash.toString(16).padStart(8, '0');
  return `0x${tail}${hash.toString(16).padStart(8, '0')}c0ffee`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [status, setStatus] = useState<WalletConnectionStatus>('DISCONNECTED');
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<WalletProviderKind | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(mockTransactions);

  /** Guards against writes racing the hydration effect. */
  const hydrated = useRef(false);
  /** Counts connection handshakes so failure seeding stays deterministic. */
  const attemptsRef = useRef(0);

  // Hydration: every storage read happens inside an effect so the server render
  // never touches browser APIs.
  useEffect(() => {
    const storedWallet = getStorageItem<WalletState | null>(STORAGE_KEYS.wallet, null);
    if (storedWallet && typeof storedWallet.address === 'string') {
      setWallet({ ...INITIAL_WALLET, ...storedWallet });
      setActiveProvider(
        getStorageItem<WalletProviderKind | null>(STORAGE_KEYS.walletProviderKind, null)
      );
      setStatus(storedWallet.isConnected ? 'CONNECTED' : 'DISCONNECTED');
    }

    const storedTransactions = getStorageItem<TransactionRecord[] | null>(
      STORAGE_KEYS.transactions,
      null
    );
    if (Array.isArray(storedTransactions) && storedTransactions.length > 0) {
      setTransactions(storedTransactions);
    }

    hydrated.current = true;
  }, []);

  const persistWallet = useCallback(
    (next: WalletState | ((current: WalletState) => WalletState)) => {
      setWallet((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        if (hydrated.current) setStorageItem(STORAGE_KEYS.wallet, resolved);
        return resolved;
      });
    },
    []
  );

  const connectWallet = useCallback(
    async (provider: WalletProviderKind = 'metamask'): Promise<boolean> => {
      const descriptor = getWalletProvider(provider);
      setError(null);
      setActiveProvider(provider);
      setStatus('CONNECTING');
      persistWallet((current) => ({ ...current, isConnecting: true }));

      await delay(CONNECT_HANDSHAKE_DELAY_MS);

      // Deterministic failure injection keeps the error state reproducible.
      const profile = WALLET_PROFILES[provider];
      const shouldFail = seededFailure(provider, attemptsRef.current);
      attemptsRef.current += 1;

      if (shouldFail) {
        setStatus('ERROR');
        setError(
          `${descriptor.name} rejected the connection request. Check the extension and try again.`
        );
        persistWallet((current) => ({
          ...current,
          isConnecting: false,
          isConnected: false,
        }));
        return false;
      }

      const next: WalletState = {
        address: profile.address,
        ensName: profile.ensName,
        chainId: CHAIN_ID_MAP[descriptor.supportedChains[0]],
        balanceEth: profile.balanceEth,
        balanceUsd: Number((profile.balanceEth * ETH_USD_RATE).toFixed(2)),
        chain: descriptor.supportedChains[0],
        isConnected: true,
        isConnecting: false,
      };

      persistWallet(next);
      setStorageItem(STORAGE_KEYS.walletProviderKind, provider);
      setStatus('CONNECTED');
      return true;
    },
    [persistWallet]
  );

  const disconnectWallet = useCallback(() => {
    persistWallet(INITIAL_WALLET);
    setActiveProvider(null);
    setStatus('DISCONNECTED');
    setError(null);
    removeStorageItem(STORAGE_KEYS.wallet);
    removeStorageItem(STORAGE_KEYS.walletProviderKind);
  }, [persistWallet]);

  const switchChain = useCallback(
    async (chain: ChainNetwork): Promise<boolean> => {
      if (!wallet.isConnected) {
        setError('Connect a wallet before switching networks.');
        setStatus('ERROR');
        return false;
      }

      const descriptor = getWalletProvider(activeProvider ?? 'metamask');
      if (!descriptor.supportedChains.includes(chain)) {
        setError(`${descriptor.name} cannot route to this network.`);
        setStatus('ERROR');
        return false;
      }

      setStatus('SWITCHING_NETWORK');
      setError(null);
      await delay(CHAIN_SWITCH_DELAY_MS);

      persistWallet((current) => ({ ...current, chain, chainId: CHAIN_ID_MAP[chain] }));
      setStatus('CONNECTED');
      return true;
    },
    [activeProvider, persistWallet, wallet.isConnected]
  );

  const recordPurchase = useCallback(
    async (input: RecordPurchaseInput): Promise<TransactionRecord> => {
      setStatus('TRANSACTING');
      await delay(200);

      const id = `tx-${input.assetId}-${Date.now()}`;
      const record: TransactionRecord = {
        id,
        txHash: makeTxHash(id),
        assetId: input.assetId,
        assetTitle: input.assetTitle,
        assetThumbnail: input.assetThumbnail,
        buyerAddress: wallet.address ?? '0x0000000000000000000000000000000000000000',
        sellerAddress: input.sellerAddress,
        amountCrypto: input.amountCrypto,
        amountFiatUsd: input.amountFiatUsd,
        currency: input.currency,
        chain: input.chain,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        gasUsedGwei: input.gasUsedGwei ?? 184200,
      };

      setTransactions((current) => {
        const next = [record, ...current];
        if (hydrated.current) setStorageItem(STORAGE_KEYS.transactions, next);
        return next;
      });

      if (wallet.isConnected) {
        const remainingEth = Number(
          Math.max(wallet.balanceEth - input.amountCrypto, 0).toFixed(6)
        );
        persistWallet({
          ...wallet,
          balanceEth: remainingEth,
          balanceUsd: Number((remainingEth * ETH_USD_RATE).toFixed(2)),
        });
      }

      setStatus('CONNECTED');
      return record;
    },
    [persistWallet, wallet]
  );

  const resetHistory = useCallback(() => {
    setTransactions(mockTransactions);
    if (hydrated.current) setStorageItem(STORAGE_KEYS.transactions, mockTransactions);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      status,
      error,
      activeProvider,
      transactions,
      connectWallet,
      disconnectWallet,
      switchChain,
      clearError,
      recordPurchase,
      resetHistory,
    }),
    [
      wallet,
      status,
      error,
      activeProvider,
      transactions,
      connectWallet,
      disconnectWallet,
      switchChain,
      clearError,
      recordPurchase,
      resetHistory,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Deterministic failure injection so the error path is reachable in a demo
 * without flaking automated runs.
 *
 * The first `attemptIndex` attempts per provider succeed; after that, failures
 * are seeded from the attempt counter rather than wall-clock time, so the same
 * interaction sequence always produces the same outcome.
 */
function seededFailure(provider: WalletProviderKind, attemptIndex: number): boolean {
  const profile = WALLET_PROFILES[provider];
  if (attemptIndex <= 2) return false;
  const bucket = attemptIndex * 37 + provider.length * 11;
  return (bucket % 100) < profile.failRate;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}