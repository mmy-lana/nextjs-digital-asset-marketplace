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
  WALLET_PROVIDERS,
  getWalletProvider,
} from '@/lib/constants';
import {
  ETH_USD_RATE,
  mockTransactions,
} from '@/lib/mock-data';
import {
  arrayOfObjects,
  getStorageItem,
  objectWithKeys,
  removeStorageItem,
  setStorageItem,
} from '@/lib/storage';
import type {
  ChainNetwork,
  TransactionRecord,
  WalletProviderKind,
  WalletState,
} from '@/types/marketplace';

/**
 * SEC-03: runtime validators applied at the storage boundary.
 *
 * Persisted payloads are untrusted. A hand-edited or schema-drifted entry is
 * rejected and discarded here rather than being allowed to crash a component
 * that assumes the full contract.
 */
const isWalletState = objectWithKeys<WalletState>([
  ['address', 'string'],
  ['chainId', 'number'],
  ['balanceEth', 'number'],
  ['balanceUsd', 'number'],
  ['isConnected', 'boolean'],
]);

const isTransactionRecordArray = arrayOfObjects<TransactionRecord>([
  ['id', 'string'],
  ['txHash', 'string'],
  ['assetId', 'string'],
  ['amountCrypto', 'number'],
  ['status', 'string'],
]);

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
  /**
   * DATA-01 / FIN-01: atomic batch settlement.
   *
   * Deducts the full order total (subtotal + platform fee + gas) in a single
   * functional state update, so concurrent settlements can never read a stale
   * balance and overwrite one another's deductions.
   *
   * Throws `InsufficientFundsError` without mutating any state when the
   * connected balance cannot cover the order.
   */
  recordOrderSettlement: (
    input: RecordOrderSettlementInput
  ) => Promise<RecordOrderSettlementResult>;
  resetHistory: () => void;
}

/** A single line inside a batched settlement. */
export interface SettlementLineInput {
  assetId: string;
  assetTitle: string;
  assetThumbnail: string;
  /** Line price in ETH before fees. */
  amountCrypto: number;
  /** Line price in fiat before fees. */
  amountFiatUsd: number;
  chain: ChainNetwork;
  currency: TransactionRecord['currency'];
  sellerAddress: string;
  gasUsedGwei?: number;
}

export interface RecordOrderSettlementInput {
  lines: SettlementLineInput[];
  /**
   * Exact charge in ETH: subtotal + platform fee + gas. This is the value that
   * is deducted, so the ledger and the wallet balance cannot disagree.
   */
  totalRequiredCrypto: number;
  /** Platform fee component of `totalRequiredCrypto`, recorded for audit. */
  platformFeeCrypto?: number;
  /** Gas component of `totalRequiredCrypto`, recorded for audit. */
  gasFeeCrypto?: number;
}

export interface RecordOrderSettlementResult {
  records: TransactionRecord[];
  balanceBeforeEth: number;
  balanceAfterEth: number;
  chargedCrypto: number;
}

/** Raised when the connected balance cannot cover an order. */
export class InsufficientFundsError extends Error {
  readonly required: number;
  readonly available: number;

  constructor(required: number, available: number) {
    super(
      `Insufficient funds: ${required.toFixed(6)} ETH required but only ${available.toFixed(
        6
      )} ETH available.`
    );
    this.name = 'InsufficientFundsError';
    this.required = required;
    this.available = available;
  }
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

/** Canonical zero address used when no buyer identity is bound to the order. */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Simulated block-inclusion delay applied before a batch settlement commits. */
const SETTLEMENT_BROADCAST_DELAY_MS = 260;

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

  /**
   * DATA-01: the single synchronous source of truth for wallet state.
   *
   * React state updaters are NOT guaranteed to execute synchronously, so they
   * cannot be used to drive control flow or read an authoritative balance.
   * Every mutation therefore goes through {@link commitWallet}, which performs a
   * synchronous read-modify-write against this ref and then mirrors the result
   * into React state. Because there is no `await` between the read and the
   * write, concurrent settlements cannot interleave.
   */
  const walletRef = useRef<WalletState>(INITIAL_WALLET);

  /**
   * Applies a synchronous read-modify-write to the authoritative wallet and
   * returns the committed state. Purely synchronous by construction.
   */
  const commitWallet = useCallback((resolve: (current: WalletState) => WalletState): WalletState => {
    const current = walletRef.current;
    const next = resolve(current);
    walletRef.current = next;
    if (hydrated.current) setStorageItem(STORAGE_KEYS.wallet, next);
    setWallet(next);
    return next;
  }, []);

  // Hydration: every storage read happens inside an effect so the server render
  // never touches browser APIs.
  useEffect(() => {
    const storedWallet = getStorageItem<WalletState | null>(
      STORAGE_KEYS.wallet,
      null,
      'local',
      (value): value is WalletState | null => value === null || isWalletState(value)
    );
    if (storedWallet && typeof storedWallet.address === 'string') {
      const restored: WalletState = { ...INITIAL_WALLET, ...storedWallet };
      walletRef.current = restored;
      setWallet(restored);
      setActiveProvider(
        getStorageItem<WalletProviderKind | null>(
          STORAGE_KEYS.walletProviderKind,
          null,
          'local',
          (value): value is WalletProviderKind | null =>
            value === null ||
            (typeof value === 'string' && (WALLET_PROVIDERS as { kind: string }[]).some((p) => p.kind === value))
        )
      );
      setStatus(storedWallet.isConnected ? 'CONNECTED' : 'DISCONNECTED');
    }

    const storedTransactions = getStorageItem<TransactionRecord[]>(
      STORAGE_KEYS.transactions,
      [],
      'local',
      isTransactionRecordArray
    );
    if (storedTransactions.length > 0) {
      setTransactions(storedTransactions);
    }

    hydrated.current = true;
  }, []);

