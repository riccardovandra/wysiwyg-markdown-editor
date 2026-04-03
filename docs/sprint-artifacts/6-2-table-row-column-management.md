# Story 6.2: Table Row/Column Management

**Status:** Done

## Story

As a **user**,
I want to add and delete rows and columns in existing tables,
So that I can modify table structure after creation.

## Acceptance Criteria

### AC1: Add Row Below
**Given** my cursor is inside a table cell
**When** I click "Add Row Below" in the toolbar
**Then** a new row is added below the current row
**And** the new row has the same number of cells

### AC2: Add Column Right
**Given** my cursor is inside a table cell
**When** I click "Add Column Right" in the toolbar
**Then** a new column is added to the right of the current column

### AC3: Delete Table
**Given** my cursor is inside a table
**When** I click "Delete Table" in the toolbar
**Then** the entire table is removed from the document

### AC4: Conditional Toolbar Buttons
**Given** the table management buttons
**When** my cursor is NOT in a table
**Then** the buttons are disabled or hidden
**When** my cursor IS in a table
**Then** the buttons are enabled/visible

### AC5: Cell Resizing
**Given** a table in the editor
**When** I drag cell borders
**Then** I can resize column widths

## Tasks / Subtasks

- [x] **Task 1: Add Row Management Button**
  - [x] Add "Add Row" button with RowsIcon
  - [x] Implement `editor.chain().addRowAfter().run()`
  - [x] Conditional visibility based on table context

- [x] **Task 2: Add Column Management Button**
  - [x] Add "Add Column" button with ColumnsIcon
  - [x] Implement `editor.chain().addColumnAfter().run()`
  - [x] Conditional visibility based on table context

- [x] **Task 3: Add Delete Table Button**
  - [x] Add "Delete Table" button with Trash2 icon
  - [x] Implement `editor.chain().deleteTable().run()`
  - [x] Conditional visibility based on table context

- [x] **Task 4: Configure Table Resizing**
  - [x] Enable `resizable: true` in Table extension config
  - [x] Add CSS for resize handles

## Dev Notes

### Files Modified
- `src/webview/components/Toolbar.tsx` - Added table management buttons

### TipTap Commands Used
```typescript
editor.chain().focus().addRowAfter().run()
editor.chain().focus().addColumnAfter().run()
editor.chain().focus().deleteTable().run()
```

### Toolbar Context Detection
```typescript
const isInTable = editor?.isActive('table')
```

## References

- [Source: docs/epics.md#Epic 6: Table Support]
- [PRD: FR27 - Add rows/columns, FR28 - Delete tables]

## Dev Agent Record

### Completion Notes

- Table management buttons added to toolbar
- Buttons conditionally visible when cursor is in table
- Row/column addition works correctly
- Table deletion removes entire table
- Cell resizing enabled via Table extension

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
