# Story 4.1: Persistent Formatting Toolbar

**Status:** Done

## Story

As a **user**,
I want a formatting toolbar always visible above the editor,
So that I can discover and access formatting options easily.

## Acceptance Criteria

### AC1: Toolbar Display (FR18)
**Given** I open a document in the WYSIWYG editor
**When** the editor loads
**Then** a formatting toolbar is displayed at the top of the editor

### AC2: Sticky Position
**Given** I have a long document
**When** I scroll through the document
**Then** the toolbar remains visible at the top (sticky position)

### AC3: VS Code Aesthetic Match
**Given** the toolbar is visible
**When** I view it
**Then** it has a clean, minimal design matching VS Code aesthetics
**And** toolbar background respects VS Code theme (light/dark)

### AC4: Clear Icons with Tooltips
**Given** the toolbar buttons are displayed
**When** I hover over any button
**Then** a tooltip appears showing action name and keyboard shortcut
**And** icons are clear and recognizable (Lucide React icons)

### AC5: Visual Feedback
**Given** the toolbar buttons
**When** I hover over a button
**Then** the button shows a hover state
**When** a button action is active (e.g., cursor is in bold text)
**Then** the button shows an active/pressed state

### AC6: Content Not Obstructed
**Given** the toolbar is displayed
**When** I view the editor
**Then** there is proper spacing below the toolbar
**And** content is not hidden behind the toolbar

### AC7: Performance (NFR3)
**Given** I interact with the toolbar
**When** I click any toolbar button
**Then** the action completes within 100ms

## Tasks / Subtasks

- [x] **Task 1: Create Toolbar Component Structure** (AC: 1, 3)
  - [x] Create `src/webview/components/Toolbar.tsx`
  - [x] Define `ToolbarProps` interface with editor prop
  - [x] Export Toolbar component
  - [x] Add basic container with Tailwind classes

- [x] **Task 2: Implement Sticky Positioning** (AC: 2, 6)
  - [x] Add `sticky top-0 z-10` positioning
  - [x] Add background color that respects VS Code theme
  - [x] Add bottom border for visual separation
  - [x] Add proper padding/margin to prevent content obstruction

- [x] **Task 3: Create ToolbarButton Component** (AC: 4, 5)
  - [x] Create reusable `ToolbarButton` subcomponent
  - [x] Props: icon, tooltip, shortcut, isActive, onClick, disabled
  - [x] Implement hover state styles
  - [x] Implement active/pressed state styles
  - [x] Add tooltip on hover (title attribute or custom tooltip)

- [x] **Task 4: Add Icon Placeholders** (AC: 4)
  - [x] Import icons from lucide-react
  - [x] Add placeholder buttons for: Bold, Italic, H1, H2, H3, List, OrderedList, Link, Code, Undo, Redo
  - [x] Group buttons logically with visual dividers
  - [x] Icons: Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link, Code, Undo2, Redo2

- [x] **Task 5: Integrate Toolbar with App** (AC: 1)
  - [x] Update `App.tsx` to include Toolbar component
  - [x] Pass editor instance to Toolbar
  - [x] Position Toolbar above Editor component
  - [x] Verify layout works correctly

- [x] **Task 6: Theme Integration** (AC: 3)
  - [x] Use VS Code CSS variables for colors
  - [x] Test with light theme
  - [x] Test with dark theme
  - [x] Ensure icons are visible in both themes

- [x] **Task 7: Write Unit Tests** (AC: 1, 4, 5)
  - [x] Create `src/webview/__tests__/Toolbar.test.tsx`
  - [x] Test toolbar renders with all buttons
  - [x] Test hover state styling
  - [x] Test active state styling
  - [x] Test tooltip displays on hover

## Dev Notes

### Toolbar Component Architecture

```typescript
// src/webview/components/Toolbar.tsx
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Code, Undo2, Redo2
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  shortcut?: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}
```

### Styling Pattern

```typescript
// Toolbar container
<div className="sticky top-0 z-10 flex items-center gap-1 p-2
    bg-[var(--vscode-editor-background)]
    border-b border-[var(--vscode-panel-border)]">

// Button group divider
<div className="w-px h-6 bg-[var(--vscode-panel-border)] mx-1" />

// Toolbar button
<button
  className={`p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)]
    ${isActive ? 'bg-[var(--vscode-toolbar-activeBackground)] text-[var(--vscode-toolbar-activeForeground)]' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}
  title={`${tooltip}${shortcut ? ` (${shortcut})` : ''}`}
  onClick={onClick}
  disabled={disabled}