  const connectWallet = useCallback(
    async (provider: WalletProviderKind = 'metamask'): Promise<boolean> => {
      const descriptor = getWalletProvider(provider);
      setError(null);
      setActiveProvider(provider);
      setStatus('CONNECTING');
      commitWallet((current) => ({ ...current, isConnecting: true }));

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
        commitWallet((current) => ({
          ...current,
          isConnecting: false,
          isConnected: false,
        }));
        return false;
      }

      commitWallet((current) => ({
        ...current,
        address: profile.address,
        ensName: profile.ensName,
        chainId: CHAIN_ID_MAP[descriptor.supportedChains[0]],
        balanceEth: profile.balanceEth,
        balanceUsd: Number((profile.balanceEth * ETH_USD_RATE).toFixed(2)),
        chain: descriptor.supportedChains[0],
        isConnected: true,
        isConnecting: false,
      }));
      setStorageItem(STORAGE_KEYS.walletProviderKind, provider);
      setStatus('CONNECTED');
      return true;
    },
    [commitWallet]
  );

  const disconnectWallet = useCallback(() => {
    commitWallet(() => INITIAL_WALLET);
    setActiveProvider(null);
    setStatus('DISCONNECTED');
    setError(null);
    removeStorageItem(STORAGE_KEYS.wallet);
    removeStorageItem(STORAGE_KEYS.walletProviderKind);
  }, [commitWallet]);

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

      commitWallet((current) => ({ ...current, chain, chainId: CHAIN_ID_MAP[chain] }));
      setStatus('CONNECTED');
      return true;
    },
    [activeProvider, commitWallet, wallet.isConnected]
  );

  /**
   * DATA-01 / FIN-01: settles an entire order as one atomic operation.
   *
   * Every balance read happens inside the functional updater, so the deduction
   * is computed from the latest committed state rather than a render-time
   * snapshot. The full `totalRequiredCrypto` (subtotal + platform fee + gas) is
   * deducted in a single write, eliminating the previous behaviour where each
   * line re-read a stale `wallet` and the final write clobbered earlier ones.
   */
  const recordOrderSettlement = useCallback(
    async (input: RecordOrderSettlementInput): Promise<RecordOrderSettlementResult> => {
      if (input.lines.length === 0) {
        throw new Error('Cannot settle an order with no line items.');
      }

      const chargedCrypto = Number(
        (Number.isFinite(input.totalRequiredCrypto) ? input.totalRequiredCrypto : 0).toFixed(6)
      );

      setStatus('TRANSACTING');
      await delay(SETTLEMENT_BROADCAST_DELAY_MS);

      const settlementId = `settlement-${Date.now()}`;
      const records: TransactionRecord[] = input.lines.map((line, index) => {
        const id = `${settlementId}-${index}-${line.assetId}`;
        return {
          id,
          txHash: makeTxHash(id),
          assetId: line.assetId,
          assetTitle: line.assetTitle,
          assetThumbnail: line.assetThumbnail,
          buyerAddress: ZERO_ADDRESS,
          sellerAddress: line.sellerAddress,
          amountCrypto: line.amountCrypto,
          amountFiatUsd: line.amountFiatUsd,
          currency: line.currency,
          chain: line.chain,
          status: 'confirmed' as const,
          timestamp: new Date().toISOString(),
          gasUsedGwei: line.gasUsedGwei ?? 0,
        };
      });

      // FIN-01: atomic batch settlement.
      //
      // `commitWallet` performs a synchronous read-modify-write, so the solvency
      // check and the deduction cannot be separated by another settlement. The
      // full `chargedCrypto` (subtotal + platform fee + gas) is debited in this
      // one write, and nothing is committed when the balance is short.
      let balanceBeforeEth = 0;
      let balanceAfterEth = 0;
      let settled = false;

      commitWallet((current) => {
        balanceBeforeEth = current.balanceEth;

        if (current.balanceEth < chargedCrypto) {
          // Short balance: return the state unchanged so nothing is persisted.
          return current;
        }

        const nextBalance = Number((current.balanceEth - chargedCrypto).toFixed(6));
        balanceAfterEth = nextBalance;
        settled = true;

        return {
          ...current,
          balanceEth: nextBalance,
          balanceUsd: Number((nextBalance * ETH_USD_RATE).toFixed(2)),
        };
      });

      if (!settled) {
        setStatus('ERROR');
        setError(
          `Settlement rejected: ${chargedCrypto.toFixed(6)} ETH required but ${balanceBeforeEth.toFixed(
            6
          )} ETH available.`
        );
        throw new InsufficientFundsError(chargedCrypto, balanceBeforeEth);
      }

      // Buyer address is stamped from the authoritative wallet identity.
      setTransactions((current) => {
        const next = [
          ...records.map((record) => ({
            ...record,
            buyerAddress: walletRef.current.address ?? ZERO_ADDRESS,
          })),
          ...current,
        ];
        if (hydrated.current) setStorageItem(STORAGE_KEYS.transactions, next);
        return next;
      });

      setStatus('CONNECTED');
      return { records, balanceBeforeEth, balanceAfterEth, chargedCrypto };
    },
    [commitWallet]
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
      recordOrderSettlement,
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
      recordOrderSettlement,
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