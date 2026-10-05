'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MIN_TOUCH_TARGET_PX } from '@/lib/constants';

export type GlassButtonVariant = 'primary-neon' | 'glass-outline' | 'ghost' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  /** Leading icon element. */
  iconLeft?: ReactNode;
  /** Trailing icon element. */
  iconRight?: ReactNode;
  /** Renders a spinner and disables interaction. */
  loading?: boolean;
  /** Stretches the button to fill its container. */
  block?: boolean;
  children?: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<GlassButtonVariant, string> = {
  'primary-neon':
    'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-semibold shadow-[0_8px_24px_-6px_rgba(6,182,212,0.55)] hover:from-cyan-400 hover:to-sky-400 active:from-cyan-600 active:to-sky-600',
  'glass-outline':
    'border border-white/15 bg-slate-900/60 text-slate-100 hover:border-cyan-400/60 hover:bg-slate-900/80 active:bg-slate-900',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/5 hover:text-slate-100 active:bg-white/10',
  danger:
    'border border-red-400/30 bg-red-500/15 text-red-200 hover:bg-red-500/25 hover:border-red-400/60 active:bg-red-500/35',
};

/**
 * Every size keeps a minimum 44px block height so touch users never get a
 * tap target below the platform accessibility guideline.
 */
const SIZE_CLASSES: Record<GlassButtonSize, string> = {
  sm: `min-h-[${MIN_TOUCH_TARGET_PX}px] px-3.5 text-sm gap-1.5`,
  md: `min-h-[${MIN_TOUCH_TARGET_PX}px] px-5 text-sm gap-2 sm:text-base`,
  lg: `min-h-[${MIN_TOUCH_TARGET_PX}px] px-7 text-base gap-2.5`,
};

/**
 * The kinetic frosted-glass button. Declared as a client component because the
 * loading/disabled behaviour relies on React state and event handling.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  function GlassButton(
    {
      variant = 'glass-outline',
      size = 'md',
      iconLeft,
      iconRight,
      loading = false,
      block = false,
      disabled = false,
      children,
      className,
      type = 'button',
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center rounded-xl border border-transparent',
          'backdrop-blur-md transition-[transform,background-color,border-color,box-shadow,opacity] duration-200',
          'motion-safe:active:scale-[0.97]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:motion-safe:active:scale-100',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          block && 'w-full',
          className
        )}
        {...rest}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
          />
        )}
        <span
          className={cn(
            'inline-flex items-center',
            size === 'lg' ? 'gap-2.5' : 'gap-2',
            loading && 'invisible'
          )}
        >
          {iconLeft ? (
            <span aria-hidden="true" className="inline-flex shrink-0 items-center">
              {iconLeft}
            </span>
          ) : null}
          {children ? <span className="truncate">{children}</span> : null}
          {iconRight ? (
            <span aria-hidden="true" className="inline-flex shrink-0 items-center">
              {iconRight}
            </span>
          ) : null}
        </span>
      </button>
    );
  }
);