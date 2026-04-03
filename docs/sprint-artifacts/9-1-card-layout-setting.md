# Story 9.1: Card Layout Setting

**Status:** Done

## Story

As a **user**,
I want to toggle the card layout appearance,
So that I can choose between card and full-width layouts.

## Acceptance Criteria

### AC1: Card Layout Default
**Given** the setting `markdownWysiwyg.showCard` is true (default)
**When** the editor loads
**Then** the document appears in a card with shadow and rounded corners

### AC2: Full-Width Layout
**Given** the setting `markdownWysiwyg.showCard` is false
**When** the editor loads
**Then** the document uses full-width layout without card styling

### AC3: Immediate Application
**Given** I change the showCard setting
**When** the setting changes
**Then** the layout updates immediately without reload

### AC4: VS Code Settings Integration
**Given** I open VS Code settings
**When** I search for "markdownWysiwyg.showCard"
**Then** I see the setting with description and default value

## Tasks / Subtasks

- [x] **Task 1: Add VS Code Setting**
  - [x] Add `markdownWysiwyg.showCard` to package.json configuration
  - [x] Type: boolean, default: true
  - [x] Description: "Show editor content in a card with shadow"

- [x] **Task 2: Pass Setting to WebView**
  - [x] Include in EditorSettings interface
  - [x] Send with init message
  - [x] Send settingsUpdate on change

- [x] **Task 3: Apply Card Styling**
  - [x] Conditional CSS classes based on setting
  - [x] Card style: shadow, rounded corners, max-width
  - [x] Full-width: no shadow, full container width

- [x] **Task 4: Listen for Setting Changes**
  - [x] Subscribe to configuration change events
  - [x] Send settingsUpdate message on change
  - [x] Update UI without reload

## Dev Notes

### Files Modified
- `wysiwyg-markdown-editor/package.json` - Added showCard setting
- `src/shared/messages.types.ts` - EditorSettings interface
- `src/extension/editorProvider.ts` - Read and send setting
- `src/webview/App.tsx` - Apply conditional styling

### CSS Classes
```css
/* Card layout */
.card-layout {
  max-width: 4xl;
  box-shadow: lg;
  border-radius: xl;
}

/* Full-width layout */
.full-width-layout {
  max-width: none;
  box-shadow: none;
}
```

### Setting Configuration
```json
{
  "markdownWysiwyg.showCard": {
    "type": "boolean",
    "default": true,
    "description": "Show editor content in a card with shadow and rounded corners"
  }
}
```

## References

- [Source: docs/epics.md#Epic 9: Editor Customization]
- [PRD: FR33 - showCard setting]

## Dev Agent Record

### Completion Notes

- showCard setting added to VS Code configuration
- Card layout with shadow and rounded corners when true
- Full-width layout without decoration when false
- Settings changes apply immediately via settingsUpdate message
- All acceptance criteria verified

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
