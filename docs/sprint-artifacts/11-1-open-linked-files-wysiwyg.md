# Story 11.1: Open Linked Files in WYSIWYG Mode

Status: Ready for Review

## Story

As a user,
I want to click on links to other markdown files in the WYSIWYG editor,
so that I can navigate between documents without switching to the file explorer.

## Acceptance Criteria

1. **Given** I am viewing a markdown document in the WYSIWYG editor
   **And** the document contains a link to another `.md` file (relative or absolute path)
   **When** I click on the link
   **Then** the linked markdown file opens in the WYSIWYG editor

2. **Given** I am viewing a markdown document with a link like `[Other Doc](./other-doc.md)`
   **When** I click the link
   **Then** the path is resolved relative to the current document's location
   **And** the file opens in a new WYSIWYG editor tab

3. **Given** the auto-open setting is disabled
   **When** I click a markdown file link
   **Then** the file should still open in WYSIWYG mode (link clicks are explicit user intent)

4. **Given** I click a link to a non-existent markdown file
   **When** the extension tries to open it
   **Then** VS Code's standard "file not found" handling is shown

5. **Given** I click a link to an external URL (http/https)
   **When** the click is processed
   **Then** the link opens in the system's default browser

6. **Given** I click a link to a non-markdown file (e.g., `.txt`, `.json`)
   **When** the click is processed
   **Then** the file opens in VS Code's default editor for that file type

## Tasks / Subtasks

- [x] Task 1: Add `linkClicked` message type to shared message types (AC: #1, #2)
  - [x] Add `{ type: 'linkClicked'; href: string }` to WebViewMessage union
  - [x] Export type for use in both extension and webview

- [x] Task 2: Add click handler for links in WebView (AC: #1, #5)
  - [x] Create click event handler in Editor component or App.tsx
  - [x] Listen for clicks on anchor elements within the editor
  - [x] Extract href from clicked link
  - [x] Send `linkClicked` message to extension via vscode postMessage
  - [x] Prevent default browser navigation for all links

- [x] Task 3: Handle link click message in extension (AC: #1, #2, #3, #4, #5, #6)
  - [x] Add message handler for `linkClicked` type in editorProvider.ts
  - [x] Detect link type: relative markdown, absolute markdown, external URL, other file
  - [x] For external URLs (http/https): use `vscode.env.openExternal()`
  - [x] For markdown files: resolve path relative to current document
  - [x] For non-markdown files: open with default editor
  - [x] Handle file not found gracefully

- [x] Task 4: Implement path resolution logic (AC: #2)
  - [x] Get current document's directory from TextDocument URI
  - [x] Resolve relative paths (./file.md, ../folder/file.md)
  - [x] Handle absolute paths (file:// URIs)
  - [x] Normalize path to vscode.Uri

- [x] Task 5: Open markdown files in WYSIWYG (AC: #1, #3)
  - [x] Use `vscode.commands.executeCommand('vscode.openWith', uri, 'markdownWysiwyg.editor')`
  - [x] This should work regardless of auto-open setting (explicit user intent)

- [x] Task 6: Add tests (AC: #1-6)
  - [x] Unit test for path resolution logic
  - [x] Unit test for link type detection
  - [x] WebView test for link click handler
  - [x] Integration test for message handling

## Dev Notes

### Architecture Compliance

- **Message Protocol:** Follow existing WebView ↔ Extension communication pattern using typed postMessage API
- **File Locations:**
  - Message types: `src/shared/messages.types.ts`
  - WebView click handler: `src/webview/App.tsx` or dedicated hook
  - Extension handler: `src/extension/editorProvider.ts`

### Current Link Implementation

The TipTap Link extension is configured with `openOnClick: false` at [useTipTapEditor.ts:120-125](wysiwyg-markdown-editor/src/webview/hooks/useTipTapEditor.ts#L120-L125):

```typescript
Link.configure({
  openOnClick: false,
  HTMLAttributes: {
    class: 'text-blue-500 underline cursor-pointer',
  },
})
```

This means links are styled but do not respond to clicks. We need to add our own click handler.

### Implementation Approach

**Option A (Recommended): DOM Event Delegation**
- Add a single click event listener to the editor container
- Check if click target is an anchor element or has an anchor parent
- Extract href and send message
- Simple, minimal code changes

**Option B: TipTap Extension**
- Create custom Link extension that extends the built-in one
- Override click behavior
- More complex but cleaner TipTap integration

Recommend **Option A** for simplicity.

### Path Resolution Examples

| Link in Document | Current Document | Resolved Path |
|-----------------|------------------|---------------|
| `./readme.md` | `/project/docs/index.md` | `/project/docs/readme.md` |
| `../api.md` | `/project/docs/index.md` | `/project/api.md` |
| `folder/guide.md` | `/project/docs/index.md` | `/project/docs/folder/guide.md` |
| `file:///absolute/path.md` | Any | `/absolute/path.md` |
| `https://example.com` | Any | Opens in browser |

### Testing Standards

- Unit tests with Vitest for path resolution and link type detection
- WebView tests with Testing Library for click handler
- Mock `vscode` API in extension tests

### Project Structure Notes

- New code follows existing patterns in the codebase
- No new directories needed
- Uses existing message protocol pattern

### References

- [Source: docs/architecture.md#API & Communication Patterns] - Message protocol spec
- [Source: useTipTapEditor.ts:120-125] - Current Link configuration
- [Source: extension.ts:129-166] - Existing openEditor command pattern
- [Source: messages.types.ts] - Current message type definitions

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- Implemented link click handling using DOM event delegation (Option A from story) via `useLinkClickHandler` hook
- Created dedicated `linkHandler.ts` module for clean separation of concerns
- Link type detection supports: http/https/ftp (external), mailto/tel (external), .md/.markdown (markdown), other files
- Path resolution handles: relative paths (./), parent paths (../), absolute paths (/), file:// URIs
- Markdown files open in WYSIWYG editor using `vscode.openWith` command (works regardless of auto-open setting)
- External URLs open via `vscode.env.openExternal()`
- Non-markdown files open with VS Code's default editor
- File not found shows error message via `vscode.window.showErrorMessage()`
- Added 9 WebView tests for `useLinkClickHandler` (all passing)
- Added 14 Extension tests for `linkHandler` - detectLinkType and resolveLinkPath (all passing)
- Total: 33 extension tests passing, 263 webview tests passing

### File List

**New Files:**
- `wysiwyg-markdown-editor/src/webview/hooks/useLinkClickHandler.ts` - WebView hook for link click handling
- `wysiwyg-markdown-editor/src/extension/linkHandler.ts` - Extension module for link routing and path resolution
- `wysiwyg-markdown-editor/src/webview/__tests__/useLinkClickHandler.test.ts` - WebView tests (9 tests)
- `wysiwyg-markdown-editor/src/extension/__tests__/linkHandler.test.ts` - Extension tests (14 tests)

**Modified Files:**
- `wysiwyg-markdown-editor/src/shared/messages.types.ts` - Added `linkClicked` message type to WebViewMessage union
- `wysiwyg-markdown-editor/src/webview/App.tsx` - Integrated useLinkClickHandler hook with postMessage callback
- `wysiwyg-markdown-editor/src/extension/editorProvider.ts` - Added `linkClicked` message handler
- `wysiwyg-markdown-editor/esbuild.js` - Added linkHandler.test.ts to test entry points
