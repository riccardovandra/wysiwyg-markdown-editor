import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

/** Width of a margin bubble, in px. */
export const BUBBLE_WIDTH = 260;
const GAP = 16;
const STACK_GAP = 10;
/** Pins sit inside the card's left padding so they are never clipped. */
const COMPACT_PIN_LEFT = 8;
const COMPACT_STACK = 28;
/** Reading column width the card is designed for (Tailwind max-w-4xl). */
const CARD_MAX_WIDTH = 896;
/** Below this card width, reserving a gutter is worse than pins. */
const MIN_CARD_WIDTH = 520;

/**
 * margin:   enough free space left of the centered card, bubbles live there.
 * reserved: the pane is narrower, the layout reserves a gutter and the card shifts right.
 * compact:  no room for either, comments collapse to pins inside the card.
 */
type LayoutMode = 'margin' | 'reserved' | 'compact';

export function pickLayoutMode(paneWidth: number, hasComments: boolean): LayoutMode {
  const gutter = BUBBLE_WIDTH + GAP;
  const free = Math.max(0, (paneWidth - CARD_MAX_WIDTH) / 2);
  if (free >= gutter) return 'margin';
  if (!hasComments) return 'margin';
  if (paneWidth - gutter >= MIN_CARD_WIDTH) return 'reserved';
  return 'compact';
}

export interface CommentItem {
  id: string;
  /** Document position of the first highlighted character (or the anchor node). */
  from: number;
  /** Highlighted text; empty for anchor-only comments. */
  anchorText: string;
  thread: string[];
  kind: 'mark' | 'anchor';
}

/** Collects every comment in the document, in document order. */
export function collectComments(doc: ProseMirrorNode): CommentItem[] {
  const items = new Map<string, CommentItem & { lastEnd: number }>();
  doc.descendants((node, pos) => {
    if (node.isText) {
      const mark = node.marks.find((m) => m.type.name === 'comment');
      if (!mark) return;
      const text = node.text ?? '';
      const existing = items.get(mark.attrs.id);
      if (existing) {
        existing.anchorText += (pos > existing.lastEnd ? ' ' : '') + text;
        existing.lastEnd = pos + node.nodeSize;
      } else {
        items.set(mark.attrs.id, {
          id: mark.attrs.id,
          from: pos,
          anchorText: text,
          thread: mark.attrs.thread ?? [],
          kind: 'mark',
          lastEnd: pos + node.nodeSize,
        });
      }
    } else if (node.type.name === 'commentAnchor') {
      items.set(node.attrs.id, {
        id: node.attrs.id,
        from: pos,
        anchorText: '',
        thread: node.attrs.thread ?? [],
        kind: 'anchor',
        lastEnd: pos + 1,
      });
    }
  });
  return [...items.values()]
    .sort((a, b) => a.from - b.from)
    .map(({ lastEnd: _lastEnd, ...item }) => item);
}

const AGENT_PREFIX = /^(Claude|Agent|AI)\s*:\s*/i;

/** Splits a note into who wrote it and what they wrote. */
export function describeNote(note: string): { author: 'You' | 'Claude'; text: string } {
  const match = AGENT_PREFIX.exec(note);
  return match ? { author: 'Claude', text: note.slice(match[0].length) } : { author: 'You', text: note };
}

type Draft =
  | { kind: 'range'; from: number; to: number }
  | { kind: 'anchor'; pos: number; from: number };

interface SelectionTarget {
  from: number;
  to: number;
  /** Set when the selection is inside a code block: the comment anchors after the block. */
  anchorAfter?: number;
  left: number;
  top: number;
}

interface CommentGutterProps {
  editor: Editor | null;
  /** The positioned element the bubbles are laid out against (the card wrapper). */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Margin comments: the floating "Comment" button over a selection, the
 * composer, and one bubble per comment in the left margin. When the window is
 * too narrow for a margin, comments collapse to pins that open on click.
 */
export function CommentGutter({ editor, containerRef }: CommentGutterProps) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [rawTops, setRawTops] = useState<Record<string, number>>({});
  const [tops, setTops] = useState<Record<string, number>>({});
  const [target, setTarget] = useState<SelectionTarget | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [mode, setMode] = useState<LayoutMode>('margin');
  const compact = mode === 'compact';
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const bubbleRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingDraftRef = useRef(false);

