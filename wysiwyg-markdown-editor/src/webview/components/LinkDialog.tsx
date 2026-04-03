import { useState, useEffect, useRef } from 'react';

/**
 * Props for the LinkDialog component.
 */
export interface LinkDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Initial URL value (for editing existing links) */
  initialUrl?: string;
  /** Callback when user confirms the URL */
  onConfirm: (url: string) => void;
  /** Callback to remove an existing link (only shown when editing) */
  onRemove?: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/**
 * Modal dialog for inserting or editing links.
 *
 * Features:
 * - Auto-focuses input on open
 * - Pre-populates URL when editing existing links
 * - Enter key confirms, Escape key cancels
 * - Remove link option for existing links
 * - VS Code themed styling
 */
export function LinkDialog({
  isOpen,
  initialUrl = '',
  onConfirm,
  onRemove,
  onCancel,
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset URL and focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      // Use setTimeout to ensure the dialog is rendered before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isOpen, initialUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleConfirm = () => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      onConfirm(trimmedUrl);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not the dialog content
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const isEditing = !!initialUrl;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
      data-testid="link-dialog-backdrop"
    >
      <div
        className="bg-dark-elevated border border-border-default rounded-xl p-5 min-w-[360px] shadow-2xl shadow-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-dialog-title"
      >
        <h2
          id="link-dialog-title"
          className="text-sm font-semibold text-text-heading mb-4"
        >
          {isEditing ? 'Edit Link' : 'Insert Link'}
        </h2>

        <label className="block text-sm text-text-secondary mb-1.5">
          URL
        </label>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="w-full p-2.5 text-sm border border-border-default bg-dark-surface text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-text-muted transition-all"
          data-testid="link-url-input"
        />

        <div className="flex justify-end gap-2 mt-5">
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
              data-testid="link-remove-button"
            >
              Remove Link
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded-lg transition-colors font-medium"
            data-testid="link-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!url.trim()}
            className="px-4 py-2 text-sm bg-accent text-white hover:bg-accent-hover rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="link-confirm-button"
          >
            {isEditing ? 'Update' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
