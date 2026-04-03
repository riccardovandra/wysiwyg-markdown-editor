import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTipTapEditor } from '../hooks/useTipTapEditor';

describe('HeadingWithId Extension (Story 11-7)', () => {
  describe('heading ID generation', () => {
    it('generates ID for simple heading', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent('<h1>Setup</h1>');
      });

      const html = editor.getHTML();
      expect(html).toContain('id="setup"');
    });

    it('generates slugified ID with hyphens', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent('<h2>API Reference</h2>');
      });

      const html = editor.getHTML();
      expect(html).toContain('id="api-reference"');
    });

    it('removes special characters from ID', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent("<h2>What's New?</h2>");
      });

      const html = editor.getHTML();
      expect(html).toContain('id="whats-new"');
    });

    it('handles duplicate headings with suffix', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent(`
          <h2>Setup</h2>
          <p>First setup section</p>
          <h2>Setup</h2>
          <p>Second setup section</p>
        `);
      });

      const html = editor.getHTML();
      expect(html).toContain('id="setup"');
      expect(html).toContain('id="setup-1"');
    });

    it('generates IDs for multiple heading levels', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      act(() => {
        editor.commands.setContent(`
          <h1>Main Title</h1>
          <h2>Section One</h2>
          <h3>Subsection</h3>
        `);
      });

      const html = editor.getHTML();
      expect(html).toContain('id="main-title"');
      expect(html).toContain('id="section-one"');
      expect(html).toContain('id="subsection"');
    });
  });

  describe('ID persistence on content updates', () => {
    it('maintains stable IDs when content is edited', async () => {
      const { result } = renderHook(() => useTipTapEditor());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const editor = result.current!;

      // Set initial content
      act(() => {
        editor.commands.setContent('<h1>Original Title</h1><p>Content</p>');
      });

      let html = editor.getHTML();
      expect(html).toContain('id="original-title"');

      // Update heading text
      act(() => {
        editor.commands.setContent('<h1>Updated Title</h1><p>Content</p>');
      });

      html = editor.getHTML();
      expect(html).toContain('id="updated-title"');
      expect(html).not.toContain('id="original-title"');
    });
  });
});
