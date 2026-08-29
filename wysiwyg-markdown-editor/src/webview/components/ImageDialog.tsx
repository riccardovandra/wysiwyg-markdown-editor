import { useState, useEffect, useRef } from 'react';

/**
 * Props for the ImageDialog component.
 */
export interface ImageDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when user confirms the image insertion */
  onConfirm: (url: string, alt: string) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/**
 * Modal dialog for inserting images via the toolbar (Story 13.1, AC5).
 *
 * - Auto-focuses the URL input on open
 * - Insert is disabled when URL is empty
 * - Enter on URL with non-empty value confirms; Escape cancels
 * - Backdrop click cancels
 */
export function ImageDialog({ isOpen, onConfirm, onCancel }: ImageDialogProps) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Reset fields and focus URL input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setAlt('');
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      onConfirm(trimmedUrl, alt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
      data-testid="image-dialog-backdrop"
    >
      <div
        className="bg-dark-elevated border border-border-default rounded-xl p-5 min-w-[360px] shadow-2xl shadow-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-dialog-title"
      >
        <h2
          id="image-dialog-title"
          className="text-sm font-semibold text-text-heading mb-4"
        >
          Insert Image
        </h2>

        <label className="block text-sm text-text-secondary mb-1.5">
          URL or path
        </label>
        <input
          ref={urlInputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/image.png or ./images/foo.png"
          className="w-full p-2.5 text-sm border border-border-default bg-dark-surface text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-text-muted transition-all"
          data-testid="image-url-input"
        />

        <label className="block text-sm text-text-secondary mb-1.5 mt-3">
          Alt text (optional)
        </label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description of the image"
          className="w-full p-2.5 text-sm border border-border-default bg-dark-surface text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-text-muted transition-all"
          data-testid="image-alt-input"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded-lg transition-colors font-medium"
            data-testid="image-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!url.trim()}
            className="px-4 py-2 text-sm bg-accent text-white hover:bg-accent-hover rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="image-confirm-button"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
