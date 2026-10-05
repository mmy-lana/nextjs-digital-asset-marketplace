import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'Digital Asset Marketplace | Next-Gen NFTs & 3D Assets',
  description: 'Curated high-dimensional digital assets, UI kits, and procedural NFTs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <WalletProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
