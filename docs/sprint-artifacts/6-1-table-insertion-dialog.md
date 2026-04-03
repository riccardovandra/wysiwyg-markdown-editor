# Story 6.1: Table Insertion Dialog

**Status:** Done

## Story

As a **user**,
I want to insert tables via a dialog,
So that I can specify the number of rows and columns before creating a table.

## Acceptance Criteria

### AC1: Table Button in Toolbar
**Given** I am in the WYSIWYG editor
**When** I look at the toolbar
**Then** I see a Table button that opens the insertion dialog

### AC2: Dialog Configuration Options
**Given** I click the Table button
**When** the dialog opens
**Then** I can configure rows (1-20) and columns (1-10)
**And** default values are 3 rows and 3 columns

### AC3: Table Insertion
**Given** I have configured rows and columns
**When** I click "Insert"
**Then** a table is created with the specified dimensions
**And** the first row is treated as a header row
**And** the dialog closes

### AC4: Cancel Action
**Given** the dialog is open
**When** I click "Cancel" or press Escape
**Then** the dialog closes without inserting a table

### AC5: Keyboard Support
**Given** the dialog is open
**When** I press Enter
**Then** the table is inserted (same as clicking Insert)

## Tasks / Subtasks

- [x] **Task 1: Create TableDialog Component**
  - [x] Create `TableDialog.tsx` in `src/webview/components/`
  - [x] Add row input (1-20 range)
  - [x] Add column input (1-10 range)
  - [x] Add Insert and Cancel buttons

- [x] **Task 2: Add Table Extensions to TipTap**
  - [x] Install @tiptap/extension-table and related packages
  - [x] Configure Table, TableRow, TableCell, TableHeader extensions
  - [x] Add to editor configuration

- [x] **Task 3: Add Table Button to Toolbar**
  - [x] Add Table icon button using Lucide
  - [x] Wire up to show dialog state
  - [x] Position in appropriate toolbar group

- [x] **Task 4: Implement Table Insertion Logic**
  - [x] Use `editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()`
  - [x] Close dialog after successful insertion
  - [x] Handle keyboard events (Enter to insert, Escape to cancel)

## Dev Notes

### Files Modified
- `src/webview/components/Toolbar.tsx` - Added table button
- `src/webview/App.tsx` - Added dialog state management

### Files Created
- `src/webview/components/TableDialog.tsx` - Table configuration dialog

### TipTap Extensions Used
- `@tiptap/extension-table`
- `@tiptap/extension-table-row`
- `@tiptap/extension-table-cell`
- `@tiptap/extension-table-header`

## References

- [Source: docs/epics.md#Epic 6: Table Support]
- [PRD: FR26 - Insert tables via toolbar]

## Dev Agent Record

### Completion Notes

- Implemented TableDialog component with row/column configuration
- Added table extensions to TipTap editor
- Toolbar table button opens dialog
- Tables created with header row by default
- All acceptance criteria verified

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
