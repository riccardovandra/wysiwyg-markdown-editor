# Story 7.2: Nested Task Lists

**Status:** Done

## Story

As a **user**,
I want to create nested task lists,
So that I can organize complex checklists with hierarchy.

## Acceptance Criteria

### AC1: Tab Indentation
**Given** I have a task list item
**When** I press Tab
**Then** the item is indented to create a nested list

### AC2: Shift-Tab Outdent
**Given** I have a nested task list item
**When** I press Shift+Tab
**Then** the item is outdented one level

### AC3: Visual Nesting
**Given** nested task list items
**When** rendered
**Then** they display with proper indentation
**And** each level is visually distinguishable

### AC4: Nested Toggle Independence
**Given** nested task list items
**When** I toggle a parent checkbox
**Then** child checkboxes remain in their individual states

### AC5: Markdown Preservation
**Given** nested task lists
**When** content is saved
**Then** the indentation levels are preserved in markdown

## Tasks / Subtasks

- [x] **Task 1: Enable Nested Task Lists**
  - [x] Configure TaskItem with `nested: true`
  - [x] Ensure sink/lift commands work for task items

- [x] **Task 2: Handle Tab/Shift+Tab**
  - [x] Tab key indents task item (sink)
  - [x] Shift+Tab outdents task item (lift)
  - [x] Proper list nesting behavior

- [x] **Task 3: Style Nested Levels**
  - [x] CSS for indentation at each level
  - [x] Consistent checkbox styling across levels
  - [x] Visual hierarchy indicators

- [x] **Task 4: Markdown Serialization**
  - [x] Preserve indentation in output
  - [x] Handle multiple nesting levels
  - [x] Round-trip verification

## Dev Notes

### Files Modified
- `src/webview/components/Editor.tsx` - TaskItem nested config
- `src/webview/styles/editor.css` - Nested list styling

### TipTap Configuration
```typescript
TaskItem.configure({
  nested: true,  // Enable nesting
})
```

### CSS for Nesting
```css
ul[data-type="taskList"] ul[data-type="taskList"] {
  margin-left: 1.5rem;
}
```

## References

- [Source: docs/epics.md#Epic 7: Task Lists]
- [PRD: FR29, FR30 - Task list functionality]

## Dev Agent Record

### Completion Notes

- Nested task lists fully functional
- Tab/Shift+Tab indentation works
- Visual hierarchy displays correctly
- Markdown serialization preserves nesting
- Child checkboxes independent of parent state

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
