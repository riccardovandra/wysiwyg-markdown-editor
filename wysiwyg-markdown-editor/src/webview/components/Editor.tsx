import { useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor as TipTapEditor } from '@tiptap/react';
import type { EditorSettings } from '../../shared/messages.types';
import { CommentGutter } from './CommentGutter';

interface EditorProps {
  editor: TipTapEditor | null;
  showCard?: boolean;
  contentPadding?: EditorSettings['contentPadding'];
  /** Whether comment highlights and bubbles are shown */
  showComments?: boolean;
  /** Called when the user posts a new comment */
  onCommentAdded?: () => void;
  /** Called whenever the number of comments in the document changes */
  onCommentCountChange?: (count: number) => void;
}

// Padding presets for different content padding options
const paddingClasses = {
  compact: 'px-6 py-6',
  medium: 'px-10 sm:px-14 lg:px-20 py-12',
  spacious: 'px-14 sm:px-20 lg:px-28 py-16',
};

/**
 * Rich text editor component built on TipTap.
 *
 * Renders an editable content area with:
 * - StarterKit extensions (bold, italic, headings, lists, etc.)
 * - Link support
 * - Placeholder text when empty
 * - Tailwind Typography styling for Medium-like appearance
 * - Constrained reading width (~65ch) for optimal readability
 * - Responsive padding that adjusts to viewport width
 * - Configurable card display and padding
 * - Margin comments (CommentGutter) positioned against the card
 */
export function Editor({
  editor,
  showCard = true,
  contentPadding = 'medium',
  showComments = true,
  onCommentAdded,
  onCommentCountChange,
}: EditorProps) {
  const padding = paddingClasses[contentPadding];
  const containerRef = useRef<HTMLDivElement>(null);

  // Card mode: full styling with background, shadow, rounded corners
  const cardClasses = showCard
    ? 'bg-dark-elevated rounded-xl shadow-2xl shadow-black/40'
    : '';

  return (
    <div className="min-h-full">
      {/* The wrapper is the positioning context for comment bubbles and the floating button */}
      <div
        ref={containerRef}
        className={`comment-layout relative mx-auto${showComments ? '' : ' comments-hidden'}`}
      >
        <div className={cardClasses}>
          <div className={padding}>
            <EditorContent
              editor={editor}
              className="prose prose-lg"
            />
          </div>
        </div>
        <CommentGutter
          editor={editor}
          containerRef={containerRef}
          visible={showComments}
          onCommentAdded={onCommentAdded}
          onCountChange={onCommentCountChange}
        />
      </div>
    </div>
  );
}
