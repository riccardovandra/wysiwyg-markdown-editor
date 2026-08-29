import { Node, mergeAttributes } from '@tiptap/core';
import { newCommentId } from './CommentMark';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentAnchor: {
      /** Insert an anchor-only comment at a position (used for code blocks and other non-text targets). */
      addCommentAnchor: (pos: number, note: string) => ReturnType;
    };
  }
}

function parseThread(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Anchor-only comment: a comment that has no highlighted text.
 *
 * HTML:     <span data-type="comment-anchor" data-comment-id="c2" data-thread='["note"]'></span>
 * Markdown: {>>note<<}
 *
 * Rendered as a small pin in the text; the note lives in the margin bubble.
 */
export const CommentAnchor = Node.create({
  name: 'commentAnchor',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => ({ 'data-comment-id': attributes.id }),
      },
      thread: {
        default: [],
        parseHTML: (element) => parseThread(element.getAttribute('data-thread')),
        renderHTML: (attributes) => ({ 'data-thread': JSON.stringify(attributes.thread ?? []) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="comment-anchor"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'comment-anchor', class: 'comment-anchor' }),
    ];
  },

  addCommands() {
    return {
      addCommentAnchor:
        (pos, note) =>
        ({ state, tr, dispatch }) => {
          const id = newCommentId(state.doc);
          if (dispatch) {
            // An anchor needs an inline parent. After a block (e.g. a code block)
            // we add a paragraph to hold it.
            const $pos = state.doc.resolve(pos);
            if ($pos.parent.inlineContent) {
              tr.insert(pos, this.type.create({ id, thread: [note] }));
            } else {
              const paragraph = state.schema.nodes.paragraph.create(null, this.type.create({ id, thread: [note] }));
              tr.insert(pos, paragraph);
            }
          }
          return true;
        },
    };
  },
});
