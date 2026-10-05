'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { WalletConnectDialog } from '@/components/molecules/WalletConnectDialog';
import { SearchAutocomplete } from '@/components/molecules/SearchAutocomplete';
import { GlassButton } from '@/components/ui/GlassButton';
import { DEFAULT_CHAIN, getChainDescriptor } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import { useWallet } from '@/context/WalletContext';
import { cn, formatAddress, formatCryptoNumber } from '@/lib/utils';
import type { DigitalAsset } from '@/types/marketplace';

export interface NavigationHeaderProps {
  assets: DigitalAsset[];
  /** Opens the cart slide-over. When omitted the cart button links to /orders. */
  onCartOpen?: () => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Sticky glass header.
 *
 * Below `sm` the search collapses behind an `isSearchOpen` toggle that expands
 * to full width, the wallet chip drops to an avatar plus network pip, and the
 * cart keeps an icon-only counter badge.
 */
export function NavigationHeader({ assets, onCartOpen, className, ...rest }: NavigationHeaderProps) {
  const pathname = usePathname();
  const { wallet } = useWallet();
  const { itemCount } = useCart();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Collapse the mobile search overlay on navigation.
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const chain = getChainDescriptor(wallet.chain);
  const navLinks = [
    { href: '/', label: 'Explore' },
    { href: '/orders', label: 'Orders' },
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 h-[var(--header-height)] w-full gpu-layer',
          'border-b bg-slate-950/80 backdrop-blur-xl transition-shadow',
          isScrolled ? 'border-white/10 shadow-[0_4px_24px_0_rgba(0,0,0,0.45)]' : 'border-transparent',
          className
        )}
        data-testid="navigation-header"
        {...rest}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-2 px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            aria-label="Digital Asset Marketplace home"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-cyan-200 ring-1 ring-cyan-400/30">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 19 12 5l7 14-7-4-7 4Z" />
              </svg>
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-slate-100 min-[420px]:inline">
              Asset<span className="text-cyan-400">Market</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-2 hidden items-center gap-1 sm:flex" aria-label="Primary">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop search */}
          <div className="ml-auto hidden min-w-0 max-w-sm flex-1 md:block">
            <SearchAutocomplete assets={assets} value={query} onChange={setQuery} />
          </div>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setIsSearchOpen((value) => !value)}
              aria-expanded={isSearchOpen}
              aria-label="Toggle search"
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-xl text-slate-300 md:hidden',
                'transition-colors hover:bg-white/10 hover:text-slate-100',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
              )}
              data-testid="mobile-search-toggle"
            >
              {isSearchOpen ? <X aria-hidden="true" className="size-5" /> : <Search aria-hidden="true" className="size-5" />}
            </button>

            {/* Cart */}
            {onCartOpen ? (
              <button
                type="button"
                onClick={onCartOpen}
                aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
                className={cn(
                  'relative inline-flex size-11 items-center justify-center rounded-xl text-slate-300',
                  'transition-colors hover:bg-white/10 hover:text-slate-100',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                )}
                data-testid="cart-toggle"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 7h12l-1 12H7L6 7Z" />
                  <path d="M9 7a3 3 0 0 1 6 0" />
                </svg>
                {itemCount > 0 ? (
                  <span
                    data-testid="cart-count-badge"
                    className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-[18px] text-slate-950"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                ) : null}
              </button>
            ) : (
              <Link
                href="/orders"
                aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
                className={cn(
                  'relative inline-flex size-11 items-center justify-center rounded-xl text-slate-300',
                  'transition-colors hover:bg-white/10 hover:text-slate-100',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                )}
                data-testid="cart-toggle"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 7h12l-1 12H7L6 7Z" />
                  <path d="M9 7a3 3 0 0 1 6 0" />
                </svg>
                {itemCount > 0 ? (
                  <span
                    data-testid="cart-count-badge"
                    className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-[18px] text-slate-950"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                ) : null}
              </Link>
            )}

            {/* Wallet chip */}
            <button
              type="button"
              onClick={() => setIsWalletOpen(true)}
              aria-label={wallet.isConnected ? `Wallet ${formatAddress(wallet.address)}` : 'Connect wallet'}
              data-testid="wallet-toggle"
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border transition-colors',
                wallet.isConnected
                  ? 'border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20'
                  : 'border-white/10 bg-slate-900/60 hover:border-cyan-400/50',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-11 items-center justify-center rounded-xl',
                  wallet.isConnected
                    ? 'bg-gradient-to-br from-cyan-500/40 to-violet-500/40 text-cyan-100'
                    : 'text-slate-300'
                )}
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
                  <path d="M16 12h3" />
                </svg>
              </span>
              {/* Text only from sm up; collapses to avatar + pip below. */}
              <span className="hidden min-w-0 pr-3 text-left sm:block">
                <span className="block text-xs font-medium leading-tight text-slate-100">
                  {wallet.isConnected ? formatAddress(wallet.address) : 'Connect'}
                </span>
                <span className="flex items-center gap-1 text-[10px] leading-tight text-slate-400">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: chain.accentClass.includes('violet') ? '#e879f9' : chain.accentClass.includes('emerald') ? '#34d399' : chain.accentClass.includes('sky') ? '#38bdf8' : '#a78bfa' }}
                  />
                  <span data-testid="wallet-balance">
                    {wallet.isConnected ? formatCryptoNumber(wallet.balanceEth) : chain.label}
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile full-width search overlay */}
        {isSearchOpen ? (
          <div className="absolute inset-x-0 top-[var(--header-height)] border-b border-white/10 bg-slate-950/95 p-3 backdrop-blur-xl md:hidden" data-testid="mobile-search-overlay">
            <SearchAutocomplete assets={assets} value={query} onChange={setQuery} />
          </div>
        ) : null}
      </header>

      <WalletConnectDialog isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </>
  );
}