'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface GlassTabItem {
  value: string;
  label: ReactNode;
  /** Optional numeric or status suffix rendered after the label. */
  badge?: ReactNode;
  disabled?: boolean;
}

export interface GlassTabsProps {
  items: GlassTabItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  size?: 'sm' | 'md';
  /** Fills the available width and distributes segments evenly. */
  stretch?: boolean;
  className?: string;
  'data-testid'?: string;
}

const HEIGHTS = { sm: 'min-h-[44px] text-xs', md: 'min-h-[48px] text-sm' } as const;

/**
 * Accessible tab strip built on the WAI-ARIA tabs pattern with roving focus.
 * The active indicator is positioned from the measured active button so it
 * tracks label width instead of assuming a fixed segment size.
 */
export function GlassTabs({
  items,
  value,
  onChange,
  label,
  size = 'md',
  stretch = false,
  className,
  ...rest
}: GlassTabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const activeIndex = items.findIndex((item) => item.value === value);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateIndicator = () => {
      const activeButton = list.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(value)}"]`);
      if (!activeButton) {
        setIndicator(null);
        return;
      }
      setIndicator({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
    };

    updateIndicator();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value, items.length]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }
    event.preventDefault();

    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) return;

    const currentPosition = enabled.findIndex((item) => item.value === value);
    let nextPosition: number;

    if (event.key === 'Home') nextPosition = 0;
    else if (event.key === 'End') nextPosition = enabled.length - 1;
    else {
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      nextPosition = (currentPosition + delta + enabled.length) % enabled.length;
      if (currentPosition === -1) nextPosition = 0;
    }

    const nextValue = enabled[nextPosition].value;
    onChange(nextValue);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(nextValue)}"]`)
      ?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70 p-1 scrollbar-hide',
        stretch && 'w-full',
        className
      )}
      {...rest}
    >
      {indicator ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/50 transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
          style={{
            left: indicator.left,
            width: indicator.width,
            top: '0.25rem',
            bottom: '0.25rem',
            height: 'auto',
          }}
        />
      ) : null}

      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={isActive}
            aria-controls={`${baseId}-panel-${item.value}`}
            tabIndex={isActive ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative z-10 flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-3.5 font-medium',
              'transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400',
              'disabled:cursor-not-allowed disabled:opacity-40',
              HEIGHTS[size],
              isActive ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-100'
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.badge !== undefined && item.badge !== null ? (
              <span
                className={cn(
                  'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-5',
                  isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/10 text-slate-400'
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}

      {activeIndex === -1 ? (
        <span className="sr-only" role="status">
          No active tab
        </span>
      ) : null}
    </div>
  );
}