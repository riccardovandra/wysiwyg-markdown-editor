import { describe, it, expect } from 'vitest';
import { serializeHtmlToMarkdown } from '../utils/markdownSerializer';
import { parseMarkdownToHtml } from '../utils/markdownParser';

describe('markdownSerializer', () => {
  describe('serializeHtmlToMarkdown', () => {
    it('should convert simple paragraph to markdown', () => {
      const html = '<p>Hello world</p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toBe('Hello world');
    });

    it('should convert headings', () => {
      expect(serializeHtmlToMarkdown('<h1>Title</h1>')).toBe('# Title');
      expect(serializeHtmlToMarkdown('<h2>Subtitle</h2>')).toBe('## Subtitle');
      expect(serializeHtmlToMarkdown('<h3>Section</h3>')).toBe('### Section');
    });

    it('should convert bold text', () => {
      const html = '<p><strong>bold text</strong></p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toBe('**bold text**');
    });

    it('should convert italic text', () => {
      const html = '<p><em>italic text</em></p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toBe('*italic text*');
    });

    it('should convert inline code', () => {
      const html = '<p><code>inline code</code></p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toBe('`inline code`');
    });

    it('should convert unordered lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toMatch(/-\s+Item 1/);
      expect(result).toMatch(/-\s+Item 2/);
    });

    it('should convert ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toMatch(/1\.\s+First/);
      expect(result).toMatch(/2\.\s+Second/);
    });

    it('should convert blockquotes', () => {
      const html = '<blockquote><p>Quote text</p></blockquote>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('> Quote text');
    });

    it('should convert links', () => {
      const html = '<p><a href="https://example.com">Link text</a></p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toBe('[Link text](https://example.com)');
    });

    it('should convert code blocks', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('```');
      expect(result).toContain('const x = 1;');
    });

    it('should handle empty input', () => {
      expect(serializeHtmlToMarkdown('')).toBe('');
      expect(serializeHtmlToMarkdown('<p></p>')).toBe('');
    });

    it('should handle multiple paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('First paragraph');
      expect(result).toContain('Second paragraph');
    });

    it('should convert unchecked task list items', () => {
      const html = '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Unchecked task</li></ul>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('[ ] Unchecked task');
    });

    it('should convert checked task list items', () => {
      const html = '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">Checked task</li></ul>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('[x] Checked task');
    });

    it('should convert multiple task list items', () => {
      const html = `<ul data-type="taskList">
        <li data-type="taskItem" data-checked="false">Task 1</li>
        <li data-type="taskItem" data-checked="true">Task 2</li>
        <li data-type="taskItem" data-checked="false">Task 3</li>
      </ul>`;
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('[ ] Task 1');
      expect(result).toContain('[x] Task 2');
      expect(result).toContain('[ ] Task 3');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve paragraph content', () => {
      const original = 'Hello world';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve headings', () => {
      const original = '# Main Title';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve bold text', () => {
      const original = '**bold text**';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve italic text', () => {
      const original = '*italic text*';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve unordered lists', () => {
      const original = '- Item 1\n- Item 2';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result).toMatch(/-\s+Item 1/);
      expect(result).toMatch(/-\s+Item 2/);
    });

    it('should preserve links', () => {
      const original = '[Link](https://example.com)';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve blockquotes', () => {
      const original = '> Quote text';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve inline code', () => {
      const original = '`inline code`';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result.trim()).toBe(original);
    });

    it('should preserve task list items', () => {
      const original = '- [ ] Task 1\n- [x] Task 2';
      const html = parseMarkdownToHtml(original);
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('[ ] Task 1');
      expect(result).toContain('[x] Task 2');
    });
  });

  describe('Story 13.1: Image serialization', () => {
    const baseUri = 'https://vscode-webview://abc/workspace/docs';

    it('serializes <img> with src and alt to markdown image syntax', () => {
      const html = '<p><img src="https://example.com/foo.png" alt="A foo"></p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('![A foo](https://example.com/foo.png)');
    });

    it('strips webview-prefixed src back to relative path', () => {
      const html = `<p><img src="${baseUri}/images/flow.png" alt="diagram"></p>`;
      const result = serializeHtmlToMarkdown(html, baseUri);
      expect(result).toContain('![diagram](./images/flow.png)');
      expect(result).not.toContain('vscode-webview');
    });

    it('leaves remote URLs unchanged when baseUri is provided', () => {
      const html = '<p><img src="https://example.com/foo.png" alt=""></p>';
      const result = serializeHtmlToMarkdown(html, baseUri);
      expect(result).toContain('![](https://example.com/foo.png)');
    });

    it('leaves data URIs unchanged when baseUri is provided', () => {
      const html =
        '<p><img src="data:image/png;base64,iVBORw0KGgo" alt=""></p>';
      const result = serializeHtmlToMarkdown(html, baseUri);
      expect(result).toContain('![](data:image/png;base64,iVBORw0KGgo)');
    });

    it('preserves alt as empty string when missing', () => {
      const html = '<p><img src="https://example.com/foo.png"></p>';
      const result = serializeHtmlToMarkdown(html);
      expect(result).toContain('![](https://example.com/foo.png)');
    });
  });

  describe('Story 13.1: Image round-trip preserves original paths', () => {
    const baseUri = 'https://vscode-webview://abc/workspace/docs';

    it('preserves a relative image path through parse→serialize', () => {
      const original = '![diagram](./images/flow.png)';
      const html = parseMarkdownToHtml(original, baseUri);
      const result = serializeHtmlToMarkdown(html, baseUri);
      expect(result.trim()).toBe(original);
    });

    it('preserves a remote image URL through parse→serialize', () => {
      const original = '![logo](https://example.com/logo.png)';
      const html = parseMarkdownToHtml(original, baseUri);
      const result = serializeHtmlToMarkdown(html, baseUri);
      expect(result.trim()).toBe(original);
    });

    it('never writes vscode-webview URIs back to markdown', () => {
      const original = '![](./flow.png)';
      const html = parseMarkdownToHtml(original, baseUri);
      // Sanity: the rewrite did happen in HTML
      expect(html).toContain(baseUri);
      const result = serializeHtmlToMarkdown(html, baseUri);
      expect(result).not.toContain('vscode-webview');
    });
  });
});
