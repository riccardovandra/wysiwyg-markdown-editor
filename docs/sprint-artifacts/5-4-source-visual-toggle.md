# Story 5.4: Source/Visual Toggle

**Status:** Ready for Review

## Story

As a **user**,
I want to toggle between visual and source views,
So that I can see and edit the raw markdown when needed.

## Acceptance Criteria

### AC1: Toggle Button in Toolbar
**Given** I am in the WYSIWYG visual view
**When** I look at the toolbar
**Then** I see a toggle button showing "View Source" with a Code icon
**And** the button tooltip indicates the keyboard shortcut (Cmd/Ctrl+Shift+V)

### AC2: Switch to Source View
**Given** I am in the WYSIWYG visual view
**When** I click the "View Source" toggle button in the toolbar
**Then** the view switches to show raw markdown text
**And** the toggle button icon changes to Eye with "Visual View" tooltip

### AC3: Source View Appearance
**Given** I am in source view
**When** I look at the editor
**Then** the source view uses a monospace font (from VS Code theme or fallback)
**And** syntax highlighting is applied to the markdown source
**And** the markdown is properly formatted and readable
**And** the styling matches the current VS Code theme (light/dark)

### AC4: Edit in Source View
**Given** I am in source view
**When** I type or edit the raw markdown text
**Then** my changes are captured
**And** changes sync to the document with the same 300ms debounce as WYSIWYG mode

### AC5: Switch Back to Visual View
**Given** I am in source view
**When** I click the toggle button again (now showing "Visual View")
**Then** the view switches back to the WYSIWYG rendering
**And** any edits made in source view are reflected in visual view
**And** the toggle button icon changes back to Code

### AC6: Keyboard Shortcut
**Given** the editor is focused (in either view mode)
**When** I press Cmd/Ctrl+Shift+V
**Then** the view toggles between source and visual modes
**And** the keyboard shortcut works in both directions

### AC7: Session Persistence
**Given** I have toggled to source view
**When** I continue working in the document
**Then** the current view mode persists for the document session
**And** the mode resets to visual view when reopening the document

### AC8: Content Sync on Toggle
**Given** I have made edits in one view mode
**When** I toggle to the other view mode
**Then** all changes are preserved and visible
**And** no content is lost during the transition
**And** frontmatter is included in source view

## Tasks / Subtasks

- [x] **Task 1: Add View Mode State to App.tsx** (AC: 1, 7, 8)
  - [x] Add `viewMode` state: `'visual' | 'source'`
  - [x] Add `sourceContent` state to hold markdown when in source mode
  - [x] Default `viewMode` to `'visual'`
  - [x] Create `handleToggleViewMode` callback that syncs content on toggle
  - [x] Pass `viewMode` and `onToggleViewMode` props to Toolbar

- [x] **Task 2: Create SourceEditor Component** (AC: 3, 4)
  - [x] Create `src/webview/components/SourceEditor.tsx`
  - [x] Use `<textarea>` with controlled value/onChange
  - [x] Apply monospace font via CSS variable `var(--vscode-editor-font-family)` with fallback
  - [x] Apply theme-aware background: `var(--vscode-editor-background)`
  - [x] Apply theme-aware text color: `var(--vscode-editor-foreground)`
  - [x] Match editor container styling (max-w-4xl, padding, card mode support)
  - [x] Add spellCheck={false} to prevent browser spell checking

- [x] **Task 3: Add Toggle Button to Toolbar** (AC: 1, 2, 5)
  - [x] Import `Eye` and `Code2` icons from lucide-react
  - [x] Add `viewMode?: 'visual' | 'source'` prop to ToolbarProps
  - [x] Add `onToggleViewMode?: () => void` prop to ToolbarProps
  - [x] Add toggle button after frontmatter toggle (before spacer/hide button)
  - [x] Show `Code2` icon with "View Source" tooltip when in visual mode
  - [x] Show `Eye` icon with "Visual View" tooltip when in source mode
  - [x] Include keyboard shortcut in tooltip: `(Cmd+Shift+V)` / `(Ctrl+Shift+V)`

