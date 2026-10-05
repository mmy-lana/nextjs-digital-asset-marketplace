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
  ESTIMATED_GAS_PER_TX_ETH,
  FALLBACK_ETH_USD_RATE,
  MAX_CART_QUANTITY,
  PLATFORM_FEE_RATE,
  STORAGE_KEYS,
  getLicenseDescriptor,
} from '@/lib/constants';
import {
  arrayOfObjects,
  deserializeIdSet,
  getStorageItem,
  isStringArray,
  removeStorageItem,
  serializeIdSet,
  setStorageItem,
} from '@/lib/storage';
import type { CartItem, CartState, DigitalAsset, LicenseType } from '@/types/marketplace';

export interface CartTotals {
  subtotalCrypto: number;
  subtotalFiatUsd: number;
  platformFeeEth: number;
  estimatedGasFeeEth: number;
  totalCrypto: number;
  totalFiatUsd: number;
}

export interface CartContextValue {
  cart: CartState;
  /** Asset ids locked by an exclusive-NFT line item. */
  unavailableAssetIds: Set<string>;
  itemCount: number;
  addToCart: (asset: DigitalAsset, license?: LicenseType) => void;
  removeFromCart: (assetId: string) => void;
  updateQuantity: (assetId: string, quantity: number) => void;
  /** Swaps the license on a line and re-prices it via the license multiplier. */
  updateLicense: (assetId: string, license: LicenseType) => void;
  clearCart: () => void;
  isAssetInCart: (assetId: string) => boolean;
  /** False when the asset is locked by an exclusive line elsewhere in the cart. */
  isAssetAvailable: (assetId: string) => boolean;
}

const EMPTY_TOTALS = {
  subtotalCrypto: 0,
  subtotalFiatUsd: 0,
  platformFeeEth: 0,
  estimatedGasFeeEth: 0,
  totalCrypto: 0,
  totalFiatUsd: 0,
} as const;

/** Effective units billed for a line: exclusive NFTs are always single-unit. */
function billableQuantity(item: CartItem): number {
  return item.selectedLicense === 'exclusive_nft' ? 1 : Math.max(1, item.quantity);
}

/** Applies the license multiplier to the listing price. */
export function priceForLicense(asset: DigitalAsset, license: LicenseType): number {
  const multiplier = getLicenseDescriptor(license).multiplier;
  return Number((asset.priceCrypto * multiplier).toFixed(6));
}

export function fiatForLicense(asset: DigitalAsset, license: LicenseType): number {
  const multiplier = getLicenseDescriptor(license).multiplier;
  return Number((asset.priceFiatUsd * multiplier).toFixed(2));
}

/**
 * Fee engine. Platform fee scales with the crypto subtotal, gas is charged once
 * per non-empty cart, and the fiat total is derived from the blended rate
 * implied by the cart so mixed-currency carts stay internally consistent.
 */
export function calculateCartTotals(items: CartItem[]): CartTotals {
  const subtotalCrypto = items.reduce(
    (acc, item) => acc + item.priceCrypto * billableQuantity(item),
    0
  );

  const subtotalFiatUsd = items.reduce(
    (acc, item) => acc + item.priceFiatUsd * billableQuantity(item),
    0
  );

  const platformFeeEth = Number((subtotalCrypto * PLATFORM_FEE_RATE).toFixed(6));
  const estimatedGasFeeEth = items.length > 0 ? ESTIMATED_GAS_PER_TX_ETH : 0;
  const totalCrypto = Number((subtotalCrypto + platformFeeEth + estimatedGasFeeEth).toFixed(6));
  const conversionRate = subtotalCrypto > 0 ? subtotalFiatUsd / subtotalCrypto : FALLBACK_ETH_USD_RATE;
  const totalFiatUsd = Number((totalCrypto * conversionRate).toFixed(2));

  return {
    subtotalCrypto: Number(subtotalCrypto.toFixed(6)),
    subtotalFiatUsd: Number(subtotalFiatUsd.toFixed(2)),
    platformFeeEth,
    estimatedGasFeeEth,
    totalCrypto,
    totalFiatUsd,
  };
}

const INITIAL_CART: CartState = { items: [], ...EMPTY_TOTALS };

/**
 * SEC-03: a persisted cart line must carry at least the identity, pricing and
 * licence fields the UI dereferences unconditionally. Anything else is
 * discarded at the boundary rather than reaching a component that would throw.
 */
