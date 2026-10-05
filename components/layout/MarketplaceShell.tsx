'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { CategorySubNav } from '@/components/layout/CategorySubNav';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { AssetExplorer } from '@/components/features/AssetExplorer';
import { CartSlideOver } from '@/components/molecules/CartSlideOver';
import { CheckoutProcessor } from '@/components/features/CheckoutProcessor';
import { GlassModal } from '@/components/ui/GlassModal';
import { useAssetFilter } from '@/hooks/useAssetFilter';
import type { CheckoutStage } from '@/components/features/CheckoutProcessor';
import type { CollectionSummary, DigitalAsset } from '@/types/marketplace';

export interface MarketplaceShellProps {
  assets: DigitalAsset[];
  collections?: CollectionSummary[];
  /**
   * Server-rendered content injected between the category ribbon and the
   * explore grid — typically the hero band. Passing it as `children` keeps the
   * markup server-rendered while the surrounding chrome stays interactive.
   */
  children?: ReactNode;
  className?: string;
}

/**
 * Client shell that binds the global chrome to the explore surface.
 *
 * Owning the `useAssetFilter` instance here is what keeps the category ribbon,
 * the filter sidebar, the mobile sheet and the grid rendering from one shared
 * state object.
 */
export function MarketplaceShell({
  assets,
  collections,
  children,
  className,
}: MarketplaceShellProps) {
  const filterApi = useAssetFilter(assets);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState<CheckoutStage>('idle');

  const handleCheckout = () => {
    setCheckoutStage('processing');
    setIsCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
    setCheckoutStage('idle');
  };

  return (
    <div className={className}>
      <NavigationHeader assets={assets} onCartOpen={() => setIsCartOpen(true)} />
      <CategorySubNav assets={assets} filterApi={filterApi} />

      {children ? <div id="main-content">{children}</div> : null}

      <main className="mx-auto max-w-[1600px] px-3 py-6 sm:px-6 sm:py-8">
        <AssetExplorer
          assets={assets}
          collections={collections}
          filterApi={filterApi}
        />
      </main>

      <CartSlideOver
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
        checkoutStage={checkoutStage}
        isCheckingOut={checkoutStage === 'processing'}
      />

      <GlassModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        title="Checkout"
        description="Authorisation, gas estimation and settlement"
        size="lg"
        data-testid="checkout-modal"
      >
        <CheckoutProcessor
          isActive={isCheckoutOpen}
          onClose={handleCheckoutClose}
          onSettled={() => setCheckoutStage('confirmed')}
        />
      </GlassModal>
    </div>
  );
}