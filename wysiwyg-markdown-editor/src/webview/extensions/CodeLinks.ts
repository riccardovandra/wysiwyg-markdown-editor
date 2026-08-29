import { Extension } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const codeLinksPluginKey = new PluginKey('codeLinks');

/** Absolute URLs only. Relative paths inside code are too ambiguous to linkify. */
const URL_PATTERN = /\b(?:https?|file):\/\/[^\s<>"'`]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;

export interface UrlMatch {
  url: string;
  /** Offset of the first character of the URL within the scanned text */
  start: number;
  /** Offset just past the last character of the URL */
  end: number;
}

function count(text: string, char: string): number {
  let n = 0;
  for (const c of text) {
    if (c === char) {n++;}
  }
  return n;
}

/** True when the URL ends with a closing bracket that has no matching opener inside it. */
function endsWithUnbalancedClose(url: string): boolean {
  const last = url[url.length - 1];
  const open = last === ')' ? '(' : last === ']' ? '[' : null;
  return open !== null && count(url, open) < count(url, last);
}

/**
 * Strip punctuation that belongs to the surrounding text rather than the URL,
 * e.g. the trailing ")" in "[text](https://example.com)" or the "." ending a sentence.
 * Balanced brackets are kept so "https://en.wikipedia.org/wiki/Foo_(bar)" survives.
 */
function trimUrl(url: string): string {
  let result = url;
  for (;;) {
    let next = result.replace(TRAILING_PUNCTUATION, '');
    if (endsWithUnbalancedClose(next)) {
      next = next.slice(0, -1);
    }
    if (next === result) {return result;}
    result = next;
  }
}

/**
 * Find every absolute URL in a piece of plain text.
 */
export function findUrls(text: string): UrlMatch[] {
  const matches: UrlMatch[] = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimUrl(match[0]);
    if (!url) {continue;}
    const start = match.index ?? 0;
    matches.push({ url, start, end: start + url.length });
  }
  return matches;
}

function linkDecoration(from: number, to: number, url: string): Decoration {
  return Decoration.inline(from, to, { class: 'code-link', 'data-href': url });
}

function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name === 'codeBlock') {
      // Code blocks hold unmarked text only, so text offsets map 1:1 to positions after the opening tag.
      for (const m of findUrls(node.textContent)) {
        decorations.push(linkDecoration(pos + 1 + m.start, pos + 1 + m.end, m.url));
      }
      return false;
    }

    if (node.isText && node.text && node.marks.some((mark) => mark.type.name === 'code')) {
      for (const m of findUrls(node.text)) {
        decorations.push(linkDecoration(pos + m.start, pos + m.end, m.url));
      }
    }

    return true;
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Makes URLs inside code blocks and inline code clickable.
 *
 * Markdown never turns text inside backticks or fences into a link, so the
 * Link mark cannot apply there. This extension overlays a decoration
 * (`<span class="code-link" data-href="...">`) on every absolute URL in code
 * without touching the document, so serialization is unaffected. Clicks are
 * picked up by useLinkClickHandler via the data-href attribute.
 */
export const CodeLinks = Extension.create({
  name: 'codeLinks',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: codeLinksPluginKey,
        state: {
          init: (_config, state) => buildDecorations(state.doc),
          apply: (tr, previous) => (tr.docChanged ? buildDecorations(tr.doc) : previous),
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
