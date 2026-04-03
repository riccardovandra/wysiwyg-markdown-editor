# Story 9.2: Content Padding Configuration

**Status:** Done

## Story

As a **user**,
I want to configure content padding,
So that I can adjust the reading area size.

## Acceptance Criteria

### AC1: Compact Padding
**Given** the setting `markdownWysiwyg.contentPadding` is "compact"
**When** the editor loads
**Then** minimal padding is applied around content

### AC2: Medium Padding (Default)
**Given** the setting `markdownWysiwyg.contentPadding` is "medium" (default)
**When** the editor loads
**Then** moderate padding is applied

### AC3: Spacious Padding
**Given** the setting `markdownWysiwyg.contentPadding` is "spacious"
**When** the editor loads
**Then** generous padding is applied

### AC4: Responsive Breakpoints
**Given** different viewport sizes
**When** padding is applied
**Then** padding adjusts appropriately for each breakpoint

### AC5: Immediate Application
**Given** I change the contentPadding setting
**When** the setting changes
**Then** the padding updates immediately without reload

## Tasks / Subtasks

- [x] **Task 1: Add VS Code Setting**
  - [x] Add `markdownWysiwyg.contentPadding` enum setting
  - [x] Options: compact, medium, spacious
  - [x] Default: medium

- [x] **Task 2: Define Padding Classes**
  - [x] Compact: px-6 py-6
  - [x] Medium: px-10 sm:px-14 lg:px-20 py-12
  - [x] Spacious: px-14 sm:px-20 lg:px-28 py-16

- [x] **Task 3: Apply Padding Dynamically**
  - [x] Read setting from EditorSettings
  - [x] Apply appropriate Tailwind classes
  - [x] Update on settings change

## Dev Notes

### Files Modified
- `wysiwyg-markdown-editor/package.json` - Added contentPadding setting
- `src/shared/messages.types.ts` - EditorSettings type
- `src/webview/App.tsx` - Dynamic padding classes

### Padding Values
```typescript
const paddingClasses = {
  compact: 'px-6 py-6',
  medium: 'px-10 sm:px-14 lg:px-20 py-12',
  spacious: 'px-14 sm:px-20 lg:px-28 py-16',
};
```

### Setting Configuration
```json
{
  "markdownWysiwyg.contentPadding": {
    "type": "string",
    "enum": ["compact", "medium", "spacious"],
    "default": "medium",
    "description": "Content padding level"
  }
}
```

## References

- [Source: docs/epics.md#Epic 9: Editor Customization]
- [PRD: FR34 - contentPadding setting]

## Dev Agent Record

### Completion Notes

- contentPadding setting with three options implemented
- Responsive padding for different viewport sizes
- Immediate update on setting change
- Tailwind utility classes for consistent styling

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
