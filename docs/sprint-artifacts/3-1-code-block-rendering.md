# Story 3.1: Code Block Rendering

**Status:** Done

## Story

As a **user**,
I want fenced code blocks to render distinctly from prose,
So that I can easily distinguish code from text.

## Acceptance Criteria

### AC1: Code Block Container Styling (FR11)
**Given** a markdown document contains a fenced code block:
```
```javascript
const greeting = "Hello, World!";
```
```
**When** the document renders
**Then** the code block displays in a distinct container

### AC2: Monospace Font
**Given** a code block is rendered
**When** I view the code
**Then** the text uses a monospace font family

### AC3: Background Color Distinction
**Given** a code block is rendered
**When** I view it
**Then** it has a background color distinct from prose (darker in light theme, lighter in dark theme)

### AC4: Horizontal Scrolling
**Given** a code block contains long lines
**When** I view it
**Then** horizontal scrolling is enabled (no line wrapping)

### AC5: Visual Padding
**Given** a code block is rendered
**When** I view it
**Then** it has comfortable padding and rounded corners

### AC6: Visual Separation
**Given** a document with code blocks and prose
**When** I view it
**Then** code blocks are visually separated from surrounding prose

### AC7: Editable Code Blocks
**Given** I click inside a code block
**When** I type
**Then** I can edit the code content

### AC8: Whitespace Preservation
**Given** I type in a code block
**When** I enter spaces and tabs
**Then** whitespace and indentation are preserved

## Tasks / Subtasks

- [x] **Task 1: Install TipTap CodeBlock Extension** (AC: 1)
  - [x] Verify if `@tiptap/extension-code-block` is needed or if StarterKit includes it
  - [x] Install `@tiptap/extension-code-block` if needed
  - [x] Configure CodeBlock extension in useTipTapEditor.ts

- [x] **Task 2: Style Code Block Container** (AC: 1, 3, 5, 6)
  - [x] Add CSS for code block container in index.css
  - [x] Apply Tailwind classes: `bg-slate-100 dark:bg-slate-800`
  - [x] Add padding: `p-4`
  - [x] Add rounded corners: `rounded-lg`
  - [x] Add margin for visual separation: `my-4`

- [x] **Task 3: Configure Monospace Typography** (AC: 2)
  - [x] Apply `font-mono` class to code blocks
  - [x] Ensure font-size is appropriate: `text-sm`
  - [x] Map to VS Code's `--vscode-editor-fontFamily` for consistency

- [x] **Task 4: Implement Horizontal Scrolling** (AC: 4)
  - [x] Add `overflow-x-auto` to code block container
  - [x] Add `whitespace-pre` to prevent line wrapping
  - [x] Test with long code lines

- [x] **Task 5: Verify Editing Behavior** (AC: 7, 8)
  - [x] Test clicking inside code blocks places cursor
  - [x] Test typing inserts code at cursor
  - [x] Test Enter creates new line within code block (not new paragraph)
  - [x] Test Tab/spaces preserve indentation
  - [x] Test paste preserves whitespace

- [x] **Task 6: Test Theme Integration** (AC: 3)
  - [x] Test code blocks in VS Code light theme
  - [x] Test code blocks in VS Code dark theme
  - [x] Verify background contrast is appropriate in both

- [x] **Task 7: Write Unit Tests**
  - [x] Create `src/webview/__tests__/CodeBlock.test.tsx`
  - [x] Test code block renders with correct CSS classes
  - [x] Test code block content is editable
  - [x] Test whitespace preservation

## Dev Notes

### TipTap CodeBlock Configuration

**StarterKit includes basic CodeBlock.** However, for enhanced features (syntax highlighting in Story 3.2), we'll need `@tiptap/extension-code-block-lowlight`. For this story, verify StarterKit's CodeBlock is sufficient.

```typescript
// Check in useTipTapEditor.ts - StarterKit already includes:
// - CodeBlock (basic fenced code block support)
// - Code (inline code with backticks)

// If StarterKit's CodeBlock isn't rendering correctly:
import CodeBlock from '@tiptap/extension-code-block';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false, // Disable StarterKit's if using custom
    }),
    CodeBlock.configure({
      HTMLAttributes: {
        class: 'code-block',
      },
    }),
  ],
});
```

