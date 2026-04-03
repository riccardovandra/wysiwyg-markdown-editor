# Story 4.2: Text Formatting via Toolbar (Bold, Italic, Headings)

**Status:** Done

## Story

As a **user**,
I want to apply text formatting using toolbar buttons,
So that I can format text without memorizing markdown syntax.

## Acceptance Criteria

### AC1: Bold Toggle (FR19)
**Given** I have text selected in the editor
**When** I click the Bold toolbar button
**Then** the selection is formatted as bold

**And** clicking Bold again removes bold formatting (toggle behavior)

**And** the Bold button shows active state when cursor is in bold text

### AC2: Italic Toggle (FR20)
**Given** I have text selected in the editor
**When** I click the Italic toolbar button
**Then** the selection is formatted as italic

**And** clicking Italic again removes italic formatting (toggle behavior)

**And** the Italic button shows active state when cursor is in italic text

### AC3: Heading Levels (FR21)
**Given** the cursor is in a paragraph
**When** I click the H1 toolbar button
**Then** the current block becomes a level 1 heading

**When** I click H2
**Then** the current block becomes a level 2 heading

**When** I click H3
**Then** the current block becomes a level 3 heading

**And** clicking the same heading level again converts back to paragraph

**And** heading buttons show active state for current heading level

### AC4: Keyboard Shortcuts (NFR12)
**Given** I am editing in the editor
**When** I press Cmd/Ctrl+B
**Then** bold formatting is toggled

**When** I press Cmd/Ctrl+I
**Then** italic formatting is toggled

### AC5: Button State Updates
**Given** I am moving the cursor around the document
**When** the cursor enters formatted text
**Then** the corresponding toolbar button shows active state immediately

**When** the cursor leaves formatted text
**Then** the button returns to inactive state

### AC6: No Selection Behavior
**Given** no text is selected
**When** I click Bold
**Then** bold mode is enabled for the next typed characters

**And** typing produces bold text until toggled off

## Tasks / Subtasks

- [x] **Task 1: Implement Bold Button Functionality** (AC: 1, 4)
  - [x] Add onClick handler calling `editor.chain().focus().toggleBold().run()`
  - [x] Add isActive check: `editor.isActive('bold')`
  - [x] Verify Cmd/Ctrl+B keyboard shortcut works (TipTap built-in)
  - [x] Test toggle behavior on/off

- [x] **Task 2: Implement Italic Button Functionality** (AC: 2, 4)
  - [x] Add onClick handler calling `editor.chain().focus().toggleItalic().run()`
  - [x] Add isActive check: `editor.isActive('italic')`
  - [x] Verify Cmd/Ctrl+I keyboard shortcut works (TipTap built-in)
  - [x] Test toggle behavior on/off

- [x] **Task 3: Implement H1 Button Functionality** (AC: 3)
  - [x] Add onClick handler calling `editor.chain().focus().toggleHeading({ level: 1 }).run()`
  - [x] Add isActive check: `editor.isActive('heading', { level: 1 })`
  - [x] Test paragraph-to-heading conversion
  - [x] Test heading-to-paragraph conversion (toggle off)

- [x] **Task 4: Implement H2 Button Functionality** (AC: 3)
  - [x] Add onClick handler for level 2 heading
  - [x] Add isActive check for level 2
  - [x] Test toggle behavior

- [x] **Task 5: Implement H3 Button Functionality** (AC: 3)
  - [x] Add onClick handler for level 3 heading
  - [x] Add isActive check for level 3
  - [x] Test toggle behavior

- [x] **Task 6: Wire Up Active State Updates** (AC: 5)
  - [x] Subscribe to editor selection changes (`onSelectionUpdate`)
  - [x] Update toolbar button states on selection change
  - [x] Ensure re-render on cursor movement
  - [x] Verify state updates are immediate (no lag)

- [x] **Task 7: Handle No Selection Case** (AC: 6)
  - [x] Verify TipTap's behavior when no text selected
  - [x] Test typing after enabling bold mode
  - [x] Test typing after enabling italic mode

- [x] **Task 8: Write Unit Tests**
  - [x] Test bold button toggles bold mark
  - [x] Test italic button toggles italic mark
  - [x] Test heading buttons toggle heading levels
  - [x] Test active state updates on cursor movement
  - [x] Test keyboard shortcuts trigger formatting

## Dev Notes

### TipTap Command Patterns

```typescript
// Toggle inline marks
editor.chain().focus().toggleBold().run();
editor.chain().focus().toggleItalic().run();

// Toggle block-level headings
editor.chain().focus().toggleHeading({ level: 1 }).run();
editor.chain().focus().toggleHeading({ level: 2 }).run();
editor.chain().focus().toggleHeading({ level: 3 }).run();

// Check active state
editor.isActive('bold');                    // true if cursor in bold
editor.isActive('italic');                  // true if cursor in italic
editor.isActive('heading', { level: 1 });   // true if cursor in H1
editor.isActive('heading', { level: 2 });   // true if cursor in H2
editor.isActive('heading', { level: 3 });   // true if cursor in H3
```

### Toolbar Button Implementation

