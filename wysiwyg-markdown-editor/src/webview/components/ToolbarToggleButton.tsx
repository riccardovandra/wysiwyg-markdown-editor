import { ChevronUp } from 'lucide-react';

interface ToolbarToggleButtonProps {
  /** Callback to toggle toolbar visibility */
  onToggle: () => void;
}

/**
 * A small floating button to show the toolbar when it's hidden.
 * Positioned at the top-right of the viewport.
 * Parent component controls visibility.
 */
export function ToolbarToggleButton({ onToggle }: ToolbarToggleButtonProps) {
  return (
    <button
      type="button"
      className="fixed top-2 right-4 z-20 p-2 rounded-lg
        bg-dark-elevated/95 backdrop-blur-sm
        border border-border-subtle
        text-text-secondary hover:text-text-primary
        hover:bg-dark-hover
        cursor-pointer transition-all duration-150
        shadow-lg shadow-black/20"
      title="Show Toolbar"
      onClick={onToggle}
    >
      <ChevronUp className="w-4 h-4" />
    </button>
  );
}