- [x] **Task 4: Integrate Source View in App.tsx** (AC: 2, 5, 8)
  - [x] Conditionally render `<Editor>` or `<SourceEditor>` based on viewMode
  - [x] When toggling TO source: get full markdown with `combineFrontmatter(frontmatterRef.current, serializeHtmlToMarkdown(editor.getHTML()))`
  - [x] When toggling FROM source: update frontmatter and TipTap with parsed content
  - [x] Handle `sourceContent` changes with debounced sync to extension

- [x] **Task 5: Implement Keyboard Shortcut** (AC: 6)
  - [x] Add `useEffect` hook for keyboard listener in App.tsx
  - [x] Listen for `(e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'V'`
  - [x] Call `e.preventDefault()` to prevent default browser behavior
  - [x] Call `handleToggleViewMode()` on shortcut press
  - [x] Clean up listener on unmount

- [x] **Task 6: Source Content Synchronization** (AC: 4, 8)
  - [x] Create `handleSourceContentChange` callback in App.tsx
  - [x] On source edit: extract frontmatter, update frontmatterRef, send debounced content to extension
  - [x] Reuse existing `debouncedSendContent` for consistency
  - [x] On switch to visual: parse sourceContent, extract frontmatter, update editor

- [x] **Task 7: Style Source Editor for Theme Compatibility** (AC: 3)
  - [x] Use CSS variable `var(--vscode-editor-background)` for background
  - [x] Use CSS variable `var(--vscode-editor-foreground)` for text color
  - [x] Use `font-family: var(--vscode-editor-font-family, 'Menlo', 'Monaco', 'Courier New', monospace)`
  - [x] Style selection with `var(--vscode-editor-selectionBackground)`
  - [x] Add focus outline with `var(--vscode-focusBorder)`
  - [x] Match padding to contentPadding setting (compact/medium/spacious)

- [x] **Task 8: Write Tests** (AC: 1-8)
  - [x] Test Toolbar renders toggle button with correct icon for visual mode
  - [x] Test Toolbar renders toggle button with correct icon for source mode
  - [x] Test toggle button calls onToggleViewMode on click
  - [x] Test toggle button shows correct tooltip with keyboard shortcut
  - [x] Create SourceEditor.test.tsx with basic rendering and change tests
  - [x] Test SourceEditor renders with content
  - [x] Test SourceEditor onChange fires with new content on input

## Dev Notes

### Architecture Compliance

From [docs/architecture.md](docs/architecture.md):
- **Component Architecture**: Create new component `SourceEditor.tsx` in `src/webview/components/`
- **Naming Conventions**: PascalCase for components (`SourceEditor`), camelCase for handlers (`handleToggleViewMode`)
- **State Management**: Use React `useState` for view mode - no external state library needed (per Architecture)
- **Communication Pattern**: Use existing `postMessage` protocol - `contentChanged` message type
- **Styling**: Tailwind CSS with VS Code CSS variables for theme awareness

### Current Implementation Analysis

**App.tsx Current State Variables:**
```typescript
const [isToolbarHidden, setIsToolbarHidden] = useState(true);
const [showCard, setShowCard] = useState(true);
const [contentPadding, setContentPadding] = useState<EditorSettings['contentPadding']>('medium');
const [textSize, setTextSize] = useState<EditorSettings['textSize']>('medium');
const [lineHeight, setLineHeight] = useState<EditorSettings['lineHeight']>('normal');
const [accentTheme, setAccentTheme] = useState<EditorSettings['accentTheme']>('indigo');
const [disableBoldAccentColor, setDisableBoldAccentColor] = useState(false);
const [frontmatter, setFrontmatter] = useState<string | null>(null);
const [showFrontmatter, setShowFrontmatter] = useState(false);
```

**New State to Add:**
```typescript
// View mode: visual (TipTap WYSIWYG) or source (raw markdown)
const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
// Holds markdown content when in source mode
const [sourceContent, setSourceContent] = useState('');
```

