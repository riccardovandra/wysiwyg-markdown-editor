# Story 10.1: Document Editor Registry

Status: Ready for Review

## Story

As a developer,
I want the extension to track which documents have open WYSIWYG editors,
so that we can coordinate lifecycle management between editor types.

## Acceptance Criteria

1. **Given** a markdown file is opened in the WYSIWYG editor
   **When** the CustomTextEditorProvider resolves the editor
   **Then** the document URI is registered in an editor registry Map

2. **And** the registry tracks: `Map<string, vscode.WebviewPanel>`

3. **And** when the WebView panel is disposed
   **Then** the entry is removed from the registry

4. **And** the registry is accessible from extension.ts for lifecycle coordination

5. **And** multiple documents can be tracked simultaneously

## Tasks / Subtasks

- [x] Task 1: Create EditorRegistry module (AC: #1, #2)
  - [x] 1.1: Create new file `src/extension/editorRegistry.ts`
  - [x] 1.2: Define `EditorRegistry` class with Map storage
  - [x] 1.3: Implement `register(uri: string, panel: vscode.WebviewPanel)` method
  - [x] 1.4: Implement `unregister(uri: string)` method
  - [x] 1.5: Implement `get(uri: string)` method for panel lookup
  - [x] 1.6: Implement `has(uri: string)` method for existence check
  - [x] 1.7: Export singleton instance for extension-wide access

- [x] Task 2: Integrate registry into editorProvider.ts (AC: #1, #3)
  - [x] 2.1: Import `editorRegistry` singleton
  - [x] 2.2: Add registration call in `resolveCustomTextEditor` after panel creation (line ~60)
  - [x] 2.3: Add unregistration call in `webviewPanel.onDidDispose` callback (line ~186)
  - [x] 2.4: Log registration/unregistration to outputChannel for debugging

- [x] Task 3: Export registry from extension.ts (AC: #4)
  - [x] 3.1: Import and re-export `editorRegistry` for external module access
  - [x] 3.2: Optionally add registry access command for debugging (skipped - not needed for current implementation)

- [x] Task 4: Verify multi-document tracking (AC: #5)
  - [x] 4.1: Integration tests written for multi-document tracking
  - [x] 4.2: Tests verify multiple documents are tracked in registry
  - [x] 4.3: Tests verify closing one file only removes that entry from registry

## Dev Notes

### Architecture Compliance

**Required Patterns (from architecture.md):**
- File naming: `camelCase.ts` for modules → `editorRegistry.ts`
- Location: `src/extension/` for extension host code
- Logging: Use existing `outputChannel` for debug logging
- No magic strings: Use typed exports

**Existing Code Context:**

```typescript
// Current onDidDispose in editorProvider.ts (lines 186-190)
webviewPanel.onDidDispose(() => {
  willSaveSubscription.dispose();
  changeDocumentSubscription.dispose();
  configChangeSubscription.dispose();
});
```

Must ADD registry unregistration to this callback, NOT replace existing logic.

### Technical Requirements

**EditorRegistry Interface:**

```typescript
// src/extension/editorRegistry.ts
import * as vscode from 'vscode';
import { outputChannel } from './outputChannel';

class EditorRegistry {
  private registry = new Map<string, vscode.WebviewPanel>();

  register(uri: string, panel: vscode.WebviewPanel): void {
    this.registry.set(uri, panel);
    outputChannel.log(`EditorRegistry: Registered ${uri}`);
  }

  unregister(uri: string): boolean {
    const result = this.registry.delete(uri);
    outputChannel.log(`EditorRegistry: Unregistered ${uri} (found: ${result})`);
    return result;
  }

  get(uri: string): vscode.WebviewPanel | undefined {
    return this.registry.get(uri);
  }

  has(uri: string): boolean {
    return this.registry.has(uri);
  }

  get size(): number {
    return this.registry.size;
  }

  // For debugging/iteration
  entries(): IterableIterator<[string, vscode.WebviewPanel]> {
    return this.registry.entries();
  }
}

export const editorRegistry = new EditorRegistry();
```

**Integration in editorProvider.ts:**

```typescript
// At top of file
import { editorRegistry } from './editorRegistry';

// In resolveCustomTextEditor, after line 60:
const documentUri = document.uri.toString();
editorRegistry.register(documentUri, webviewPanel);

// In onDidDispose callback, add:
webviewPanel.onDidDispose(() => {
  editorRegistry.unregister(documentUri);  // ADD THIS
  willSaveSubscription.dispose();
  changeDocumentSubscription.dispose();
  configChangeSubscription.dispose();
});
```

### Project Structure Notes

**New file location:**
```
src/extension/
  editorProvider.ts  # Modified
  editorRegistry.ts  # NEW
  extension.ts       # Modified (re-export)
  outputChannel.ts   # Existing
```

**No conflicts detected with unified project structure.**

### References

- [Source: docs/architecture.md#Implementation-Patterns] - File naming conventions
- [Source: docs/architecture.md#Project-Structure-Boundaries] - Extension directory organization
- [Source: docs/epics.md#Story-10.1] - Full acceptance criteria
- [Source: wysiwyg-markdown-editor/src/extension/editorProvider.ts#L186-190] - Current onDidDispose implementation
- [Source: wysiwyg-markdown-editor/src/extension/extension.ts#L26-41] - Provider registration

## Dev Agent Record

### Context Reference

- docs/architecture.md (full document)
- docs/epics.md (Epic 10 section)
- wysiwyg-markdown-editor/src/extension/editorProvider.ts (lines 1-238)
- wysiwyg-markdown-editor/src/extension/extension.ts (lines 1-188)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation was straightforward

### Completion Notes List

- Created EditorRegistry class as singleton with Map<string, vscode.WebviewPanel> storage
- Implemented all required methods: register, unregister, get, has, size, entries
- Integrated registration in resolveCustomTextEditor after webview.html is set
- Added unregistration in onDidDispose callback before other subscription cleanups
- Exported editorRegistry from extension.ts for external module access
- Added comprehensive integration tests in editorRegistry.test.ts covering:
  - Module import and method availability
  - Document tracking when opened in WYSIWYG editor
  - Document removal when editor is closed
  - Multiple document simultaneous tracking
  - Selective removal when closing one of multiple editors
- All existing tests continue to pass
- TypeScript type checks pass
- Build completes successfully
- Lint passes (only pre-existing warnings)

### File List

**Files Created:**
- `wysiwyg-markdown-editor/src/extension/editorRegistry.ts`
- `wysiwyg-markdown-editor/src/extension/__tests__/editorRegistry.test.ts`

**Files Modified:**
- `wysiwyg-markdown-editor/src/extension/editorProvider.ts` (added import and registration/unregistration)
- `wysiwyg-markdown-editor/src/extension/extension.ts` (added import and re-export)
- `wysiwyg-markdown-editor/esbuild.js` (added new test file to build entry points)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-03 | Implemented EditorRegistry module for document-to-panel tracking (Story 10.1) |

---

**Implementation completed - all acceptance criteria satisfied**
