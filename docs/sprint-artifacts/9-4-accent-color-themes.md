# Story 9.4: Accent Color Themes

**Status:** Done

## Story

As a **user**,
I want to choose an accent color theme,
So that I can personalize the visual style.

## Acceptance Criteria

### AC1: Theme Options
**Given** the setting `markdownWysiwyg.accentTheme`
**When** set to different values
**Then** the accent color changes:
- "indigo" (default) - Indigo/purple tones
- "blue" - Blue tones
- "purple" - Purple/violet tones
- "teal" - Teal/cyan tones (high contrast)
- "neutral" - Gray tones

### AC2: Accent Application
**Given** an accent theme is selected
**When** the editor renders
**Then** the accent color is applied to:
- Links
- Headings
- Borders
- Selection highlights
- Inline code background

### AC3: Bold Accent Option
**Given** the setting `markdownWysiwyg.disableBoldAccentColor` is false (default)
**When** bold text is rendered
**Then** it uses the accent color
**Given** the setting is true
**When** bold text is rendered
**Then** it uses the default text color

### AC4: Immediate Theme Switch
**Given** I change the accent theme
**When** the setting changes
**Then** all accent colors update immediately without reload

## Tasks / Subtasks

- [x] **Task 1: Define Color Palettes**
  - [x] Create color definitions for each theme
  - [x] Include base, light, and dark variants
  - [x] Ensure sufficient contrast ratios

- [x] **Task 2: Add VS Code Settings**
  - [x] Add `markdownWysiwyg.accentTheme` enum setting
  - [x] Add `markdownWysiwyg.disableBoldAccentColor` boolean setting

- [x] **Task 3: Implement CSS Variables**
  - [x] Define accent color CSS custom properties
  - [x] Map theme selection to color values
  - [x] Apply across all accent-colored elements

- [x] **Task 4: Apply Theme Dynamically**
  - [x] Read theme from EditorSettings
  - [x] Set CSS variables on mount
  - [x] Update on settings change

## Dev Notes

### Files Modified
- `wysiwyg-markdown-editor/package.json` - Added accentTheme and disableBoldAccentColor
- `src/shared/messages.types.ts` - EditorSettings type updates
- `src/webview/App.tsx` - Theme application logic
- `src/webview/styles/editor.css` - CSS variable usage

### Color Palette Example
```typescript
const accentThemes = {
  indigo: {
    base: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  blue: {
    base: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    background: 'rgba(59, 130, 246, 0.1)',
  },
  // ... other themes
};
```

### CSS Variables
```css
:root {
  --accent-color: var(--theme-accent-base);
  --accent-color-light: var(--theme-accent-light);
  --accent-color-dark: var(--theme-accent-dark);
  --accent-background: var(--theme-accent-background);
}

a { color: var(--accent-color); }
h1, h2, h3 { color: var(--accent-color); }
code { background: var(--accent-background); }
```

### Setting Configurations
```json
{
  "markdownWysiwyg.accentTheme": {
    "type": "string",
    "enum": ["indigo", "blue", "purple", "teal", "neutral"],
    "default": "indigo",
    "description": "Accent color theme for links, headings, and highlights"
  },
  "markdownWysiwyg.disableBoldAccentColor": {
    "type": "boolean",
    "default": false,
    "description": "Use default text color for bold text instead of accent color"
  }
}
```

## References

- [Source: docs/epics.md#Epic 9: Editor Customization]
- [PRD: FR37 - accentTheme setting, FR38 - disableBoldAccentColor setting]

## Dev Agent Record

### Completion Notes

- Five accent themes implemented (indigo, blue, purple, teal, neutral)
- Accent colors applied to links, headings, borders, selections, inline code
- disableBoldAccentColor option for plain bold text
- Live theme switching without reload
- Consistent color application across all elements

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
