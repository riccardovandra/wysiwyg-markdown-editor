# Story 5.6: Extension-Controlled Font Settings

**Status:** Ready for Review

## Story

As a **user**,
I want the extension to control the editor font,
So that the reading experience is optimized regardless of my VS Code editor font.

## Acceptance Criteria

### AC1: Default Readable Font Stack
**Given** the extension has default font settings
**When** I open a document
**Then** the content uses a readable sans-serif font (not VS Code's monospace)
**And** the default font stack prioritizes system fonts:
`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

### AC2: Code Blocks Remain Monospace
**Given** a document contains code blocks (fenced or inline)
**When** the content renders
**Then** code blocks still use monospace font (unchanged from current behavior)
**And** the prose font setting does NOT affect code blocks

### AC3: Font Family Setting
**Given** the VS Code setting `markdownWysiwyg.fontFamily` exists
**When** I set it to a custom value (e.g., `"Georgia, serif"`)
**Then** the document content uses that font family
**And** the setting appears in VS Code settings UI

### AC4: Font Size Setting
**Given** the VS Code setting `markdownWysiwyg.fontSize` exists
**When** I set it to a numeric value (e.g., `16`, `18`, `20`)
**Then** the base font size adjusts accordingly (in pixels)
**And** the setting has sensible min/max limits (12-24)

### AC5: Line Height Setting
**Given** the VS Code setting `markdownWysiwyg.lineHeightMultiplier` exists
**When** I set it to a numeric value (e.g., `1.5`, `1.75`, `2.0`)
**Then** the line spacing adjusts accordingly
**And** the setting has sensible limits (1.0-2.5)

### AC6: Settings Apply Immediately
**Given** I change any font setting while a document is open
**When** the setting change is saved
**Then** the change applies immediately to all open WYSIWYG editors
**And** no manual reload is required

### AC7: Settings Integration
**Given** the extension has font settings
**When** I view VS Code settings (UI or JSON)
**Then** all font settings appear under "Markdown WYSIWYG" category
**And** each setting has a clear description

## Tasks / Subtasks

- [x] **Task 1: Add Font Settings to package.json** (AC: 3, 4, 5, 7)
  - [x] Add `markdownWysiwyg.fontFamily` setting (string, default: system font stack)
  - [x] Add `markdownWysiwyg.fontSize` setting (number, default: 16, min: 12, max: 24)
  - [x] Add `markdownWysiwyg.lineHeightMultiplier` setting (number, default: 1.75, min: 1.0, max: 2.5)
  - [x] Include clear descriptions for each setting
  - [x] Verify settings appear in VS Code settings UI

- [x] **Task 2: Update EditorSettings Type** (AC: 3, 4, 5)
  - [x] Add `fontFamily?: string` to EditorSettings interface
  - [x] Add `fontSize?: number` to EditorSettings interface
  - [x] Add `lineHeightMultiplier?: number` to EditorSettings interface
  - [x] Ensure type changes compile without errors

- [x] **Task 3: Update Extension Settings Provider** (AC: 6)
  - [x] Read new font settings in `editorProvider.ts`
  - [x] Include font settings in `settingsUpdate` message
  - [x] Listen for configuration changes to trigger live updates
  - [x] Ensure settings are passed on init and on change

- [x] **Task 4: Apply Font Settings in WebView** (AC: 1, 3, 4, 5, 6)
  - [x] Update `applySettings` in App.tsx to handle new font settings
  - [x] Set CSS variables: `--prose-font-family`, `--prose-font-size-px`, `--prose-line-height`
  - [x] Ensure defaults match acceptance criteria

- [x] **Task 5: Update CSS to Use Font Variables** (AC: 1, 2)
  - [x] Add `--prose-font-family` CSS variable with default value
  - [x] Update body font-family to use `--prose-font-family`
  - [x] Update `.prose` elements to use the font variables
  - [x] Ensure code blocks (`.ProseMirror pre code`, inline code) remain monospace
  - [x] Update `--prose-font-size` to use pixel value from setting

- [x] **Task 6: Write Tests** (AC: 1-6)
  - [x] Test that default font stack is applied
  - [x] Test that code blocks remain monospace
  - [x] Test that custom fontFamily setting is applied
  - [x] Test that fontSize setting is applied as pixels
  - [x] Test that lineHeightMultiplier setting is applied
  - [x] Test that settings changes trigger CSS updates

## Dev Notes

### Architecture Compliance

From [docs/architecture.md](docs/architecture.md):
- **Settings Pattern**: Follow existing configuration structure in `package.json`
- **Message Types**: Add new fields to `EditorSettings` interface in `src/shared/messages.types.ts`
- **CSS Variables**: Apply settings via CSS custom properties (existing pattern in App.tsx)
- **Live Updates**: Use `vscode.workspace.onDidChangeConfiguration` (existing pattern)

### Current Implementation Analysis

**Existing Settings Structure (package.json lines 72-161):**
The extension already has these settings:
- `markdownWysiwyg.autoOpen` - boolean
- `markdownWysiwyg.hideToolbar` - boolean
- `markdownWysiwyg.showCard` - boolean
- `markdownWysiwyg.contentPadding` - enum (compact/medium/spacious)
- `markdownWysiwyg.textSize` - enum (small/medium/large)
- `markdownWysiwyg.lineHeight` - enum (tight/compact/normal/relaxed)
- `markdownWysiwyg.accentTheme` - enum (indigo/blue/purple/teal/neutral)
- `markdownWysiwyg.disableBoldAccentColor` - boolean

**Note:** The existing `textSize` and `lineHeight` settings use enum values, NOT numeric values. This story adds **new** settings with numeric values for more precise control:
- `fontSize` (number in px) - more granular than `textSize` enum
- `lineHeightMultiplier` (number) - more granular than `lineHeight` enum
- `fontFamily` (string) - new capability

**Decision:** Keep existing enum settings for backward compatibility. The new numeric settings will override the enum settings if both are specified.

### Current CSS Analysis

**Body Font (index.css line 130):**
```css
body {
  font-family: var(--vscode-font-family, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}
```

**Current Issue:** This uses `--vscode-font-family` which is typically monospace (VS Code's editor font). This story changes the default to a readable sans-serif stack.

**Prose Font Variables (index.css lines 116-119):**
```css
:root {
  --prose-font-size: 0.95rem; /* Set via textSize setting */
  --prose-line-height: 1.75; /* Set via lineHeight setting */
}
```

**Code Block Font (index.css lines 456-465):**
```css
.ProseMirror pre code {
  font-family: var(--vscode-editor-fontFamily, 'JetBrains Mono', 'Fira Code', 'Consolas', monospace);
  /* This must remain unchanged */
}
```

### Existing EditorSettings Interface

From `src/shared/messages.types.ts`:
```typescript
export interface EditorSettings {
  hideToolbar?: boolean;
  showCard?: boolean;
  contentPadding?: 'compact' | 'medium' | 'spacious';
  textSize?: 'small' | 'medium' | 'large';
  lineHeight?: 'tight' | 'compact' | 'normal' | 'relaxed';
  accentTheme?: 'indigo' | 'blue' | 'purple' | 'teal' | 'neutral';
  disableBoldAccentColor?: boolean;
}
```

### Existing Settings Application Pattern

From `App.tsx` (lines 44-67, 192-203):
```typescript
// Apply settings via CSS variables
useEffect(() => {
  const textSizeMap = { small: '0.85rem', medium: '0.95rem', large: '1rem' };
  document.documentElement.style.setProperty('--prose-font-size', textSizeMap[textSize || 'medium']);
}, [textSize]);

useEffect(() => {
  const lineHeightMap = { tight: '1', compact: '1.5', normal: '1.75', relaxed: '2' };
  document.documentElement.style.setProperty('--prose-line-height', lineHeightMap[lineHeight || 'normal']);
}, [lineHeight]);
```

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add 3 new font settings to configuration |
| `src/shared/messages.types.ts` | Add font fields to EditorSettings interface |
| `src/extension/editorProvider.ts` | Read and pass font settings |
| `src/webview/App.tsx` | Apply font settings via CSS variables |
| `src/webview/styles/index.css` | Add font-family variable, update body font |

### New Settings Schema

Add to `package.json` contributes.configuration.properties:

```json
"markdownWysiwyg.fontFamily": {
  "type": "string",
  "default": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "description": "Font family for document content. Code blocks always use monospace."
},
"markdownWysiwyg.fontSize": {
  "type": "number",
  "default": 16,
  "minimum": 12,
  "maximum": 24,
  "description": "Base font size in pixels for document content."
},
"markdownWysiwyg.lineHeightMultiplier": {
  "type": "number",
  "default": 1.75,
  "minimum": 1.0,
  "maximum": 2.5,
  "description": "Line height multiplier for paragraph text."
}
```

### Updated EditorSettings Interface

```typescript
export interface EditorSettings {
  hideToolbar?: boolean;
  showCard?: boolean;
  contentPadding?: 'compact' | 'medium' | 'spacious';
  textSize?: 'small' | 'medium' | 'large';
  lineHeight?: 'tight' | 'compact' | 'normal' | 'relaxed';
  accentTheme?: 'indigo' | 'blue' | 'purple' | 'teal' | 'neutral';
  disableBoldAccentColor?: boolean;
  // NEW: Extension-controlled font settings
  fontFamily?: string;
  fontSize?: number;
  lineHeightMultiplier?: number;
}
```

### CSS Variable Updates

Add to `index.css` :root:
```css
:root {
  /* New: Extension-controlled font family */
  --prose-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  /* Existing (keep for backward compatibility) */
  --prose-font-size: 0.95rem;
  --prose-line-height: 1.75;
}
```

Update body font:
```css
body {
  /* Change from vscode-font-family to prose-font-family */
  font-family: var(--prose-font-family);
}
```

### App.tsx Updates

Add new state and effects:
```typescript
const [fontFamily, setFontFamily] = useState<string>('-apple-system, BlinkMacSystemFont, ...');
const [fontSizePx, setFontSizePx] = useState<number>(16);
const [lineHeightMultiplier, setLineHeightMultiplier] = useState<number>(1.75);

// In applySettings callback
if (settings.fontFamily !== undefined) {
  setFontFamily(settings.fontFamily);
}
if (settings.fontSize !== undefined) {
  setFontSizePx(settings.fontSize);
}
if (settings.lineHeightMultiplier !== undefined) {
  setLineHeightMultiplier(settings.lineHeightMultiplier);
}

// New useEffects
useEffect(() => {
  document.documentElement.style.setProperty('--prose-font-family', fontFamily);
}, [fontFamily]);

useEffect(() => {
  document.documentElement.style.setProperty('--prose-font-size', `${fontSizePx}px`);
}, [fontSizePx]);

useEffect(() => {
  document.documentElement.style.setProperty('--prose-line-height', String(lineHeightMultiplier));
}, [lineHeightMultiplier]);
```

### Interaction with Existing Settings

The new numeric settings should take **priority** over existing enum settings:

1. If `fontSize` is set → use its pixel value directly
2. Else if `textSize` is set → use mapped rem value (existing behavior)
3. Else → use default 16px

Similarly for line height:
1. If `lineHeightMultiplier` is set → use its value directly
2. Else if `lineHeight` is set → use mapped value (existing behavior)
3. Else → use default 1.75

This ensures backward compatibility while providing more precise control.

### Testing Strategy

**Unit Tests (Vitest):**
```typescript
describe('Font Settings', () => {
  it('applies default font family (sans-serif, not monospace)', () => {
    // Check body font-family includes system fonts
    const style = getComputedStyle(document.body);
    expect(style.fontFamily).toContain('apple-system');
  });

  it('applies custom fontFamily setting', () => {
    // Simulate settingsUpdate with fontFamily: 'Georgia, serif'
    // Verify --prose-font-family CSS variable
  });

  it('applies fontSize as pixels', () => {
    // Set fontSize=18, verify --prose-font-size is '18px'
  });

  it('does not affect code block fonts', () => {
    // Verify code blocks use monospace regardless of prose font setting
    const codeBlock = document.querySelector('.ProseMirror pre code');
    const style = getComputedStyle(codeBlock);
    expect(style.fontFamily).toContain('monospace');
  });

  it('updates immediately on setting change', () => {
    // Simulate settingsUpdate message, verify CSS changes
  });
});
```

### Anti-Patterns to Avoid

- **DO NOT** change the font of code blocks - they must remain monospace
- **DO NOT** use rem units for fontSize setting - use pixels for predictability
- **DO NOT** break backward compatibility with existing textSize/lineHeight settings
- **DO NOT** apply font settings to toolbar or other UI elements - only prose content
- **DO NOT** use inline styles - use CSS variables consistently

### Edge Cases to Handle

| Scenario | Expected Behavior |
|----------|------------------|
| Empty fontFamily setting | Use default system font stack |
| Invalid fontFamily string | CSS gracefully falls back to next font |
| fontSize below minimum (12) | VS Code clamps to 12px |
| fontSize above maximum (24) | VS Code clamps to 24px |
| lineHeightMultiplier outside range | VS Code clamps to 1.0-2.5 |
| Both textSize and fontSize set | fontSize takes priority |
| Both lineHeight and lineHeightMultiplier set | lineHeightMultiplier takes priority |
| Web font specified | May not load (no external access in webview) |

### Previous Story Intelligence (5-5-mermaid-diagram-rendering)

Key patterns from Story 5-5:
1. **Theme Detection**: Continue using `document.body.dataset.vscodeThemeKind`
2. **CSS Variables**: Set on `document.documentElement.style`
3. **Settings via Messages**: Use existing `settingsUpdate` message pattern
4. **Live Updates**: Apply immediately in `applySettings` callback

### Recommended Font Configurations (for README)

```json
// Clean sans-serif (default)
{
  "markdownWysiwyg.fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
}

// Elegant serif for long-form reading
{
  "markdownWysiwyg.fontFamily": "Georgia, Cambria, 'Times New Roman', serif"
}

// Larger, more spacious for accessibility
{
  "markdownWysiwyg.fontSize": 18,
  "markdownWysiwyg.lineHeightMultiplier": 2.0
}
```

### References

- [Source: docs/architecture.md#Frontend Architecture]
- [Source: docs/epics.md#Story 5.6]
- [Source: package.json lines 72-161 - existing configuration structure]
- [Source: src/shared/messages.types.ts lines 12-20 - EditorSettings interface]
- [Source: src/webview/App.tsx lines 44-67, 192-203 - applySettings pattern]
- [Source: src/webview/styles/index.css lines 116-132 - CSS variables and body font]
- [Web Typography Best Practices - System Font Stack](https://css-tricks.com/snippets/css/system-font-stack/)
- [VS Code Extension Configuration Guide](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)

## Dev Agent Record

### Context Reference

Story created for Epic 5: UI/UX Polish & Customization. This is the sixth story in the epic (5-7-hide-toolbar was added as a mid-sprint addition).

**Epic 5 Progress:**
- 5-1-improved-padding-spacing: **done**
- 5-2-auto-open-setting: **review**
- 5-3-theme-aware-toolbar: **review**
- 5-4-source-visual-toggle: **review**
- 5-5-mermaid-diagram-rendering: **review**
- 5-6-extension-controlled-fonts: **ready-for-dev** (this story)
- 5-7-hide-toolbar: **done**

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Analyzed current codebase: package.json, messages.types.ts, App.tsx, Editor.tsx, index.css
- Verified existing settings pattern and CSS variable usage
- Identified interaction between existing enum settings and new numeric settings
- Confirmed code block font isolation requirement
- Reviewed existing font-family usage in index.css line 130

### Completion Notes List

- Story enhanced with comprehensive developer context from codebase analysis (2025-12-30)
- Existing settings structure analyzed and preserved for backward compatibility
- CSS variable pattern documented with specific line references
- Testing strategy defined with specific test cases
- Edge cases and anti-patterns documented
- Priority rules for conflicting settings (enum vs numeric) defined
- ✅ Implementation complete (2026-01-03): All 6 tasks implemented and tested
- ✅ Added 3 new font settings (fontFamily, fontSize, lineHeightMultiplier) with proper defaults and min/max limits
- ✅ Numeric settings (fontSize, lineHeightMultiplier) take priority over existing enum settings for backward compatibility
- ✅ CSS updated: body uses --prose-font-family, code blocks remain monospace
- ✅ Live updates work via existing configChangeSubscription pattern
- ✅ 10 unit tests added covering all acceptance criteria

### File List

**Files Created:**
- wysiwyg-markdown-editor/src/webview/__tests__/FontSettings.test.tsx (new test file with 10 tests)

**Files Modified:**
- wysiwyg-markdown-editor/package.json (added 3 new font settings: fontFamily, fontSize, lineHeightMultiplier)
- wysiwyg-markdown-editor/src/shared/messages.types.ts (added fontFamily, fontSize, lineHeightMultiplier to EditorSettings)
- wysiwyg-markdown-editor/src/extension/editorProvider.ts (read and pass new font settings in getEditorSettings())
- wysiwyg-markdown-editor/src/webview/App.tsx (added state, applySettings handlers, and useEffect hooks for font CSS variables)
- wysiwyg-markdown-editor/src/webview/styles/index.css (added --prose-font-family variable, updated body font-family)

### Change Log

- 2025-12-13: Story created with basic developer context
- 2025-12-30: Story enhanced with comprehensive implementation guidance from codebase analysis, marked ready-for-dev
- 2026-01-03: Implementation complete - All tasks implemented, 10 tests passing, marked Ready for Review
