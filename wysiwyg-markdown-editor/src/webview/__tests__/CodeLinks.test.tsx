import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTipTapEditor } from '../hooks/useTipTapEditor';
import { findUrls } from '../extensions/CodeLinks';

describe('findUrls', () => {
  it('finds a plain https URL', () => {
    expect(findUrls('see https://example.com/docs for details')).toEqual([
      { url: 'https://example.com/docs', start: 4, end: 28 },
    ]);
  });

  it('finds http and file URLs', () => {
    const urls = findUrls('http://a.com and file:///tmp/notes.md').map((m) => m.url);
    expect(urls).toEqual(['http://a.com', 'file:///tmp/notes.md']);
  });

  it('drops the closing paren of markdown link syntax', () => {
    const [match] = findUrls('[`offer.md`](https://github.com/org/repo/blob/abc/offer.md) and more');
    expect(match.url).toBe('https://github.com/org/repo/blob/abc/offer.md');
    expect(match.end - match.start).toBe(match.url.length);
  });

  it('keeps balanced parens inside the URL', () => {
    const [match] = findUrls('https://en.wikipedia.org/wiki/Foo_(bar)');
    expect(match.url).toBe('https://en.wikipedia.org/wiki/Foo_(bar)');
  });

  it('strips sentence punctuation', () => {
    expect(findUrls('Go to https://example.com.').map((m) => m.url)).toEqual(['https://example.com']);
    expect(findUrls('Go to https://example.com/a),').map((m) => m.url)).toEqual(['https://example.com/a']);
  });

  it('stops at quotes and backticks', () => {
    expect(findUrls('url = "https://example.com/x"').map((m) => m.url)).toEqual(['https://example.com/x']);
    expect(findUrls('`https://example.com/y`').map((m) => m.url)).toEqual(['https://example.com/y']);
  });

  it('returns nothing for text without absolute URLs', () => {
    expect(findUrls('see ./docs/offer.md or www.example.com')).toEqual([]);
  });
});

describe('CodeLinks extension', () => {
  async function createEditor() {
    const { result } = renderHook(() => useTipTapEditor());
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    return result.current!;
  }

  it('decorates URLs inside code blocks', async () => {
    const editor = await createEditor();
    act(() => {
      editor.commands.setContent(
        '<pre><code>See [`offer.md`](https://github.com/org/repo/blob/abc/offer.md) and https://example.com.</code></pre>',
      );
    });

    // Syntax highlighting may split one URL into several fragments; every
    // fragment carries the full href and together they spell the URL.
    const links = Array.from(editor.view.dom.querySelectorAll('.code-link'));
    const byHref = new Map<string, string>();
    for (const el of links) {
      const href = el.getAttribute('data-href')!;
      byHref.set(href, (byHref.get(href) ?? '') + el.textContent);
    }
    expect(Array.from(byHref.keys())).toEqual([
      'https://github.com/org/repo/blob/abc/offer.md',
      'https://example.com',
    ]);
    for (const [href, text] of byHref) {
      expect(text).toBe(href);
    }
  });

  it('decorates URLs inside inline code', async () => {
    const editor = await createEditor();
    act(() => {
      editor.commands.setContent('<p>Run <code>curl https://api.example.com/v1</code> first.</p>');
    });

    const link = editor.view.dom.querySelector('.code-link');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('data-href')).toBe('https://api.example.com/v1');
    expect(link!.closest('code')).not.toBeNull();
  });

  it('does not decorate URLs in regular prose', async () => {
    const editor = await createEditor();
    act(() => {
      editor.commands.setContent('<p>Visit https://example.com today</p>');
    });

    expect(editor.view.dom.querySelector('.code-link')).toBeNull();
  });

  it('does not change the document or its HTML output', async () => {
    const editor = await createEditor();
    const html = '<pre><code>https://example.com</code></pre>';
    act(() => {
      editor.commands.setContent(html);
    });

    expect(editor.getHTML()).not.toContain('code-link');
    expect(editor.getHTML()).not.toContain('data-href');
  });

  it('updates decorations as the code is edited', async () => {
    const editor = await createEditor();
    act(() => {
      editor.commands.setContent('<pre><code>https://example.co</code></pre>');
    });
    expect(editor.view.dom.querySelector('.code-link')!.getAttribute('data-href')).toBe('https://example.co');

    act(() => {
      // Append plain text at the end of the code block's content
      // (the code block is the first node; the editor appends a trailing paragraph after it)
      const endOfCode = editor.state.doc.firstChild!.nodeSize - 1;
      editor.view.dispatch(editor.state.tr.insertText('m/path', endOfCode));
    });
    expect(editor.view.dom.querySelector('.code-link')!.getAttribute('data-href')).toBe('https://example.com/path');
  });
});
