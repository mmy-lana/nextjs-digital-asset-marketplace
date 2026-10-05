"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletState, ChainNetwork } from '@/types/marketplace';
import { CHAIN_ID_MAP } from '@/lib/constants';

interface WalletContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chain: ChainNetwork) => void;
}

const initialWalletState: WalletState = {
  address: null,
  ensName: null,
  chainId: CHAIN_ID_MAP.ethereum,
  balanceEth: 0,
  balanceUsd: 0,
  chain: 'ethereum',
  isConnected: false,
  isConnecting: false,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem('ns_asset_market_wallet_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        setWallet(parsed);
      }
    } catch {
      // Discard invalid state
    }
  }, []);

  const connectWallet = async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true }));
    // Simulate web3 handshake delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    const connectedState: WalletState = {
      address: '0x38F24C...4a92',
      ensName: 'collector.eth',
      chainId: CHAIN_ID_MAP.ethereum,
      balanceEth: 4.85,
      balanceUsd: 15520.00,
      chain: 'ethereum',
      isConnected: true,
      isConnecting: false,
    };
    setWallet(connectedState);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ns_asset_market_wallet_v1', JSON.stringify(connectedState));
    }
  };

  const disconnectWallet = () => {
    setWallet(initialWalletState);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ns_asset_market_wallet_v1');
    }
  };

  const switchChain = (chain: ChainNetwork) => {
    setWallet((prev) => {
      const updated: WalletState = {
        ...prev,
        chain,
        chainId: CHAIN_ID_MAP[chain],
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ns_asset_market_wallet_v1', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <WalletContext.Provider value={{ wallet, connectWallet, disconnectWallet, switchChain }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
