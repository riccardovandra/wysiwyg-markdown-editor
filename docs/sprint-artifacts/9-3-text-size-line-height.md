# Story 9.3: Text Size and Line Height Settings

**Status:** Done

## Story

As a **user**,
I want to configure text size and line height,
So that I can optimize readability for my preferences.

## Acceptance Criteria

### AC1: Text Size Options
**Given** the setting `markdownWysiwyg.textSize`
**When** set to "small"
**Then** base font size is 0.85rem
**When** set to "medium" (default)
**Then** base font size is 0.95rem
**When** set to "large"
**Then** base font size is 1rem

### AC2: Line Height Options
**Given** the setting `markdownWysiwyg.lineHeight`
**When** set to "tight"
**Then** line spacing is 1.0
**When** set to "compact"
**Then** line spacing is 1.5
**When** set to "normal" (default)
**Then** line spacing is 1.75
**When** set to "relaxed"
**Then** line spacing is 2.0

### AC3: Combined Effect
**Given** both settings are configured
**When** the editor loads
**Then** both text size and line height are applied together

### AC4: Immediate Application
**Given** I change either setting
**When** the setting changes
**Then** the typography updates immediately without reload

## Tasks / Subtasks

- [x] **Task 1: Add VS Code Settings**
  - [x] Add `markdownWysiwyg.textSize` enum setting
  - [x] Add `markdownWysiwyg.lineHeight` enum setting
  - [x] Set appropriate defaults

- [x] **Task 2: Define CSS Variables**
  - [x] Map text sizes to rem values
  - [x] Map line heights to numeric values
  - [x] Apply via CSS custom properties

- [x] **Task 3: Apply Typography Dynamically**
  - [x] Read settings from EditorSettings
  - [x] Set CSS variables on container
  - [x] Update on settings change

## Dev Notes

### Files Modified
- `wysiwyg-markdown-editor/package.json` - Added textSize and lineHeight settings
- `src/shared/messages.types.ts` - EditorSettings type updates
- `src/webview/App.tsx` - Dynamic typography application
- `src/webview/styles/editor.css` - CSS variable definitions

### Size Mapping
```typescript
const textSizeMap = {
  small: '0.85rem',
  medium: '0.95rem',
  large: '1rem',
};

const lineHeightMap = {
  tight: '1.0',
  compact: '1.5',
  normal: '1.75',
  relaxed: '2.0',
};
```

### CSS Application
```css
.editor-content {
  font-size: var(--editor-text-size);
  line-height: var(--editor-line-height);
}
```

### Setting Configurations
```json
{
  "markdownWysiwyg.textSize": {
    "type": "string",
    "enum": ["small", "medium", "large"],
    "default": "medium"
  },
  "markdownWysiwyg.lineHeight": {
    "type": "string",
    "enum": ["tight", "compact", "normal", "relaxed"],
    "default": "normal"
  }
}
```

## References

- [Source: docs/epics.md#Epic 9: Editor Customization]
- [PRD: FR35 - textSize setting, FR36 - lineHeight setting]

## Dev Agent Record

### Completion Notes

- textSize setting with small/medium/large options
- lineHeight setting with tight/compact/normal/relaxed options
- CSS variables apply typography dynamically
- Both settings work together for combined effect
- Immediate update on setting changes

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
