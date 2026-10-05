'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GlassModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface GlassModalProps {
  /** Controlled open state. The dialog is shown via `showModal()` in an effect. */
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  title?: string;
  description?: string;
  /** Header slot for custom content; replaces the default title block. */
  header?: ReactNode;
  /** Footer slot pinned below the scrollable body. */
  footer?: ReactNode;
  size?: GlassModalSize;
  /** Hides the built-in close affordance. */
  hideCloseButton?: boolean;
  /** Prevents backdrop/Escape dismissal for in-flight transactions. */
  dismissible?: boolean;
  className?: string;
  'data-testid'?: string;
}

const SIZE_CLASSES: Record<GlassModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(96vw,1200px)]',
};

/**
 * Native `<dialog>` wrapper.
 *
 * The open state is applied imperatively through `showModal()` / `close()` in an
 * effect — the `open` attribute is never rendered directly, which preserves
 * top-layer rendering, the browser's built-in focus trap and `::backdrop`
 * pseudo-element support.
 */
export function GlassModal({
  isOpen,
  onClose,
  children,
  title,
  description,
  header,
  footer,
  size = 'md',
  hideCloseButton = false,
  dismissible = true,
  className,
  ...rest
}: GlassModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    /** Cancels on Escape or backdrop click; `preventDefault` keeps it open. */
    const handleCancel = (event: Event) => {
      if (!dismissible) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [dismissible, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    /** Native `close` fires for Escape and programmatic closes alike. */
    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const hasHeader = Boolean(header || title || description || !hideCloseButton);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'w-full max-w-none bg-transparent p-0 text-slate-100 backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm',
        'm-auto sm:m-6',
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-glass border border-white/10 bg-slate-950/90 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
        {hasHeader ? (
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              {header}
              {title ? (
                <h2
                  id={titleId}
                  className="truncate text-lg font-semibold text-slate-50"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-slate-400">
                  {description}
                </p>
              ) : null}
            </div>

            {!hideCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
                  'text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                )}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          data-testid="modal-scroll-body"
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
        >
          {children}
        </div>

        {footer ? (
          <div className="border-t border-white/10 bg-slate-900/60 p-4 sm:p-5">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}