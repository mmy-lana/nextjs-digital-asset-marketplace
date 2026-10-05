'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search, TrendingUp } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/GlassBadge';
import { cn, formatCryptoNumber } from '@/lib/utils';
import type { DigitalAsset } from '@/types/marketplace';

export interface SearchAutocompleteProps {
  assets: DigitalAsset[];
  value: string;
  onChange: (value: string) => void;
  /** Fired when a suggestion or Enter is committed. */
  onSelect?: (asset: DigitalAsset) => void;
  placeholder?: string;
  /** Debounce window in milliseconds. */
  debounceMs?: number;
  maxSuggestions?: number;
  className?: string;
  'data-testid'?: string;
}

/**
 * Instant-search input with a debounced suggestion list.
 *
 * Implements the ARIA combobox pattern: the input owns a listbox, arrow keys
 * move the active option, Enter commits it and Escape reverts to the pre-focus
 * query.
 */
export function SearchAutocomplete({
  assets,
  value,
  onChange,
  onSelect,
  placeholder = 'Search assets, creators, tags',
  debounceMs = 180,
  maxSuggestions = 6,
  className,
  ...rest
}: SearchAutocompleteProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => {
    const query = debouncedValue.trim().toLowerCase();
    if (query.length === 0) return [];
    return assets
      .filter((asset) => {
        return (
          asset.title.toLowerCase().includes(query) ||
          asset.creator.displayName.toLowerCase().includes(query) ||
          asset.creator.handle.toLowerCase().includes(query) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .slice(0, maxSuggestions);
  }, [assets, debouncedValue, maxSuggestions]);

  // Debounce the raw input so keystrokes do not thrash the catalogue scan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedValue]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const commit = useCallback(
    (asset: DigitalAsset) => {
      onChange(asset.title);
      onSelect?.(asset);
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (suggestions.length === 0) return;
        setIsOpen(true);
        setActiveIndex((current) => (current + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (suggestions.length === 0) return;
        setIsOpen(true);
        setActiveIndex((current) =>
          current <= 0 ? suggestions.length - 1 : current - 1
        );
        return;
      }
      if (event.key === 'Enter') {
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          event.preventDefault();
          commit(suggestions[activeIndex]);
        } else {
          setIsOpen(false);
        }
        return;
      }
      if (event.key === 'Escape') {
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(false);
          setActiveIndex(-1);
        }
      }
    },
    [activeIndex, commit, isOpen, suggestions]
  );

  useEffect(() => {
    if (activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const showList = isOpen && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)} {...rest}>
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 size-4 text-slate-500"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && suggestions[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          data-testid="search-input"
          className={cn(
            'min-h-[44px] w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-10 text-slate-100',
            'backdrop-blur-md transition-[border-color,box-shadow] duration-200',
            'placeholder:text-slate-600',
            'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none',
            'focus-visible:outline-none'
          )}
        />
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className={cn(
              'absolute right-1.5 inline-flex size-11 items-center justify-center rounded-lg',
              'text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200',
              'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan-400'
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        ) : null}
      </div>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className={cn(
            'absolute inset-x-0 top-[calc(100%+0.375rem)] z-50 overflow-hidden rounded-xl',
            'border border-white/10 bg-slate-950/95 shadow-[0_8px_32px_0_rgba(0,0,0,0.55)] backdrop-blur-xl'
          )}
          data-testid="search-suggestions"
        >
          {suggestions.map((asset, index) => (
            <li key={asset.id} role="none">
              <button
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                id={`${listboxId}-option-${index}`}
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(asset)}
                className={cn(
                  'flex min-h-[56px] w-full items-center gap-3 px-3 py-2 text-left',
                  'transition-colors',
                  index === activeIndex ? 'bg-cyan-500/15' : 'hover:bg-white/5'
                )}
              >
                {/*
                  eslint-disable-next-line @next/next/no-img-element -- arbitrary CDN thumbs
                  are served without next/image optimisation support
                */}
                <img
                  src={asset.media.thumbnailUrl}
                  alt=""
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-lg border border-white/10 object-cover"
                  loading="lazy"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-100">
                    {asset.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">{asset.creator.displayName}</span>
                    <CategoryBadge category={asset.category} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-xs text-cyan-300">
                    {formatCryptoNumber(asset.priceCrypto)}
                  </span>
                  {index === activeIndex ? (
                    <CornerDownLeft aria-hidden="true" className="ml-auto mt-0.5 size-3 text-slate-500" />
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {isOpen && debouncedValue.trim().length > 0 && suggestions.length === 0 ? (
        <div
          className={cn(
            'absolute inset-x-0 top-[calc(100%+0.375rem)] z-50 rounded-xl',
            'border border-white/10 bg-slate-950/95 p-4 text-center backdrop-blur-xl'
          )}
          data-testid="search-no-results"
        >
          <TrendingUp aria-hidden="true" className="mx-auto size-5 text-slate-600" />
          <p className="mt-2 text-sm text-slate-400">
            No matches for “{debouncedValue.trim()}”
          </p>
        </div>
      ) : null}
    </div>
  );
}