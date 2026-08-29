import { MessageSquare } from 'lucide-react';

interface CommentsToggleButtonProps {
  /** Whether comments are currently shown */
  active: boolean;
  /** Number of comments in the document */
  count: number;
  /** Callback to toggle comment visibility */
  onToggle: () => void;
}

/**
 * Floating button to show or hide comments, shown next to the toolbar
 * toggle when the toolbar itself is hidden. Carries a count badge.
 */
export function CommentsToggleButton({ active, count, onToggle }: CommentsToggleButtonProps) {
  return (
    <button
      type="button"
      className={`fixed top-2 right-14 z-20 p-2 rounded-lg
        bg-dark-elevated/95 backdrop-blur-sm
        border border-border-subtle
        hover:bg-dark-hover
        cursor-pointer transition-all duration-150
        shadow-lg shadow-black/20
        ${active ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
      title={active ? 'Hide Comments' : 'Show Comments'}
      aria-pressed={active}
      onClick={onToggle}
    >
      <MessageSquare className="w-4 h-4" />
      {count > 0 && (
        <span className="comment-badge" aria-label={`${count} comments`}>
          {count}
        </span>
      )}
    </button>
  );
}
