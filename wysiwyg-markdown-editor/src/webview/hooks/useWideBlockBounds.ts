import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { Editor } from '@tiptap/react';

/** Horizontal extent of a box, in viewport pixels. */
export interface HorizontalSpan {
  left: number;
  right: number;
}

/**
 * Widest a wide block (table, code block) may grow while it stays centered on
 * the reading column and inside the pane's usable area.
 *
 * The block is centered on the column, so it can only grow by twice the
 * distance from the column's center to the nearer pane edge. Anything wider
 * would leave the pane on one side, and content left of the pane can never be
 * scrolled into view. Never returns less than the column width itself.
 */
export function wideBlockMax(area: HorizontalSpan, column: HorizontalSpan): number {
  const columnWidth = column.right - column.left;
  const center = column.left + columnWidth / 2;
  const room = Math.min(center - area.left, area.right - center);
  return Math.max(columnWidth, Math.floor(room * 2));
}

/**
 * Keeps `--wide-block-max` on the editor wrapper in sync with the pane.
 *
 * The usable area is the wrapper's parent (the block that fills the scroll
 * pane's content box, so it already excludes pane padding and scrollbar).
 * The column is the ProseMirror root. Recomputed whenever either resizes,
 * which also covers the comment gutter shifting the card sideways.
 */
export function useWideBlockBounds(
  editor: Editor | null,
  containerRef: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    const wrapper = containerRef.current;
    if (!editor || !wrapper) return;
    const area = wrapper.parentElement;
    if (!area) return;
    const column = editor.view.dom;

    const update = () => {
      const max = wideBlockMax(area.getBoundingClientRect(), column.getBoundingClientRect());
      wrapper.style.setProperty('--wide-block-max', `${max}px`);
    };

    update();
    window.addEventListener('resize', update);
    // ResizeObserver is absent in jsdom (tests); the resize listener still runs there.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(area);
    observer?.observe(column);

    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [editor, containerRef]);
}
