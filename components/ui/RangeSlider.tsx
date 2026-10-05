'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn, formatCryptoNumber } from '@/lib/utils';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  /** Controlled lower bound. */
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  /** Unit appended to the numeric readouts, e.g. `ETH`. */
  unit?: string;
  /** Formats each bound for the readout row. */
  formatValue?: (value: number) => string;
  className?: string;
  'data-testid'?: string;
}

type DragTarget = 'lower' | 'upper' | null;

const TRACK_PADDING = 0;

/**
 * Dual-thumb range control.
 *
 * Two overlaid native `input[type=range]` elements provide full keyboard and
 * assistive-technology support, while pointer/touch drags are handled
 * imperatively against the track so both thumbs can be manipulated from a
 * single finger. `touch-action: none` on the thumbs isolates each drag so the
 * page never scrolls underneath an in-progress adjustment.
 */
export function RangeSlider({
  min,
  max,
  step = 0.01,
  value,
  onChange,
  label = 'Price range',
  unit = 'ETH',
  formatValue,
  className,
  ...rest
}: RangeSliderProps) {
  const groupId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);

  const span = Math.max(max - min, Number.EPSILON);
  const lowerPercent = ((value[0] - min) / span) * 100;
  const upperPercent = ((value[1] - min) / span) * 100;

  const format = useCallback(
    (raw: number) => (formatValue ? formatValue(raw) : `${formatCryptoNumber(raw)} ${unit}`),
    [formatValue, unit]
  );

  const clampToStep = useCallback(
    (raw: number) => {
      const stepped = Math.round((raw - min) / step) * step + min;
      const fixed = Number(stepped.toFixed(6));
      return Math.min(Math.max(fixed, min), max);
    },
    [min, max, step]
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const usable = Math.max(rect.width - TRACK_PADDING * 2, 1);
      const ratio = (clientX - rect.left - TRACK_PADDING) / usable;
      return clampToStep(min + Math.min(Math.max(ratio, 0), 1) * span);
    },
    [clampToStep, min, span]
  );

  /** Pointer capture drag handler shared by both thumbs. */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, target: Exclude<DragTarget, null>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(target);
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (dragging === null) return;
      const next = valueFromClientX(event.clientX);
      if (dragging === 'lower') {
        const clamped = Math.min(next, value[1]);
        if (clamped !== value[0]) onChange([clamped, value[1]]);
      } else {
        const clamped = Math.max(next, value[0]);
        if (clamped !== value[1]) onChange([value[0], clamped]);
      }
    },
    [dragging, onChange, value, valueFromClientX]
  );

  const stopDragging = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(null);
  }, []);

  /** Clicking the bare track moves the nearest thumb to that position. */
  const handleTrackClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (dragging !== null) return;
      const next = valueFromClientX(event.clientX);
      const distanceToLower = Math.abs(next - value[0]);
      const distanceToUpper = Math.abs(next - value[1]);
      if (distanceToLower <= distanceToUpper) {
        onChange([Math.min(next, value[1]), value[1]]);
      } else {
        onChange([value[0], Math.max(next, value[0])]);
      }
    },
    [dragging, onChange, value, valueFromClientX]
  );

  useEffect(() => {
    if (dragging === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDragging(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dragging]);

  const lowerInputId = `${groupId}-lower`;
  const upperInputId = `${groupId}-upper`;

  return (
    <div className={cn('flex w-full flex-col gap-3', className)} {...rest}>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium uppercase tracking-wider">{label}</span>
        <span className="font-mono text-slate-300" data-testid="range-readout">
          {format(value[0])} — {format(value[1])}
        </span>
      </div>

      <div
        ref={trackRef}
        onMouseDown={handleTrackClick}
        className="relative h-10 w-full select-none"
      >
        {/* Rail */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10"
        />
        {/* Active span */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-400"
          style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }}
        />

        {/* Native inputs drive keyboard + screen-reader semantics. */}
        <input
          id={lowerInputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          aria-label={`${label} minimum`}
          onChange={(event) =>
            onChange([Math.min(Number(event.target.value), value[1]), value[1]])
          }
          className="pointer-events-none absolute inset-0 h-10 w-full appearance-none bg-transparent focus:pointer-events-auto focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{ zIndex: lowerPercent > 90 ? 4 : 3 }}
        />
        <input
          id={upperInputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          aria-label={`${label} maximum`}
          onChange={(event) =>
            onChange([value[0], Math.max(Number(event.target.value), value[0])])
          }
          className="pointer-events-none absolute inset-0 h-10 w-full appearance-none bg-transparent focus:pointer-events-auto focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{ zIndex: upperPercent < 10 ? 4 : 3 }}
        />

        {/* Visual thumbs */}
        <button
          type="button"
          aria-label="Adjust minimum price"
          data-testid="range-thumb-min"
          onPointerDown={(event) => handlePointerDown(event, 'lower')}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className={cn(
            'absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full',
            'border-2 border-cyan-300 bg-slate-900 shadow-[0_0_12px_rgba(6,182,212,0.55)]',
            'transition-transform motion-safe:hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          )}
          style={{ left: `${lowerPercent}%`, zIndex: 5 }}
        />
        <button
          type="button"
          aria-label="Adjust maximum price"
          data-testid="range-thumb-max"
          onPointerDown={(event) => handlePointerDown(event, 'upper')}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className={cn(
            'absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full',
            'border-2 border-cyan-300 bg-slate-900 shadow-[0_0_12px_rgba(6,182,212,0.55)]',
            'transition-transform motion-safe:hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          )}
          style={{ left: `${upperPercent}%`, zIndex: 5 }}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}