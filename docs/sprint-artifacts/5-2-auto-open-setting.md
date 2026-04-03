# Story 5.2: Auto-Open Markdown Files Setting

**Status:** Done

## Story

As a **user**,
I want the option to automatically open markdown files in the WYSIWYG editor,
So that I don't have to manually select it each time.

## Acceptance Criteria

### AC1: Setting Available in VS Code
**Given** I open VS Code settings
**When** I search for "markdownWysiwyg"
**Then** I see a setting "Auto Open" with boolean toggle
**And** the default value is `false`

### AC2: Setting Configuration Schema
**Given** the extension is installed
**When** I view settings.json
**Then** I can add `"markdownWysiwyg.autoOpen": true`
**And** IntelliSense shows the setting with description

### AC3: Auto-Open When Enabled
**Given** I have enabled `markdownWysiwyg.autoOpen: true`
**When** I open any `.md` file (double-click, Cmd+O, etc.)
**Then** it opens in the WYSIWYG editor by default

### AC4: Standard Behavior When Disabled
**Given** I have `markdownWysiwyg.autoOpen: false` (default)
**When** I open any `.md` file
**Then** it opens in the standard text editor
**And** I can still use "Open With..." to choose WYSIWYG

### AC5: User/Workspace Level Setting
**Given** the setting exists
**When** I configure it
**Then** I can set it at user level (global)
**And** I can set it at workspace level (per-project)
**And** workspace setting overrides user setting

### AC6: Open With Still Works
**Given** auto-open is enabled or disabled
**When** I right-click a .md file and select "Open With..."
**Then** I can still choose between text editor and WYSIWYG editor

### AC7: README Documentation
**Given** the extension README
**When** I read it
**Then** the auto-open setting is documented with usage instructions

## Tasks / Subtasks

- [x] **Task 1: Add Configuration Schema to package.json** (AC: 1, 2)
  - [x] Add `contributes.configuration` section
  - [x] Define `markdownWysiwyg.autoOpen` property
  - [x] Set type: boolean, default: false
  - [x] Add description for settings UI

- [x] **Task 2: Update Custom Editor Priority** (AC: 3, 4)
  - [x] Read setting value in extension activation
  - [x] Dynamically set editor priority based on setting
  - [x] Option A: Use `priority: "default"` when enabled (implemented via document interception)
  - [x] Option B: Re-register provider with different priority (not needed - Option A used)

- [x] **Task 3: Listen for Setting Changes** (AC: 3, 4, 5)
  - [x] Add `onDidChangeConfiguration` listener
  - [x] Update behavior when setting changes
  - [x] Handle workspace vs user level settings

- [x] **Task 4: Verify Open With Behavior** (AC: 6)
  - [x] Test "Open With..." menu appears
  - [x] Test can switch between editors
  - [x] Test with both setting values

- [x] **Task 5: Update README** (AC: 7)
  - [x] Add Settings section to README
  - [x] Document `markdownWysiwyg.autoOpen`
  - [x] Include example configuration

- [x] **Task 6: Write Tests** (AC: 1-4)
  - [x] Test setting is registered
  - [x] Test default value is false
  - [x] Test setting change is detected

## Dev Notes

### Package.json Configuration Schema

```json
{
  "contributes": {
    "configuration": {
      "title": "Markdown WYSIWYG",
      "properties": {
        "markdownWysiwyg.autoOpen": {
          "type": "boolean",
          "default": false,
          "description": "Automatically open markdown files in the WYSIWYG editor instead of the text editor."
        }
      }
    }
  }
}
```

### Custom Editor Priority Options

VS Code custom editor priorities:
- `"default"` - Opens by default for matching files
- `"option"` - Available as an option via "Open With..."

```json
{
  "contributes": {
    "customEditors": [{
      "viewType": "markdownWysiwyg.editor",
      "displayName": "Markdown WYSIWYG",
      "selector": [{ "filenamePattern": "*.md" }],
      "priority": "option"  // or "default" based on setting
    }]
  }
}
```

### Implementation Strategy

**Option A: Static Priority + Intercept Opens**
Keep priority as "option" but intercept file opens when setting enabled:

```typescript
// extension.ts
vscode.workspace.onDidOpenTextDocument(async (document) => {
  const config = vscode.workspace.getConfiguration('markdownWysiwyg');
  const autoOpen = config.get<boolean>('autoOpen', false);

  if (autoOpen && document.fileName.endsWith('.md')) {
    await vscode.commands.executeCommand(
      'vscode.openWith',
      document.uri,
      'markdownWysiwyg.editor'
    );
  }
});
```

