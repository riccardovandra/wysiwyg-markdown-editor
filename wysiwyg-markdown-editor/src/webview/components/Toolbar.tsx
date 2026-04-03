import { useEffect, useReducer, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { LinkDialog } from './LinkDialog';
import { TableDialog } from './TableDialog';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Code,
  Undo2,
  Redo2,
  ChevronDown,
  Table,
  Rows3,
  Columns3,
  Trash2,
  FileCode,
  Eye,
  Code2,
} from 'lucide-react';

/**
 * Props for the Toolbar component.
 */
export interface ToolbarProps {
  /** TipTap editor instance, or null if not yet initialized */
  editor: Editor | null;
  /** Optional callback to hide the toolbar */
  onHide?: () => void;
  /** Whether the document has frontmatter */
  hasFrontmatter?: boolean;
  /** Whether frontmatter is currently visible */
  showFrontmatter?: boolean;
  /** Optional callback to toggle frontmatter visibility */
  onToggleFrontmatter?: () => void;
  /** Current view mode: visual (WYSIWYG) or source (raw markdown) */
  viewMode?: 'visual' | 'source';
  /** Optional callback to toggle between visual and source views */
  onToggleViewMode?: () => void;
}

/**
 * Props for the ToolbarButton subcomponent.
 */
interface ToolbarButtonProps {
  /** Icon to display in the button */
  icon: React.ReactNode;
  /** Tooltip text describing the action */
  tooltip: string;
  /** Optional keyboard shortcut to display in tooltip */
  shortcut?: string;
  /** Whether the button action is currently active */
  isActive?: boolean;
  /** Click handler for the button */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Reusable toolbar button with hover/active states and tooltip.
 */
function ToolbarButton({
  icon,
  tooltip,
  shortcut,
  isActive = false,
  onClick,
  disabled = false,
}: ToolbarButtonProps) {
  const title = shortcut ? `${tooltip} (${shortcut})` : tooltip;

  return (
    <button
      type="button"
      className={`p-1.5 rounded-md transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-border
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-dark-hover'}
        ${isActive ? 'bg-dark-active text-text-primary' : 'text-text-primary hover:text-text-primary'}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}

/**
 * Visual divider between button groups.
 */
function ToolbarDivider() {
  return (
    <div
      className="w-px h-5 bg-border-panel mx-1.5"
      data-testid="toolbar-divider"
    />
  );
}

/**
 * Persistent formatting toolbar for the WYSIWYG editor.
 *
 * Displays formatting buttons organized into logical groups:
 * - Text Formatting: Bold, Italic
 * - Headings: H1, H2, H3
 * - Lists: Bullet, Numbered
 * - Insert: Link, Code Block
 * - History: Undo, Redo
 *
 * Uses VS Code theme variables for consistent styling.
 */
export function Toolbar({
  editor,
  onHide,
  hasFrontmatter,
  showFrontmatter,
  onToggleFrontmatter,
  viewMode,
  onToggleViewMode,
}: ToolbarProps) {
  const iconSize = 'w-4 h-4';
  const isDisabled = !editor;

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');

  // Table dialog state
  const [tableDialogOpen, setTableDialogOpen] = useState(false);

  // Force re-render when editor state changes (selection, formatting, etc.)
  // This ensures active states update immediately when cursor moves
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;

    // Subscribe to editor events that affect toolbar state
    editor.on('selectionUpdate', forceUpdate);
    editor.on('transaction', forceUpdate);

    return () => {
      editor.off('selectionUpdate', forceUpdate);
      editor.off('transaction', forceUpdate);
    };
  }, [editor]);

  // Detect platform for keyboard shortcuts
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  // Link dialog handlers
  const handleLinkClick = () => {
    if (editor?.isActive('link')) {
      // Editing existing link - get current href
      const attrs = editor.getAttributes('link');
      setCurrentLinkUrl(attrs.href || '');
    } else {
      setCurrentLinkUrl('');
    }
    setLinkDialogOpen(true);
  };

  const handleLinkConfirm = (url: string) => {
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkDialogOpen(false);
  };

  const handleLinkRemove = () => {
    editor?.chain().focus().unsetLink().run();
    setLinkDialogOpen(false);
  };

  const handleLinkCancel = () => {
    setLinkDialogOpen(false);
    // Re-focus editor after closing dialog
    editor?.commands.focus();
  };

  // Table dialog handlers
  const handleTableConfirm = (rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableDialogOpen(false);
  };

  const handleTableCancel = () => {
    setTableDialogOpen(false);
    editor?.commands.focus();
  };

  // Check if cursor is inside a table
  const isInTable = editor?.isActive('table') ?? false;

  return (
    <div
      role="toolbar"
      aria-label="Formatting toolbar"
      className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-2.5 bg-dark-base border-b border-border-panel"
    >
      {/* Text Formatting Group */}
      <ToolbarButton
        icon={<Bold className={iconSize} />}
        tooltip="Bold"
        shortcut={`${modKey}+B`}
        isActive={editor?.isActive('bold') ?? false}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        disabled={isDisabled}
      />
      <ToolbarButton
        icon={<Italic className={iconSize} />}
        tooltip="Italic"
        shortcut={`${modKey}+I`}
        isActive={editor?.isActive('italic') ?? false}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        disabled={isDisabled}
      />

      <ToolbarDivider />

      {/* Headings Group */}
      <ToolbarButton
        icon={<Heading1 className={iconSize} />}
        tooltip="Heading 1"
        shortcut={`${modKey}+Shift+1`}
        isActive={editor?.isActive('heading', { level: 1 }) ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={isDisabled}
      />
      <ToolbarButton
        icon={<Heading2 className={iconSize} />}
        tooltip="Heading 2"
        shortcut={`${modKey}+Shift+2`}
        isActive={editor?.isActive('heading', { level: 2 }) ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={isDisabled}
      />
      <ToolbarButton
        icon={<Heading3 className={iconSize} />}
        tooltip="Heading 3"
        shortcut={`${modKey}+Shift+3`}
        isActive={editor?.isActive('heading', { level: 3 }) ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={isDisabled}
      />

      <ToolbarDivider />

      {/* Lists Group */}
      <ToolbarButton
        icon={<List className={iconSize} />}
        tooltip="Bullet List"
        isActive={editor?.isActive('bulletList') ?? false}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        disabled={isDisabled}
      />
      <ToolbarButton
        icon={<ListOrdered className={iconSize} />}
        tooltip="Numbered List"
        isActive={editor?.isActive('orderedList') ?? false}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        disabled={isDisabled}
      />

      <ToolbarDivider />

      {/* Table Group */}
      <ToolbarButton
        icon={<Table className={iconSize} />}
        tooltip="Insert Table"
        isActive={isInTable}
        onClick={() => setTableDialogOpen(true)}
        disabled={isDisabled}
      />
      <ToolbarButton
        icon={<Rows3 className={iconSize} />}
        tooltip="Add Row Below"
        onClick={() => editor?.chain().focus().addRowAfter().run()}
        disabled={isDisabled || !isInTable}
      />
      <ToolbarButton
        icon={<Columns3 className={iconSize} />}
        tooltip="Add Column Right"
        onClick={() => editor?.chain().focus().addColumnAfter().run()}
        disabled={isDisabled || !isInTable}
      />
      <ToolbarButton
        icon={<Trash2 className={iconSize} />}
        tooltip="Delete Table"
        onClick={() => editor?.chain().focus().deleteTable().run()}
        disabled={isDisabled || !isInTable}
      />

      <ToolbarDivider />

      {/* Insert Group */}
      <ToolbarButton
        icon={<Link className={iconSize} />}
        tooltip="Link"
        shortcut={`${modKey}+K`}
        isActive={editor?.isActive('link') ?? false}
        onClick={handleLinkClick}
        disabled={isDisabled}
      />
      <ToolbarButton
        icon={<Code className={iconSize} />}
        tooltip="Code Block"
        isActive={editor?.isActive('codeBlock') ?? false}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        disabled={isDisabled}
      />

      <ToolbarDivider />

      {/* History Group */}
      <ToolbarButton
        icon={<Undo2 className={iconSize} />}
        tooltip="Undo"
        shortcut={`${modKey}+Z`}
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={isDisabled || !editor?.can().undo()}
      />
      <ToolbarButton
        icon={<Redo2 className={iconSize} />}
        tooltip="Redo"
        shortcut={isMac ? `${modKey}+Shift+Z` : `${modKey}+Y`}
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={isDisabled || !editor?.can().redo()}
      />

      {/* Frontmatter Toggle */}
      {onToggleFrontmatter && (
        <>
          <ToolbarDivider />
          <ToolbarButton
            icon={<FileCode className={iconSize} />}
            tooltip="Toggle Frontmatter"
            isActive={showFrontmatter}
            onClick={onToggleFrontmatter}
            disabled={!hasFrontmatter}
          />
        </>
      )}

      {/* View Mode Toggle (Source/Visual) */}
      {onToggleViewMode && (
        <>
          <ToolbarDivider />
          <ToolbarButton
            icon={viewMode === 'visual' ? <Code2 className={iconSize} /> : <Eye className={iconSize} />}
            tooltip={viewMode === 'visual' ? 'View Source' : 'Visual View'}
            shortcut={`${modKey}+Shift+V`}
            onClick={onToggleViewMode}
            disabled={false}
          />
        </>
      )}

      {/* Spacer to push hide button to the right */}
      {onHide && <div className="flex-1" />}

      {/* Hide Toolbar Button */}
      {onHide && (
        <ToolbarButton
          icon={<ChevronDown className={iconSize} />}
          tooltip="Hide Toolbar"
          onClick={onHide}
          disabled={false}
        />
      )}

      {/* Link Dialog */}
      <LinkDialog
        isOpen={linkDialogOpen}
        initialUrl={currentLinkUrl}
        onConfirm={handleLinkConfirm}
        onRemove={editor?.isActive('link') ? handleLinkRemove : undefined}
        onCancel={handleLinkCancel}
      />

      {/* Table Dialog */}
      <TableDialog
        isOpen={tableDialogOpen}
        onConfirm={handleTableConfirm}
        onCancel={handleTableCancel}
      />
    </div>
  );
}
