import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTipTapEditor } from '../hooks/useTipTapEditor';
import { serializeHtmlToMarkdown } from '../utils/markdownSerializer';

describe('Content Sync (Story 2.5)', () => {
  describe('Task 3: useTipTapEditor onUpdate callback', () => {
    it('should call onUpdate when editor content changes', async () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        useTipTapEditor({ onUpdate })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      // Trigger a content update
      act(() => {
        editor.commands.setContent('<p>New content</p>');
      });

      expect(onUpdate).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalledWith(expect.stringContaining('New content'));
    });

    it('should call onUpdate with HTML content', async () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        useTipTapEditor({ onUpdate })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent('<h1>Title</h1><p>Paragraph</p>');
      });

      // Headings now have auto-generated IDs via HeadingWithId extension
      expect(onUpdate).toHaveBeenCalledWith(
        expect.stringMatching(/<h1.*>/)
      );
    });

    it('should not call onUpdate when no callback provided', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      // This should not throw
      expect(() => {
        act(() => {
          editor.commands.setContent('<p>Test</p>');
        });
      }).not.toThrow();
    });
  });
});

describe('Save Document (Story 2.6)', () => {
  describe('Flush mechanism', () => {
    it('should serialize editor HTML to markdown for flush', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent('<h1>Title</h1><p>Content</p>');
      });

      const html = editor.getHTML();
      const markdown = serializeHtmlToMarkdown(html);

      expect(markdown).toContain('# Title');
      expect(markdown).toContain('Content');
    });

    it('should handle empty editor for flush', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;
      const html = editor.getHTML();
      const markdown = serializeHtmlToMarkdown(html);

      // Empty editor should not throw
      expect(markdown).toBeDefined();
    });
  });
});
