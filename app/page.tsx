import { MarketplaceShell } from '@/components/layout/MarketplaceShell';
import { Footer } from '@/components/layout/Footer';
import { catalogStats, mockAssets, mockCollections } from '@/lib/mock-data';
import { formatCryptoNumber } from '@/lib/utils';

/**
 * Root explore page — a React Server Component.
 *
 * The catalogue is read on the server and handed to the client shell as plain
 * serialisable props, so the grid's first paint arrives with the HTML and no
 * client-side fetch waterfall is needed before hydration.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketplaceShell assets={mockAssets} collections={mockCollections}>
        {/* Server-rendered hero band, injected between the ribbon and the grid. */}
        <section className="border-b border-white/10 bg-slate-950/60">
          <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Verified catalogue
            </p>
            <h1 className="mt-3 max-w-3xl bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
              Next-generation assets, licensed and anchored on-chain.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {catalogStats.assetCount} listings from {catalogStats.creatorCount} creators across{' '}
              {catalogStats.collectionCount} collections — 3D models, interface systems, generative
              editions, cleared audio and motion packages. Every purchase settles with a simulated
              on-chain receipt and an auditable royalty split.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">Listings</dt>
                <dd className="mt-1 font-mono text-xl font-semibold text-slate-100">
                  {catalogStats.assetCount}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">Available now</dt>
                <dd className="mt-1 font-mono text-xl font-semibold text-slate-100">
                  {catalogStats.availableCount}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">Creators</dt>
                <dd className="mt-1 font-mono text-xl font-semibold text-slate-100">
                  {catalogStats.creatorCount}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  Cumulative volume
                </dt>
                <dd className="mt-1 font-mono text-xl font-semibold text-cyan-300">
                  {formatCryptoNumber(catalogStats.totalVolumeEth)} ETH
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </MarketplaceShell>

      <Footer />
    </div>
  );
}