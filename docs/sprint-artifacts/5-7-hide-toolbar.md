# Story 5.7: Hide Toolbar Option

**Status:** Done

## Story

As a **user**,
I want to be able to hide the formatting toolbar,
So that I can have more screen space for writing when I don't need formatting controls.

## Acceptance Criteria

### AC1: VS Code Setting for Default Visibility
**Given** I am using VS Code settings
**When** I configure `markdownWysiwyg.hideToolbar` to `true`
**Then** the toolbar is hidden by default when opening the WYSIWYG editor

### AC2: Hide Button in Toolbar
**Given** the toolbar is visible
**When** I look at the toolbar
**Then** I see a hide button on the right side of the toolbar
**And** clicking it hides the toolbar

### AC3: Show Button When Hidden
**Given** the toolbar is hidden
**When** I look at the editor
**Then** I see a small floating button in the top-right corner
**And** clicking it shows the toolbar again

### AC4: Toggle State Persistence (Session)
**Given** I toggle the toolbar visibility during editing
**When** I continue editing
**Then** the toolbar remains in the state I set
**Note** State resets to default setting when reopening the editor

### AC5: Theme Integration
**Given** the toggle buttons (hide/show)
**When** rendered
**Then** they use VS Code theme colors consistently with existing toolbar buttons

## Tasks / Subtasks

- [x] **Task 1: Add VS Code Setting** (AC: 1)
  - [x] Add `markdownWysiwyg.hideToolbar` to package.json configuration
  - [x] Default value: `false` (toolbar visible by default)

- [x] **Task 2: Update Message Types** (AC: 1)
  - [x] Extend `init` message to include `settings?: { hideToolbar?: boolean }`
  - [x] Add settings field to ExtensionMessage type

- [x] **Task 3: Send Setting from Extension** (AC: 1)
  - [x] Read `hideToolbar` setting in editorProvider.ts
  - [x] Include setting in `init` message to WebView

- [x] **Task 4: Add Toolbar State in App.tsx** (AC: 1, 2, 3, 4)
  - [x] Add `isToolbarHidden` state with `useState`
  - [x] Initialize from settings received in `init` message
  - [x] Conditionally render `<Toolbar>` based on state
  - [x] Pass `onHide` callback to Toolbar component

- [x] **Task 5: Add Hide Button to Toolbar** (AC: 2, 5)
  - [x] Add optional `onHide` prop to Toolbar component
  - [x] Add hide button using `PanelTopClose` icon from lucide-react
  - [x] Position at the right end of toolbar with a spacer
  - [x] Style consistently with existing toolbar buttons

- [x] **Task 6: Create ToolbarToggleButton Component** (AC: 3, 5)
  - [x] Create new component `ToolbarToggleButton.tsx`
  - [x] Show floating button when toolbar is hidden
  - [x] Position in top-right corner (absolute positioning)
  - [x] Use `PanelTopOpen` icon
  - [x] Style with VS Code theme variables

## Dev Notes

### Files to Modify

| File | Changes |
|------|---------|
| `wysiwyg-markdown-editor/package.json` | Add `hideToolbar` setting |
| `src/shared/messages.types.ts` | Add settings to `init` message |
| `src/extension/editorProvider.ts` | Read setting, send with init message |
| `src/webview/App.tsx` | Add toolbar visibility state, conditional render |
| `src/webview/components/Toolbar.tsx` | Add hide button with `onHide` prop |
| **New:** `src/webview/components/ToolbarToggleButton.tsx` | Floating "show toolbar" button |

### Icons Used

- `PanelTopClose` - For hide button in toolbar
- `PanelTopOpen` - For floating show button

Both from `lucide-react` (already a dependency).

### CSS Variables for Styling

```css
--vscode-editor-background
--vscode-toolbar-hoverBackground
--vscode-panel-border
```

### App.tsx Changes Summary

```tsx
// Add state
const [isToolbarHidden, setIsToolbarHidden] = useState(false);

// Handle init message settings
case 'init': {
  // ... existing code ...
  if (message.settings?.hideToolbar !== undefined) {
    setIsToolbarHidden(message.settings.hideToolbar);
  }
}

// Toggle handler
const handleToggleToolbar = useCallback(() => {
  setIsToolbarHidden(prev => !prev);
}, []);

// Conditional render
<div className="relative flex flex-col h-screen ...">
  {!isToolbarHidden && <Toolbar editor={editor} onHide={handleToggleToolbar} />}
  <ToolbarToggleButton isHidden={isToolbarHidden} onToggle={handleToggleToolbar} />
  ...
</div>
```

## References

- [Source: docs/epics.md#Epic 5: UI/UX Polish & Customization]
- Existing setting pattern: `markdownWysiwyg.autoOpen` in package.json

## Dev Agent Record

### Completion Notes

- Added `markdownWysiwyg.hideToolbar` VS Code setting (default: false)
- Created `EditorSettings` interface in messages.types.ts
- Extended init message to include settings from extension
- Added toolbar visibility state and toggle handler in App.tsx
- Added hide button (PanelTopClose icon) to right side of Toolbar
- Created new ToolbarToggleButton component for floating show button
- All 178 tests pass, build succeeds

### File List

**Files Modified:**
- `wysiwyg-markdown-editor/package.json` - Added hideToolbar setting
- `src/shared/messages.types.ts` - Added EditorSettings interface
- `src/extension/editorProvider.ts` - Read setting, send with init
- `src/webview/App.tsx` - Toolbar visibility state & conditional render
- `src/webview/components/Toolbar.tsx` - Added onHide prop and hide button

**Files Created:**
- `src/webview/components/ToolbarToggleButton.tsx` - Floating show button

### Change Log

- 2025-12-22: Story created and implemented
