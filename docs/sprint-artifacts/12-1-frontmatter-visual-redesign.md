# Story 12.1: Frontmatter Visual Redesign (Obsidian-style)

**Status:** ready-for-dev

## Story

As a **user**,
I want YAML frontmatter to be always visible as a collapsible, syntax-highlighted block at the top of the document,
So that I can see and edit metadata without hunting for a toolbar toggle.

## Acceptance Criteria

### AC1: Always Visible When Present

**Given** a markdown document has YAML frontmatter
**When** the document loads in the WYSIWYG editor
**Then** a collapsed frontmatter bar is visible at the top of the document content area
**And** the bar shows "Frontmatter" with a chevron icon

### AC2: Collapsible Behavior

**Given** the frontmatter bar is visible
**When** I click anywhere on the collapsed bar
**Then** it expands to show the full YAML content
**And** the chevron rotates to indicate expanded state
**When** I click the bar header again
**Then** it collapses back to the single-line bar

### AC3: YAML Syntax Highlighting

**Given** the frontmatter editor is expanded
**When** viewing the YAML content
**Then** keys, values, strings, and comments are syntax-highlighted
**And** highlighting uses the same color scheme as code blocks (hljs theme)

### AC4: Editable with Live Sync

**Given** the frontmatter editor is expanded
**When** I edit the YAML content
**Then** changes are synced to the markdown file (same as current behavior)
**And** syntax highlighting updates as I type

### AC5: Visual Integration

**Given** the editor is in card mode
**When** frontmatter is visible (collapsed or expanded)
**Then** it visually integrates with the document card (same max-width, matching background)
**And** it does not look like a separate floating panel

### AC6: No Frontmatter = No Bar

**Given** a markdown document has no YAML frontmatter
**When** the document loads
**Then** no frontmatter bar is shown at the top

### AC7: Toolbar Button Update

**Given** the toolbar has a frontmatter toggle button
**When** I click it
**Then** it toggles the frontmatter between expanded and collapsed (not show/hide)

## Tasks / Subtasks

- [ ] **Task 1: Export lowlight instance and register YAML language**
  - [ ] In `useTipTapEditor.ts`, register `yaml` language with lowlight
  - [ ] Export the lowlight instance for reuse by FrontmatterEditor

- [ ] **Task 2: Rewrite FrontmatterEditor component**
  - [ ] Replace `onClose` prop with `expanded: boolean` + `onToggleExpand: () => void`
  - [ ] Collapsed state: single-line header bar with chevron-right, "Frontmatter" label
  - [ ] Expanded state: header bar (chevron-down) + syntax-highlighted editing area
  - [ ] Dual-layer editing: `<pre>` backdrop with lowlight HTML + transparent `<textarea>` overlay
  - [ ] Sync scroll position between textarea and pre backdrop
  - [ ] Auto-resize textarea height to content

- [ ] **Task 3: Update App.tsx state management**
  - [ ] Replace `showFrontmatter` with `frontmatterExpanded` (default: `false`)
  - [ ] Always render FrontmatterEditor when `frontmatter !== null`
  - [ ] Pass `expanded` / `onToggleExpand` props

- [ ] **Task 4: Update Toolbar frontmatter button**
  - [ ] Change button behavior from show/hide to expand/collapse
  - [ ] Update props passed to Toolbar component

- [ ] **Task 5: Add CSS styles**
  - [ ] Collapsed bar hover state and transition
  - [ ] Expand/collapse animation (height transition)
  - [ ] Dual-layer alignment (shared font, padding, line-height)
  - [ ] Chevron rotation transition

- [ ] **Task 6: Verification**
  - [ ] Test with document containing frontmatter (collapsed bar appears)
  - [ ] Test expand/collapse behavior
  - [ ] Test YAML editing with syntax highlighting
  - [ ] Test with document without frontmatter (no bar)
  - [ ] Test source/visual mode toggle preserves frontmatter state
  - [ ] Run `npm run build` to verify no build errors

## Dev Notes

### Current Component Interface

```typescript
interface FrontmatterEditorProps {
  frontmatter: string;
  onChange: (value: string) => void;
  onClose: () => void;
}
```

### Target Component Interface

```typescript
interface FrontmatterEditorProps {
  frontmatter: string;
  onChange: (value: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}
```

### Dual-Layer Syntax Highlighting Pattern

The editing area uses two overlapping elements:

1. A `<pre>` element with lowlight-rendered HTML (positioned as backdrop, pointer-events: none)
2. A transparent `<textarea>` overlaid on top (handles input, caret, selection)
   Both share identical font-family, font-size, padding, and line-height so text aligns perfectly.

### Lowlight Integration

The project already uses `lowlight` via `@tiptap/extension-code-block-lowlight` with languages registered in `useTipTapEditor.ts`. Adding YAML is one import + one `lowlight.register()` call.

### Files to Modify

- `src/webview/components/FrontmatterEditor.tsx` - Complete rewrite
- `src/webview/App.tsx` - State management change
- `src/webview/components/Toolbar.tsx` - Button behavior update
- `src/webview/hooks/useTipTapEditor.ts` - Export lowlight, register YAML
- `src/webview/styles/index.css` - New frontmatter styles

## References

- [Source: docs/sprint-artifacts/8-1-frontmatter-detection-editing.md]
- [Source: docs/sprint-artifacts/8-2-frontmatter-toggle-ui.md]
- Obsidian frontmatter UI as visual reference
