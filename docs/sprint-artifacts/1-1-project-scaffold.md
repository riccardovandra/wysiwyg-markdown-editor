# Story 1.1: Project Scaffold & Build Configuration

**Status:** Done

## Story

As a **developer**,
I want the project restructured with WebView build configuration,
So that I have a working foundation for both extension and WebView development.

## Current State

The basic VS Code extension scaffold already exists at `wysiwyg-markdown-editor/`:
- ✅ Basic yo code scaffold complete
- ✅ package.json with extension basics
- ✅ esbuild configured for extension
- ✅ TypeScript and ESLint set up
- ✅ node_modules installed

**Remaining work:** Restructure for Architecture layout + add WebView (React/Vite/Tailwind)

## Acceptance Criteria

### AC1: Project Structure Matches Architecture
**Given** the existing scaffold
**When** I restructure it
**Then** the structure matches Architecture layout:
```
wysiwyg-markdown-editor/
├── src/
│   ├── extension/           # Move extension.ts here
│   │   ├── extension.ts
│   │   └── __tests__/
│   ├── webview/             # NEW - React app
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.html
│   └── shared/              # NEW - Shared types
│       ├── messages.types.ts
│       └── constants.ts
├── tsconfig.json            # Base
├── tsconfig.extension.json  # NEW
├── tsconfig.webview.json    # NEW
├── vite.config.ts           # NEW
├── tailwind.config.js       # NEW
└── postcss.config.js        # NEW
```

### AC2: WebView Dependencies Added
**Given** the project
**When** I check package.json
**Then** these dependencies are added:
- react, react-dom, @types/react, @types/react-dom
- @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-link
- tailwindcss, postcss, autoprefixer, @tailwindcss/typography
- lucide-react
- vite, @vitejs/plugin-react

### AC3: Dual TypeScript Configuration
**Given** the restructured project
**When** I inspect TypeScript configs
**Then**:
- `tsconfig.json` — Base config with strict mode
- `tsconfig.extension.json` — Extends base, targets Node.js/CommonJS
- `tsconfig.webview.json` — Extends base, targets ESNext/ESM for React

### AC4: Build Scripts Work
**Given** the configured project
**When** I run npm scripts
**Then**:
- `npm run dev:extension` — esbuild watch (extension)
- `npm run dev:webview` — Vite dev server (WebView)
- `npm run build` — Builds both targets
- `npm run build:extension` — Builds extension only
- `npm run build:webview` — Builds WebView only

### AC5: Vite Configured for WebView
**Given** the project
**When** Vite builds the WebView
**Then**:
- Output goes to `dist/webview/`
- React plugin configured
- Tailwind CSS processed

## Tasks / Subtasks

- [x] **Task 1: Restructure src directory** (AC: 1)
  - [x] Create `src/extension/` directory
  - [x] Move `src/extension.ts` to `src/extension/extension.ts`
  - [x] Move `src/test/` to `src/extension/__tests__/`
  - [x] Create `src/webview/` with subdirectories (components/, hooks/, styles/)
  - [x] Create `src/shared/` directory
  - [x] Update esbuild.js entry point to `src/extension/extension.ts`

- [x] **Task 2: Create shared types** (AC: 1)
  - [x] Create `src/shared/messages.types.ts` with message type definitions
  - [x] Create `src/shared/constants.ts` with shared constants

- [x] **Task 3: Add WebView dependencies** (AC: 2)
  - [x] `npm install react react-dom`
  - [x] `npm install -D @types/react @types/react-dom`
  - [x] `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link`
  - [x] `npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography`
  - [x] `npm install lucide-react`
  - [x] `npm install -D vite @vitejs/plugin-react`

- [x] **Task 4: Configure TypeScript** (AC: 3)
  - [x] Update `tsconfig.json` as base config with path aliases
  - [x] Create `tsconfig.extension.json` (CommonJS, Node target)
  - [x] Create `tsconfig.webview.json` (ESM, ESNext target, JSX)

