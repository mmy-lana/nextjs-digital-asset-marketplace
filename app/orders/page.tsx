import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { OrdersLedger } from '@/components/features/OrdersLedger';
import { mockAssets } from '@/lib/mock-data';

export const metadata: Metadata = {
  title: 'Order history',
  description:
    'Review every purchase settled on the marketplace: on-chain receipts, counterparties and status.',
};

/**
 * Order ledger route. The page shell stays a Server Component; only the
 * interactive ledger body is a client component.
 */
export default function OrdersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationHeader assets={mockAssets} />

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-6 sm:py-8"
      >
        <OrdersLedger />
      </main>

      <Footer />
    </div>
  );
}