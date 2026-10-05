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
  deserializeIdSet,
  getStorageItem,
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

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [unavailableAssetIds, setUnavailableAssetIds] = useState<Set<string>>(new Set());
  const hydrated = useRef(false);

  // Hydration — storage is only touched inside the effect.
  useEffect(() => {
    const storedItems = getStorageItem<CartItem[] | null>(STORAGE_KEYS.cart, null);
    if (Array.isArray(storedItems)) {
      setItems(storedItems);
    }
    // A Set collapses to `{}` under JSON.stringify, so it is stored as string[].
    setUnavailableAssetIds(
      deserializeIdSet(getStorageItem<unknown>(STORAGE_KEYS.unavailableAssets, []))
    );
    hydrated.current = true;
  }, []);

  const persistItems = useCallback((next: CartItem[]) => {
    setItems(next);
    if (hydrated.current) setStorageItem(STORAGE_KEYS.cart, next);
  }, []);

  const persistLocked = useCallback((next: Set<string>) => {
    setUnavailableAssetIds(next);
    if (hydrated.current) setStorageItem(STORAGE_KEYS.unavailableAssets, serializeIdSet(next));
  }, []);

  const addToCart = useCallback(
    (asset: DigitalAsset, license: LicenseType = asset.license) => {
      // An exclusive line already in the cart means the asset is spoken for.
      setItems((current) => {
        const existing = current.find((item) => item.assetId === asset.id);

        if (existing) {
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

      if (license === 'exclusive_nft') {
        setUnavailableAssetIds((current) => {
          const next = new Set(current);
          next.add(asset.id);
          if (hydrated.current) setStorageItem(STORAGE_KEYS.unavailableAssets, serializeIdSet(next));
          return next;
        });
      }
    },
    []
  );

  const removeFromCart = useCallback(
    (assetId: string) => {
      persistItems(items.filter((item) => item.assetId !== assetId));
      if (unavailableAssetIds.has(assetId)) {
        const next = new Set(unavailableAssetIds);
        next.delete(assetId);
        persistLocked(next);
      }
    },
    [items, unavailableAssetIds, persistItems, persistLocked]
  );

  const updateQuantity = useCallback(
    (assetId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(assetId);
        return;
      }
      persistItems(
        items.map((item) => {
          if (item.assetId !== assetId) return item;
          if (item.selectedLicense === 'exclusive_nft') return item;
          return { ...item, quantity: Math.min(quantity, MAX_CART_QUANTITY) };
        })
      );
    },
    [items, persistItems, removeFromCart]
  );

  const updateLicense = useCallback(
    (assetId: string, license: LicenseType) => {
      persistItems(
        items.map((item) => {
          if (item.assetId !== assetId) return item;
          return {
            ...item,
            selectedLicense: license,
            priceCrypto: priceForLicense(item.asset, license),
            priceFiatUsd: fiatForLicense(item.asset, license),
          };
        })
      );

      // Swapping the last exclusive line releases the asset lock.
      setUnavailableAssetIds((current) => {
        const stillExclusive = items.some(
          (item) => item.assetId === assetId && item.selectedLicense === 'exclusive_nft'
        );
        if (stillExclusive || license === 'exclusive_nft') return current;
        const next = new Set(current);
        next.delete(assetId);
        if (hydrated.current) setStorageItem(STORAGE_KEYS.unavailableAssets, serializeIdSet(next));
        return next;
      });
    },
    [items, persistItems]
  );

  const clearCart = useCallback(() => {
    persistItems([]);
    persistLocked(new Set());
    removeStorageItem(STORAGE_KEYS.unavailableAssets);
  }, [persistItems, persistLocked]);

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