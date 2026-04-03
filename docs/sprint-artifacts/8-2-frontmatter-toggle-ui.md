# Story 8.2: Frontmatter Toggle UI

**Status:** Done

## Story

As a **user**,
I want to toggle frontmatter visibility,
So that I can show/hide metadata when focusing on content.

## Acceptance Criteria

### AC1: Toggle Button Presence
**Given** a document has frontmatter
**When** I look at the toolbar
**Then** I see a frontmatter toggle button

### AC2: Toggle Button Absence
**Given** a document has NO frontmatter
**When** I look at the toolbar
**Then** the frontmatter toggle button is NOT shown

### AC3: Toggle Visibility
**Given** the frontmatter panel is hidden
**When** I click the toggle button
**Then** the frontmatter editor panel becomes visible

### AC4: Toggle Hidden
**Given** the frontmatter panel is visible
**When** I click the toggle button
**Then** the frontmatter editor panel is hidden

### AC5: Active State Indicator
**Given** the frontmatter panel is visible
**When** I look at the toggle button
**Then** it shows an active/pressed state

## Tasks / Subtasks

- [x] **Task 1: Add Toggle Button to Toolbar**
  - [x] Use FileText or similar icon from Lucide
  - [x] Add button in appropriate toolbar position
  - [x] Implement toggle callback

- [x] **Task 2: Conditional Button Visibility**
  - [x] Track whether document has frontmatter
  - [x] Show button only when frontmatter exists
  - [x] Update on content changes

- [x] **Task 3: Panel Visibility State**
  - [x] Add `showFrontmatter` state in App.tsx
  - [x] Toggle state on button click
  - [x] Conditionally render FrontmatterEditor

- [x] **Task 4: Active State Styling**
  - [x] Apply active/pressed style when panel visible
  - [x] Match existing toolbar button styling
  - [x] Use VS Code theme variables

## Dev Notes

### Files Modified
- `src/webview/components/Toolbar.tsx` - Added toggle button
- `src/webview/App.tsx` - Visibility state management

### Toolbar Button Implementation
```typescript
{hasFrontmatter && (
  <ToolbarButton
    icon={FileText}
    onClick={onToggleFrontmatter}
    isActive={showFrontmatter}
    tooltip="Toggle Frontmatter"
  />
)}
```

### State Management
```typescript
const [showFrontmatter, setShowFrontmatter] = useState(false);
const hasFrontmatter = frontmatter !== null && frontmatter !== undefined;
```

## References

- [Source: docs/epics.md#Epic 8: Frontmatter Support]
- [PRD: FR32 - Toggle visibility]

## Dev Agent Record

### Completion Notes

- Toggle button added to toolbar with FileText icon
- Button only visible when document has frontmatter
- Click toggles FrontmatterEditor visibility
- Active state shown when panel is visible
- Consistent styling with other toolbar buttons

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
