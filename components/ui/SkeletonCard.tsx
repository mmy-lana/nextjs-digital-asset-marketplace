import { cn } from '@/lib/utils';

export interface SkeletonCardProps {
  /** Number of cards to render. */
  count?: number;
  className?: string;
  'data-testid'?: string;
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton-card"
      className={cn(
        'flex flex-col overflow-hidden rounded-glass border border-white/10 bg-slate-950/75 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        className
      )}
    >
      {/* Media block — matches AssetCard's aspect-ratio media area. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
        <div className="skeleton-sheen absolute inset-0" />
        <div className="absolute left-3 top-3 size-8 rounded-full bg-slate-800/80" />
        <div className="absolute right-3 top-3 h-5 w-16 rounded-full bg-slate-800/80" />
      </div>

      {/* Body block */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="skeleton-sheen size-6 rounded-full" />
          <div className="skeleton-sheen h-3 w-24 rounded-full" />
        </div>

        <div className="skeleton-sheen h-4 w-4/5 rounded" />
        <div className="skeleton-sheen h-3 w-3/5 rounded" />

        <div className="mt-auto space-y-2.5 pt-2">
          <div className="skeleton-sheen h-3 w-1/2 rounded" />
          <div className="flex items-center gap-2">
            <div className="skeleton-sheen h-10 flex-1 rounded-xl" />
            <div className="skeleton-sheen size-10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Zero-layout-shift loading placeholder. The media block, body rhythm and
 * control heights mirror `AssetCard` exactly so swapping skeletons for real
 * cards produces no reflow.
 */
export function SkeletonCard({ count = 1, className, ...rest }: SkeletonCardProps) {
  if (count <= 1) {
    return <CardSkeleton className={className} />;
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading assets"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      {...rest}
    >
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} className={className} />
      ))}
      <span className="sr-only">Loading assets…</span>
    </div>
  );
}