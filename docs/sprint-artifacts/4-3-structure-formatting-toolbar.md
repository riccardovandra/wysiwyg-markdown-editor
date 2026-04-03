# Story 4.3: Structure Formatting via Toolbar (Lists, Links, Code)

**Status:** Done

## Story

As a **user**,
I want to create lists, links, and code blocks using toolbar buttons,
So that I can structure content without markdown syntax.

## Acceptance Criteria

### AC1: Bullet List (FR22)
**Given** my cursor is in a paragraph
**When** I click the Bullet List button
**Then** the paragraph becomes a bullet list item

**And** subsequent Enter presses create new list items

**And** clicking Bullet List again converts back to paragraph (toggle)

**And** Bullet List button shows active state when in a bullet list

### AC2: Numbered List (FR22)
**Given** my cursor is in a paragraph
**When** I click the Numbered List button
**Then** the paragraph becomes a numbered list item

**And** subsequent Enter presses create new numbered items (2, 3, 4...)

**And** clicking Numbered List again converts back to paragraph (toggle)

**And** Numbered List button shows active state when in an ordered list

### AC3: Link Insertion (FR23)
**Given** I have text selected
**When** I click the Link button
**Then** a dialog/prompt appears asking for the URL

**When** I enter a URL and confirm
**Then** the selected text becomes a link to that URL

**Given** I click on existing linked text
**When** I click the Link button
**Then** I can edit the URL or remove the link

### AC4: Code Block Insertion (FR24)
**Given** my cursor is in a paragraph
**When** I click the Code Block button
**Then** a code block is inserted at cursor position

**And** the cursor moves inside the code block

**And** I can type code in the new block immediately

**And** Code Block button shows active state when in a code block

### AC5: Active State Updates
**Given** I am navigating the document
**When** my cursor enters a list, link, or code block
**Then** the corresponding toolbar button shows active state

### AC6: Link Button State
**Given** the Link button
**When** text is selected
**Then** the button is enabled
**When** no text is selected and cursor is not in a link
**Then** the button behavior allows inserting link at cursor

## Tasks / Subtasks

- [x] **Task 1: Implement Bullet List Button** (AC: 1, 5)
  - [x] Add onClick handler: `editor.chain().focus().toggleBulletList().run()`
  - [x] Add isActive check: `editor.isActive('bulletList')`
  - [x] Test paragraph-to-list conversion
  - [x] Test list-to-paragraph conversion (toggle off)
  - [x] Test Enter creates new list items

- [x] **Task 2: Implement Numbered List Button** (AC: 2, 5)
  - [x] Add onClick handler: `editor.chain().focus().toggleOrderedList().run()`
  - [x] Add isActive check: `editor.isActive('orderedList')`
  - [x] Test paragraph-to-numbered-list conversion
  - [x] Test numbering increments correctly
  - [x] Test toggle behavior

- [x] **Task 3: Implement Link Button with Dialog** (AC: 3, 6)
  - [x] Add onClick handler to open URL input
  - [x] Implement simple prompt dialog for URL input
  - [x] Call `editor.chain().focus().setLink({ href: url }).run()` on confirm
  - [x] Handle existing link editing
  - [x] Add unlink functionality: `editor.chain().focus().unsetLink().run()`
  - [x] Add isActive check: `editor.isActive('link')`

- [x] **Task 4: Create Link Dialog Component** (AC: 3)
  - [x] Create `src/webview/components/LinkDialog.tsx`
  - [x] Input field for URL
  - [x] Cancel and Confirm buttons
  - [x] Pre-populate URL if editing existing link
  - [x] Add "Remove Link" option for existing links
  - [x] Handle Enter key to confirm
  - [x] Handle Escape key to cancel

- [x] **Task 5: Implement Code Block Button** (AC: 4, 5)
  - [x] Add onClick handler: `editor.chain().focus().toggleCodeBlock().run()`
  - [x] Add isActive check: `editor.isActive('codeBlock')`
  - [x] Test code block insertion
  - [x] Test cursor placement inside block
  - [x] Test toggle behavior (code block to paragraph)

