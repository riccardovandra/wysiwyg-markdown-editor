import { EditorContent } from '@tiptap/react';
import type { Editor as TipTapEditor } from '@tiptap/react';
import type { EditorSettings } from '../../shared/messages.types';

interface EditorProps {
  editor: TipTapEditor | null;
  showCard?: boolean;
  contentPadding?: EditorSettings['contentPadding'];
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
 */
export function Editor({ editor, showCard = true, contentPadding = 'medium' }: EditorProps) {
  const padding = paddingClasses[contentPadding];

  // Card mode: full styling with background, shadow, rounded corners
  if (showCard) {
    return (
      <div className="min-h-full">
        <div className="max-w-4xl mx-auto bg-dark-elevated rounded-xl shadow-2xl shadow-black/40">
          <div className={padding}>
            <EditorContent
              editor={editor}
              className="prose prose-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  // No-card mode: minimal margin, no background/shadow
  return (
    <div className="min-h-full">
      <div className={`max-w-4xl mx-auto ${padding}`}>
        <EditorContent
          editor={editor}
          className="prose prose-lg"
        />
      </div>
    </div>
  );
}
