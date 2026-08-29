import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageDialog } from '../components/ImageDialog';

describe('ImageDialog', () => {
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
      render(<ImageDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('image-url-input')).toBeInTheDocument();
      expect(screen.getByTestId('image-alt-input')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ImageDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows "Insert Image" title and Insert button', () => {
      render(<ImageDialog {...defaultProps} />);
      expect(screen.getByText('Insert Image')).toBeInTheDocument();
      expect(screen.getByText('Insert')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables Insert when URL is empty', () => {
      render(<ImageDialog {...defaultProps} />);
      const button = screen.getByTestId('image-confirm-button');
      expect(button).toBeDisabled();
    });

    it('enables Insert when URL has a value', () => {
      render(<ImageDialog {...defaultProps} />);
      const input = screen.getByTestId('image-url-input');
      fireEvent.change(input, { target: { value: 'https://example.com/foo.png' } });
      const button = screen.getByTestId('image-confirm-button');
      expect(button).not.toBeDisabled();
    });

    it('does not call onConfirm when URL is whitespace-only', () => {
      const onConfirm = vi.fn();
      render(<ImageDialog {...defaultProps} onConfirm={onConfirm} />);
      const input = screen.getByTestId('image-url-input');
      fireEvent.change(input, { target: { value: '   ' } });
      const button = screen.getByTestId('image-confirm-button');
      fireEvent.click(button);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm with URL and alt text', () => {
      const onConfirm = vi.fn();
      render(<ImageDialog {...defaultProps} onConfirm={onConfirm} />);

      const urlInput = screen.getByTestId('image-url-input');
      const altInput = screen.getByTestId('image-alt-input');
      fireEvent.change(urlInput, { target: { value: 'https://example.com/foo.png' } });
      fireEvent.change(altInput, { target: { value: 'A photo of foo' } });

      fireEvent.click(screen.getByTestId('image-confirm-button'));

      expect(onConfirm).toHaveBeenCalledWith(
        'https://example.com/foo.png',
        'A photo of foo'
      );
    });

    it('calls onConfirm with empty alt when alt is not provided', () => {
      const onConfirm = vi.fn();
      render(<ImageDialog {...defaultProps} onConfirm={onConfirm} />);

      const urlInput = screen.getByTestId('image-url-input');
      fireEvent.change(urlInput, { target: { value: './images/flow.png' } });
      fireEvent.click(screen.getByTestId('image-confirm-button'));

      expect(onConfirm).toHaveBeenCalledWith('./images/flow.png', '');
    });

    it('trims whitespace from URL and alt', () => {
      const onConfirm = vi.fn();
      render(<ImageDialog {...defaultProps} onConfirm={onConfirm} />);

      const urlInput = screen.getByTestId('image-url-input');
      const altInput = screen.getByTestId('image-alt-input');
      fireEvent.change(urlInput, { target: { value: '  https://example.com/foo.png  ' } });
      fireEvent.change(altInput, { target: { value: '  alt text  ' } });
      fireEvent.click(screen.getByTestId('image-confirm-button'));

      expect(onConfirm).toHaveBeenCalledWith('https://example.com/foo.png', 'alt text');
    });

    it('calls onCancel when Cancel button clicked', () => {
      const onCancel = vi.fn();
      render(<ImageDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByTestId('image-cancel-button'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Keyboard interactions', () => {
    it('confirms on Enter when URL is non-empty', () => {
      const onConfirm = vi.fn();
      render(<ImageDialog {...defaultProps} onConfirm={onConfirm} />);
      const urlInput = screen.getByTestId('image-url-input');
      fireEvent.change(urlInput, { target: { value: 'https://example.com/foo.png' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });
      expect(onConfirm).toHaveBeenCalledWith('https://example.com/foo.png', '');
    });

    it('does not confirm on Enter when URL is empty', () => {
      const onConfirm = vi.fn();
      render(<ImageDialog {...defaultProps} onConfirm={onConfirm} />);
      const urlInput = screen.getByTestId('image-url-input');
      fireEvent.keyDown(urlInput, { key: 'Enter' });
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('cancels on Escape', () => {
      const onCancel = vi.fn();
      render(<ImageDialog {...defaultProps} onCancel={onCancel} />);
      const urlInput = screen.getByTestId('image-url-input');
      fireEvent.keyDown(urlInput, { key: 'Escape' });
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Backdrop', () => {
    it('cancels when clicking backdrop', () => {
      const onCancel = vi.fn();
      render(<ImageDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByTestId('image-dialog-backdrop'));
      expect(onCancel).toHaveBeenCalled();
    });

    it('does not cancel when clicking dialog content', () => {
      const onCancel = vi.fn();
      render(<ImageDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByRole('dialog'));
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