const isCartItemArray = arrayOfObjects<CartItem>([
  ['assetId', 'string'],
  ['selectedLicense', 'string'],
  ['quantity', 'number'],
  ['priceCrypto', 'number'],
  ['priceFiatUsd', 'number'],
]);

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [unavailableAssetIds, setUnavailableAssetIds] = useState<Set<string>>(new Set());
  const hydrated = useRef(false);

  /**
   * DATA-02: synchronous source of truth for cart lines.
   *
   * React state updaters are not guaranteed to run synchronously, so cart
   * mutations that must reason about the resulting items perform a synchronous
   * read-modify-write here and then mirror the result into React state.
   */
  const itemsRef = useRef<CartItem[]>([]);

  // Hydration — storage is only touched inside the effect.
  useEffect(() => {
    const storedItems = getStorageItem<CartItem[]>(STORAGE_KEYS.cart, [], 'local', isCartItemArray);
    if (storedItems.length > 0) {
      itemsRef.current = storedItems;
      setItems(storedItems);
    }
    // A Set collapses to `{}` under JSON.stringify, so it is stored as string[].
    setUnavailableAssetIds(
      deserializeIdSet(
        getStorageItem<unknown>(STORAGE_KEYS.unavailableAssets, [], 'local', isStringArray)
      )
    );
    hydrated.current = true;
  }, []);

  const persistItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
    if (hydrated.current) setStorageItem(STORAGE_KEYS.cart, next);
  }, []);

  const persistLocked = useCallback((next: Set<string>) => {
    setUnavailableAssetIds(next);
    if (hydrated.current) setStorageItem(STORAGE_KEYS.unavailableAssets, serializeIdSet(next));
  }, []);

  /**
   * DATA-02: derives the exclusive-asset lock set from a given cart.
   *
   * The lock set is always a pure function of the lines, which removes the
   * possibility of the inventory and the locks disagreeing after a licence swap.
   */
  const locksForItems = useCallback((lines: CartItem[]): Set<string> => {
    const locked = new Set<string>();
    for (const line of lines) {
      if (line.selectedLicense === 'exclusive_nft') locked.add(line.assetId);
    }
    return locked;
  }, []);

  /** Applies a synchronous read-modify-write to the cart lines. */
  const commitItems = useCallback(
    (resolve: (current: CartItem[]) => CartItem[]): CartItem[] => {
      const next = resolve(itemsRef.current);
      persistItems(next);
      return next;
    },
    [persistItems]
  );

  const addToCart = useCallback(
    (asset: DigitalAsset, license: LicenseType = asset.license) => {
      commitItems((current) => {
        const existing = current.find((item) => item.assetId === asset.id);

        if (existing) {
          // An exclusive line can never be duplicated or incremented.
          if (existing.selectedLicense === 'exclusive_nft') return current;
          const nextQuantity = Math.min(existing.quantity + 1, MAX_CART_QUANTITY);
          if (nextQuantity === existing.quantity) return current;
          return current.map((item) =>
            item.assetId === asset.id ? { ...item, quantity: nextQuantity } : item
          );
        }

        return [
          ...current,
          {
            assetId: asset.id,
            asset,
            selectedLicense: license,
            quantity: 1,
            priceCrypto: priceForLicense(asset, license),
            priceFiatUsd: fiatForLicense(asset, license),
            addedAt: Date.now(),
          },
        ];
      });

      // The lock set is re-derived from the committed lines so it stays correct
      // whether the new line is exclusive or not.
      persistLocked(locksForItems(itemsRef.current));
    },
    [commitItems, locksForItems, persistLocked]
  );

  const removeFromCart = useCallback(
    (assetId: string) => {
      const next = commitItems((current) => current.filter((item) => item.assetId !== assetId));
      persistLocked(locksForItems(next));
    },
    [commitItems, locksForItems, persistLocked]
  );

  const updateQuantity = useCallback(
    (assetId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(assetId);
        return;
      }
      commitItems((current) =>
        current.map((item) => {
          if (item.assetId !== assetId) return item;
          if (item.selectedLicense === 'exclusive_nft') return item;
          return { ...item, quantity: Math.min(quantity, MAX_CART_QUANTITY) };
        })
      );
    },
    [commitItems, removeFromCart]
  );

  /**
   * DATA-02: swaps a line's licence and re-prices it in a single transition.
   *
   * The new lines and the new lock set are both derived from the same committed
   * array, so the inventory and the exclusive locks can never disagree. The
   * previous implementation decided the lock from the *pre-update* lines, which
   * inverted the release/acquire behaviour on a licence swap.
   */
  const updateLicense = useCallback(
    (assetId: string, license: LicenseType) => {
      const next = commitItems((current) =>
        current.map((item) => {
          if (item.assetId !== assetId) return item;
          return {
            ...item,
            selectedLicense: license,
            priceCrypto: priceForLicense(item.asset, license),
            priceFiatUsd: fiatForLicense(item.asset, license),
          };
        })
      );
      persistLocked(locksForItems(next));
    },
    [commitItems, locksForItems, persistLocked]
  );

  const clearCart = useCallback(() => {
    commitItems(() => []);
    persistLocked(new Set());
    removeStorageItem(STORAGE_KEYS.unavailableAssets);
  }, [commitItems, persistLocked]);

  const isAssetInCart = useCallback(
    (assetId: string) => items.some((item) => item.assetId === assetId),
    [items]
  );

  const isAssetAvailable = useCallback(
    (assetId: string) => !unavailableAssetIds.has(assetId),
    [unavailableAssetIds]
  );

  const cart = useMemo<CartState>(
    () => ({ items, ...calculateCartTotals(items) }),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + billableQuantity(item), 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      unavailableAssetIds,
      itemCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateLicense,
      clearCart,
      isAssetInCart,
      isAssetAvailable,
    }),
    [
      cart,
      unavailableAssetIds,
      itemCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateLicense,
      clearCart,
      isAssetInCart,
      isAssetAvailable,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}