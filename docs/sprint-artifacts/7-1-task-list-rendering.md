# Story 7.1: Task List Rendering and Interaction

**Status:** Done

## Story

As a **user**,
I want task lists to render as interactive checkboxes,
So that I can see and toggle todo items visually.

## Acceptance Criteria

### AC1: Unchecked Task Rendering
**Given** a markdown document contains `- [ ] unchecked item`
**When** the content renders
**Then** an unchecked checkbox is displayed before the text

### AC2: Checked Task Rendering
**Given** a markdown document contains `- [x] checked item`
**When** the content renders
**Then** a checked checkbox is displayed before the text

### AC3: Checkbox Toggle
**Given** a task list item is displayed
**When** I click the checkbox
**Then** its state toggles (checked <-> unchecked)
**And** the markdown file is updated with the new state

### AC4: Visual Styling
**Given** task list items
**When** rendered
**Then** they have proper spacing and alignment
**And** checkboxes are styled consistently with the editor theme

### AC5: Markdown Serialization
**Given** task list items with various states
**When** content is saved
**Then** the `[ ]` and `[x]` syntax is correctly preserved

## Tasks / Subtasks

- [x] **Task 1: Add TaskList Extension**
  - [x] Install @tiptap/extension-task-list and @tiptap/extension-task-item
  - [x] Configure extensions in editor setup
  - [x] Enable checkbox interactivity

- [x] **Task 2: Implement Markdown Parsing**
  - [x] Parse `- [ ]` and `- [x]` syntax
  - [x] Transform to TipTap TaskList/TaskItem nodes
  - [x] Handle nested task lists

- [x] **Task 3: Implement Checkbox Toggle**
  - [x] Add click handler for checkbox elements
  - [x] Update node attribute on toggle
  - [x] Trigger content sync after state change

- [x] **Task 4: Style Task List Items**
  - [x] CSS for checkbox appearance
  - [x] Proper indentation and spacing
  - [x] Theme-aware colors

- [x] **Task 5: Implement Serialization**
  - [x] Custom Turndown rule for task list items
  - [x] Preserve checked/unchecked state in output

## Dev Notes

### Files Modified
- `src/webview/components/Editor.tsx` - TaskList/TaskItem extensions
- `src/webview/utils/markdownParser.ts` - Task list parsing
- `src/webview/utils/markdownSerializer.ts` - Task list serialization
- `src/webview/styles/editor.css` - Task list styling

### TipTap Extensions
```typescript
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

// In editor config
extensions: [
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
]
```

### HTML Attributes
```html
<li data-type="taskItem" data-checked="true">Checked item</li>
<li data-type="taskItem" data-checked="false">Unchecked item</li>
```

## References

- [Source: docs/epics.md#Epic 7: Task Lists]
- [PRD: FR29 - Render task list checkboxes, FR30 - Toggle checkbox state]

## Dev Agent Record

### Completion Notes

- TaskList and TaskItem extensions configured
- Checkboxes render correctly for both states
- Click-to-toggle functionality works
- Markdown parsing handles `- [ ]` and `- [x]` syntax
- Serialization preserves checkbox states

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
