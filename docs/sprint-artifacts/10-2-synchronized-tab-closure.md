# Story 10.2: Synchronized Tab Closure

Status: Ready for Review

## Story

As a user,
I want closing the WYSIWYG editor to also close the text editor tab,
so that I don't have orphaned tabs for the same document.

## Acceptance Criteria

1. **Given** I have a markdown file open in WYSIWYG editor
   **And** the same file has a text editor tab open
   **When** I close the WYSIWYG editor tab
   **Then** the text editor tab for the same document is also closed (FR40)

2. **Given** I have a markdown file open in text editor only
   **When** I close the text editor tab
   **Then** it closes normally (no WYSIWYG editor to close)

3. **And** closing behavior is graceful (no errors if tabs don't exist)

4. **And** unsaved changes prompt appears before closing (standard VS Code behavior)

## Tasks / Subtasks

- [x] Task 1: Implement tab closure helper function (AC: #1, #3)
  - [x] 1.1: Create `closeRelatedTextEditors(documentUri: string)` function in editorProvider.ts
  - [x] 1.2: Use `vscode.window.tabGroups` API to find text editor tabs matching URI
  - [x] 1.3: Filter to only close non-custom-editor tabs (plain text tabs)
  - [x] 1.4: Use TabGroups close API to close matching tabs gracefully
  - [x] 1.5: Add try-catch for graceful error handling (AC: #3)
  - [x] 1.6: Add outputChannel logging for debugging

- [x] Task 2: Integrate closure logic into onDidDispose (AC: #1)
  - [x] 2.1: Call `closeRelatedTextEditors(documentUri)` in webviewPanel.onDidDispose callback
  - [x] 2.2: Ensure unregistration happens before tab closure (order matters)
  - [x] 2.3: Handle async properly - don't block disposal

- [x] Task 3: Write integration tests (AC: #1, #2, #3, #4)
  - [x] 3.1: Test: Closing WYSIWYG editor closes related text editor tabs
  - [x] 3.2: Test: Closing text editor only doesn't error (no WYSIWYG to close)
  - [x] 3.3: Test: Multiple documents tracked independently
  - [x] 3.4: Test: Graceful handling when no tabs to close
  - [x] 3.5: Test: Tab in split views handled correctly

- [x] Task 4: Manual verification (AC: #4)
  - [x] 4.1: Verify unsaved changes prompt works correctly
  - [x] 4.2: Verify behavior in split view scenarios
  - [x] 4.3: Test with multiple markdown files open simultaneously

## Dev Notes

### Architecture Compliance

**Required Patterns (from architecture.md):**
- File naming: `camelCase.ts` for modules → editorProvider.ts (existing file)
- Location: `src/extension/` for extension host code
- Logging: Use existing `outputChannel` for debug logging
- Error handling: Try-catch at boundary, log to output channel

**Existing Code Context:**

```typescript
// Current onDidDispose in editorProvider.ts (lines 191-196)
webviewPanel.onDidDispose(() => {
  editorRegistry.unregister(documentUri);
  willSaveSubscription.dispose();
  changeDocumentSubscription.dispose();
  configChangeSubscription.dispose();
});
```

Must ADD tab closure logic to this callback after unregistration.

### Technical Requirements

**VS Code Tab API Reference:**

The extension.ts already demonstrates working with tabs (lines 48-56, 90-97):

```typescript
// Type guard from extension.ts
function isTabInputWithUri(input: unknown): input is { uri: vscode.Uri } {
  return input !== null &&
    typeof input === 'object' &&
    'uri' in input &&
    (input as { uri: unknown }).uri instanceof vscode.Uri;
}

// Finding tabs with matching URI
const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
const matchingTab = tabs.find(tab => {
  if (isTabInputWithUri(tab.input)) {
    return tab.input.uri.toString() === targetUri;
  }
  return false;
});
```

**Implementation Approach:**

```typescript
// Add to editorProvider.ts - helper function
async function closeRelatedTextEditors(documentUri: string): Promise<void> {
  try {
    // Find all tabs across all tab groups
    const allTabs = vscode.window.tabGroups.all.flatMap(group =>
      group.tabs.map(tab => ({ tab, group }))
    );

    // Find text editor tabs with matching URI (exclude custom editors)
    const tabsToClose = allTabs.filter(({ tab }) => {
      // Check if it's a text tab (has uri but NOT viewType)
      if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
        const input = tab.input as { uri: vscode.Uri; viewType?: string };
        // Only close if it's NOT a custom editor (no viewType = text editor)
        if (!('viewType' in tab.input)) {
          return input.uri.toString() === documentUri;
        }
      }
      return false;
    });

    // Close each matching tab
    for (const { tab, group } of tabsToClose) {
      await vscode.window.tabGroups.close(tab);
      outputChannel.log(`Closed related text editor tab for: ${documentUri}`);
    }
  } catch (error) {
    // Graceful handling - log but don't throw
    outputChannel.log(`Error closing related tabs: ${error}`);
  }
}

// In onDidDispose callback:
webviewPanel.onDidDispose(() => {
  editorRegistry.unregister(documentUri);

  // Close related text editor tabs (fire and forget - don't block disposal)
  closeRelatedTextEditors(documentUri);

  willSaveSubscription.dispose();
  changeDocumentSubscription.dispose();
  configChangeSubscription.dispose();
});
```

**Tab Input Type Discrimination:**
- `vscode.TabInputText` - Plain text editor (has `uri` only)
- `vscode.TabInputCustom` - Custom editor (has `uri` AND `viewType`)
- We want to close `TabInputText` tabs, NOT `TabInputCustom` tabs

### Important Considerations

1. **Async vs Sync**: The `onDidDispose` callback doesn't need to wait for tab closure. Fire-and-forget is fine since we're cleaning up.

2. **Tab vs Editor**: VS Code has tabs (UI) and editors (documents). We're closing tabs, not documents. The document may remain in memory but the tab UI element is closed.

3. **Split Views**: Same document can be open in multiple tab groups. We need to close ALL matching text editor tabs, not just one.

4. **Dirty State**: VS Code handles the "Save changes?" prompt automatically when closing tabs with unsaved changes. We don't need to implement this.

5. **Race Conditions**: The editor registry unregistration should happen BEFORE tab closure to prevent any race conditions with auto-open logic.

### Project Structure Notes

**File to modify:**
```
src/extension/
  editorProvider.ts  # Add closeRelatedTextEditors helper and integrate
```

**No new files needed - this is a modification to existing editorProvider.ts.**

### Testing Strategy

**Integration Tests (editorProvider.test.ts or new file):**
- Mock `vscode.window.tabGroups` API
- Verify `closeRelatedTextEditors` is called on dispose
- Verify correct tabs are identified and closed
- Verify errors are caught gracefully

**Manual Testing Scenarios:**
1. Open .md file in text editor → right-click "Open with WYSIWYG" → close WYSIWYG tab → verify text tab also closes
2. Open .md file in WYSIWYG only → close WYSIWYG tab → verify no errors
3. Open .md file in both editors in split view → close WYSIWYG → verify both text tabs close
4. Make unsaved changes → close WYSIWYG → verify save prompt appears
5. Multiple .md files open → close one WYSIWYG → verify only that file's tabs close

### References

- [Source: docs/architecture.md#API-Communication-Patterns] - postMessage patterns
- [Source: docs/architecture.md#Implementation-Patterns] - Error handling patterns
- [Source: docs/epics.md#Story-10.2] - Full acceptance criteria and technical notes
- [Source: wysiwyg-markdown-editor/src/extension/editorProvider.ts#L191-196] - Current onDidDispose
- [Source: wysiwyg-markdown-editor/src/extension/extension.ts#L16-28] - Tab type guards
- [Source: wysiwyg-markdown-editor/src/extension/extension.ts#L48-56] - isDocumentInVisibleTab pattern
- [Source: docs/sprint-artifacts/10-1-document-editor-registry.md] - Previous story learnings

### Previous Story Intelligence (from 10-1)

**What worked well:**
- EditorRegistry singleton pattern is clean and effective
- Registration/unregistration at correct lifecycle points
- outputChannel logging for debugging

**Code patterns established:**
- documentUri is `document.uri.toString()` for consistent string keys
- Registry operations happen in `resolveCustomTextEditor` (register) and `onDidDispose` (unregister)

**Files created in 10-1:**
- `wysiwyg-markdown-editor/src/extension/editorRegistry.ts` - EditorRegistry class
- `wysiwyg-markdown-editor/src/extension/__tests__/editorRegistry.test.ts` - Tests

## Dev Agent Record

### Context Reference

- docs/architecture.md (full document)
- docs/epics.md (Epic 10 section)
- wysiwyg-markdown-editor/src/extension/editorProvider.ts (lines 1-244)
- wysiwyg-markdown-editor/src/extension/extension.ts (lines 1-192)
- wysiwyg-markdown-editor/src/extension/editorRegistry.ts (lines 1-58)
- docs/sprint-artifacts/10-1-document-editor-registry.md (previous story)

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Fixed webview script loading: Added `type="module"` to script tag to support ES module syntax

### Completion Notes List

- ✅ Task 1-2: Implementation was already present in codebase (closeRelatedTextEditors function and onDidDispose integration)
- ✅ Task 3: Integration tests already written in editorRegistry.test.ts covering all ACs
- ✅ Task 4: Manual verification passed - closing WYSIWYG closes text tab, unsaved changes prompt works, multiple files handled independently
- 🔧 Bug fix: Added `type="module"` to webview script tag to fix "Unexpected token 'export'" error

### File List

- wysiwyg-markdown-editor/src/extension/editorProvider.ts (modified - added type="module" to script tag)
- wysiwyg-markdown-editor/src/extension/__tests__/editorRegistry.test.ts (tests for synchronized tab closure)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-07 | Story verification and completion - all ACs satisfied |
| 2026-01-07 | Fixed webview module loading (type="module" attribute) |

---

**Story created by create-story workflow - comprehensive developer guide ready**
