import { describe, it, expect } from 'vitest';
import { parseMarkdownToHtml } from '../utils/markdownParser';

describe('markdownParser', () => {
  describe('parseMarkdownToHtml', () => {
    it('should convert headings (h1-h6)', () => {
      expect(parseMarkdownToHtml('# Heading 1')).toContain('<h1>Heading 1</h1>');
      expect(parseMarkdownToHtml('## Heading 2')).toContain('<h2>Heading 2</h2>');
      expect(parseMarkdownToHtml('### Heading 3')).toContain('<h3>Heading 3</h3>');
      expect(parseMarkdownToHtml('#### Heading 4')).toContain('<h4>Heading 4</h4>');
      expect(parseMarkdownToHtml('##### Heading 5')).toContain('<h5>Heading 5</h5>');
      expect(parseMarkdownToHtml('###### Heading 6')).toContain('<h6>Heading 6</h6>');
    });

    it('should convert bold text', () => {
      const html = parseMarkdownToHtml('This is **bold** text');
      expect(html).toContain('<strong>bold</strong>');
    });

    it('should convert italic text', () => {
      const html = parseMarkdownToHtml('This is *italic* text');
      expect(html).toContain('<em>italic</em>');
    });

    it('should convert unordered lists', () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('<li>Item 3</li>');
    });

    it('should convert ordered lists', () => {
      const markdown = `1. First
2. Second
3. Third`;
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>First</li>');
      expect(html).toContain('<li>Second</li>');
      expect(html).toContain('<li>Third</li>');
    });

    it('should convert links', () => {
      const html = parseMarkdownToHtml('[Click here](https://example.com)');
      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Click here</a>');
    });

    it('should convert blockquotes', () => {
      const html = parseMarkdownToHtml('> This is a quote');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote');
    });

    it('should convert horizontal rules', () => {
      const html = parseMarkdownToHtml('---');
      expect(html).toContain('<hr');
    });

    it('should handle paragraphs with proper spacing', () => {
      const markdown = `First paragraph.

Second paragraph.`;
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('<p>First paragraph.</p>');
      expect(html).toContain('<p>Second paragraph.</p>');
    });

    it('should handle empty input', () => {
      expect(parseMarkdownToHtml('')).toBe('');
    });

    it('should handle combined formatting', () => {
      const html = parseMarkdownToHtml('This is ***bold and italic*** text');
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
    });

    it('should convert unchecked task list items', () => {
      const markdown = '- [ ] Unchecked task';
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('data-type="taskItem"');
      expect(html).toContain('data-checked="false"');
    });

    it('should convert checked task list items', () => {
      const markdown = '- [x] Checked task';
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('data-type="taskItem"');
      expect(html).toContain('data-checked="true"');
    });

    it('should convert multiple task list items', () => {
      const markdown = `- [ ] Task 1
- [x] Task 2
- [ ] Task 3`;
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('data-type="taskList"');
      const taskItemMatches = html.match(/data-type="taskItem"/g);
      expect(taskItemMatches?.length).toBe(3);
    });

    it('should handle mixed task and regular list items', () => {
      const markdown = `- [ ] Task item
- Regular item`;
      const html = parseMarkdownToHtml(markdown);
      expect(html).toContain('data-type="taskItem"');
      expect(html).toContain('<li>Regular item</li>');
    });
  });

  describe('performance', () => {
    it('should parse 10,000 lines in under 500ms (AC10)', () => {
      // Generate a large markdown file with 10,000 lines
      const lines: string[] = [];
      for (let i = 0; i < 10000; i++) {
        const lineType = i % 5;
        switch (lineType) {
          case 0:
            lines.push(`## Heading ${i}`);
            break;
          case 1:
            lines.push(`This is paragraph ${i} with **bold** and *italic* text.`);
            break;
          case 2:
            lines.push(`- List item ${i}`);
            break;
          case 3:
            lines.push(`> Blockquote line ${i}`);
            break;
          case 4:
            lines.push(`[Link ${i}](https://example.com/${i})`);
            break;
        }
      }
      const largeMarkdown = lines.join('\n');

      const startTime = performance.now();
      const html = parseMarkdownToHtml(largeMarkdown);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify parsing succeeded
      expect(html).toContain('<h2>');
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<a');

      // Verify performance requirement: < 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});
