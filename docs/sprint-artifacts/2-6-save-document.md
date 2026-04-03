# Story 2.6: Save Document

**Status:** Done

## Story

As a **user**,
I want to save the document with Cmd/Ctrl+S,
So that I have explicit control over when changes are persisted.

## Acceptance Criteria

### AC1: Save Keyboard Shortcut (FR4)
**Given** I have made edits to the document
**When** I press Cmd+S (Mac) or Ctrl+S (Windows/Linux)
**Then** the document is saved to disk

### AC2: Save Performance (NFR4)
**Given** I trigger a save
**When** the save completes
**Then** it completes within 200ms

### AC3: Dirty State Cleared
**Given** I have unsaved changes (dirty file)
**When** I save the document
**Then** VS Code shows the file as "not dirty" (no dot in tab)

### AC4: Pending Sync Flushed
**Given** I have pending debounced changes
**When** I press Cmd/Ctrl+S
**Then** the pending changes are flushed before save

### AC5: Save with No Changes
**Given** I have no pending changes
**When** I press Cmd/Ctrl+S
**Then** save completes without error

### AC6: Save Persists Content
**Given** I have edited the document
**When** I save and close the editor
**Then** reopening shows my saved changes

## Tasks / Subtasks

- [x] **Task 1: Understand VS Code save flow**
  - [x] Research how CustomTextEditor handles save
  - [x] Determine if save is automatic or needs handling
  - [x] Check if `onWillSaveTextDocument` is needed

- [x] **Task 2: Handle save trigger in extension** (AC: 1, 4)
  - [x] Listen to `vscode.workspace.onWillSaveTextDocument`
  - [x] Force flush any pending WebView changes before save
  - [x] Implement save coordination between WebView and extension

- [x] **Task 3: Implement flush mechanism in WebView** (AC: 4)
  - [x] Create method to immediately sync content (bypass debounce)
  - [x] Respond to extension's "flushBeforeSave" message if needed
  - [x] Ensure sync completes before save proceeds

- [x] **Task 4: Verify dirty state handling** (AC: 3)
  - [x] Test that edits mark document as dirty
  - [x] Test that save clears dirty state
  - [x] Verify tab shows/hides dirty indicator correctly

- [x] **Task 5: Test save behaviors** (AC: 1-6)
  - [x] Test Cmd/Ctrl+S triggers save
  - [x] Test save with pending changes
  - [x] Test save with no pending changes
  - [x] Test content persists after save and reopen
  - [x] Measure save latency (should be < 200ms)

- [x] **Task 6: Write tests**
  - [x] Test flush mechanism
  - [x] Test save event handling

## Dev Notes

### VS Code CustomTextEditor Save Behavior

With `CustomTextEditorProvider`, the `TextDocument` is the source of truth. VS Code handles save automatically through the document.

**Key insight:** If Story 2.5 (bidirectional sync) keeps the TextDocument updated via `document.edit()`, then Cmd/Ctrl+S just triggers VS Code's native save.

### Save Flow

```
1. User presses Cmd/Ctrl+S
2. VS Code triggers onWillSaveTextDocument
3. Extension signals WebView to flush pending changes
4. WebView immediately syncs content (bypasses debounce)
5. Extension updates TextDocument
6. VS Code writes TextDocument to disk
7. File saved, dirty state cleared
```

### Flush Before Save Implementation

**Option 1: onWillSaveTextDocument with waitUntil**
```typescript
vscode.workspace.onWillSaveTextDocument((e) => {
  if (e.document.uri.toString() === document.uri.toString()) {
    e.waitUntil(this.flushPendingChanges());
  }
});

private async flushPendingChanges(): Promise<void> {
  // Signal WebView to immediately sync
  webviewPanel.webview.postMessage({ type: 'flushContent' });

  // Wait for response or timeout
  await this.waitForFlushComplete();
}
```

**Option 2: WebView listens for save shortcut**
WebView can intercept Cmd/Ctrl+S, immediately sync, then let it bubble up.

**Recommendation:** Option 1 is cleaner and follows VS Code patterns.

### Message Types Update

May need to add to `messages.types.ts`:
```typescript
export type ExtensionMessage =
  | { type: 'init'; content: string }
  | { type: 'externalChange'; content: string }
  | { type: 'flushContent' }; // Request immediate sync

export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'contentChanged'; markdown: string }
  | { type: 'contentFlushed' }; // Confirm flush complete
```

### WebView Flush Handler

```typescript
// In App.tsx or Editor.tsx
useEffect(() => {
  const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
    const message = event.data;
    switch (message.type) {
      case 'flushContent':
        // Immediately serialize and send content
        const markdown = serializeToMarkdown(editor);
        vscode.postMessage({ type: 'contentChanged', markdown });
        vscode.postMessage({ type: 'contentFlushed' });
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [editor]);
```

### Performance Considerations

Save should complete in < 200ms. Components:
- Flush message round-trip: ~50ms
- Markdown serialization: ~10ms for typical documents
- File write: ~50ms
- Total: Well under 200ms for normal documents

### Current Codebase State

**From Story 2.5:**
- Bidirectional sync implemented
- contentChanged message working
- Document stays updated via debounced sync

**Key Files:**
- `src/extension/editorProvider.ts` - Add save handling
- `src/webview/App.tsx` - Add flush handler
- `src/shared/messages.types.ts` - Update if needed

### Anti-Patterns to Avoid

- DO NOT block save indefinitely waiting for WebView
- DO NOT lose edits if flush fails
- DO NOT create save loops
- DO NOT ignore save errors

### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Save with no edits | Save completes, no error |
| Save immediately after edit | Flush pending, then save |
| Save during long sync | Wait for sync, then save |
| WebView unresponsive | Timeout, save what's in document |

### Testing Strategy

1. **Unit tests:** Test flush mechanism in isolation
2. **Integration tests:** Test save + reopen preserves content
3. **Manual tests:** Time save operations, verify < 200ms

### References

- [Source: docs/epics.md#Story 2.6: Save Document]
- [Source: docs/architecture.md#Communication Patterns]
- [VS Code API: onWillSaveTextDocument](https://code.visualstudio.com/api/references/vscode-api#workspace.onWillSaveTextDocument)

## Dev Agent Record

### Context Reference

Story created by create-story workflow.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Added flushContent/contentFlushed message types to messages.types.ts
- Implemented onWillSaveTextDocument listener in editorProvider.ts
- Created flushPendingChanges function with 100ms timeout
- Added flushContent handler in App.tsx that bypasses debounce
- All 95 tests pass with no regressions

### File List

- `wysiwyg-markdown-editor/src/shared/messages.types.ts` (modified - added flush messages)
- `wysiwyg-markdown-editor/src/extension/editorProvider.ts` (modified - added save handling)
- `wysiwyg-markdown-editor/src/webview/App.tsx` (modified - added flush handler)
- `wysiwyg-markdown-editor/src/webview/hooks/useDebounce.ts` (modified - fixed type signature)
- `wysiwyg-markdown-editor/src/webview/__tests__/contentSync.test.tsx` (modified - added flush tests)

### Change Log

- 2025-12-11: Story created with comprehensive developer context
- 2025-12-12: Implemented save document with flush mechanism before save
