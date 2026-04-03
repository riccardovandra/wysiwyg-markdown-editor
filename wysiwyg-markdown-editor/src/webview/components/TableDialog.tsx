import { useState, useEffect, useRef } from 'react';

/**
 * Props for the TableDialog component.
 */
export interface TableDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when user confirms table creation */
  onConfirm: (rows: number, cols: number) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/**
 * Modal dialog for inserting tables.
 *
 * Features:
 * - Input fields for rows and columns
 * - Auto-focuses rows input on open
 * - Enter key confirms, Escape key cancels
 * - VS Code themed styling
 */
export function TableDialog({
  isOpen,
  onConfirm,
  onCancel,
}: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset values and focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRows(3);
      setCols(3);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isOpen]);

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
    if (rows >= 1 && cols >= 1) {
      onConfirm(rows, cols);
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
      data-testid="table-dialog-backdrop"
    >
      <div
        className="bg-dark-elevated border border-border-default rounded-xl p-5 min-w-[300px] shadow-2xl shadow-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-dialog-title"
      >
        <h2
          id="table-dialog-title"
          className="text-sm font-semibold text-text-heading mb-4"
        >
          Insert Table
        </h2>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm text-text-secondary mb-1.5">
              Rows
            </label>
            <input
              ref={inputRef}
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
              onKeyDown={handleKeyDown}
              className="w-full p-2.5 text-sm border border-border-default bg-dark-surface text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              data-testid="table-rows-input"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-text-secondary mb-1.5">
              Columns
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
              onKeyDown={handleKeyDown}
              className="w-full p-2.5 text-sm border border-border-default bg-dark-surface text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              data-testid="table-cols-input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded-lg transition-colors font-medium"
            data-testid="table-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={rows < 1 || cols < 1}
            className="px-4 py-2 text-sm bg-accent text-white hover:bg-accent-hover rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="table-confirm-button"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
}