**Toolbar Props Extension (from Toolbar.tsx line 28-39):**
```typescript
export interface ToolbarProps {
  editor: Editor | null;
  onHide?: () => void;
  hasFrontmatter?: boolean;
  showFrontmatter?: boolean;
  onToggleFrontmatter?: () => void;
  // NEW PROPS:
  viewMode?: 'visual' | 'source';
  onToggleViewMode?: () => void;
}
```

### SourceEditor Component Design

```typescript
// src/webview/components/SourceEditor.tsx
import type { EditorSettings } from '../../shared/messages.types';

interface SourceEditorProps {
  content: string;
  onChange: (content: string) => void;
  showCard?: boolean;
  contentPadding?: EditorSettings['contentPadding'];
}

// Padding presets matching Editor.tsx
const paddingClasses = {
  compact: 'p-6',
  medium: 'p-10 sm:p-14 lg:p-20',
  spacious: 'p-14 sm:p-20 lg:p-28',
};

export function SourceEditor({
  content,
  onChange,
  showCard = true,
  contentPadding = 'medium'
}: SourceEditorProps) {
  const padding = paddingClasses[contentPadding];

  const textareaClasses = `
    w-full h-full min-h-[400px] resize-none
    font-mono text-sm leading-relaxed
    bg-transparent border-none outline-none
    text-[var(--vscode-editor-foreground)]
    selection:bg-[var(--vscode-editor-selectionBackground)]
    focus:outline-none focus:ring-0
  `;

  if (showCard) {
    return (
      <div className="min-h-full">
        <div className="max-w-4xl mx-auto bg-dark-elevated rounded-xl shadow-2xl shadow-black/40">
          <div className={padding}>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              className={textareaClasses}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className={`max-w-4xl mx-auto ${padding}`}>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className={textareaClasses}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
```

### View Toggle Implementation in App.tsx

```typescript
// Toggle view mode handler
const handleToggleViewMode = useCallback(() => {
  if (viewMode === 'visual') {
    // Switching TO source: serialize current TipTap content to markdown
    if (editor) {
      const html = editor.getHTML();
      const bodyMarkdown = serializeHtmlToMarkdown(html);
      const fullMarkdown = combineFrontmatter(frontmatterRef.current, bodyMarkdown);
      setSourceContent(fullMarkdown);
    }
    setViewMode('source');
  } else {
    // Switching FROM source: parse markdown and update TipTap
    const { frontmatter: fm, content } = extractFrontmatter(sourceContent);
    setFrontmatter(fm);
    frontmatterRef.current = fm;
    if (editor) {
      isExternalUpdate.current = true;
      const html = parseMarkdownToHtml(content);
      editor.commands.setContent(html);
    }
    setViewMode('visual');
  }
}, [viewMode, editor, sourceContent]);

// Source content change handler (with debounced sync)
const handleSourceContentChange = useCallback((newContent: string) => {
  setSourceContent(newContent);
  // Extract frontmatter and sync
  const { frontmatter: fm, content } = extractFrontmatter(newContent);
  frontmatterRef.current = fm;
  setFrontmatter(fm);
  // Debounced sync to extension
  debouncedSendContent(newContent);
}, [debouncedSendContent]);
```

### Keyboard Shortcut Implementation

```typescript
// In App.tsx - add useEffect for keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Shift + V
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      handleToggleViewMode();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleToggleViewMode]);
```

### Toolbar Toggle Button Addition

```typescript
// In Toolbar.tsx - add after frontmatter toggle, before spacer

// Import Eye and Code2 icons (Code2 is clearer than Code for "view source")
import { ..., Eye, Code2 } from 'lucide-react';

// In component, before the spacer div:
{onToggleViewMode && (
  <>
    <ToolbarDivider />
    <ToolbarButton
      icon={viewMode === 'visual'
        ? <Code2 className={iconSize} />
        : <Eye className={iconSize} />}
      tooltip={viewMode === 'visual' ? 'View Source' : 'Visual View'}
      shortcut={`${modKey}+Shift+V`}
      onClick={onToggleViewMode}
      disabled={isDisabled}
    />
  </>
)}
```

