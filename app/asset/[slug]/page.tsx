import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AssetDetailView } from '@/components/features/AssetDetailView';
import { Footer } from '@/components/layout/Footer';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { getAssetBySlug, getAllAssetSlugs, mockAssets } from '@/lib/mock-data';
import { formatFiat } from '@/lib/utils';
import type { DigitalAsset } from '@/types/marketplace';

interface AssetDetailPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-renders every catalogue slug at build time. */
export function generateStaticParams(): { slug: string }[] {
  return getAllAssetSlugs().map((slug) => ({ slug }));
}

/** Dynamic metadata resolved with the same `await params` pattern. */
export async function generateMetadata({ params }: AssetDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const asset = getAssetBySlug(slug);

  if (!asset) {
    return {
      title: 'Asset not found',
      description: 'The requested listing does not exist in the catalogue.',
    };
  }

  return {
    title: asset.title,
    description: `${asset.description.slice(0, 150)} — ${formatFiat(asset.priceFiatUsd)} from ${asset.creator.displayName}.`,
    openGraph: {
      title: asset.title,
      description: asset.description.slice(0, 200),
      images: [{ url: asset.media.highResUrl }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: asset.title,
      images: [asset.media.highResUrl],
    },
  };
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { slug } = await params;
  const asset: DigitalAsset | undefined = getAssetBySlug(slug);

  if (!asset) {
    notFound();
  }

  const related = mockAssets
    .filter(
      (candidate) =>
        candidate.id !== asset.id &&
        (candidate.category === asset.category || candidate.chain === asset.chain)
    )
    .slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <NavigationHeader assets={mockAssets} />

      <main id="main-content" className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-6 sm:py-8">
        <Link
          href="/"
          className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl text-sm text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to explore
        </Link>

        <AssetDetailView asset={asset} />
      </main>

      <Footer />
    </div>
  );
}