>
  {icon}
</button>
```

### Button Groups

| Group | Buttons | Purpose |
|-------|---------|---------|
| Text Formatting | Bold, Italic | Inline text styles |
| Headings | H1, H2, H3 | Block-level headings |
| Lists | Bullet, Numbered | List structures |
| Insert | Link, Code | Insert elements |
| History | Undo, Redo | Edit history |

### Icon Sizing

All Lucide icons should use consistent sizing:
```typescript
<Bold className="w-4 h-4" />
```

### Keyboard Shortcuts Reference

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| H1 | Cmd+Shift+1 | Ctrl+Shift+1 |
| H2 | Cmd+Shift+2 | Ctrl+Shift+2 |
| H3 | Cmd+Shift+3 | Ctrl+Shift+3 |
| Undo | Cmd+Z | Ctrl+Z |
| Redo | Cmd+Shift+Z | Ctrl+Y |

### VS Code Theme Variables

```css
/* Primary colors */
--vscode-editor-background
--vscode-editor-foreground
--vscode-panel-border

/* Toolbar-specific */
--vscode-toolbar-hoverBackground
--vscode-toolbar-activeBackground
--vscode-toolbar-activeForeground

/* Icon colors */
--vscode-icon-foreground
```

### Integration with App.tsx

```tsx
// src/webview/App.tsx
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { useTipTapEditor } from './hooks/useTipTapEditor';

function App() {
  const editor = useTipTapEditor({ ... });

  return (
    <div className="flex flex-col h-screen">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-auto">
        <Editor editor={editor} />
      </div>
    </div>
  );
}
```

### Dependencies

Already installed in package.json:
- `lucide-react`: v0.559.0 (icons library)

### Project Structure Notes

Per architecture.md:
- Toolbar goes in `src/webview/components/Toolbar.tsx`
- Tests go in `src/webview/__tests__/Toolbar.test.tsx`
- PascalCase for component files

### Anti-Patterns to Avoid

- DO NOT use inline styles for colors (use CSS variables)
- DO NOT hard-code light/dark theme colors
- DO NOT make toolbar scrollable with content
- DO NOT block editor interaction while loading toolbar
- DO NOT use magic numbers for sizing (use Tailwind classes)

### Testing Strategy

1. **Unit tests:** Verify button rendering and states
2. **Visual tests:** Check in Extension Development Host
3. **Theme tests:** Verify light/dark mode appearance
4. **Interaction tests:** Verify hover/active states

### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Editor not loaded yet | Toolbar buttons disabled |
| Very narrow viewport | Buttons should not wrap (consider overflow) |
| Rapid button clicks | Actions debounced naturally by TipTap |

### References

- [Source: docs/epics.md#Story 4.1: Persistent Formatting Toolbar]
- [Source: docs/architecture.md#Component Architecture]
- [Source: docs/architecture.md#Frontend Architecture]
- [Lucide React Icons](https://lucide.dev/icons/)
- [TipTap Editor API](https://tiptap.dev/api/editor)

## Dev Agent Record

### Context Reference

Story created by create-story workflow (SM agent, YOLO mode).

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Created Toolbar.tsx with all formatting buttons grouped logically (Text, Headings, Lists, Insert, History)
- Implemented ToolbarButton subcomponent with hover/active/disabled states
- Used VS Code CSS variables for theme integration (--vscode-editor-background, --vscode-toolbar-hoverBackground, etc.)
- Added sticky positioning with z-index for proper scroll behavior
- Integrated Toolbar with App.tsx using flex layout to prevent content obstruction
- Platform-aware keyboard shortcut display (Cmd for Mac, Ctrl for Windows)
- All 11 toolbar buttons render with tooltips showing shortcuts
- 7 new Toolbar tests pass (125 total tests, no regressions)
- Fixed pre-existing unused import in CodeBlock.test.tsx

### File List

**Files Created:**
- `wysiwyg-markdown-editor/src/webview/components/Toolbar.tsx`
- `wysiwyg-markdown-editor/src/webview/__tests__/Toolbar.test.tsx`

**Files Modified:**
- `wysiwyg-markdown-editor/src/webview/App.tsx` - Added Toolbar import and integration with flex layout
- `wysiwyg-markdown-editor/src/webview/__tests__/CodeBlock.test.tsx` - Removed unused 'screen' import

### Change Log

- 2025-12-13: Story created with comprehensive developer context (create-story workflow)
- 2025-12-13: Implementation complete - All 7 tasks completed, 7 new tests, 125 total tests pass
