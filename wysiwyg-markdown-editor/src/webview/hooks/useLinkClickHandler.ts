import { useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

interface UseLinkClickHandlerOptions {
  editor: Editor | null;
  /** Callback invoked when a file/external link is clicked */
  onLinkClick: (href: string) => void;
  /** Callback invoked when an anchor-only link (#anchor) is clicked. Receives the anchor ID without # */
  onAnchorClick?: (anchorId: string) => void;
}

/**
 * Hook that handles clicks on links within the TipTap editor.
 * Uses DOM event delegation to capture all link clicks.
 *
 * Anchor-only links (href starting with #) are handled locally via onAnchorClick.
 * File and external links are forwarded to onLinkClick for extension handling.
 *
 * @param options.editor - The TipTap editor instance
 * @param options.onLinkClick - Callback invoked with the href when a file/external link is clicked
 * @param options.onAnchorClick - Callback invoked with anchor ID when an anchor link is clicked
 */
export function useLinkClickHandler({
  editor,
  onLinkClick,
  onAnchorClick,
}: UseLinkClickHandlerOptions): void {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Find the anchor element - could be the target or an ancestor
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href) {
        // Prevent default browser navigation
        event.preventDefault();
        event.stopPropagation();

        // Extract the href attribute
        const href = anchor.getAttribute('href');
        if (!href) return;

        // Check if this is an anchor-only link (starts with #)
        if (href.startsWith('#')) {
          // Handle anchor links locally - extract ID without the #
          const anchorId = href.slice(1);
          onAnchorClick?.(anchorId);
        } else {
          // Forward file/external links to extension
          onLinkClick(href);
        }
      }
    },
    [onLinkClick, onAnchorClick]
  );

  useEffect(() => {
    if (!editor) return;

    // Get the editor's DOM element
    const editorElement = editor.view.dom;

    // Add click listener using capture phase to intercept before TipTap
    editorElement.addEventListener('click', handleClick, true);

    return () => {
      editorElement.removeEventListener('click', handleClick, true);
    };
  }, [editor, handleClick]);
}