```typescript
// In Toolbar.tsx
<ToolbarButton
  icon={<Bold className="w-4 h-4" />}
  tooltip="Bold"
  shortcut="Cmd+B"
  isActive={editor?.isActive('bold')}
  onClick={() => editor?.chain().focus().toggleBold().run()}
  disabled={!editor}
/>

<ToolbarButton
  icon={<Italic className="w-4 h-4" />}
  tooltip="Italic"
  shortcut="Cmd+I"
  isActive={editor?.isActive('italic')}
  onClick={() => editor?.chain().focus().toggleItalic().run()}
  disabled={!editor}
/>

<ToolbarButton
  icon={<Heading1 className="w-4 h-4" />}
  tooltip="Heading 1"
  shortcut="Cmd+Shift+1"
  isActive={editor?.isActive('heading', { level: 1 })}
  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
  disabled={!editor}
/>
```

### Active State Re-rendering

The toolbar needs to re-render when editor state changes. Two approaches:

**Option A: Force re-render on update (simpler)**
```typescript
const [, forceUpdate] = useReducer(x => x + 1, 0);

useEffect(() => {
  if (!editor) return;

  editor.on('selectionUpdate', forceUpdate);
  editor.on('transaction', forceUpdate);

  return () => {
    editor.off('selectionUpdate', forceUpdate);
    editor.off('transaction', forceUpdate);
  };
}, [editor]);
```

**Option B: TipTap React's built-in re-render**
TipTap's `useEditor` hook already triggers re-renders on state changes. If Toolbar receives the editor as a prop and uses `editor.isActive()`, React should handle updates automatically when combined with proper dependency tracking.

### Keyboard Shortcuts

TipTap's StarterKit already includes these shortcuts:
- Cmd/Ctrl+B: Bold
- Cmd/Ctrl+I: Italic
- Cmd/Ctrl+Shift+1/2/3: Headings (if configured)

Heading shortcuts may need explicit configuration:
```typescript
// In useTipTapEditor.ts, if heading shortcuts aren't working:
StarterKit.configure({
  heading: {
    levels: [1, 2, 3],
  },
}),
```

### Cross-Platform Shortcut Display

```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const shortcuts = {
  bold: isMac ? 'Cmd+B' : 'Ctrl+B',
  italic: isMac ? 'Cmd+I' : 'Ctrl+I',
  h1: isMac ? 'Cmd+Shift+1' : 'Ctrl+Shift+1',
  // etc.
};
```

### Project Structure Notes

Files from Story 4.1 will be modified:
- `src/webview/components/Toolbar.tsx` - Add button handlers
- `src/webview/__tests__/Toolbar.test.tsx` - Add functionality tests

### Dependencies

This story depends on Story 4.1 (Persistent Toolbar) being completed first.

### Anti-Patterns to Avoid

- DO NOT call editor commands without `.focus()` (cursor may jump)
- DO NOT check `editor.can()` for these commands (always available)
- DO NOT debounce toolbar button clicks (should be instant)
- DO NOT use setTimeout for state updates (creates lag)

### Testing Strategy

```typescript
// Test bold toggle
it('toggles bold when bold button clicked', () => {
  // Select text
  // Click bold button
  // Assert editor.isActive('bold') === true
  // Click bold button again
  // Assert editor.isActive('bold') === false
});

// Test active state
it('shows active state when cursor in bold text', () => {
  // Set content with bold text
  // Move cursor into bold text
  // Assert bold button has active class
});
```

### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Click bold, no selection | Enable bold mode for next typed text |
| Select across bold/unbold | Toggle based on first character |
| Heading inside list | Convert list item to heading (exits list) |
| Multiple headings selected | Apply heading to all selected blocks |
| Nested formatting (bold+italic) | Both active states shown |

### References

- [Source: docs/epics.md#Story 4.2: Text Formatting via Toolbar]
- [Source: docs/architecture.md#Communication Patterns]
- [TipTap Commands](https://tiptap.dev/api/commands)
- [TipTap Bold Extension](https://tiptap.dev/api/marks/bold)
- [TipTap Heading Extension](https://tiptap.dev/api/nodes/heading)

## Dev Agent Record

### Context Reference

Story created by create-story workflow (SM agent, YOLO mode).
Depends on: Story 4.1 (Persistent Formatting Toolbar)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Tasks 1-5, 7 were already implemented in Story 4.1 (button handlers and isActive checks)
- Added active state re-rendering via useReducer + editor event subscriptions (selectionUpdate, transaction)
- Toolbar now properly updates when cursor moves through formatted text
- Added 13 new tests for text formatting functionality (20 total Toolbar tests)
- Tests cover: toggleBold, toggleItalic, toggleHeading with levels 1-3
- Tests verify active state styling and event subscription/unsubscription
- Keyboard shortcuts work via TipTap's StarterKit built-in handlers
- 138 total tests pass, no regressions

### File List

**Files Modified:**
- `wysiwyg-markdown-editor/src/webview/components/Toolbar.tsx` - Added useReducer for force re-render and editor event subscriptions
- `wysiwyg-markdown-editor/src/webview/__tests__/Toolbar.test.tsx` - Added 13 new tests for formatting functionality

### Change Log

- 2025-12-13: Story created with comprehensive developer context (create-story workflow)
- 2025-12-13: Implementation complete - Added active state updates, 13 new tests, 138 total tests pass
