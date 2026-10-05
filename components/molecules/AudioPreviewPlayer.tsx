'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { formatDuration, seededRandom, cn } from '@/lib/utils';

export interface AudioPreviewPlayerProps {
  /**
   * Audio stream URL. Callers should pass `asset.media.audioUrl` and fall back to
   * `asset.media.previewUrl` when the listing carries no dedicated stream.
   */
  src: string;
  /** Poster artwork shown while the stream buffers; omitted renders a gradient. */
  posterUrl?: string;
  /** Total length in seconds, used for the readout before metadata loads. */
  durationSeconds?: number;
  title?: string;
  className?: string;
  'data-testid'?: string;
}

const BAR_COUNT = 48;

/**
 * Audio preview with a clickable scrubber and a deterministic waveform.
 *
 * The waveform bars are generated from a seed derived from the source URL, so
 * the visual is stable across renders without shipping audio-analysis data.
 */
export function AudioPreviewPlayer({
  src,
  posterUrl,
  durationSeconds,
  title,
  className,
  ...rest
}: AudioPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [muted, setMuted] = useState(false);

  const waveform = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, index) => {
        const primary = seededRandom(`${src}-${index}`);
        const secondary = seededRandom(`${src}-bar-${index}`);
        return 0.18 + (primary * 0.6 + secondary * 0.22);
      }),
    [src]
  );

  const effectiveDuration = duration > 0 ? duration : (durationSeconds ?? 0);
  const progress = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  /**
   * PERF-01: release the media element on unmount and whenever the source
   * changes.
   *
   * Without this, an in-flight download keeps decoding after the player is
   * unmounted, retaining the buffered media and a live network connection, and
   * audio can continue playing over a newly focused screen.
   */
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (!audio) return;
      audio.pause();
      audio.removeAttribute('src');
      // Force the media element to release buffered resources.
      audio.load();
    };
  }, [src]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (audio.paused) {
      setIsLoading(true);
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setHasError(true);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [hasError]);

  const handleScrub = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Number(event.target.value);
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio) return;
      const seek = (delta: number) => {
        const next = Math.min(Math.max(audio.currentTime + delta, 0), effectiveDuration || 0);
        audio.currentTime = next;
        setCurrentTime(next);
      };
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        seek(5);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seek(-5);
      }
    },
    [effectiveDuration]
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md',
        className
      )}
      data-testid="audio-preview-player"
      {...rest}
    >
      {posterUrl ? (
        <div
          aria-hidden="true"
          className="h-28 w-full overflow-hidden rounded-lg border border-white/10 bg-slate-900 bg-cover bg-center sm:h-36"
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
      ) : null}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const next = event.currentTarget.duration;
          if (Number.isFinite(next) && next > 0) setDuration(next);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError}
          aria-label={isPlaying ? `Pause ${title ?? 'preview'}` : `Play ${title ?? 'preview'}`}
          className={cn(
            'inline-flex size-11 shrink-0 items-center justify-center rounded-full',
            'bg-gradient-to-br from-cyan-500 to-sky-500 text-slate-950',
            'transition-transform motion-safe:active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          )}
          data-testid="audio-play-toggle"
        >
          {isLoading ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : isPlaying ? (
            <Pause aria-hidden="true" className="size-5" fill="currentColor" />
          ) : (
            <Play aria-hidden="true" className="size-5 translate-x-[1px]" fill="currentColor" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          {title ? (
            <p className="truncate text-sm font-medium text-slate-200">{title}</p>
          ) : null}
          <p className="font-mono text-xs text-slate-400" data-testid="audio-time-readout">
            {formatDuration(currentTime)} / {formatDuration(effectiveDuration)}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute preview' : 'Mute preview'}
          className={cn(
            'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
            'text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          )}
        >
          {muted ? (
            <VolumeX aria-hidden="true" className="size-5" />
          ) : (
            <Volume2 aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {/* Waveform doubles as a progress indicator. */}
      <div
        className="relative"
        onKeyDown={handleKeyDown}
        role="group"
        aria-label="Audio scrubber"
      >
        <div className="flex h-12 items-end gap-[2px]" aria-hidden="true">
          {waveform.map((height, index) => {
            const barPercent = (index / (BAR_COUNT - 1)) * 100;
            const played = barPercent <= progress;
            return (
              <span
                key={index}
                className={cn(
                  'w-full rounded-full transition-colors duration-150',
                  played ? 'bg-cyan-400' : 'bg-white/12'
                )}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            );
          })}
        </div>

        <label className="sr-only" htmlFor={`${src}-scrubber`}>
          Seek preview
        </label>
        <input
          id={`${src}-scrubber`}
          type="range"
          min={0}
          max={effectiveDuration || 0}
          step={0.1}
          value={Math.min(currentTime, effectiveDuration || 0)}
          onChange={handleScrub}
          disabled={hasError || effectiveDuration === 0}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent',
            'focus-visible:outline-none',
            '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)]',
            '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cyan-300',
            'disabled:cursor-not-allowed'
          )}
        />
      </div>

      {hasError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          data-testid="audio-error"
        >
          <AlertTriangle aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span>
            Preview unavailable — the audio host did not respond. The licence and download are
            unaffected.
          </span>
        </p>
      ) : null}
    </div>
  );
}