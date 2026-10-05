import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GlassPanelTone = 'default' | 'raised' | 'inset' | 'transparent';
export type GlassPanelPadding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassPanelProps {
  children?: ReactNode;
  /** Semantic element to render, keeping heading order correct per context. */
  as?: ElementType;
  tone?: GlassPanelTone;
  padding?: GlassPanelPadding;
  /** Draws the animated neon hairline border. */
  neon?: boolean;
  /** Removes the drop shadow — useful inside already-shadowed containers. */
  flat?: boolean;
  className?: string;
  'data-testid'?: string;
}

const TONE_CLASSES: Record<GlassPanelTone, string> = {
  default: 'bg-slate-950/75',
  raised: 'bg-slate-900/80',
  inset: 'bg-slate-950/55',
  transparent: 'bg-transparent',
};

const PADDING_CLASSES: Record<GlassPanelPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6 lg:p-8',
};

/**
 * The foundational frosted-glass surface: `backdrop-blur-xl bg-slate-950/75
 * border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]`.
 *
 * Intentionally a Server Component — it holds no state and can be rendered from
 * RSC trees without pulling a client bundle.
 */
export function GlassPanel({
  children,
  as: Component = 'div',
  tone = 'default',
  padding = 'md',
  neon = false,
  flat = false,
  className,
  ...rest
}: GlassPanelProps) {
  return (
    <Component
      className={cn(
        'relative rounded-glass border border-white/10 backdrop-blur-xl',
        TONE_CLASSES[tone],
        !flat && 'shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        PADDING_CLASSES[padding],
        neon && 'neon-hairline',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}