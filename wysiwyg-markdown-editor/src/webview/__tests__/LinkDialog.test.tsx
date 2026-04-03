import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkDialog } from '../components/LinkDialog';

describe('LinkDialog', () => {
  const defaultProps = {
    isOpen: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<LinkDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('link-url-input')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<LinkDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows "Insert Link" title when creating new link', () => {
      render(<LinkDialog {...defaultProps} />);

      expect(screen.getByText('Insert Link')).toBeInTheDocument();
      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });

    it('shows "Edit Link" title when editing existing link', () => {
      render(<LinkDialog {...defaultProps} initialUrl="https://example.com" />);

      expect(screen.getByText('Edit Link')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('pre-populates URL input with initialUrl', () => {
      render(<LinkDialog {...defaultProps} initialUrl="https://example.com" />);

      const input = screen.getByTestId('link-url-input') as HTMLInputElement;
      expect(input.value).toBe('https://example.com');
    });
  });

  describe('User Interactions', () => {
    it('updates input value when typing', () => {
      render(<LinkDialog {...defaultProps} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.change(input, { target: { value: 'https://test.com' } });

      expect((input as HTMLInputElement).value).toBe('https://test.com');
    });

    it('calls onConfirm with URL when confirm button clicked', () => {
      const onConfirm = vi.fn();
      render(<LinkDialog {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.change(input, { target: { value: 'https://test.com' } });

      const confirmButton = screen.getByTestId('link-confirm-button');
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledWith('https://test.com');
    });

    it('calls onCancel when cancel button clicked', () => {
      const onCancel = vi.fn();
      render(<LinkDialog {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByTestId('link-cancel-button');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('calls onRemove when remove button clicked', () => {
      const onRemove = vi.fn();
      render(
        <LinkDialog
          {...defaultProps}
          initialUrl="https://example.com"
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByTestId('link-remove-button');
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalled();
    });

    it('does not show remove button when onRemove is not provided', () => {
      render(<LinkDialog {...defaultProps} />);

      expect(screen.queryByTestId('link-remove-button')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Interactions', () => {
    it('confirms on Enter key press', () => {
      const onConfirm = vi.fn();
      render(<LinkDialog {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.change(input, { target: { value: 'https://test.com' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onConfirm).toHaveBeenCalledWith('https://test.com');
    });

    it('cancels on Escape key press', () => {
      const onCancel = vi.fn();
      render(<LinkDialog {...defaultProps} onCancel={onCancel} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('disables confirm button when URL is empty', () => {
      render(<LinkDialog {...defaultProps} />);

      const confirmButton = screen.getByTestId('link-confirm-button');
      expect(confirmButton).toBeDisabled();
    });

    it('enables confirm button when URL has value', () => {
      render(<LinkDialog {...defaultProps} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.change(input, { target: { value: 'https://test.com' } });

      const confirmButton = screen.getByTestId('link-confirm-button');
      expect(confirmButton).not.toBeDisabled();
    });

    it('trims whitespace from URL before confirming', () => {
      const onConfirm = vi.fn();
      render(<LinkDialog {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.change(input, { target: { value: '  https://test.com  ' } });

      const confirmButton = screen.getByTestId('link-confirm-button');
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledWith('https://test.com');
    });

    it('does not confirm if URL is only whitespace', () => {
      const onConfirm = vi.fn();
      render(<LinkDialog {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByTestId('link-url-input');
      fireEvent.change(input, { target: { value: '   ' } });

      const confirmButton = screen.getByTestId('link-confirm-button');
      fireEvent.click(confirmButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop', () => {
    it('closes dialog when clicking backdrop', () => {
      const onCancel = vi.fn();
      render(<LinkDialog {...defaultProps} onCancel={onCancel} />);

      const backdrop = screen.getByTestId('link-dialog-backdrop');
      fireEvent.click(backdrop);

      expect(onCancel).toHaveBeenCalled();
    });

    it('does not close when clicking dialog content', () => {
      const onCancel = vi.fn();
      render(<LinkDialog {...defaultProps} onCancel={onCancel} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
