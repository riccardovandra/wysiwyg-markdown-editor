---
project_name: 'Markdown WYSIWYG'
user_name: 'Riccardo'
date: '2025-12-10'
---

# Project Context for AI Agents

_Critical rules and patterns for implementing the Markdown WYSIWYG VS Code extension._

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.x (strict) | Language |
| VS Code API | 1.74+ | Custom Editor Provider |
| React | 18.x | WebView UI |
| TipTap | 3.x | WYSIWYG editor |
| Tailwind CSS | 3.x | Styling + typography |
| esbuild | latest | Extension bundler |
| Vite | 5.x | WebView bundler |
| Vitest | latest | WebView tests |

## VS Code Extension Rules

**WebView Security:**
- All WebViews require CSP with nonce for scripts
- Use `webview.asWebviewUri()` for all local assets
- Never use relative paths in WebView HTML

**Extension Lifecycle:**
- Dispose all subscriptions in `deactivate()`
- Use `context.subscriptions.push()` for auto-cleanup
- Never store state in module scope — use `context.workspaceState`

**File Operations:**
- Use `TextDocument` API, never direct `fs` access
- All I/O must be async — never block extension host
- Use `vscode.Uri.joinPath()` for cross-platform paths

## TypeScript Rules

- **Strict mode required** — no implicit any
- **Separate tsconfigs** — extension (CommonJS) vs WebView (ESM)
- **Shared types only in `src/shared/`** — never cross-import extension↔webview

## React & TipTap Rules

- **Single editor instance** — create once, update via `.commands.setContent()`
- **VS Code API singleton** — call `acquireVsCodeApi()` once at init
- **State persistence** — use `vscode.getState()`/`setState()` for WebView restore

## Message Types

All messages use discriminated unions:

```typescript
type WebViewMessage =
  | { type: 'ready' }
  | { type: 'contentChanged'; markdown: string }
  | { type: 'formatAction'; action: FormatAction };

type ExtensionMessage =
  | { type: 'init'; content: string }
  | { type: 'externalChange'; content: string };
```

## Build Rules

- **Dual build**: esbuild (extension) + Vite (WebView)
- **External vscode**: `external: ['vscode']` in esbuild config
- **WebView output**: Must be in `dist/webview/`

## Testing Rules

- Extension tests: `@vscode/test-electron` in Extension Host
- WebView tests: Vitest with mocked `acquireVsCodeApi()`
- Test files: `__tests__/*.test.ts(x)` co-located

## Anti-Patterns

| Never Do | Why |
|----------|-----|
| `document.` in extension | No DOM in Node.js |
| `require('vscode')` in WebView | VS Code API is extension-only |
| `fs` in WebView | File access is extension-only |
| Hardcoded paths | Breaks cross-platform |
| Sync file I/O | Blocks extension host |
| Module-scope state | Lost on reload |

## Edge Cases

- **Empty files**: Ensure TipTap has at least one paragraph
- **Large files (>1MB)**: Warn user, TipTap performance degrades
- **External changes**: Handle `onDidChangeTextDocument` events
- **Malformed markdown**: Render as plain text, don't crash
