# Story 2.5: Bidirectional Sync (WebView <-> Extension)

**Status:** Done

## Story

As a **user**,
I want my edits to sync to the markdown file automatically,
So that I don't lose work and the file stays current.

## Acceptance Criteria

### AC1: Debounced Sync to File (FR3)
**Given** I make an edit in the WYSIWYG editor
**When** I stop typing for 300ms
**Then** the change is synced to the underlying markdown file

### AC2: WebView to Extension Message
**Given** I make an edit
**When** the debounce timer fires
**Then** WebView sends `{ type: 'contentChanged', markdown: string }`

### AC3: Extension Updates Document
**Given** the extension receives contentChanged message
**When** it processes the message
**Then** it calls `document.edit()` to update the TextDocument

### AC4: External Change Detection
**Given** the file is modified externally (e.g., git checkout, another editor)
**When** VS Code detects the change
**Then** the extension sends `{ type: 'externalChange', content: string }` to WebView

### AC5: External Change Applies
**Given** the WebView receives an externalChange message
**When** it processes the message
**Then** the editor updates to reflect external changes
**And** cursor position is preserved as much as possible

### AC6: No Excessive Syncing
**Given** I am typing rapidly
**When** the debounce is active
**Then** sync operations don't occur until I pause

### AC7: Markdown Integrity (NFR6)
**Given** I edit content in the WYSIWYG editor
**When** the content is synced to markdown
**Then** the markdown output preserves original formatting intent (no corruption)

## Tasks / Subtasks

- [x] **Task 1: Create useDebounce hook** (AC: 1, 6)
  - [x] Create `src/webview/hooks/useDebounce.ts`
  - [x] Implement debounce with 300ms delay
  - [x] Return debounced function
  - [x] Handle cleanup on unmount

- [x] **Task 2: Implement TipTap to Markdown serialization** (AC: 2, 7)
  - [x] Research TipTap markdown serialization options
  - [x] Install necessary dependencies (e.g., `@tiptap/pm/markdown` or `turndown`)
  - [x] Create `src/webview/utils/markdownSerializer.ts`
  - [x] Ensure serialization preserves formatting correctly
  - [x] Test round-trip: markdown → TipTap → markdown

- [x] **Task 3: Implement content change handler** (AC: 1, 2)
  - [x] Add `onUpdate` callback to TipTap editor config
  - [x] Serialize editor content to markdown
  - [x] Debounce the serialization + postMessage
  - [x] Send `{ type: 'contentChanged', markdown }` via useVSCodeApi

- [x] **Task 4: Handle contentChanged in extension** (AC: 3)
  - [x] In `editorProvider.ts`, add message handler for 'contentChanged'
  - [x] Use `vscode.WorkspaceEdit` to update document
  - [x] Apply edit via `vscode.workspace.applyEdit()`
  - [x] Handle potential conflicts gracefully

- [x] **Task 5: Implement external change detection** (AC: 4)
  - [x] In extension, listen to `vscode.workspace.onDidChangeTextDocument`
  - [x] Filter for changes not caused by our own edits
  - [x] Send `{ type: 'externalChange', content }` to WebView

- [x] **Task 6: Handle external changes in WebView** (AC: 5)
  - [x] Add message listener for 'externalChange'
  - [x] Store current cursor position
  - [x] Update editor content with `editor.commands.setContent()`
  - [x] Attempt to restore cursor position

- [x] **Task 7: Test sync behaviors** (AC: 1-7)
  - [x] Test rapid typing doesn't cause excessive syncs
  - [x] Test content persists after sync
  - [x] Test external file modification updates editor
  - [x] Test markdown round-trip fidelity

- [x] **Task 8: Write unit tests**
  - [x] Test useDebounce hook
  - [x] Test markdownSerializer output
  - [x] Test message handlers

## Dev Notes

### Debounce Implementation

```typescript
// src/webview/hooks/useDebounce.ts
import { useCallback, useRef, useEffect } from 'react';

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}
```

### Markdown Serialization Options

**Option 1: Turndown (HTML → Markdown)**
```bash
npm install turndown
```
```typescript
import TurndownService from 'turndown';
const turndown = new TurndownService();
const markdown = turndown.turndown(editor.getHTML());
```

**Option 2: ProseMirror Markdown Serializer**
More complex but potentially better fidelity.

**Recommendation:** Start with Turndown for simplicity.

### Message Flow Diagram