- [x] **Task 5: Configure Vite** (AC: 4, 5)
  - [x] Create `vite.config.ts` with React plugin
  - [x] Set output directory to `dist/webview/`
  - [x] Configure base path for VS Code WebView

- [x] **Task 6: Configure Tailwind** (AC: 2)
  - [x] Create `tailwind.config.js` with content paths
  - [x] Create `postcss.config.js`
  - [x] Add @tailwindcss/typography plugin
  - [x] Create `src/webview/styles/index.css` with Tailwind directives

- [x] **Task 7: Create WebView entry files** (AC: 1)
  - [x] Create `src/webview/index.html` (template)
  - [x] Create `src/webview/index.tsx` (React entry)
  - [x] Create `src/webview/App.tsx` (placeholder component)

- [x] **Task 8: Update npm scripts** (AC: 4)
  - [x] Add `dev:webview`: vite dev
  - [x] Add `build:webview`: vite build
  - [x] Rename existing scripts to `dev:extension`, `build:extension`
  - [x] Add combined `build` script

- [x] **Task 9: Verify setup** (AC: 1-5)
  - [x] Run `npm install`
  - [x] Run `npm run build` — should complete without errors
  - [ ] Verify extension still works (F5 → Extension Host) — *User verification needed*

## Dev Notes

### Message Types (src/shared/messages.types.ts)
```typescript
export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'contentChanged'; markdown: string };

export type ExtensionMessage =
  | { type: 'init'; content: string }
  | { type: 'externalChange'; content: string };
```

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/webview/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      colors: {
        'vscode-bg': 'var(--vscode-editor-background)',
        'vscode-fg': 'var(--vscode-editor-foreground)',
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
```

### Vite Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/webview',
    rollupOptions: {
      input: 'src/webview/index.html'
    }
  }
});
```

### References

- [Source: docs/architecture.md#Project Structure & Boundaries]
- [Source: docs/architecture.md#Starter Template Evaluation]
- [Source: docs/architecture.md#Frontend Architecture]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- ✅ Restructured src/ to extension/, webview/, shared/ layout per Architecture doc
- ✅ Created shared message types (WebViewMessage, ExtensionMessage) and constants (VIEW_TYPE, SYNC_DEBOUNCE_MS)
- ✅ Installed all WebView dependencies: React 19, TipTap 3.x, Tailwind CSS 4.x, Vite 7.x, Lucide React
- ✅ Configured dual TypeScript setup with separate configs for extension (Node16) and webview (ESNext)
- ✅ Configured Vite with React plugin, outputs to dist/webview/
- ✅ Configured Tailwind CSS 4.x with @tailwindcss/postcss plugin and VS Code theme color mappings
- ✅ Created WebView entry files: index.html, index.tsx, App.tsx with placeholder UI
- ✅ Updated npm scripts: dev:extension, dev:webview, build, build:extension, build:webview
- ✅ Build verified successful: extension.js (1KB) and webview bundle (193KB)
- ⏳ F5 Extension Host verification pending user action

### File List

**New Files:**
- src/extension/extension.ts (moved from src/extension.ts)
- src/extension/__tests__/extension.test.ts (moved from src/test/)
- src/shared/messages.types.ts
- src/shared/constants.ts
- src/webview/index.html
- src/webview/index.tsx
- src/webview/App.tsx
- src/webview/styles/index.css
- tsconfig.extension.json
- tsconfig.webview.json
- vite.config.ts
- tailwind.config.js
- postcss.config.js

**Modified Files:**
- esbuild.js (updated entry point)
- tsconfig.json (converted to base config)
- package.json (added dependencies and scripts)

**Deleted Files:**
- src/extension.ts (moved to src/extension/)
- src/test/ (moved to src/extension/__tests__/)

### Change Log

- 2025-12-11: Story 1.1 implementation complete - project restructured with WebView build configuration
- 2025-12-11: Code Review - All ACs verified, no issues found specific to this story
