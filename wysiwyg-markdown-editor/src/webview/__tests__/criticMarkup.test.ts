import { describe, it, expect } from 'vitest';
import {
  extractComments,
  criticMarkupToHtml,
  notesToCriticMarkup,
  removedComments,
} from '../../shared/criticMarkup';
import { parseMarkdownToHtml } from '../utils/markdownParser';
import { serializeHtmlToMarkdown } from '../utils/markdownSerializer';

describe('extractComments', () => {
  it('reads a highlight with one note', () => {
    expect(extractComments('Some {==bold claim==}{>>soften this<<} here.')).toEqual([
      { anchor: 'bold claim', notes: ['soften this'] },
    ]);
  });

  it('reads a thread of adjacent notes', () => {
    expect(extractComments('{==x==}{>>first<<}{>>Claude: done<<}')).toEqual([
      { anchor: 'x', notes: ['first', 'Claude: done'] },
    ]);
  });

  it('reads an anchor-only comment', () => {
    expect(extractComments('Paragraph.{>>rewrite this paragraph<<}')).toEqual([
      { anchor: '', notes: ['rewrite this paragraph'] },
    ]);
  });

  it('joins highlights that span paragraphs into one comment', () => {
    const md = 'A {==end of one==}\n\n{==start of two==}{>>merge these<<}';
    expect(extractComments(md)).toEqual([{ anchor: 'end of one\nstart of two', notes: ['merge these'] }]);
  });

  it('ignores comment syntax inside fenced code and inline code', () => {
    const md = [
      'Use `{==x==}{>>not a comment<<}` literally.',
      '',
      '```md',
      '{==in a fence==}{>>not a comment either<<}',
      '```',
      '',
      '{==real==}{>>real note<<}',
    ].join('\n');
    expect(extractComments(md)).toEqual([{ anchor: 'real', notes: ['real note'] }]);
  });

  it('returns nothing for a document without comments', () => {
    expect(extractComments('# Title\n\nPlain text.')).toEqual([]);
  });
});

describe('criticMarkupToHtml', () => {
  it('turns a highlight into a mark carrying its thread', () => {
    expect(criticMarkupToHtml('a {==b==}{>>n<<} c')).toBe(
      'a <mark data-comment-id="c1" data-thread="[&quot;n&quot;]">b</mark> c',
    );
  });

  it('turns an anchor-only comment into a span', () => {
    expect(criticMarkupToHtml('a{>>n<<}')).toBe(
      'a<span data-type="comment-anchor" data-comment-id="c1" data-thread="[&quot;n&quot;]"></span>',
    );
  });

  it('gives paragraph-spanning highlights one id', () => {
    const html = criticMarkupToHtml('{==a==}\n\n{==b==}{>>n<<}');
    expect(html).toBe(
      '<mark data-comment-id="c1" data-thread="[&quot;n&quot;]">a</mark>\n\n<mark data-comment-id="c1" data-thread="[&quot;n&quot;]">b</mark>',
    );
  });

  it('leaves code untouched and returns input unchanged without comments', () => {
    const md = 'Use `{==x==}{>>y<<}` literally.';
    expect(criticMarkupToHtml(md)).toBe(md);
    expect(criticMarkupToHtml('plain')).toBe('plain');
  });
});

describe('removedComments', () => {
  it('reports comments that vanished between two versions', () => {
    const before = 'A {==x==}{>>fix x<<} and {==y==}{>>fix y<<}';
    const after = 'A X and {==y==}{>>fix y<<}';
    expect(removedComments(before, after)).toEqual([{ anchor: 'x', notes: ['fix x'] }]);
  });

  it('does not report a comment that only gained a reply', () => {
    const before = '{==x==}{>>fix x<<}';
    const after = '{==x==}{>>fix x<<}{>>Claude: which way?<<}';
    expect(removedComments(before, after)).toEqual([]);
  });
});

describe('comment round trip through parser and serializer', () => {
  const roundTrip = (md: string): string => serializeHtmlToMarkdown(parseMarkdownToHtml(md));

  it('keeps a highlight with inline formatting and a thread', () => {
    const md = 'Intro {==**bold** and `code`==}{>>note<<}{>>Claude: reply<<} outro.';
    expect(roundTrip(md)).toBe(md);
  });

  it('keeps an anchor-only comment', () => {
    const md = 'A paragraph.{>>rewrite<<}';
    expect(roundTrip(md)).toBe(md);
  });

  it('keeps a comment that sits alone after a code block', () => {
    const md = '```ts\nconst a = 1;\n```\n\n{>>use a for loop<<}\n\nAfter.';
    expect(roundTrip(md)).toBe(md);
  });

  it('keeps a comment inside a heading and a list item', () => {
    const md = '# Title {==here==}{>>shorter<<}\n\n- item {==one==}{>>drop<<}\n- item two';
    // turndown writes list items as "-   item"; the comments must survive untouched.
    expect(roundTrip(md)).toBe('# Title {==here==}{>>shorter<<}\n\n-   item {==one==}{>>drop<<}\n-   item two');
  });

  it('keeps a comment inside a table cell', () => {
    const md = '| A | B |\n| --- | --- |\n| {==x==}{>>check<<} | y |';
    expect(roundTrip(md)).toBe(md);
  });

  it('writes the thread once for a highlight that spans paragraphs', () => {
    const md = 'One {==end==}\n\n{==start==}{>>merge<<} two.';
    expect(roundTrip(md)).toBe(md);
  });

  it('parses the highlight into a mark the editor understands', () => {
    const html = parseMarkdownToHtml('a {==b==}{>>n<<}');
    expect(html).toContain('<mark data-comment-id="c1" data-thread="[&quot;n&quot;]">b</mark>');
  });

  it('serializes notes with notesToCriticMarkup', () => {
    expect(notesToCriticMarkup(['a', 'b'])).toBe('{>>a<<}{>>b<<}');
  });
});
