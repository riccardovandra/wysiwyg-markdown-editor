import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface CommentRange {
  from: number;
  to: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /** Highlight a range and start its thread with one note. */
      addComment: (range: CommentRange, note: string) => ReturnType;
      /** Replace the thread (notes) of a comment, wherever its highlight lives. */
      setCommentThread: (id: string, thread: string[]) => ReturnType;
      /** Remove the highlight (and any anchor) of a comment. The text stays. */
      removeComment: (id: string) => ReturnType;
      /** Show a temporary highlight while the user is writing a comment. */
      setPendingComment: (range: CommentRange | null) => ReturnType;
    };
  }
}

export const pendingCommentKey = new PluginKey<CommentRange | null>('pendingComment');

function parseThread(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

let counter = 0;
export function newCommentId(doc: ProseMirrorNode): string {
  const used = new Set<string>();
  doc.descendants((node) => {
    node.marks.forEach((m) => {
      if (m.type.name === 'comment') used.add(m.attrs.id);
    });
    if (node.type.name === 'commentAnchor') used.add(node.attrs.id);
  });
  let id: string;
  do {
    counter += 1;
    id = `c${counter}`;
  } while (used.has(id));
  return id;
}

/**
 * Comment highlight.
 *
 * HTML:     <mark data-comment-id="c1" data-thread='["note","Claude: reply"]'>text</mark>
 * Markdown: {==text==}{>>note<<}{>>Claude: reply<<}
 *
 * The thread travels inside the mark so the document stays the single source
 * of truth: external edits to the file update the margin on reload.
 */
export const CommentMark = Mark.create({
  name: 'comment',

  // Render outside every other mark so a highlight spanning bold/code is one <mark>.
  priority: 1000,
  inclusive: false,
  excludes: '',

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
    return [{ tag: 'mark[data-comment-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes, { class: 'comment-mark' }), 0];
  },

  addCommands() {
    return {
      addComment:
        (range, note) =>
        ({ state, tr, dispatch }) => {
          if (range.from >= range.to) return false;
          const id = newCommentId(state.doc);
          if (dispatch) {
            tr.addMark(range.from, range.to, this.type.create({ id, thread: [note] }));
            tr.setMeta(pendingCommentKey, null);
          }
          return true;
        },

      setCommentThread:
        (id, thread) =>
        ({ state, tr, dispatch }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.isText) {
              const mark = node.marks.find((m) => m.type === this.type && m.attrs.id === id);
              if (mark) {
                found = true;
                if (dispatch) {
                  tr.removeMark(pos, pos + node.nodeSize, mark);
                  tr.addMark(pos, pos + node.nodeSize, this.type.create({ id, thread }));
                }
              }
            } else if (node.type.name === 'commentAnchor' && node.attrs.id === id) {
              found = true;
              if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, thread });
            }
          });
          return found;
        },

      removeComment:
        (id) =>
        ({ state, tr, dispatch }) => {
          let found = false;
          const anchors: number[] = [];
          state.doc.descendants((node, pos) => {
            if (node.isText) {
              const mark = node.marks.find((m) => m.type === this.type && m.attrs.id === id);
              if (mark) {
                found = true;
                if (dispatch) tr.removeMark(pos, pos + node.nodeSize, mark);
              }
            } else if (node.type.name === 'commentAnchor' && node.attrs.id === id) {
              found = true;
              anchors.push(pos);
            }
          });
          if (dispatch) {
            // Delete anchors last-to-first so earlier positions stay valid.
            anchors.reverse().forEach((pos) => tr.delete(pos, pos + 1));
          }
          return found;
        },

      setPendingComment:
        (range) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(pendingCommentKey, range);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<CommentRange | null>({
        key: pendingCommentKey,
        state: {
          init: () => null,
          apply(tr, value) {
            const meta = tr.getMeta(pendingCommentKey);
            if (meta !== undefined) return meta;
            if (!value) return null;
            if (!tr.docChanged) return value;
            return { from: tr.mapping.map(value.from), to: tr.mapping.map(value.to) };
          },
        },
        props: {
          decorations(state) {
            const range = pendingCommentKey.getState(state);
            if (!range || range.from >= range.to) return DecorationSet.empty;
            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, { class: 'comment-mark comment-pending' }),
            ]);
          },
        },
      }),
    ];
  },
});
