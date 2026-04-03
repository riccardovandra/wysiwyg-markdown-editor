# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A VS Code extension providing WYSIWYG editing for markdown files. Uses a custom editor provider to render markdown in a React-based TipTap editor within a WebView.

## Development Commands

```bash
npm install                 # Install dependencies
npm run dev:extension       # Watch extension (esbuild)
npm run dev:webview         # Watch webview (vite)
npm run build               # Build both extension and webview
npm run lint                # Run ESLint
npm run test:extension      # Run extension tests (vscode-test-electron)
npm run test:webview        # Run webview tests (vitest)
npm run package             # Build and create .vsix
```

Press F5 in VS Code to launch Extension Development Host.

## Architecture

### Dual Build System
- **Extension** (Node.js): Built with esbuild to `dist/extension.js`. Entry: `src/extension/extension.ts`
- **WebView** (Browser): Built with Vite to `dist/webview/`. Entry: `src/webview/index.tsx`

### Extension ↔ WebView Communication
Messages flow through `webview.postMessage()` using typed discriminated unions defined in `src/shared/messages.types.ts`:
- `ready`: WebView signals initialization complete
- `init`/`externalChange`: Extension sends markdown content to WebView
- `contentChanged`: WebView sends updated markdown back (debounced 300ms)
- `flushContent`/`contentFlushed`: Force sync before save

### Key Components
- **editorProvider.ts**: `CustomTextEditorProvider` that creates WebView, handles document sync
- **App.tsx**: Root React component orchestrating TipTap editor and message handling
- **useTipTapEditor.ts**: TipTap configuration with StarterKit, CodeBlockLowlight, Link extensions
- **markdownParser.ts**: Markdown → HTML using `marked`
- **markdownSerializer.ts**: HTML → Markdown using `turndown`

### Shared Code
Only `src/shared/` can be imported by both extension and webview. Contains constants and message types.

## Critical Rules

- **No cross-imports**: Extension code cannot import WebView code and vice versa
- **CSP required**: All WebView scripts use nonce-based CSP
- **TextDocument API only**: Never use `fs` directly; all file ops through VS Code API
- **Single editor instance**: Create TipTap once, update via `setContent()`
- **acquireVsCodeApi() once**: Call only at initialization, reuse the instance

## Testing

- Extension tests: Mocha in Extension Host (`src/extension/__tests__/`)
- WebView tests: Vitest + jsdom + React Testing Library (`src/webview/__tests__/`)
- Mock `acquireVsCodeApi` in webview tests via `src/webview/__tests__/setup.ts`
