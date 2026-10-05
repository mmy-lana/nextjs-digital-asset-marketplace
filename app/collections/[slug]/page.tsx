import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { AssetCard } from '@/components/molecules/AssetCard';
import { CollectionBrowser } from '@/components/features/CollectionBrowser';
import {
  getCollectionBySlug,
  mockAssets,
  mockCollections,
} from '@/lib/mock-data';
import { formatCryptoNumber } from '@/lib/utils';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return mockCollections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return { title: 'Collection not found' };
  }

  return {
    title: collection.name,
    description: collection.description,
    openGraph: {
      title: collection.name,
      description: collection.description,
      images: [{ url: collection.bannerUrl }],
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavigationHeader assets={mockAssets} />

      <div className="relative h-40 w-full sm:h-56">
        <Image
          src={collection.bannerUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
      </div>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-6 sm:py-8"
      >
        <Link
          href="/"
          className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl text-sm text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All collections
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Image
            src={collection.logoUrl}
            alt={`${collection.name} logo`}
            width={80}
            height={80}
            className="size-20 shrink-0 rounded-2xl border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">{collection.name}</h1>
              {collection.verified ? (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{collection.description}</p>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Floor</dt>
                <dd className="font-mono text-cyan-300">
                  {formatCryptoNumber(collection.floorPriceEth)} ETH
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Volume</dt>
                <dd className="font-mono text-slate-300">
                  {formatCryptoNumber(collection.totalVolumeEth)} ETH
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Items</dt>
                <dd className="font-mono text-slate-300">{collection.itemCount}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">Owners</dt>
                <dd className="font-mono text-slate-300">{collection.ownersCount}</dd>
              </div>
            </dl>
          </div>
        </header>

        <CollectionBrowser assetIds={collection.assetIds} assets={mockAssets} />
      </main>

      <Footer />
    </div>
  );
}