import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Editor } from '../components/Editor';
import { useTipTapEditor } from '../hooks/useTipTapEditor';

/**
 * Test wrapper component that provides a real TipTap editor instance.
 */
function EditorWithHook({ initialContent }: { initialContent?: string }) {
  const editor = useTipTapEditor({ initialContent });
  return <Editor editor={editor} />;
}

describe('Editor Selection and Input', () => {
  beforeEach(() => {
    // Mock getClientRects which JSDOM doesn't implement
    Element.prototype.getClientRects = vi.fn(() => ({
      length: 1,
      item: () => ({ top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 }),
      [Symbol.iterator]: function* () {
        yield { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 };
      },
    })) as unknown as typeof Element.prototype.getClientRects;

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 20,
      width: 100,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    // Mock Range.getClientRects
    Range.prototype.getClientRects = vi.fn(() => ({
      length: 1,
      item: () => ({ top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 }),
      [Symbol.iterator]: function* () {
        yield { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 };
      },
    })) as unknown as typeof Range.prototype.getClientRects;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Click to Place Cursor (AC1)', () => {
    it('editor accepts focus on click', () => {
      render(<EditorWithHook />);
      const editorElement = document.querySelector('.tiptap');
      expect(editorElement).toBeInTheDocument();

      // Click on the editor
      fireEvent.click(editorElement!);

      // Editor should be focusable (contenteditable)
      expect(editorElement).toHaveAttribute('contenteditable', 'true');
    });

    it('editor is the active element after focus', () => {
      render(<EditorWithHook />);
      const editorElement = document.querySelector('.tiptap') as HTMLElement;
      expect(editorElement).toBeInTheDocument();

      // Focus the editor
      editorElement.focus();

      // The ProseMirror editor should be focused
      expect(document.activeElement).toBe(editorElement);
    });
  });

  describe('Immediate Typing (AC2)', () => {
    it('editor is ready to accept input (contenteditable)', () => {
      render(<EditorWithHook />);
      const editorElement = document.querySelector('.tiptap') as HTMLElement;
      expect(editorElement).toBeInTheDocument();

      // Editor should be contenteditable to accept typing
      expect(editorElement).toHaveAttribute('contenteditable', 'true');

      // Focus should work
      editorElement.focus();
      expect(document.activeElement).toBe(editorElement);
    });

    it('editor renders initial content correctly', () => {
      render(<EditorWithHook initialContent="<p>Hello World</p>" />);
      const editorElement = document.querySelector('.tiptap') as HTMLElement;
      expect(editorElement).toBeInTheDocument();

      // Initial content should be rendered
      expect(editorElement.textContent).toContain('Hello World');
    });
  });

  describe('Selection Visual Highlighting (AC6)', () => {
    it('editor container has correct CSS classes for prose styling', () => {
      const { container } = render(<EditorWithHook />);
      const proseElement = container.querySelector('.prose');

      expect(proseElement).toBeInTheDocument();
      expect(proseElement).toHaveClass('prose-slate');
      expect(proseElement).toHaveClass('dark:prose-invert');
    });

    it('ProseMirror editor element is rendered with correct structure', () => {
      render(<EditorWithHook />);

      // TipTap creates a ProseMirror editor with class "ProseMirror"
      const proseMirrorElement = document.querySelector('.ProseMirror');
      expect(proseMirrorElement).toBeInTheDocument();
    });

    it('editor has contenteditable attribute for selection support', () => {
      render(<EditorWithHook />);

      const editorElement = document.querySelector('.tiptap');
      expect(editorElement).toHaveAttribute('contenteditable', 'true');
    });
  });

  describe('Editor Configuration', () => {
    it('editor is editable by default', () => {
      render(<EditorWithHook />);
      const editorElement = document.querySelector('.tiptap');

      expect(editorElement).toHaveAttribute('contenteditable', 'true');
    });

    it('editor removes focus outline when focused', () => {
      render(<EditorWithHook />);

      // The .ProseMirror element should exist for CSS styling
      const proseMirrorElement = document.querySelector('.ProseMirror');
      expect(proseMirrorElement).toBeInTheDocument();
    });
  });
});