### CSS Styling Approach

Add to `src/webview/styles/index.css`:

```css
/* Code block container styling */
.ProseMirror pre {
  background-color: var(--vscode-textCodeBlock-background, #f5f5f5);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

/* Dark mode support */
.dark .ProseMirror pre,
[data-theme="dark"] .ProseMirror pre {
  background-color: var(--vscode-textCodeBlock-background, #1e1e1e);
}

/* Code text styling */
.ProseMirror pre code {
  font-family: var(--vscode-editor-fontFamily, 'Consolas', 'Monaco', monospace);
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre;
  color: var(--vscode-editor-foreground);
}

/* Ensure no prose typography affects code */
.prose pre {
  @apply bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto my-4;
}

.prose pre code {
  @apply font-mono text-sm whitespace-pre;
  background: transparent;
  padding: 0;
}
```

### VS Code Theme Variables for Code Blocks

| CSS Variable | Purpose |
|-------------|---------|
| `--vscode-textCodeBlock-background` | Code block background |
| `--vscode-editor-fontFamily` | Monospace font family |
| `--vscode-editor-foreground` | Text color |

### Markdown Parsing Consideration

The `marked` library (already installed) handles fenced code blocks. Verify the parser correctly:
1. Detects ``` fenced blocks
2. Extracts language specifier (for Story 3.2)
3. Preserves whitespace and indentation

### Current Codebase State (from Epic 2)

**Existing Components:**
- `wysiwyg-markdown-editor/src/webview/components/Editor.tsx` - TipTap editor wrapper
- `wysiwyg-markdown-editor/src/webview/hooks/useTipTapEditor.ts` - TipTap configuration
- `wysiwyg-markdown-editor/src/webview/styles/index.css` - Global styles
- `wysiwyg-markdown-editor/src/webview/utils/markdownParser.ts` - Markdown to HTML
- `wysiwyg-markdown-editor/src/webview/utils/markdownSerializer.ts` - HTML to Markdown

**Key Patterns Established:**
- ProseMirror CSS selectors: `.ProseMirror`, `.ProseMirror pre`
- VS Code theme integration via CSS custom properties
- Tailwind prose classes for typography

### Anti-Patterns to Avoid

- DO NOT use inline styles - use CSS classes
- DO NOT break whitespace preservation (no `white-space: normal`)
- DO NOT apply prose typography to code content
- DO NOT use `contenteditable` directly - use TipTap's API
- DO NOT create new ProseMirror blocks when pressing Enter in code

### Testing Strategy

1. **Visual Testing:** Manual verification in Extension Development Host
2. **Unit Tests:** Verify CSS classes applied, content editable
3. **Integration Tests:** Markdown → render → edit → serialize round-trip

### Performance Considerations

Code blocks should render without delay. No syntax highlighting in this story (deferred to 3.2), so rendering is just CSS styling.

### References

- [Source: docs/epics.md#Story 3.1: Code Block Rendering]
- [Source: docs/architecture.md#Frontend Architecture]
- [TipTap CodeBlock Extension](https://tiptap.dev/api/nodes/code-block)
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography-plugin)

## Dev Agent Record

### Context Reference

Story created by create-story workflow (SM agent, YOLO mode).

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Verified StarterKit includes CodeBlock extension (no additional install needed)
- Added comprehensive CSS styling for code blocks with VS Code theme integration
- Implemented light/dark mode support via CSS custom properties and media queries
- Added inline code styling for backtick code
- Created 13 unit tests covering all acceptance criteria
- All 108 tests pass with no regressions

### File List

**Files Modified:**
- `wysiwyg-markdown-editor/src/webview/styles/index.css` - Added code block styling (AC1-6)

**Files Created:**
- `wysiwyg-markdown-editor/src/webview/__tests__/CodeBlock.test.tsx` - 13 code block tests

### Change Log

- 2025-12-12: Story created with comprehensive developer context (create-story workflow)
- 2025-12-12: Implementation complete - CSS styling for code blocks with theme support, 13 tests added
- 2025-12-12: Code review passed - All acceptance criteria verified, tests enhanced with proper assertions
