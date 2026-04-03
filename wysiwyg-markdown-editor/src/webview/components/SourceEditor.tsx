import type { EditorSettings } from '../../shared/messages.types';

/**
 * Props for the SourceEditor component.
 */
interface SourceEditorProps {
  /** Current markdown content */
  content: string;
  /** Called when content changes */
  onChange: (content: string) => void;
  /** Whether to show card styling */
  showCard?: boolean;
  /** Content padding setting */
  contentPadding?: EditorSettings['contentPadding'];
}

/**
 * Padding preset classes matching Editor.tsx behavior.
 */
const paddingClasses = {
  compact: 'p-6',
  medium: 'p-10 sm:p-14 lg:p-20',
  spacious: 'p-14 sm:p-20 lg:p-28',
};

/**
 * Source code editor component for viewing and editing raw markdown.
 *
 * Uses a textarea with monospace font and VS Code theme-aware styling.
 * Supports the same card/padding options as the visual Editor component.
 */
export function SourceEditor({
  content,
  onChange,
  showCard = true,
  contentPadding = 'medium',
}: SourceEditorProps) {
  const padding = paddingClasses[contentPadding];

  // Textarea styling with VS Code theme variables
  const textareaClasses = `
    w-full h-full min-h-[400px] resize-none
    text-sm leading-relaxed
    bg-transparent border-none
    text-[var(--vscode-editor-foreground)]
    selection:bg-[var(--vscode-editor-selectionBackground)]
    placeholder:text-[var(--vscode-input-placeholderForeground)]
    focus:outline-none focus:ring-1 focus:ring-[var(--vscode-focusBorder)]
  `;

  // Font family using VS Code's editor font with fallbacks
  const fontStyle = {
    fontFamily: "var(--vscode-editor-font-family, 'Menlo', 'Monaco', 'Courier New', monospace)",
  };

  if (showCard) {
    return (
      <div className="min-h-full">
        <div className="max-w-4xl mx-auto bg-dark-elevated rounded-xl shadow-2xl shadow-black/40">
          <div className={padding}>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              className={textareaClasses}
              style={fontStyle}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="Start typing markdown..."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className={`max-w-4xl mx-auto ${padding}`}>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className={textareaClasses}
          style={fontStyle}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Start typing markdown..."
        />
      </div>
    </div>
  );
}
