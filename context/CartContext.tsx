"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartState, DigitalAsset, LicenseType } from '@/types/marketplace';
import { PLATFORM_FEE_RATE, ESTIMATED_GAS_PER_TX_ETH } from '@/lib/constants';

interface CartContextType {
  cart: CartState;
  unavailableAssetIds: Set<string>;
  addToCart: (asset: DigitalAsset, license?: LicenseType) => void;
  removeFromCart: (assetId: string) => void;
  updateQuantity: (assetId: string, quantity: number) => void;
  clearCart: () => void;
  isAssetAvailable: (assetId: string) => boolean;
}

const initialCartState: CartState = {
  items: [],
  subtotalCrypto: 0,
  subtotalFiatUsd: 0,
  estimatedGasFeeEth: 0,
  platformFeeEth: 0,
  totalCrypto: 0,
  totalFiatUsd: 0,
};

function computeTotals(items: CartItem[]): CartState {
  const subtotalCrypto = items.reduce((acc, curr) => {
    const qty = curr.selectedLicense === 'exclusive_nft' ? 1 : Math.max(1, curr.quantity);
    return acc + curr.priceCrypto * qty;
  }, 0);

  const subtotalFiatUsd = items.reduce((acc, curr) => {
    const qty = curr.selectedLicense === 'exclusive_nft' ? 1 : Math.max(1, curr.quantity);
    return acc + curr.priceFiatUsd * qty;
  }, 0);

  const platformFeeEth = Number((subtotalCrypto * PLATFORM_FEE_RATE).toFixed(6));
  const estimatedGasFeeEth = items.length > 0 ? ESTIMATED_GAS_PER_TX_ETH : 0;
  const totalCrypto = Number((subtotalCrypto + platformFeeEth + estimatedGasFeeEth).toFixed(6));
  const conversionRate = subtotalCrypto > 0 ? subtotalFiatUsd / subtotalCrypto : 3200;
  const totalFiatUsd = Number((totalCrypto * conversionRate).toFixed(2));

  return {
    items,
    subtotalCrypto: Number(subtotalCrypto.toFixed(6)),
    subtotalFiatUsd: Number(subtotalFiatUsd.toFixed(2)),
    platformFeeEth,
    estimatedGasFeeEth,
    totalCrypto,
    totalFiatUsd,
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(initialCartState);
  const [unavailableAssetIds, setUnavailableAssetIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedCart = window.localStorage.getItem('ns_asset_market_cart_v1');
      if (savedCart) {
        const parsedItems: CartItem[] = JSON.parse(savedCart);
        setCart(computeTotals(parsedItems));
      }
      const savedUnavailable = window.localStorage.getItem('ns_asset_market_unavailable_v1');
      if (savedUnavailable) {
        const parsedArray: string[] = JSON.parse(savedUnavailable);
        setUnavailableAssetIds(new Set(parsedArray));
      }
    } catch {
      // Storage access disabled or corrupt payload
    }
  }, []);

  const persistCart = (newItems: CartItem[]) => {
    const nextCart = computeTotals(newItems);
    setCart(nextCart);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ns_asset_market_cart_v1', JSON.stringify(newItems));
    }
  };

  const persistUnavailable = (nextSet: Set<string>) => {
    setUnavailableAssetIds(nextSet);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'ns_asset_market_unavailable_v1',
        JSON.stringify(Array.from(nextSet))
      );
    }
  };

  const addToCart = (asset: DigitalAsset, license: LicenseType = asset.license) => {
    const exists = cart.items.find((item) => item.assetId === asset.id);
    let nextItems: CartItem[];

    if (exists) {
      if (license === 'exclusive_nft') return;
      nextItems = cart.items.map((item) =>
        item.assetId === asset.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      nextItems = [
        ...cart.items,
        {
          assetId: asset.id,
          asset,
          selectedLicense: license,
          quantity: 1,
          priceCrypto: asset.priceCrypto,
          priceFiatUsd: asset.priceFiatUsd,
          addedAt: Date.now(),
        },
      ];
    }

    if (license === 'exclusive_nft') {
      const nextUnavailable = new Set(unavailableAssetIds);
      nextUnavailable.add(asset.id);
      persistUnavailable(nextUnavailable);
    }

    persistCart(nextItems);
  };

  const removeFromCart = (assetId: string) => {
    const nextItems = cart.items.filter((item) => item.assetId !== assetId);
    persistCart(nextItems);

    if (unavailableAssetIds.has(assetId)) {
      const nextUnavailable = new Set(unavailableAssetIds);
      nextUnavailable.delete(assetId);
      persistUnavailable(nextUnavailable);
    }
  };

  const updateQuantity = (assetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(assetId);
      return;
    }
    const nextItems = cart.items.map((item) => {
      if (item.assetId === assetId) {
        if (item.selectedLicense === 'exclusive_nft') return item;
        return { ...item, quantity };
      }
      return item;
    });
    persistCart(nextItems);
  };

  const clearCart = () => {
    persistCart([]);
    persistUnavailable(new Set());
  };

  const isAssetAvailable = (assetId: string) => !unavailableAssetIds.has(assetId);

  return (
    <CartContext.Provider
      value={{
        cart,
        unavailableAssetIds,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isAssetAvailable,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