### Content Flow Diagram

```
VISUAL → SOURCE:
1. editor.getHTML()
2. serializeHtmlToMarkdown(html) → bodyMarkdown
3. combineFrontmatter(frontmatterRef.current, bodyMarkdown) → fullMarkdown
4. setSourceContent(fullMarkdown)
5. setViewMode('source')

SOURCE → VISUAL:
1. extractFrontmatter(sourceContent) → { frontmatter, content }
2. setFrontmatter(frontmatter), frontmatterRef.current = frontmatter
3. parseMarkdownToHtml(content) → html
4. editor.commands.setContent(html)
5. setViewMode('visual')

SOURCE EDITING:
1. User types in textarea
2. handleSourceContentChange(newContent)
3. setSourceContent(newContent)
4. extractFrontmatter(newContent) → update frontmatterRef
5. debouncedSendContent(newContent) → sync to extension
```

### Files to Modify

| File | Action | Changes |
|------|--------|---------|
| [App.tsx](wysiwyg-markdown-editor/src/webview/App.tsx) | Modify | Add viewMode state, sourceContent state, toggle handler, keyboard shortcut, conditional rendering |
| [Toolbar.tsx](wysiwyg-markdown-editor/src/webview/components/Toolbar.tsx) | Modify | Add viewMode/onToggleViewMode props, import Eye/Code2 icons, add toggle button |
| [SourceEditor.tsx](wysiwyg-markdown-editor/src/webview/components/SourceEditor.tsx) | Create | New component for source view with textarea |
| [Toolbar.test.tsx](wysiwyg-markdown-editor/src/webview/__tests__/Toolbar.test.tsx) | Modify | Add tests for toggle button icon, tooltip, click handler |
| [SourceEditor.test.tsx](wysiwyg-markdown-editor/src/webview/__tests__/SourceEditor.test.tsx) | Create | New tests for SourceEditor component |

### Existing Utilities to Reuse

From the codebase analysis:
- `serializeHtmlToMarkdown(html)` - [markdownSerializer.ts](wysiwyg-markdown-editor/src/webview/utils/markdownSerializer.ts)
- `parseMarkdownToHtml(markdown)` - [markdownParser.ts](wysiwyg-markdown-editor/src/webview/utils/markdownParser.ts)
- `extractFrontmatter(content)` - [frontmatterParser.ts](wysiwyg-markdown-editor/src/webview/utils/frontmatterParser.ts)
- `combineFrontmatter(frontmatter, body)` - [frontmatterParser.ts](wysiwyg-markdown-editor/src/webview/utils/frontmatterParser.ts)
- `useDebounce` hook - already used in App.tsx
- `SYNC_DEBOUNCE_MS` constant (300ms) - from shared/constants.ts

### Testing Strategy

**Toolbar.test.tsx additions:**
```typescript
describe('Story 5.4: Source/Visual Toggle', () => {
  it('renders toggle button with Code2 icon when in visual mode', () => {
    render(<Toolbar editor={mockEditor} viewMode="visual" onToggleViewMode={mockFn} />);
    // Assert Code2 icon visible, tooltip says "View Source"
  });

  it('renders toggle button with Eye icon when in source mode', () => {
    render(<Toolbar editor={mockEditor} viewMode="source" onToggleViewMode={mockFn} />);
    // Assert Eye icon visible, tooltip says "Visual View"
  });

  it('calls onToggleViewMode when toggle button clicked', () => {
    const mockToggle = vi.fn();
    render(<Toolbar editor={mockEditor} viewMode="visual" onToggleViewMode={mockToggle} />);
    fireEvent.click(screen.getByTitle(/View Source/));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
```

**SourceEditor.test.tsx:**
```typescript
describe('SourceEditor', () => {
  it('renders textarea with provided content', () => {
    render(<SourceEditor content="# Hello" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('# Hello');
  });

  it('calls onChange when content is edited', () => {
    const mockChange = vi.fn();
    render(<SourceEditor content="" onChange={mockChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# New' } });
    expect(mockChange).toHaveBeenCalledWith('# New');
  });

  it('applies card styling when showCard is true', () => {
    render(<SourceEditor content="" onChange={vi.fn()} showCard={true} />);
    // Assert card classes present
  });
});
```

