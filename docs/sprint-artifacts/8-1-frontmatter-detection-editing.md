# Story 8.1: Frontmatter Detection and Editing

**Status:** Done

## Story

As a **user**,
I want YAML frontmatter to be detected and editable,
So that I can manage document metadata easily.

## Acceptance Criteria

### AC1: Frontmatter Detection
**Given** a markdown document starts with:
```yaml
---
title: My Document
date: 2025-01-01
---
```
**When** the content loads
**Then** the frontmatter is detected and extracted

### AC2: Frontmatter Editor
**Given** a document has frontmatter
**When** the frontmatter panel is visible
**Then** I see a dedicated textarea for editing the YAML

### AC3: Live Sync
**Given** I am editing frontmatter
**When** I make changes
**Then** the changes are synced to the markdown file

### AC4: Content Separation
**Given** a document with frontmatter
**When** rendered in the editor
**Then** the main content displays without the frontmatter delimiters

### AC5: Frontmatter Preservation
**Given** a document with frontmatter
**When** I edit only the main content and save
**Then** the frontmatter is preserved unchanged

## Tasks / Subtasks

- [x] **Task 1: Implement Frontmatter Detection**
  - [x] Regex pattern: `^---\r?\n([\s\S]*?)\r?\n---\r?\n?`
  - [x] Extract frontmatter from content on load
  - [x] Separate frontmatter from main content

- [x] **Task 2: Create FrontmatterEditor Component**
  - [x] Create `FrontmatterEditor.tsx` component
  - [x] Textarea with monospace font
  - [x] Header with icon and close button
  - [x] Placeholder text showing example

- [x] **Task 3: State Management**
  - [x] Add frontmatter state in App.tsx
  - [x] Track frontmatter content separately
  - [x] Handle edits in frontmatter panel

- [x] **Task 4: Implement Re-serialization**
  - [x] Combine frontmatter with content on save
  - [x] Add proper `---` delimiters
  - [x] Ensure no duplicate delimiters

## Dev Notes

### Files Created
- `src/webview/components/FrontmatterEditor.tsx`

### Files Modified
- `src/webview/App.tsx` - Frontmatter state management
- `src/webview/utils/markdownParser.ts` - Frontmatter extraction

### Detection Regex
```typescript
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
```

### Component Props
```typescript
interface FrontmatterEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}
```

## References

- [Source: docs/epics.md#Epic 8: Frontmatter Support]
- [PRD: FR31 - Detect YAML frontmatter, FR32 - Visual editor]

## Dev Agent Record

### Completion Notes

- Frontmatter detection via regex works correctly
- FrontmatterEditor component displays YAML in textarea
- Live editing syncs changes to document
- Main content renders without frontmatter delimiters
- Re-serialization preserves frontmatter on save

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