```
EDITING:
User types → TipTap onUpdate → debounce(300ms) → serialize → postMessage
                                                              ↓
                                               { type: 'contentChanged', markdown }
                                                              ↓
                                               Extension receives → document.edit()

EXTERNAL CHANGE:
File changes → VS Code event → Extension detects → postMessage
                                                        ↓
                                        { type: 'externalChange', content }
                                                        ↓
                                        WebView receives → setContent()
```

### Extension Message Handler

```typescript
// In editorProvider.ts
webviewPanel.webview.onDidReceiveMessage(
  (message: WebViewMessage) => {
    switch (message.type) {
      case 'ready':
        // Send initial content
        this.sendInitContent(document, webviewPanel);
        break;
      case 'contentChanged':
        this.updateDocument(document, message.markdown);
        break;
    }
  },
  undefined,
  this.disposables
);

private async updateDocument(document: vscode.TextDocument, content: string) {
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );
  edit.replace(document.uri, fullRange, content);
  await vscode.workspace.applyEdit(edit);
}
```

### External Change Detection

```typescript
// In editorProvider.ts
vscode.workspace.onDidChangeTextDocument((e) => {
  if (e.document.uri.toString() === document.uri.toString()) {
    // Check if change was from our edit (avoid loop)
    if (!this.isOwnEdit) {
      webviewPanel.webview.postMessage({
        type: 'externalChange',
        content: e.document.getText()
      });
    }
  }
});
```

### Avoiding Edit Loops

When WebView sends contentChanged → Extension updates document → triggers onDidChangeTextDocument → could send externalChange back.

**Solution:** Use a flag to track own edits:
```typescript
private isOwnEdit = false;

private async updateDocument(...) {
  this.isOwnEdit = true;
  await vscode.workspace.applyEdit(edit);
  this.isOwnEdit = false;
}
```

### Architecture Constants

From `src/shared/constants.ts`:
```typescript
export const DEBOUNCE_MS = 300;
```

### Anti-Patterns to Avoid

- DO NOT sync on every keystroke (use debounce)
- DO NOT create edit loops (external change triggers sync triggers external change)
- DO NOT lose user edits during external sync
- DO NOT block UI during sync operations

### Testing Considerations

- Mock VS Code API for extension tests
- Test debounce timing
- Test markdown serialization fidelity
- Test edit conflict scenarios

### References

- [Source: docs/epics.md#Story 2.5: Bidirectional Sync]
- [Source: docs/architecture.md#API & Communication Patterns]
- [Source: docs/architecture.md#WebView ↔ Extension Communication]

## Dev Agent Record

### Context Reference

Story created by create-story workflow.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Implemented useDebounce hook with cleanup on unmount (6 tests)
- Implemented markdownSerializer using Turndown library (20 tests)
- Modified useTipTapEditor to accept options object with onUpdate callback (3 tests)
- Updated App.tsx with debounced content sync and external change handling
- Updated editorProvider.ts with contentChanged handler and external change detection
- Added isOwnEdit flag to prevent circular update loops
- All 93 tests pass with no regressions

### File List

- `wysiwyg-markdown-editor/src/webview/hooks/useDebounce.ts` (new)
- `wysiwyg-markdown-editor/src/webview/utils/markdownSerializer.ts` (new)
- `wysiwyg-markdown-editor/src/webview/hooks/useTipTapEditor.ts` (modified)
- `wysiwyg-markdown-editor/src/webview/App.tsx` (modified)
- `wysiwyg-markdown-editor/src/extension/editorProvider.ts` (modified)
- `wysiwyg-markdown-editor/src/webview/__tests__/useDebounce.test.ts` (new)
- `wysiwyg-markdown-editor/src/webview/__tests__/markdownSerializer.test.ts` (new)
- `wysiwyg-markdown-editor/src/webview/__tests__/contentSync.test.tsx` (new)
- `wysiwyg-markdown-editor/src/webview/__tests__/useTipTapEditor.test.ts` (modified)
- `wysiwyg-markdown-editor/src/webview/__tests__/Editor.selection.test.tsx` (modified)
- `wysiwyg-markdown-editor/package.json` (modified - added turndown dependency)
- `wysiwyg-markdown-editor/package-lock.json` (modified)

### Change Log

- 2025-12-11: Story created with comprehensive developer context
- 2025-12-12: Implemented bidirectional sync with debounce, serialization, and external change detection