### Anti-Patterns to Avoid

- **DO NOT** create a CodeMirror integration for MVP (adds complexity and bundle size)
- **DO NOT** persist view mode to localStorage or settings (per AC7: session-only)
- **DO NOT** use Tailwind `dark:` prefix (use VS Code CSS variables instead)
- **DO NOT** duplicate markdown parsing logic (reuse existing utilities)
- **DO NOT** break existing content sync (use same debounce pattern)
- **DO NOT** forget frontmatter when switching views

### Edge Cases to Handle

| Scenario | Expected Behavior |
|----------|------------------|
| Toggle with pending debounced changes | Flush content before toggle |
| Invalid markdown in source view | Keep in source, show in visual as best effort |
| Empty document | Show empty textarea in source |
| Very large document (10k+ lines) | Textarea handles natively, consider lazy load later |
| Toggle during external file change | External change updates current view |

### Previous Story Intelligence (5-3-theme-aware-toolbar)

Key patterns established that apply here:
1. **Theme Detection**: VS Code auto-sets `data-vscode-theme-kind` on body - no JS detection needed
2. **CSS Variable Pattern**: Use `var(--vscode-*)` for all theme-aware styling
3. **ToolbarButton Pattern**: Use existing `ToolbarButton` component with icon/tooltip/shortcut/onClick props
4. **Testing Pattern**: Test class names, interactions, and state changes

### References

- [Source: docs/epics.md#Story 5.4: Source/Visual Toggle]
- [Source: docs/architecture.md#Frontend Architecture]
- [Source: docs/architecture.md#Communication Patterns]
- [TipTap Editor API - getHTML()](https://tiptap.dev/docs/editor/api/editor#gethtml)
- [VS Code Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)
- [Lucide React Icons - Eye, Code2](https://lucide.dev/icons)

## Dev Agent Record

### Context Reference

Story created for Epic 5: UI/UX Polish & Customization. This is the fourth story in the epic.

**Epic 5 Progress:**
- 5-1-improved-padding-spacing: **done**
- 5-2-auto-open-setting: **review**
- 5-3-theme-aware-toolbar: **review**
- 5-4-source-visual-toggle: **ready-for-dev** (this story)
- 5-5-mermaid-diagram-rendering: backlog
- 5-6-extension-controlled-fonts: backlog
- 5-7-hide-toolbar: **done**

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Analyzed existing codebase: Toolbar.tsx (377 lines), Editor.tsx (60 lines), App.tsx (228 lines)
- Identified reusable patterns: ToolbarButton component, CSS variables, debounced sync
- Confirmed markdown utilities: serializeHtmlToMarkdown, parseMarkdownToHtml, extractFrontmatter, combineFrontmatter
- Verified Lucide icons available: need to import Eye, Code2

### Completion Notes List

- Story enhanced with comprehensive developer context from codebase analysis
- Content flow diagram added for view toggle implementation
- Test strategy defined with specific test cases
- All files to modify/create identified with line references
- Implementation completed with all 8 tasks done
- All 79 tests passing (59 Toolbar + 20 SourceEditor tests)

### File List

**New Files:**
- wysiwyg-markdown-editor/src/webview/components/SourceEditor.tsx
- wysiwyg-markdown-editor/src/webview/__tests__/SourceEditor.test.tsx

**Modified Files:**
- wysiwyg-markdown-editor/src/webview/App.tsx
- wysiwyg-markdown-editor/src/webview/components/Toolbar.tsx
- wysiwyg-markdown-editor/src/webview/__tests__/Toolbar.test.tsx

### Change Log

- 2025-12-13: Story created with basic developer context
- 2025-12-29: Story enhanced with comprehensive implementation analysis, marked ready-for-dev
- 2025-12-30: Implementation complete - all 8 tasks finished, 79 tests passing
