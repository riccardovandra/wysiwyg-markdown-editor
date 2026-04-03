import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceEditor } from '../components/SourceEditor';

describe('SourceEditor', () => {
  describe('Story 5.4: Source/Visual Toggle - SourceEditor Component', () => {
    describe('AC3: Source View Appearance', () => {
      it('renders textarea with provided content', () => {
        render(<SourceEditor content="# Hello World" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveValue('# Hello World');
      });

      it('uses monospace font from VS Code theme', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        // Font family style should be applied with VS Code variable and monospace fallbacks
        const style = textarea.getAttribute('style');
        expect(style).toContain('font-family');
        expect(style).toContain('monospace');
      });

      it('applies VS Code theme-aware text color class', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        // Should use VS Code editor foreground color variable
        expect(textarea.className).toContain('text-[var(--vscode-editor-foreground)]');
      });

      it('applies VS Code theme-aware selection color class', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        // Should use VS Code selection background variable
        expect(textarea.className).toContain('selection:bg-[var(--vscode-editor-selectionBackground)]');
      });

      it('has spell check disabled', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('spellcheck', 'false');
      });

      it('has autocomplete features disabled', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('autocomplete', 'off');
        expect(textarea).toHaveAttribute('autocorrect', 'off');
        expect(textarea).toHaveAttribute('autocapitalize', 'off');
      });
    });

    describe('AC4: Edit in Source View', () => {
      it('calls onChange when content is edited', () => {
        const mockChange = vi.fn();
        render(<SourceEditor content="" onChange={mockChange} />);

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '# New Content' } });

        expect(mockChange).toHaveBeenCalledWith('# New Content');
      });

      it('calls onChange with full content on each keystroke', () => {
        const mockChange = vi.fn();
        render(<SourceEditor content="# Hello" onChange={mockChange} />);

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '# Hello World' } });

        expect(mockChange).toHaveBeenCalledWith('# Hello World');
      });
    });

    describe('Card Mode Support', () => {
      it('applies card styling when showCard is true', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} showCard={true} />
        );

        // Should have card styling classes
        const cardDiv = container.querySelector('.bg-dark-elevated');
        expect(cardDiv).toBeInTheDocument();
        expect(cardDiv?.className).toContain('rounded-xl');
        expect(cardDiv?.className).toContain('shadow-2xl');
      });

      it('does not apply card styling when showCard is false', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} showCard={false} />
        );

        // Should not have card styling
        const cardDiv = container.querySelector('.bg-dark-elevated');
        expect(cardDiv).not.toBeInTheDocument();
      });
    });

    describe('Content Padding Support', () => {
      it('applies compact padding when contentPadding is compact', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} contentPadding="compact" />
        );

        // Should have compact padding class
        const paddingDiv = container.querySelector('.p-6');
        expect(paddingDiv).toBeInTheDocument();
      });

      it('applies medium padding when contentPadding is medium', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} contentPadding="medium" />
        );

        // Should have medium padding class
        const paddingDiv = container.querySelector('.p-10');
        expect(paddingDiv).toBeInTheDocument();
      });

      it('applies spacious padding when contentPadding is spacious', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} contentPadding="spacious" />
        );

        // Should have spacious padding class
        const paddingDiv = container.querySelector('.p-14');
        expect(paddingDiv).toBeInTheDocument();
      });

      it('defaults to medium padding when not specified', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} />
        );

        // Should default to medium padding
        const paddingDiv = container.querySelector('.p-10');
        expect(paddingDiv).toBeInTheDocument();
      });
    });

    describe('Accessibility', () => {
      it('renders textarea with proper role', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toBeInTheDocument();
      });

      it('has focus ring styling for accessibility', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        // Should have focus ring with VS Code focus border
        expect(textarea.className).toContain('focus:ring-1');
        expect(textarea.className).toContain('focus:ring-[var(--vscode-focusBorder)]');
      });

      it('shows placeholder when empty', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', 'Start typing markdown...');
      });
    });

    describe('Layout', () => {
      it('has max width constraint for readability', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} />
        );

        // Should have max-w-4xl for consistent width with Editor
        const maxWidthDiv = container.querySelector('.max-w-4xl');
        expect(maxWidthDiv).toBeInTheDocument();
      });

      it('centers content horizontally', () => {
        const { container } = render(
          <SourceEditor content="" onChange={vi.fn()} />
        );

        // Should be centered with mx-auto
        const centeredDiv = container.querySelector('.mx-auto');
        expect(centeredDiv).toBeInTheDocument();
      });

      it('has minimum height for usability', () => {
        render(<SourceEditor content="" onChange={vi.fn()} />);

        const textarea = screen.getByRole('textbox');
        // Should have min-h-[400px] for comfortable editing
        expect(textarea.className).toContain('min-h-[400px]');
      });
    });
  });
});
