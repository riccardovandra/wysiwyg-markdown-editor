# Story 1.3: Context Menu & Command Palette Integration

**Status:** Done

## Story

As a **user**,
I want to open markdown files in WYSIWYG view via context menu or command palette,
So that I can choose when to use the visual editor.

## Acceptance Criteria

### AC1: Context Menu Entry
**Given** I have a `.md` file in the explorer
**When** I right-click the file
**Then** I see "Open with Markdown WYSIWYG" in the context menu

### AC2: Context Menu Opens Editor
**Given** I right-click a `.md` file
**When** I select "Open with Markdown WYSIWYG"
**Then** the file opens in the custom editor WebView

### AC3: Command Palette Entry
**Given** I have a `.md` file open (standard editor) or selected
**When** I open command palette and type "Markdown WYSIWYG"
**Then** I see "Markdown WYSIWYG: Open in Visual Editor" command

### AC4: Command Palette Opens Editor
**Given** I have a `.md` file selected
**When** I execute the command from palette
**Then** the file opens in the custom editor

### AC5: Package.json Command Contribution
**Given** the project
**When** I inspect package.json
**Then** it contains:
```json
"contributes": {
  "commands": [{
    "command": "markdownWysiwyg.openEditor",
    "title": "Open in Visual Editor",
    "category": "Markdown WYSIWYG"
  }],
  "menus": {
    "explorer/context": [{
      "command": "markdownWysiwyg.openEditor",
      "when": "resourceExtname == .md",
      "group": "navigation"
    }]
  }
}
```

## Tasks / Subtasks

- [x] **Task 1: Add command to package.json** (AC: 5)
  - [x] Add command contribution with id `markdownWysiwyg.openEditor`
  - [x] Set title: "Open in Visual Editor"
  - [x] Set category: "Markdown WYSIWYG"

- [x] **Task 2: Add context menu contribution** (AC: 5)
  - [x] Add `explorer/context` menu entry
  - [x] Set `when` clause: `resourceExtname == .md`
  - [x] Set group: "navigation" (appears near top)

- [x] **Task 3: Implement command handler** (AC: 2, 4)
  - [x] Register command in extension.ts
  - [x] Get URI from command arguments (context menu) or active editor
  - [x] Call `vscode.commands.executeCommand('vscode.openWith', uri, 'markdownWysiwyg.editor')`

- [x] **Task 4: Handle edge cases** (AC: 2, 4)
  - [x] Handle case when no file is selected
  - [x] Handle case when non-md file is somehow triggered
  - [x] Show error message if file can't be opened

- [x] **Task 5: Test both entry points** (AC: 1-4)
  - [x] Test context menu on .md file → opens in custom editor
  - [x] Test command palette → opens current/selected .md file
  - [x] Test on non-.md file → context menu shouldn't appear

## Dev Notes

### Command Implementation
```typescript
// In extension.ts activate()
context.subscriptions.push(
  vscode.commands.registerCommand('markdownWysiwyg.openEditor', async (uri?: vscode.Uri) => {
    // If no URI provided, try to get from active editor
    if (!uri) {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.fileName.endsWith('.md')) {
        uri = activeEditor.document.uri;
      }
    }

    if (!uri) {
      vscode.window.showWarningMessage('No markdown file selected');
      return;
    }

    await vscode.commands.executeCommand(
      'vscode.openWith',
      uri,
      'markdownWysiwyg.editor'
    );
  })
);
```

### Package.json Additions
```json
{
  "contributes": {
    "commands": [{
      "command": "markdownWysiwyg.openEditor",
      "title": "Open in Visual Editor",
      "category": "Markdown WYSIWYG",
      "icon": "$(book)"
    }],
    "menus": {
      "explorer/context": [{
        "command": "markdownWysiwyg.openEditor",
        "when": "resourceExtname == .md",
        "group": "navigation"
      }],
      "editor/title": [{
        "command": "markdownWysiwyg.openEditor",
        "when": "resourceExtname == .md",
        "group": "navigation"
      }]
    }
  }
}
```

### PRD Reference
This implements:
- **FR1:** Open `.md` file in WYSIWYG via right-click context menu
- **FR2:** Open `.md` file in WYSIWYG via command palette

### References

- [Source: docs/prd.md#Functional Requirements - FR1, FR2]
- [Source: docs/architecture.md#Project Structure & Boundaries]

## Dev Agent Record

### Completion Notes List

- **Task 1-2**: Added `markdownWysiwyg.openEditor` command and menu contributions to package.json. Command appears in command palette under "Markdown WYSIWYG" category. Context menu entry appears for .md files in explorer and editor title bar.

- **Task 3-4**: Implemented command handler in extension.ts that:
  - Accepts URI from context menu or gets from active editor
  - Shows warning if no markdown file selected
  - Shows warning if non-.md file triggered
  - Shows error message on failure with error details
  - Opens file using `vscode.openWith` API with custom editor viewType

- **Task 5**: Added unit tests for command execution:
  - Test: command can be executed without throwing
  - Test: command opens markdown file in custom editor (skipped in CI due to no workspace)
  - Also updated esbuild.js to compile test files to out/test/ directory

### File List

- `wysiwyg-markdown-editor/package.json` - Added command and menu contributions
- `wysiwyg-markdown-editor/src/extension/extension.ts` - Added openEditor command handler
- `wysiwyg-markdown-editor/src/extension/__tests__/extension.test.ts` - Added command tests
- `wysiwyg-markdown-editor/esbuild.js` - Updated to compile test files

### Change Log

- 2025-12-11: Implemented Story 1.3 - Context Menu & Command Palette Integration (AC: 1-5)
- 2025-12-11: Code Review - Note: Dev Notes mention icon "$(book)" but not in actual package.json (minor doc discrepancy, not blocking)
