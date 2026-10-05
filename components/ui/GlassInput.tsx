'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface GlassInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label rendered above the field; falls back to `aria-label` when absent. */
  label?: string;
  /** Helper or error copy rendered below the field. */
  helperText?: string;
  /** Leading adornment (icon). Receives the muted foreground colour. */
  iconLeft?: ReactNode;
  /** Trailing adornment; replaces the clear button when provided. */
  iconRight?: ReactNode;
  /** Renders the built-in clear button when the field holds a value. */
  clearable?: boolean;
  /** Invoked with the next value when the clear affordance is activated. */
  onClear?: () => void;
  /** Applies the destructive error palette and wires `aria-invalid`. */
  invalid?: boolean;
  /** Visually hides the label while keeping it for assistive technology. */
  hideLabel?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Frosted-glass text field with a leading icon slot, an optional clear
 * affordance and the focus glow ring `focus:border-cyan-400
 * focus:ring-1 focus:ring-cyan-400/50`.
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput(
    {
      label,
      helperText,
      iconLeft,
      iconRight,
      clearable = false,
      onClear,
      invalid = false,
      hideLabel = false,
      className,
      containerClassName,
      id,
      value,
      onChange,
      ...rest
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const hasValue = typeof value === 'string' ? value.length > 0 : value != null && value !== 0;
    const showClear = clearable && hasValue && !iconRight;

    return (
      <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className={cn(
              'text-xs font-medium uppercase tracking-wider text-slate-400',
              hideLabel && 'sr-only'
            )}
          >
            {label}
          </label>
        ) : null}

        <div className="relative flex items-center">
          {iconLeft ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 inline-flex items-center text-slate-500"
            >
              {iconLeft}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={onChange}
            aria-invalid={invalid || undefined}
            aria-describedby={helperText ? helperId : undefined}
            className={cn(
              'min-h-[44px] w-full rounded-xl border border-white/10 bg-slate-950/70 text-slate-100',
              'backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-200',
              'placeholder:text-slate-600',
              'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none',
              'focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              iconLeft ? 'pl-11' : '',
              showClear || iconRight ? 'pr-11' : '',
              !iconLeft && !(showClear || iconRight) ? 'px-4' : '',
              invalid
                ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/50'
                : 'hover:border-white/20',
              className
            )}
            {...rest}
          />

          {iconRight ? (
            <span className="absolute right-3 inline-flex items-center text-slate-500">
              {iconRight}
            </span>
          ) : null}

          {showClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear input"
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

        {helperText ? (
          <p
            id={helperId}
            className={cn(
              'text-xs',
              invalid ? 'text-red-300' : 'text-slate-500'
            )}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);