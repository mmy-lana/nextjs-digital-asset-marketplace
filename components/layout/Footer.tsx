import Link from 'next/link';
import { CATEGORIES, CHAIN_NETWORKS, SITE_NAME } from '@/lib/constants';
import { formatCryptoNumber } from '@/lib/utils';
import { catalogStats } from '@/lib/mock-data';

export interface FooterProps {
  className?: string;
  'data-testid'?: string;
}

const RESOURCE_LINKS = [
  { href: '/', label: 'Explore assets' },
  { href: '/orders', label: 'Order history' },
  { href: '/design-system', label: 'Design system' },
];

const COMPANY_LINKS = [
  { href: '/', label: 'Licensing' },
  { href: '/', label: 'Creator royalties' },
  { href: '/', label: 'Provenance' },
];

const LEGAL_LINKS = [
  { href: '/', label: 'Terms of service' },
  { href: '/', label: 'Privacy policy' },
  { href: '/', label: 'Security' },
];

/**
 * Dark glass footer with responsive multi-column links, live network status and
 * contract security disclaimers. A Server Component — fully static.
 */
export function Footer({ className, ...rest }: FooterProps) {
  const year = 2026;

  return (
    <footer
      className={`mt-16 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl ${className ?? ''}`}
      data-testid="site-footer"
      {...rest}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              aria-label="Digital Asset Marketplace home"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-cyan-200 ring-1 ring-cyan-400/30">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 19 12 5l7 14-7-4-7 4Z" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-slate-100">{SITE_NAME}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              A curated exchange for licensed 3D models, interface systems, generative editions
              and cleared audio — every listing anchored to verifiable on-chain provenance.
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Assets</dt>
                <dd className="font-mono text-slate-300">{catalogStats.assetCount}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Creators</dt>
                <dd className="font-mono text-slate-300">{catalogStats.creatorCount}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Collections</dt>
                <dd className="font-mono text-slate-300">{catalogStats.collectionCount}</dd>
              </div>
            </dl>
          </div>

          {/* Link columns */}
          <FooterColumn title="Browse" links={RESOURCE_LINKS} />
          <FooterColumn title="Marketplace" links={COMPANY_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Network status */}
        <div className="mt-10 rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span aria-hidden="true" className="size-2 animate-[neon-pulse_2.8s_ease-in-out_infinite] rounded-full bg-emerald-400" />
              Network status
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {CHAIN_NETWORKS.map((chain) => (
                <li key={chain.value} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
                  {chain.label}
                  <span className="font-mono text-slate-600">#{chain.chainId}</span>
                </li>
              ))}
            </ul>
            <p className="ml-auto text-xs text-slate-500">
              Cumulative volume{' '}
              <span className="font-mono text-slate-300">
                {formatCryptoNumber(catalogStats.totalVolumeEth)} ETH
              </span>
            </p>
          </div>
        </div>

        {/* Security disclaimer */}
        <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
          <p className="text-xs leading-relaxed text-amber-200/80">
            <strong className="font-semibold">Security notice.</strong> This marketplace runs a
            simulated settlement layer for demonstration. Balances, transaction hashes and
            confirmations are generated locally and never broadcast to a public network. Always
            verify contract addresses on the network explorer before signing a real transfer.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          <p className="font-mono">Built with Next.js App Router · React Server Components</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-flex min-h-[44px] items-center text-sm text-slate-500 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}