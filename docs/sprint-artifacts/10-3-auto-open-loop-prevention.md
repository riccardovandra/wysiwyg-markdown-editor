# Story 10.3: Auto-Open Loop Prevention

Status: in-progress

## Story

As a user,
I want closing a WYSIWYG editor to not trigger auto-open when I click the remaining text tab,
so that I don't experience frustrating re-open loops.

## Acceptance Criteria

1. **Given** the auto-open setting is enabled
   **And** I close a WYSIWYG editor tab
   **When** I click on the remaining text editor tab within 2 seconds
   **Then** auto-open does NOT trigger for that document (FR41)

2. **And** after the cooldown period (2 seconds), auto-open works normally again

3. **Given** the auto-open setting is disabled
   **Then** this behavior has no effect (auto-open already off)

4. **And** manual "Open with Markdown WYSIWYG" command still works during cooldown

5. **And** opening a different markdown file triggers auto-open normally

## Tasks / Subtasks

- [x] Task 1: Create CooldownManager module (AC: #1, #2)
  - [x] 1.1: Create new file `src/extension/cooldownManager.ts`
  - [x] 1.2: Define `CooldownManager` class with Map<string, number> storage (URI → timestamp)
  - [x] 1.3: Implement `markRecentlyClosed(uri: string): void` method that stores URI with current timestamp
  - [x] 1.4: Implement `isInCooldown(uri: string): boolean` method that checks if URI was closed within COOLDOWN_MS
  - [x] 1.5: Implement cleanup logic using setTimeout to remove expired entries
  - [x] 1.6: Export singleton instance for extension-wide access
  - [x] 1.7: Add outputChannel logging for debugging

- [x] Task 2: Integrate cooldown trigger into editorProvider.ts (AC: #1)
  - [x] 2.1: Import `cooldownManager` singleton
  - [x] 2.2: Call `cooldownManager.markRecentlyClosed(documentUri)` in `webviewPanel.onDidDispose` callback
  - [x] 2.3: Ensure this happens AFTER registry unregistration (order: unregister → mark cooldown → close tabs)

- [x] Task 3: Integrate cooldown check into extension.ts auto-open handler (AC: #1, #2, #3, #5)
  - [x] 3.1: Import `cooldownManager` singleton
  - [x] 3.2: Add cooldown check before auto-open logic (after `isAlreadyInWysiwyg` check)
  - [x] 3.3: If `cooldownManager.isInCooldown(uri)` returns true, skip auto-open
  - [x] 3.4: Add outputChannel logging when auto-open is blocked by cooldown

- [x] Task 4: Ensure manual command bypasses cooldown (AC: #4)
  - [x] 4.1: Verify `markdownWysiwyg.openEditor` command does NOT check cooldown
  - [x] 4.2: Add comment documenting that manual command intentionally bypasses cooldown

- [x] Task 5: Write unit tests for CooldownManager (AC: #1, #2)
  - [x] 5.1: Test: `markRecentlyClosed` stores URI correctly
  - [x] 5.2: Test: `isInCooldown` returns true within cooldown period
  - [x] 5.3: Test: `isInCooldown` returns false after cooldown expires
  - [x] 5.4: Test: Different URIs tracked independently
  - [x] 5.5: Test: Expired entries are cleaned up

- [x] Task 6: Write integration tests (AC: #1, #4, #5)
  - [x] 6.1: Test: Auto-open blocked after WYSIWYG close
  - [x] 6.2: Test: Manual command works during cooldown
  - [x] 6.3: Test: Different files auto-open normally

- [ ] Task 7: Manual verification (All AC)
  - [ ] 7.1: Enable autoOpen setting
  - [ ] 7.2: Open .md file in WYSIWYG
  - [ ] 7.3: Open same file in text editor (via "Open With" → Text Editor)
  - [ ] 7.4: Close WYSIWYG tab
  - [ ] 7.5: Immediately click text tab → verify NO re-open
  - [ ] 7.6: Wait 3 seconds → click text tab → verify auto-open works
  - [ ] 7.7: During cooldown → use command palette "Open in Visual Editor" → verify it works

## Dev Notes

### Architecture Compliance

**Required Patterns (from architecture.md):**
- File naming: `camelCase.ts` for modules → `cooldownManager.ts`
- Location: `src/extension/` for extension host code
- Logging: Use existing `outputChannel` for debug logging
- Error handling: Graceful handling, log errors but don't throw

**Avoiding Circular Dependencies:**
The new `cooldownManager.ts` module must be designed to avoid circular imports:
- `extension.ts` imports from `cooldownManager.ts` ✓
- `editorProvider.ts` imports from `cooldownManager.ts` ✓
- `cooldownManager.ts` only imports from `outputChannel.ts` ✓

### Technical Requirements

**CooldownManager Implementation:**

```typescript
// src/extension/cooldownManager.ts
import { outputChannel } from './outputChannel';

const COOLDOWN_MS = 2000; // 2 seconds cooldown period

class CooldownManager {
  private recentlyClosed = new Map<string, number>(); // URI → close timestamp
  private cleanupTimers = new Map<string, NodeJS.Timeout>(); // URI → cleanup timer

  /**
   * Mark a document URI as recently closed from WYSIWYG editor.
   * Auto-open will be suppressed for this URI for COOLDOWN_MS.
   */
  markRecentlyClosed(uri: string): void {
    // Clear any existing timer for this URI
    const existingTimer = this.cleanupTimers.get(uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Store the close timestamp
    this.recentlyClosed.set(uri, Date.now());
    outputChannel.log(`CooldownManager: Marked ${uri} as recently closed`);

    // Schedule cleanup
    const timer = setTimeout(() => {
      this.recentlyClosed.delete(uri);
      this.cleanupTimers.delete(uri);
      outputChannel.log(`CooldownManager: Cooldown expired for ${uri}`);
    }, COOLDOWN_MS);

    this.cleanupTimers.set(uri, timer);
  }

  /**
   * Check if a document URI is in cooldown period.
   * Returns true if auto-open should be suppressed.
   */
  isInCooldown(uri: string): boolean {
    const closeTime = this.recentlyClosed.get(uri);
    if (!closeTime) {
      return false;
    }

    const elapsed = Date.now() - closeTime;
    const inCooldown = elapsed < COOLDOWN_MS;

    if (inCooldown) {
      outputChannel.log(`CooldownManager: ${uri} in cooldown (${elapsed}ms elapsed)`);
    }

    return inCooldown;
  }

  /**
   * Dispose all timers (for extension deactivation)
   */
  dispose(): void {
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
    this.recentlyClosed.clear();
  }
}

export const cooldownManager = new CooldownManager();
```

**Integration in editorProvider.ts (lines 191-196):**

```typescript
// Add import at top of file
import { cooldownManager } from './cooldownManager';

// In onDidDispose callback:
webviewPanel.onDidDispose(() => {
  editorRegistry.unregister(documentUri);

  // Mark as recently closed to prevent auto-open loop
  cooldownManager.markRecentlyClosed(documentUri);

  // Close related text editor tabs (from Story 10.2)
  closeRelatedTextEditors(documentUri);

  willSaveSubscription.dispose();
  changeDocumentSubscription.dispose();
  configChangeSubscription.dispose();
});
```

**Integration in extension.ts auto-open handler (lines 89-99):**

```typescript
// Add import at top of file
import { cooldownManager } from './cooldownManager';

// Inside the setTimeout callback, after isAlreadyInWysiwyg check:
if (isAlreadyInWysiwyg) return;

// Check if document is in cooldown (recently closed from WYSIWYG)
if (cooldownManager.isInCooldown(editor.document.uri.toString())) {
  outputChannel.log(`Auto-open blocked by cooldown: ${editor.document.uri.fsPath}`);
  return;
}

await vscode.commands.executeCommand(
  'vscode.openWith',
  editor.document.uri,
  'markdownWysiwyg.editor'
);
```

**Cleanup in extension.ts deactivate():**

```typescript
export function deactivate() {
  // Clean up any pending auto-open timeout
  if (autoOpenTimeout) {
    clearTimeout(autoOpenTimeout);
    autoOpenTimeout = undefined;
  }

  // Clean up cooldown manager
  cooldownManager.dispose();

  outputChannel.dispose();
}
```

### Dependency Analysis

**Story 10.2 Dependency:**
This story depends on Story 10.2 (Synchronized Tab Closure) which adds `closeRelatedTextEditors()` to the `onDidDispose` callback. The cooldown mark must happen BEFORE tab closure so that:
1. User closes WYSIWYG tab
2. `onDidDispose` fires
3. Registry unregistration happens
4. **Cooldown is marked** ← This story
5. Related text tabs are closed ← Story 10.2
6. User clicks remaining text tab (if any)
7. Auto-open handler checks cooldown → blocked

**Order matters!** If tabs are closed before cooldown is marked, there's a race condition.

### Important Considerations

1. **Timer Management**: Each URI has its own cleanup timer. If the same document is opened and closed again during cooldown, the timer resets.

2. **Memory Cleanup**: The `dispose()` method clears all timers on extension deactivation. Individual entries auto-cleanup after `COOLDOWN_MS`.

3. **Timestamp vs Boolean**: Using timestamps allows flexibility for future features (e.g., adjustable cooldown, remaining time display) and enables the `isInCooldown` check to be accurate even if cleanup is delayed.

4. **No Effect When AutoOpen Disabled**: The cooldown check is inside the auto-open handler which already returns early if autoOpen is false (line 68). No additional check needed.

5. **Manual Command Bypasses**: The `markdownWysiwyg.openEditor` command (lines 122-156) has NO cooldown check, so manual opens always work.

### Project Structure Notes

**New file:**
```
src/extension/
  cooldownManager.ts  # NEW - Manages auto-open cooldown for recently closed editors
```

**Modified files:**
```
src/extension/
  editorProvider.ts   # Add cooldown mark in onDidDispose
  extension.ts        # Add cooldown check in auto-open handler, cleanup in deactivate
```

### Testing Strategy

**Unit Tests (cooldownManager.test.ts):**

```typescript
import { cooldownManager } from '../cooldownManager';

describe('CooldownManager', () => {
  beforeEach(() => {
    // Reset state between tests
    cooldownManager.dispose();
  });

  it('marks URI as recently closed', () => {
    const uri = 'file:///test.md';
    cooldownManager.markRecentlyClosed(uri);
    expect(cooldownManager.isInCooldown(uri)).toBe(true);
  });

  it('returns false for unknown URI', () => {
    expect(cooldownManager.isInCooldown('file:///unknown.md')).toBe(false);
  });

  it('cooldown expires after timeout', async () => {
    jest.useFakeTimers();
    const uri = 'file:///test.md';
    cooldownManager.markRecentlyClosed(uri);

    expect(cooldownManager.isInCooldown(uri)).toBe(true);

    jest.advanceTimersByTime(2001);

    expect(cooldownManager.isInCooldown(uri)).toBe(false);
    jest.useRealTimers();
  });

  it('tracks multiple URIs independently', () => {
    const uri1 = 'file:///test1.md';
    const uri2 = 'file:///test2.md';

    cooldownManager.markRecentlyClosed(uri1);

    expect(cooldownManager.isInCooldown(uri1)).toBe(true);
    expect(cooldownManager.isInCooldown(uri2)).toBe(false);
  });
});
```

**Manual Testing Checklist:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable `markdownWysiwyg.autoOpen` in settings | Setting is true |
| 2 | Open any .md file via Explorer | Opens in WYSIWYG (auto-open) |
| 3 | Right-click tab → "Open With" → "Text Editor" | Text editor tab opens |
| 4 | Close WYSIWYG tab (X button) | Both tabs close (Story 10.2) OR text tab remains |
| 5 | If text tab remains, click it immediately | NO re-open to WYSIWYG |
| 6 | Wait 3+ seconds, click text tab | WYSIWYG opens (auto-open resumes) |
| 7 | Close WYSIWYG, open Command Palette | Can run "Open in Visual Editor" |
| 8 | Open a DIFFERENT .md file | Auto-open works normally |

### References

- [Source: docs/architecture.md#Implementation-Patterns] - Error handling patterns
- [Source: docs/architecture.md#Project-Structure-Boundaries] - Extension directory organization
- [Source: docs/epics.md#Story-10.3] - Full acceptance criteria and technical notes
- [Source: wysiwyg-markdown-editor/src/extension/extension.ts#L61-108] - Current auto-open handler
- [Source: wysiwyg-markdown-editor/src/extension/editorProvider.ts#L191-196] - Current onDidDispose
- [Source: docs/sprint-artifacts/10-1-document-editor-registry.md] - EditorRegistry pattern
- [Source: docs/sprint-artifacts/10-2-synchronized-tab-closure.md] - Previous story with onDidDispose changes

### Previous Story Intelligence

**From Story 10.1 (Document Editor Registry):**
- Singleton pattern with exported instance works well
- outputChannel logging is valuable for debugging
- `documentUri = document.uri.toString()` for consistent string keys
- Registration/unregistration lifecycle hooks are correct

**From Story 10.2 (Synchronized Tab Closure):**
- `onDidDispose` callback order matters for lifecycle coordination
- Fire-and-forget pattern for async cleanup operations
- Tab closure uses VS Code tabGroups API
- Graceful error handling (log but don't throw)

**Code patterns established in Epic 10:**
- Module structure: Class with singleton export
- URI key format: `document.uri.toString()`
- Lifecycle: Register in resolveCustomTextEditor, cleanup in onDidDispose
- Logging: Use outputChannel with descriptive prefixes

## Dev Agent Record

### Context Reference

- docs/architecture.md (full document)
- docs/epics.md (Epic 10 section)
- wysiwyg-markdown-editor/src/extension/extension.ts (lines 1-192) - auto-open handler
- wysiwyg-markdown-editor/src/extension/editorProvider.ts (lines 1-244) - onDidDispose
- wysiwyg-markdown-editor/src/extension/editorRegistry.ts - singleton pattern reference
- docs/sprint-artifacts/10-1-document-editor-registry.md (previous story learnings)
- docs/sprint-artifacts/10-2-synchronized-tab-closure.md (dependency - onDidDispose changes)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No significant debug issues encountered during implementation

### Completion Notes List

- ✅ Created CooldownManager module following singleton pattern from editorRegistry.ts
- ✅ Integrated cooldown trigger into editorProvider.ts onDidDispose callback (order: unregister → cooldown → close tabs)
- ✅ Integrated cooldown check into extension.ts auto-open handler after isAlreadyInWysiwyg check
- ✅ Added cleanup in extension.ts deactivate() for proper resource disposal
- ✅ Verified manual command bypasses cooldown (no check in markdownWysiwyg.openEditor)
- ✅ Added comprehensive unit tests (8 tests passing, including timing tests)
- ✅ Added integration tests (3 tests for AC #1, #4, #5)
- ✅ All extension type checks pass
- ⏳ Task 7: Manual verification pending (requires user testing)

### File List

**New Files:**
- wysiwyg-markdown-editor/src/extension/cooldownManager.ts
- wysiwyg-markdown-editor/src/extension/__tests__/cooldownManager.test.ts

**Modified Files:**
- wysiwyg-markdown-editor/src/extension/editorProvider.ts (added import, cooldown mark in onDidDispose)
- wysiwyg-markdown-editor/src/extension/extension.ts (added import, cooldown check, cleanup in deactivate)
- wysiwyg-markdown-editor/esbuild.js (added test entry point)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-06 | Implemented CooldownManager module with 2-second cooldown period |
| 2026-01-06 | Integrated cooldown into editorProvider.ts and extension.ts |
| 2026-01-06 | Added unit tests (8 passing) and integration tests (3 tests) |

---

**Story created by create-story workflow - comprehensive developer guide ready**
