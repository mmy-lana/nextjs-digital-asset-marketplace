import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { CartProvider } from '@/context/CartContext';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: 'Digital Asset Marketplace | Next-Gen NFTs & 3D Assets',
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Curated high-dimensional digital assets, interface systems, generative editions and cleared audio — every listing anchored to verifiable on-chain provenance.',
  applicationName: SITE_NAME,
  keywords: [
    'digital assets',
    '3D models',
    'UI templates',
    'generative NFT',
    'audio tracks',
    'motion graphics',
  ],
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-slate-950"
        >
          Skip to main content
        </a>
        <WalletProvider>
          <CartProvider>{children}</CartProvider>
        </WalletProvider>
      </body>
    </html>
  );
}