**Option B: Dynamic Priority (Preferred)**
Set priority based on setting at activation time:

```typescript
// extension.ts
export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('markdownWysiwyg');
  const autoOpen = config.get<boolean>('autoOpen', false);

  // Register with appropriate priority
  const provider = new MarkdownEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'markdownWysiwyg.editor',
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );
}
```

Note: Changing priority dynamically may require extension reload.

### Reading Configuration

```typescript
// Get setting value
const config = vscode.workspace.getConfiguration('markdownWysiwyg');
const autoOpen = config.get<boolean>('autoOpen', false);

// Listen for changes
vscode.workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('markdownWysiwyg.autoOpen')) {
    const newValue = vscode.workspace
      .getConfiguration('markdownWysiwyg')
      .get<boolean>('autoOpen', false);
    // Handle change - may need to prompt for reload
  }
});
```

### README Documentation Addition

```markdown
## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `markdownWysiwyg.autoOpen` | boolean | `false` | Automatically open markdown files in the WYSIWYG editor |

### Example Configuration

```json
// settings.json
{
  "markdownWysiwyg.autoOpen": true
}
```

When enabled, all `.md` files will open in the visual editor by default.
You can still use "Open With..." to choose a different editor.
```

### Files to Modify

- `package.json` - Add configuration schema
- `src/extension/extension.ts` - Read setting, configure priority
- `README.md` - Document the setting

### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Setting enabled mid-session | May require reload |
| Workspace overrides user setting | Workspace wins |
| File already open in text editor | No auto-switch |
| Multiple workspace folders | Each can have own setting |

### Testing Checklist

- [x] Setting appears in VS Code settings UI
- [x] Setting has correct default (false)
- [x] Setting description is clear
- [x] Auto-open works when enabled
- [x] Normal behavior when disabled
- [x] "Open With..." still works
- [x] Workspace setting overrides user (handled by VS Code configuration API)
- [x] README is updated

### References

- [Source: docs/epics.md#Story 5.2: Auto-Open Markdown Files Setting]
- [VS Code Configuration Contribution](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)
- [VS Code Custom Editors](https://code.visualstudio.com/api/extension-guides/custom-editors)

## Dev Agent Record

### Context Reference

Story created for Epic 5: UI/UX Polish & Customization.

### Implementation Plan

Used **Option A: Static Priority + Intercept Opens** approach:
- Kept custom editor priority as `"option"` to preserve "Open With..." functionality
- Implemented `onDidOpenTextDocument` listener to intercept markdown file opens
- When `autoOpen` setting is true, automatically switches to WYSIWYG editor
- Added `onDidChangeConfiguration` listener for logging and future enhancements

### Completion Notes

✅ All acceptance criteria satisfied:
- AC1: Setting visible in VS Code settings UI with boolean toggle
- AC2: IntelliSense shows setting with description in settings.json
- AC3: Auto-open works when setting is enabled
- AC4: Standard text editor behavior when setting is disabled (default)
- AC5: Workspace/user level settings handled by VS Code configuration API
- AC6: "Open With..." menu still works (priority remains "option")
- AC7: README updated with Settings section and example

Tests: 3 new tests added, all passing (10 total, 1 pending/skipped)

### File List

- `wysiwyg-markdown-editor/package.json` - Added contributes.configuration section
- `wysiwyg-markdown-editor/src/extension/extension.ts` - Added auto-open and config change listeners
- `wysiwyg-markdown-editor/src/extension/__tests__/extension.test.ts` - Added Auto-Open Setting Test Suite
- `wysiwyg-markdown-editor/README.md` - Added Settings section with documentation

### Change Log

- 2025-12-13: Story created with comprehensive developer context
- 2025-12-20: Implementation complete - all tasks done, tests passing, ready for review
- 2025-12-28: Code review completed - 8 issues found and fixed:
  - Added type guards for safer VS Code API access
  - Added constant for magic number (AUTO_OPEN_DELAY_MS)
  - Added timeout cleanup on deactivation
  - Added debouncing for rapid file switches
  - Added behavior tests for AC3/AC4 (auto-open when enabled/disabled)
  - Removed placeholder sample test
  - Updated README with reload note
  - Marked testing checklist items as verified
