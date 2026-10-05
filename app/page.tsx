import { mockAssets } from '@/lib/mock-data';

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
          Next-Gen Asset Exchange
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl">
          Curated marketplace featuring glassmorphic procedural 3D models, vector design systems, and verified tokens.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold text-slate-200">Featured Prime Specs</h2>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            {mockAssets.length} Assets Online
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAssets.map((asset) => (
            <article
              key={asset.id}
              className="rounded-xl border border-white/10 bg-slate-950/70 p-4 transition-all hover:border-cyan-500/50"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                <img
                  src={asset.media.thumbnailUrl}
                  alt={asset.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <span className="absolute top-2 right-2 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-0.5 text-xs font-medium text-cyan-300 backdrop-blur-md">
                  {asset.chain.toUpperCase()}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-slate-100">{asset.title}</h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{asset.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-400">Price</span>
                  <span className="font-mono text-sm font-semibold text-cyan-400">
                    {asset.priceCrypto} {asset.currencySymbol}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