- [x] **Task 6: Wire Up Active States** (AC: 5)
  - [x] Ensure bulletList isActive updates
  - [x] Ensure orderedList isActive updates
  - [x] Ensure link isActive updates
  - [x] Ensure codeBlock isActive updates
  - [x] Verify updates on cursor movement

- [x] **Task 7: Write Unit Tests**
  - [x] Test bullet list toggle
  - [x] Test ordered list toggle
  - [x] Test link insertion with URL
  - [x] Test link removal
  - [x] Test code block toggle
  - [x] Test active state for each element type

## Dev Notes

### TipTap Command Patterns

```typescript
// Lists
editor.chain().focus().toggleBulletList().run();
editor.chain().focus().toggleOrderedList().run();

// Links
editor.chain().focus().setLink({ href: 'https://example.com' }).run();
editor.chain().focus().unsetLink().run();

// Get current link href (for editing)
const { href } = editor.getAttributes('link');

// Code blocks
editor.chain().focus().toggleCodeBlock().run();
// Or with language:
editor.chain().focus().setCodeBlock({ language: 'javascript' }).run();

// Active state checks
editor.isActive('bulletList');
editor.isActive('orderedList');
editor.isActive('link');
editor.isActive('codeBlock');
```

### Link Dialog Implementation

```typescript
// src/webview/components/LinkDialog.tsx
import { useState, useEffect, useRef } from 'react';

interface LinkDialogProps {
  isOpen: boolean;
  initialUrl?: string;
  onConfirm: (url: string) => void;
  onRemove?: () => void;  // Only show if editing existing link
  onCancel: () => void;
}

export function LinkDialog({ isOpen, initialUrl, onConfirm, onRemove, onCancel }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(url);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg p-4 min-w-[300px]">
        <label className="block text-sm mb-2">URL</label>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="w-full p-2 border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] rounded"
        />
        <div className="flex justify-end gap-2 mt-4">
          {onRemove && (
            <button
              onClick={onRemove}
              className="px-3 py-1 text-red-500 hover:bg-red-500/10 rounded"
            >
              Remove Link
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-1 hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(url)}
            className="px-3 py-1 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] rounded"
          >
            {initialUrl ? 'Update' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Toolbar Integration for Link

```typescript
// In Toolbar.tsx
const [linkDialogOpen, setLinkDialogOpen] = useState(false);

const handleLinkClick = () => {
  if (editor?.isActive('link')) {
    // Editing existing link - get current href
    const { href } = editor.getAttributes('link');
    setCurrentLinkUrl(href);
  } else {
    setCurrentLinkUrl('');
  }
  setLinkDialogOpen(true);
};

const handleLinkConfirm = (url: string) => {
  if (url) {
    editor?.chain().focus().setLink({ href: url }).run();
  }
  setLinkDialogOpen(false);
};

const handleLinkRemove = () => {
  editor?.chain().focus().unsetLink().run();
  setLinkDialogOpen(false);
};

// In JSX:
<ToolbarButton
  icon={<Link className="w-4 h-4" />}
  tooltip="Add Link"
  shortcut="Cmd+K"
  isActive={editor?.isActive('link')}
  onClick={handleLinkClick}
  disabled={!editor}
/>

<LinkDialog
  isOpen={linkDialogOpen}
  initialUrl={currentLinkUrl}
  onConfirm={handleLinkConfirm}
  onRemove={editor?.isActive('link') ? handleLinkRemove : undefined}
  onCancel={() => setLinkDialogOpen(false)}