  const refresh = useCallback(() => {
    if (!editor || editor.isDestroyed || !containerRef.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top;
    const next = collectComments(editor.state.doc);
    const nextTops: Record<string, number> = {};
    const topFor = (pos: number): number => {
      try {
        return Math.max(0, editor.view.coordsAtPos(pos).top - containerTop);
      } catch {
        return 0;
      }
    };
    next.forEach((item) => {
      nextTops[item.id] = topFor(item.from);
    });
    setItems(next);
    setRawTops(nextTops);
    const pane = containerRef.current.parentElement?.clientWidth ?? window.innerWidth;
    const nextMode = pickLayoutMode(pane, next.length > 0 || pendingDraftRef.current);
    setMode(nextMode);
    // The wrapper reserves the gutter through this variable (see .comment-layout in index.css).
    containerRef.current.style.setProperty('--comment-gutter', nextMode === 'reserved' ? `${BUBBLE_WIDTH + GAP}px` : '0px');
  }, [editor, containerRef]);

  // Keep the list in sync with the document.
  useEffect(() => {
    if (!editor) return;
    refresh();
    editor.on('transaction', refresh);
    window.addEventListener('resize', refresh);
    // ResizeObserver is absent in jsdom (tests); positions still refresh on transactions.
    const observer =
      containerRef.current && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
    if (observer && containerRef.current) observer.observe(containerRef.current);
    return () => {
      editor.off('transaction', refresh);
      window.removeEventListener('resize', refresh);
      observer?.disconnect();
    };
  }, [editor, refresh, containerRef]);

  // Track the selection to show the floating button.
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      if (editor.isDestroyed || !containerRef.current) return;
      const { state } = editor;
      const { selection } = state;
      if (selection.empty || !(selection instanceof TextSelection) || !editor.view.hasFocus()) {
        setTarget(null);
        return;
      }
      const { from, to } = selection;
      const commentType = state.schema.marks.comment;
      if (commentType && state.doc.rangeHasMark(from, to, commentType)) {
        setTarget(null);
        return;
      }
      let anchorAfter: number | undefined;
      const $from = selection.$from;
      if ($from.parent.type.name === 'codeBlock') {
        anchorAfter = $from.after($from.depth);
      }
      const rect = containerRef.current.getBoundingClientRect();
      try {
        const coords = editor.view.coordsAtPos(from);
        setTarget({ from, to, anchorAfter, left: coords.left - rect.left, top: coords.top - rect.top });
      } catch {
        setTarget(null);
      }
    };
    editor.on('selectionUpdate', update);
    editor.on('focus', update);
    editor.on('blur', () => setTarget(null));
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('focus', update);
    };
  }, [editor, containerRef]);

  // Second pass: push bubbles down so they never overlap.
  useLayoutEffect(() => {
    const entries = [...items.map((i) => i.id), ...(draft ? ['draft'] : [])]
      .map((id) => ({ id, top: rawTops[id] ?? 0 }))
      .sort((a, b) => a.top - b.top);
    const next: Record<string, number> = {};
    let floor = -Infinity;
    entries.forEach(({ id, top }) => {
      const placed = Math.max(top, floor);
      next[id] = placed;
      const height = compact ? COMPACT_STACK - STACK_GAP : (bubbleRefs.current.get(id)?.offsetHeight ?? 0);
      floor = placed + height + STACK_GAP;
    });
    const changed = Object.keys(next).some((k) => next[k] !== tops[k]) || Object.keys(next).length !== Object.keys(tops).length;
    if (changed) setTops(next);
  }, [items, rawTops, draft, compact, tops]);

  // Highlight the text of the hovered bubble.
  useEffect(() => {
    if (!editor) return;
    const root = editor.view.dom;
    root.querySelectorAll('.comment-active').forEach((el) => el.classList.remove('comment-active'));
    if (activeId) {
      root
        .querySelectorAll(`[data-comment-id="${activeId}"]`)
        .forEach((el) => el.classList.add('comment-active'));
    }
  }, [editor, activeId, items]);

  // Clicking a highlight jumps to its bubble.
  useEffect(() => {
    if (!editor) return;
    const root = editor.view.dom;
    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest?.('[data-comment-id]');
      const id = el?.getAttribute('data-comment-id');
      if (!id) return;
      setOpenId(id);
      setFlashId(id);
      bubbleRefs.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      window.setTimeout(() => setFlashId((current) => (current === id ? null : current)), 900);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [editor]);

  const openComposer = useCallback(() => {
    if (!editor || !target) return;
    if (target.anchorAfter !== undefined) {
      setDraft({ kind: 'anchor', pos: target.anchorAfter, from: target.from });
    } else {
      editor.commands.setPendingComment({ from: target.from, to: target.to });
      setDraft({ kind: 'range', from: target.from, to: target.to });
    }
    setRawTops((prev) => ({ ...prev, draft: target.top }));
    setTarget(null);
    pendingDraftRef.current = true;
    refresh();
  }, [editor, target, refresh]);

  const cancelDraft = useCallback(() => {
    editor?.commands.setPendingComment(null);
    setDraft(null);
    pendingDraftRef.current = false;
    refresh();
  }, [editor, refresh]);

  const submitDraft = useCallback(
    (text: string) => {
      if (!editor || !draft) return;
      const note = text.trim();
      if (!note) return;
      if (draft.kind === 'range') {
        editor.chain().addComment({ from: draft.from, to: draft.to }, note).setTextSelection(draft.to).focus().run();
      } else {
        // Collapse the selection so the floating button does not reappear over the block.
        editor.chain().addCommentAnchor(draft.pos, note).setTextSelection(draft.from).focus().run();
      }
      setDraft(null);
      pendingDraftRef.current = false;
    },
    [editor, draft],
  );

  const resolve = useCallback(
    (id: string) => {
      editor?.chain().removeComment(id).focus().run();
      setOpenId(null);
    },
    [editor],
  );

  const reply = useCallback(
    (item: CommentItem, text: string) => {
      const note = text.trim();
      if (!note || !editor) return;
      editor.chain().setCommentThread(item.id, [...item.thread, note]).focus().run();
    },
    [editor],
  );

  if (!editor) return null;

  const bubbleLeft = mode === 'margin' ? -(BUBBLE_WIDTH + GAP) : mode === 'reserved' ? 0 : COMPACT_PIN_LEFT;
  const buttonLabel = target?.anchorAfter !== undefined ? 'Comment on block' : 'Comment';

  return (
    <>
      {target && !draft && (
        <button
          type="button"
          className="comment-btn"
          style={{ left: target.left, top: target.top }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={openComposer}
          aria-label="Add a comment on the selected text"
        >
          <CommentIcon />
          {buttonLabel}
        </button>
      )}

      <div className={`comment-gutter${compact ? ' comment-gutter-compact' : ''}`} aria-label="Comments">
        {draft && (
          <Composer
            top={tops.draft ?? rawTops.draft ?? 0}
            left={bubbleLeft}
            onSubmit={submitDraft}
            onCancel={cancelDraft}
            registerRef={(el) => registerBubble(bubbleRefs, 'draft', el)}
          />
        )}

        {items.map((item) => {
          const top = tops[item.id] ?? rawTops[item.id] ?? 0;
          const isOpen = !compact || openId === item.id;
          return (
            <div key={item.id}>
              {compact && (
                <button
                  type="button"
                  className={`comment-pin${openId === item.id ? ' is-open' : ''}${activeId === item.id ? ' is-active' : ''}`}
                  style={{ top, left: COMPACT_PIN_LEFT }}
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  onMouseEnter={() => setActiveId(item.id)}
                  onMouseLeave={() => setActiveId(null)}
                  aria-label={`Open comment: ${item.thread[0] ?? ''}`}
                >
                  <CommentIcon />
                  {item.thread.length > 1 && <span className="comment-count">{item.thread.length}</span>}
                </button>
              )}
              {isOpen && (
                <Bubble
                  item={item}
                  top={top}
                  left={bubbleLeft}
                  compact={compact}
                  active={activeId === item.id}
                  flash={flashId === item.id}
                  onHover={(on) => setActiveId(on ? item.id : null)}
                  onResolve={() => resolve(item.id)}
                  onReply={(text) => reply(item, text)}
                  onClose={() => setOpenId(null)}
                  registerRef={(el) => registerBubble(bubbleRefs, item.id, el)}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function registerBubble(refs: RefObject<Map<string, HTMLDivElement>>, id: string, el: HTMLDivElement | null) {
  if (el) refs.current.set(id, el);
  else refs.current.delete(id);
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.4-4.2A8 8 0 1 1 21 12z" />
    </svg>
  );
}

interface ComposerProps {
  top: number;
  left: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
}

function Composer({ top, left, onSubmit, onCancel, registerRef }: ComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  return (
    <div className="comment-bubble comment-composer" style={{ top, left }} ref={registerRef}>
      <textarea
        ref={textareaRef}
        className="comment-textarea"
        placeholder="Write a comment"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onSubmit(text);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        aria-label="Comment text"
      />
      <div className="comment-row">
        <span className="comment-hint">⌘↩ to post · Esc to cancel</span>
        <button type="button" className="comment-action" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="comment-action is-primary" onClick={() => onSubmit(text)} disabled={!text.trim()}>
          Comment
        </button>
      </div>
    </div>
  );
}

interface BubbleProps {
  item: CommentItem;
  top: number;
  left: number;
  compact: boolean;
  active: boolean;
  flash: boolean;
  onHover: (on: boolean) => void;
  onResolve: () => void;
  onReply: (text: string) => void;
  onClose: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
}

function Bubble({ item, top, left, compact, active, flash, onHover, onResolve, onReply, onClose, registerRef }: BubbleProps) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const submitReply = () => {
    onReply(text);
    setText('');
    setReplying(false);
  };
  const className = [
    'comment-bubble',
    compact ? 'is-compact' : '',
    active ? 'is-active' : '',
    flash ? 'is-flash' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={className}
      style={{ top, left }}
      ref={registerRef}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      data-comment-bubble={item.id}
    >
      {item.anchorText && <p className="comment-quote">{item.anchorText}</p>}
      {item.kind === 'anchor' && <p className="comment-quote is-anchor">Comment on this block</p>}
      <div className="comment-thread">
        {item.thread.map((note, index) => {
          const { author, text: body } = describeNote(note);
          return (
            <div key={index} className="comment-note">
              <span className={`comment-author${author === 'Claude' ? ' is-agent' : ''}`}>{author}</span>
              <span className="comment-text">{body}</span>
            </div>
          );
        })}
      </div>
      {replying ? (
        <>
          <textarea
            className="comment-textarea"
            placeholder="Reply"
            rows={2}
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                submitReply();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setReplying(false);
              }
            }}
            aria-label="Reply text"
          />
          <div className="comment-row">
            <button type="button" className="comment-action" onClick={() => setReplying(false)}>
              Cancel
            </button>
            <button type="button" className="comment-action is-primary" onClick={submitReply} disabled={!text.trim()}>
              Reply
            </button>
          </div>
        </>
      ) : (
        <div className="comment-row comment-actions">
          <button type="button" className="comment-action" onClick={() => setReplying(true)}>
            Reply
          </button>
          <button type="button" className="comment-action" onClick={onResolve} title="Remove this comment from the file. The text stays.">
            Resolve
          </button>
          {compact && (
            <button type="button" className="comment-action" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
