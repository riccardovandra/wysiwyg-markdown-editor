# Story 2.4: Text Input & Deletion

**Status:** Done

## Story

As a **user**,
I want to create and delete content naturally,
So that editing feels like a standard text editor.

## Acceptance Criteria

### AC1: Enter Creates New Line (FR15)
**Given** the cursor is in the document
**When** I press Enter
**Then** a new line or paragraph is created appropriately

### AC2: Enter in List Creates New Item
**Given** the cursor is at the end of a list item
**When** I press Enter
**Then** a new list item is created

### AC3: Double Enter Exits List
**Given** the cursor is in an empty list item
**When** I press Enter
**Then** the list is exited and a new paragraph is created

### AC4: Backspace Deletes Text (FR16)
**Given** the cursor is in text
**When** I press Backspace
**Then** the character before the cursor is deleted

### AC5: Backspace at Block Start Merges
**Given** the cursor is at the start of a block
**When** I press Backspace
**Then** the block merges with the previous block

### AC6: Backspace on Empty List Item
**Given** the cursor is in an empty list item
**When** I press Backspace
**Then** the list item is removed

### AC7: Delete Key Works
**Given** the cursor is in text
**When** I press Delete
**Then** the character after the cursor is deleted

### AC8: Delete Selected Text
**Given** I have text selected
**When** I press Backspace or Delete
**Then** the selected text is deleted

### AC9: Select All and Delete
**Given** I press Cmd/Ctrl+A
**When** I press Backspace or Delete
**Then** all content is deleted

## Tasks / Subtasks

- [x] **Task 1: Verify Enter key behavior** (AC: 1, 2, 3)
  - [x] Test Enter in paragraph creates new paragraph
  - [x] Test Enter in heading creates paragraph (not new heading)
  - [x] Test Enter in list item creates new list item
  - [x] Test Enter in empty list item exits list
  - [x] Test Enter in blockquote behavior

- [x] **Task 2: Verify Backspace behavior** (AC: 4, 5, 6)
  - [x] Test Backspace deletes character before cursor
  - [x] Test Backspace at paragraph start merges with previous
  - [x] Test Backspace at heading start converts to paragraph
  - [x] Test Backspace in empty list item removes item
  - [x] Test Backspace at document start does nothing

- [x] **Task 3: Verify Delete key behavior** (AC: 7)
  - [x] Test Delete removes character after cursor
  - [x] Test Delete at end of block merges with next block
  - [x] Test Delete at document end does nothing

- [x] **Task 4: Verify selection deletion** (AC: 8, 9)
  - [x] Test Backspace with selection deletes selected text
  - [x] Test Delete with selection deletes selected text
  - [x] Test Cmd/Ctrl+A selects all
  - [x] Test delete after select-all clears document

- [x] **Task 5: Test edge cases**
  - [x] Test empty document behavior
  - [x] Test single character document
  - [x] Test cursor at various boundaries
  - [x] Test rapid key presses

- [x] **Task 6: Write unit tests** (AC: 1-9)
  - [x] Create `src/webview/__tests__/Editor.input.test.tsx`
  - [x] Test keyboard events produce expected results
  - [x] Use TipTap's testing utilities if available

## Dev Notes

### TipTap Native Behaviors

All these behaviors are handled natively by TipTap/ProseMirror with StarterKit:
- Enter key handling for paragraphs, lists, blockquotes
- Backspace/Delete with proper block merging
- Selection deletion
- Select-all (Cmd/Ctrl+A)

**This story is primarily verification testing.**

### StarterKit Included Behaviors

StarterKit includes these relevant extensions:
- `Document` - Root node
- `Paragraph` - Default block type
- `Text` - Text content
- `HardBreak` - Shift+Enter line break
- `History` - Undo/redo (handled in Story 4.4)
- `BulletList`, `OrderedList`, `ListItem` - List behaviors

### List Behavior Details

TipTap's list behavior:
1. Enter at end of list item → new list item
2. Enter in middle of list item → split into two items
3. Enter on empty list item → exit list, create paragraph
4. Backspace on empty list item → remove item, cursor to previous
5. Tab/Shift+Tab → indent/outdent (if configured)

### Edge Cases to Test

| Scenario | Expected Behavior |
|----------|------------------|
| Enter in empty document | Create first paragraph |
| Backspace in empty document | Do nothing |
| Delete in empty document | Do nothing |
| Backspace at start of first block | Do nothing |
| Delete at end of last block | Do nothing |
| Enter at end of heading | Create paragraph, not heading |

### Current Codebase State

**From Story 2.1:**
- TipTap with StarterKit (includes all input handling)
- Editor is editable

**From Story 2.2:**
- Content loads from markdown
- Various block types present

**From Story 2.3:**
- Cursor placement works
- Selection works

### Anti-Patterns to Avoid

- DO NOT override TipTap's default key handlers unless necessary
- DO NOT add custom keydown listeners that conflict with TipTap
- DO NOT manually manipulate DOM content

### Testing Strategy

TipTap provides testing utilities. Example:

```typescript
import { Editor } from '@tiptap/core';

test('enter creates new paragraph', () => {
  const editor = new Editor({
    extensions: [StarterKit],
    content: '<p>Hello</p>',
  });

  editor.commands.focus('end');
  editor.commands.enter();

  expect(editor.getHTML()).toContain('<p>Hello</p><p></p>');
  editor.destroy();
});
```

For React integration tests:
```tsx
import { fireEvent, render } from '@testing-library/react';

test('typing adds content', () => {
  render(<Editor />);
  const editorEl = document.querySelector('.ProseMirror');
  fireEvent.keyDown(editorEl, { key: 'a' });
  // Assert content changed
});
```

### References

- [Source: docs/epics.md#Story 2.4: Text Input & Deletion]
- [Source: docs/architecture.md#TipTap Integration]

## Dev Agent Record

### Context Reference

Story created by create-story workflow.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Verification testing story, all TipTap behaviors worked as expected.

### Completion Notes List

- **Verification Testing Approach:** This story confirmed TipTap's native keyboard handling behaviors work correctly out-of-the-box with StarterKit configuration.
- **Test Strategy:** Used TipTap's editor API (commands) rather than DOM events since JSDOM doesn't fully support contenteditable interactions.
- **All ACs Verified:** 22 tests cover all 9 acceptance criteria (AC1-AC9) for Enter, Backspace, Delete, and selection behaviors.
- **No Implementation Changes Required:** TipTap/ProseMirror handles all text input and deletion behaviors natively.

### File List

- `wysiwyg-markdown-editor/src/webview/__tests__/Editor.input.test.tsx` (new) - 22 comprehensive tests for text input & deletion

### Change Log

- 2025-12-11: Story created with comprehensive developer context
- 2025-12-11: Created Editor.input.test.tsx with 22 tests verifying TipTap native behaviors (AC1-AC9)
