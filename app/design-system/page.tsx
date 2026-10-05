'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { CategoryBadge, ChainBadge, GlassBadge, RarityBadge } from '@/components/ui/GlassBadge';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassTabs } from '@/components/ui/GlassTabs';

const TABS = [
  { value: 'recently_listed', label: 'Recently listed' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export default function DesignSystemSmokePage() {
  const [tab, setTab] = useState('recently_listed');
  const [range, setRange] = useState<[number, number]>([0, 10]);
  const [query, setQuery] = useState('glass');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <GlassPanel data-testid="smoke-panel" className="mx-auto max-w-4xl" padding="lg" neon>
        <h1 className="text-2xl font-semibold">Design system smoke</h1>

        <section className="mt-6 flex flex-wrap gap-3">
          <GlassButton variant="primary-neon" data-testid="btn-primary">
            Primary neon
          </GlassButton>
          <GlassButton variant="glass-outline">Glass outline</GlassButton>
          <GlassButton variant="ghost">Ghost</GlassButton>
          <GlassButton variant="danger">Danger</GlassButton>
          <GlassButton variant="primary-neon" loading>
            Loading
          </GlassButton>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <GlassInput
            label="Search catalogue"
            placeholder="Search assets, creators, tags"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            clearable
            iconLeft={<span>⌕</span>}
            data-testid="smoke-input"
          />
          <GlassInput label="Invalid sample" invalid helperText="Helper text" defaultValue="" />
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          <GlassBadge tone="neon" dot pulse>
            Live
          </GlassBadge>
          <CategoryBadge category="3d_models" />
          <ChainBadge chain="ethereum" />
          <ChainBadge chain="solana" />
          <RarityBadge rarityScore={95} />
          <RarityBadge rarityScore={12} />
        </section>

        <section className="mt-6">
          <GlassTabs
            items={TABS}
            value={tab}
            onChange={setTab}
            label="Sort assets"
            data-testid="smoke-tabs"
          />
        </section>

        <section className="mt-6">
          <RangeSlider
            min={0}
            max={10}
            step={0.5}
            value={range}
            onChange={setRange}
            data-testid="smoke-slider"
          />
        </section>

        <section className="mt-6">
          <SkeletonCard count={4} />
        </section>
      </GlassPanel>

      <div className="mx-auto mt-6 max-w-4xl">
        <GlassButton variant="primary-neon" onClick={() => setModalOpen(true)} data-testid="open-modal">
          Open modal
        </GlassButton>
      </div>

      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Static dialog"
        description="Imperative showModal()/close() render check"
        footer={<GlassButton variant="glass-outline" onClick={() => setModalOpen(false)}>Close</GlassButton>}
        data-testid="smoke-modal"
      >
        <p className="text-sm text-slate-400">Modal body</p>
      </GlassModal>
    </main>
  );
}