/>
```

### List Behavior Notes

- Enter at end of list item creates new item
- Enter twice (empty item) exits list, creates paragraph
- Backspace at start of list item outdents or exits list
- Tab can indent list items (if configured)

These behaviors are handled by TipTap's StarterKit automatically.

### Code Block Notes

The CodeBlockLowlight extension from Story 3.2 is already configured. The toggle behavior:
- Paragraph to code block: Wraps content in code block
- Code block to paragraph: Extracts content as paragraph

Language selection is optional (could be deferred):
- Simple approach: Default to no language, user types manually
- Advanced approach: Add language dropdown in code block (future enhancement)

### Project Structure Notes

New file to create:
- `src/webview/components/LinkDialog.tsx`
- `src/webview/__tests__/LinkDialog.test.tsx`

Files to modify:
- `src/webview/components/Toolbar.tsx` - Add structure formatting buttons

### Dependencies

This story depends on:
- Story 4.1 (Persistent Toolbar)
- Story 4.2 (Text Formatting)

### Anti-Patterns to Avoid

- DO NOT use browser `prompt()` for URL input (doesn't style with VS Code theme)
- DO NOT allow invalid URLs to be submitted (validate or show error)
- DO NOT block interaction while dialog is open (use modal pattern)
- DO NOT forget to re-focus editor after dialog closes

### Testing Strategy

```typescript
// Test list toggle
it('toggles bullet list when button clicked', () => {
  // Place cursor in paragraph
  // Click bullet list button
  // Assert editor.isActive('bulletList') === true
});

// Test link insertion
it('inserts link when URL provided', async () => {
  // Select text
  // Click link button
  // Enter URL in dialog
  // Click confirm
  // Assert selected text is now a link with correct href
});
```

### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Empty URL submitted | Don't create link, show validation |
| Invalid URL format | Accept anyway (user might want relative links) |
| Link with special chars | URL encode properly |
| Nested list items | Toggle affects current level only |
| Code block in list | Create code block inside list item |
| Multiple paragraphs selected | Convert all to list items |

### References

- [Source: docs/epics.md#Story 4.3: Structure Formatting via Toolbar]
- [Source: docs/architecture.md#Communication Patterns]
- [TipTap BulletList](https://tiptap.dev/api/nodes/bullet-list)
- [TipTap OrderedList](https://tiptap.dev/api/nodes/ordered-list)
- [TipTap Link Extension](https://tiptap.dev/api/marks/link)
- [TipTap CodeBlock](https://tiptap.dev/api/nodes/code-block)

## Dev Agent Record

### Context Reference

Story created by create-story workflow (SM agent, YOLO mode).
Depends on: Story 4.1, Story 4.2

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Tasks 1, 2, 5, 6 (Lists, Code Block, Active States) were already implemented in Story 4.1
- Created LinkDialog component with VS Code themed styling
- LinkDialog features: URL input, Enter/Escape key handling, backdrop click to close, Remove Link option for existing links
- Integrated LinkDialog with Toolbar via useState hooks and handlers
- Link button now opens dialog, pre-populates URL when editing existing link
- Added 17 new LinkDialog tests and 12 new Toolbar structure formatting tests
- Fixed handleLinkCancel to use editor.commands.focus() instead of chain().focus().run()
- 168 total tests pass, no regressions

**Code Review Fixes (2025-12-13):**
- Added test for `unsetLink` being called when Remove Link button clicked
- Added test for Link shortcut (`Cmd+K`) appearing in tooltip
- Added `unsetLinkMock` to test mock factory for complete coverage
- 178 total tests pass after review fixes

### File List

**Files Created:**
- `wysiwyg-markdown-editor/src/webview/components/LinkDialog.tsx`
- `wysiwyg-markdown-editor/src/webview/__tests__/LinkDialog.test.tsx`

**Files Modified:**
- `wysiwyg-markdown-editor/src/webview/components/Toolbar.tsx` - Added LinkDialog integration with state and handlers
- `wysiwyg-markdown-editor/src/webview/__tests__/Toolbar.test.tsx` - Added 12 structure formatting tests

### Change Log

- 2025-12-13: Story created with comprehensive developer context (create-story workflow)
- 2025-12-13: Implementation complete - LinkDialog created, Toolbar integrated, 29 new tests, 168 total pass
