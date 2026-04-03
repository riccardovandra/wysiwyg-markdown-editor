---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/prd.md
workflowType: 'architecture'
workflowStatus: 'complete'
lastStep: 7
project_name: 'Markdown WYSIWYG'
user_name: 'Riccardo'
date: '2025-12-10'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
24 requirements across 4 categories:
- **File Operations (FR1-FR4):** Opening `.md` files in WYSIWYG view, syncing edits, saving
- **Document Rendering (FR5-FR12):** Visual rendering of headings, text formatting, lists, links, code blocks with syntax highlighting
- **Editing Capabilities (FR13-FR17):** Click-to-edit, text selection, line/paragraph creation, deletion, undo/redo
- **Toolbar & Formatting (FR18-FR24):** Persistent toolbar for bold, italic, headings, lists, links, code blocks

**Non-Functional Requirements:**
12 requirements driving architectural constraints:
- **Performance:** <500ms file open, <50ms typing latency, <100ms toolbar actions, <200ms save
- **Reliability:** Zero data loss, valid markdown output, graceful malformed markdown handling
- **Compatibility:** VS Code 1.74+, forks (Cursor, Windsurf), macOS/Windows/Linux
- **Usability:** Zero learning curve, standard keyboard shortcuts

**Scale & Complexity:**
- Primary domain: VS Code Extension (WebView-based custom editor)
- Complexity level: Low
- Estimated architectural components: 4-5 (Extension host, WebView UI, Editor framework, Markdown parser/serializer, Sync layer)

### Technical Constraints & Dependencies

- **VS Code Custom Editor API**: Dictates extension architecture pattern
- **WebView requirement**: Rich text editing not possible with native VS Code APIs
- **ProseMirror ecosystem**: TipTap or Milkdown as editor framework (PRD-specified options)
- **Remark ecosystem**: Battle-tested markdown parsing (PRD-specified)
- **Single-file bundling**: No external runtime dependencies for end users

### Cross-Cutting Concerns Identified

1. **Markdown ↔ WYSIWYG Sync Fidelity**: The core technical challenge—edits in either direction must preserve intent and formatting
2. **Performance Under Latency Constraints**: 50ms typing latency is aggressive for WebView communication
3. **Platform Consistency**: Behavior must be identical across VS Code, Cursor, Windsurf on all OSes
4. **Graceful Degradation**: Malformed or unusual markdown should render something sensible, not crash

## Starter Template Evaluation

### Primary Technology Domain

VS Code Extension (Custom Editor with WebView) based on project requirements analysis

### Starter Options Considered

1. **yo code (Yeoman Generator v1.11.15)** — Official scaffold, TypeScript + esbuild. Too basic—no Custom Editor or WebView boilerplate.

2. **vscode-react-webviews (GitHub Next)** — React-based WebView with Vite bundling. Excellent WebView patterns but panel-focused, not Custom Editor.

3. **Microsoft Custom Editor Sample** — Official CustomTextEditorProvider reference implementation. Best structural foundation for our use case.

4. **vscode-react-webview-template (Elio Struyf)** — Simpler React webview. Panel-focused, not suitable.

### Selected Approach: Hybrid Reference Implementation

**Rationale:** No single starter template covers Custom Editor + React WebView + WYSIWYG Markdown. Use Microsoft's Custom Editor Sample as structural foundation, adapt WebView patterns from GitHub Next's template, integrate TipTap for editor.

**Initialization Approach:**

```bash
# Start with official generator for scaffolding
npx --package yo --package generator-code -- yo code -t=ts --bundle=esbuild

# Then manually integrate:
# 1. CustomTextEditorProvider pattern from Microsoft sample
# 2. WebView React setup from vscode-react-webviews
# 3. TipTap markdown editor
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
TypeScript 5.x, Node.js LTS, esbuild for extension bundling

**Editor Framework:**
TipTap v3.x with @tiptap/markdown extension (MarkedJS-based bidirectional markdown support)

**Build Tooling:**
- Extension: esbuild (fast, VS Code recommended)
- WebView: Vite (fast HMR for React development)

**WebView UI:**
React 18.x (matches GitHub Next best practices, TipTap has first-class React support)

**Code Organization:**
```
src/
  extension/          # VS Code extension host code
    extension.ts      # Entry point
    editorProvider.ts # CustomTextEditorProvider
  webview/            # React app for WebView
    App.tsx           # TipTap editor integration
    index.tsx         # WebView entry
```

**Development Experience:**
- Hot reload for WebView development
- VS Code debugger integration for extension
- TypeScript strict mode

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- WebView ↔ Extension sync strategy
- Styling approach for editor UI

**Important Decisions (Shape Architecture):**
- Testing strategy
- Distribution approach

**Deferred Decisions (Post-MVP):**
- VS Code Marketplace publishing details
- E2E testing setup

### Data Architecture

Not applicable — this is a file-based extension with no persistent data store. The VS Code `TextDocument` API handles file I/O.

### Authentication & Security

Not applicable — local tool with no network communication or user authentication.

### API & Communication Patterns

**WebView ↔ Extension Communication:**

| Aspect | Decision |
|--------|----------|
| Sync Strategy | Debounced (300ms) |
| Direction | Bidirectional |
| Protocol | VS Code `postMessage` API |

**Message Flow:**
```
┌─────────────────┐                    ┌─────────────────┐
│   Extension     │                    │    WebView      │
│   (Node.js)     │                    │    (React)      │
├─────────────────┤                    ├─────────────────┤
│ TextDocument    │◄──── onDidChange ──│ TipTap Editor   │
│ .getText()      │                    │ .getMarkdown()  │
│ .edit()         │──── postMessage ──►│ .setContent()   │
└─────────────────┘     (debounced)    └─────────────────┘
```

**Rationale:** 300ms debounce balances responsiveness with performance. Prevents excessive message passing during rapid typing while maintaining near-real-time sync feel.

### Frontend Architecture

**Styling:**

| Aspect | Decision |
|--------|----------|
| Framework | Tailwind CSS v3.x |
| Typography | `@tailwindcss/typography` plugin |
| Theming | CSS custom properties mapped to VS Code theme variables |

**Rationale:** Tailwind's `prose` class provides Medium.com-style typography out of the box. CSS variables enable seamless VS Code light/dark theme integration.

**State Management:**
- TipTap editor manages its own state internally
- No external state library needed (React useState for UI state)
- Document state lives in VS Code TextDocument (source of truth)

**Component Architecture:**
- Single main `Editor` component wrapping TipTap
- `Toolbar` component for formatting controls
- `TableDialog` component for table insertion (rows/columns configuration modal)
- `LinkDialog` component for link insertion/editing (URL input modal)
- `FrontmatterEditor` component for YAML frontmatter visual editing
- Minimal component tree — simplicity over abstraction

**TipTap Extensions (beyond StarterKit):**
- `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header` for table support
- `TaskList` and `TaskItem` extensions for checkbox lists
- `CodeBlockLowlight` for syntax-highlighted code blocks
- `Link` extension with `openOnClick: false` for link management

### Infrastructure & Deployment

**Testing Strategy:**

| Layer | Tool | Scope |
|-------|------|-------|
| Extension | VS Code Extension Test Runner | Provider registration, document sync |
| WebView | Vitest + Testing Library | TipTap integration, toolbar actions |
| E2E | Deferred | Manual testing for MVP |

**Distribution:**

| Phase | Method |
|-------|--------|
| MVP | `vsce package` → manual VSIX install |
| Post-MVP | VS Code Marketplace publish |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold with yo code
2. CustomTextEditorProvider setup
3. WebView React/Vite integration
4. TipTap + Tailwind integration
5. Bidirectional sync implementation
6. Toolbar and formatting controls

**Cross-Component Dependencies:**
- Sync strategy affects both extension and WebView code
- Tailwind config must include VS Code CSS variable mappings
- TipTap markdown extension must be configured for CommonMark compatibility

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 areas where AI agents could make different choices, addressed below.

### Naming Patterns

**File Naming Conventions:**

| Element | Convention | Example |
|---------|------------|---------|
| React components | PascalCase `.tsx` | `Toolbar.tsx`, `Editor.tsx` |
| TypeScript modules | camelCase `.ts` | `editorProvider.ts`, `messageHandler.ts` |
| React hooks | `use` prefix, camelCase | `useDebounce.ts`, `useVSCodeTheme.ts` |
| Shared types | `.types.ts` suffix | `messages.types.ts` |
| Test files | `.test.ts` / `.test.tsx` | `Editor.test.tsx` |

**Variable & Function Naming:**
- camelCase for variables and functions: `getUserData`, `isLoading`
- PascalCase for components and types: `EditorProps`, `ToolbarButton`
- UPPER_SNAKE_CASE for constants: `DEBOUNCE_MS`, `MAX_FILE_SIZE`

### Structure Patterns

**Directory Organization:**
```
src/
  extension/           # VS Code extension host
    __tests__/         # Extension tests
    editorProvider.ts
    extension.ts
  webview/             # React WebView app
    __tests__/         # WebView tests
    components/        # React components
      Editor.tsx
      Toolbar.tsx
      TableDialog.tsx  # Table insertion modal
      LinkDialog.tsx   # Link editing modal
      FrontmatterEditor.tsx  # YAML frontmatter visual editor
      ErrorBoundary.tsx
    hooks/             # Custom React hooks
      useDebounce.ts
      useVSCodeApi.ts
      useTipTapEditor.ts
    utils/             # Utility functions
      markdownParser.ts  # Markdown to HTML conversion
      markdownSerializer.ts  # HTML to Markdown conversion
    App.tsx
    index.tsx
  shared/              # Code shared between extension and WebView
    messages.types.ts  # Message type definitions
    constants.ts       # Shared constants
```

### Communication Patterns

**WebView ↔ Extension Messages:**

All messages use discriminated unions with a `type` field:

```typescript
// src/shared/messages.types.ts
export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'contentChanged'; markdown: string }
  | { type: 'contentFlushed'; markdown: string }
  | { type: 'formatAction'; action: FormatAction; level?: number };

export type ExtensionMessage =
  | { type: 'init'; content: string; settings: EditorSettings }
  | { type: 'externalChange'; content: string }
  | { type: 'settingsUpdate'; settings: EditorSettings }
  | { type: 'flushContent' };

export type FormatAction = 'bold' | 'italic' | 'heading' | 'bulletList' | 'orderedList' | 'codeBlock' | 'link';

export interface EditorSettings {
  hideToolbar: boolean;
  showCard: boolean;
  contentPadding: 'compact' | 'medium' | 'spacious';
  textSize: 'small' | 'medium' | 'large';
  lineHeight: 'tight' | 'compact' | 'normal' | 'relaxed';
  accentTheme: 'indigo' | 'blue' | 'purple' | 'teal' | 'neutral';
  disableBoldAccentColor: boolean;
}
```

**Message Handling Rules:**
- No magic strings — all message types defined in shared types
- Type-safe handlers using TypeScript discriminated unions
- Unknown message types logged and ignored (forward compatibility)

### Process Patterns

**Error Handling:**

| Layer | Pattern | Example |
|-------|---------|---------|
| Extension commands | Try-catch at boundary | Catch in `resolveCustomTextEditor`, log to output channel |
| WebView root | React Error Boundary | Graceful "Something went wrong" UI |
| TipTap parsing | Fallback to plain text | Malformed markdown renders without crashing |

**Error Logging:**
- Extension: Use VS Code `OutputChannel` for debug logs
- WebView: Console.error for development, swallow in production
- User-facing: VS Code `window.showErrorMessage` for actionable errors only

**Loading States:**
- Use simple boolean `isLoading` state
- Show loading indicator during initial file parse
- No loading state for incremental edits (debounce handles UX)

### Enforcement Guidelines

**All AI Agents MUST:**
1. Use the shared message types — never inline string literals for message types
2. Follow file naming conventions exactly — PascalCase for components, camelCase for modules
3. Place new components in `src/webview/components/`
4. Place new hooks in `src/webview/hooks/`
5. Add tests alongside code in `__tests__/` directories

**Anti-Patterns to Avoid:**
- ❌ `postMessage({ type: 'content-changed' })` — wrong casing, not type-safe
- ❌ `src/components/toolbar.tsx` — wrong location and casing
- ❌ Catching errors silently without logging
- ❌ Creating new directories without updating this document

## Project Structure & Boundaries

### Complete Project Directory Structure

```
markdown-wysiwyg/
├── .vscode/
│   ├── launch.json              # Debug configurations
│   ├── tasks.json               # Build tasks
│   └── settings.json            # Workspace settings
├── .github/
│   └── workflows/
│       └── ci.yml               # CI pipeline
├── src/
│   ├── extension/               # VS Code extension host (Node.js)
│   │   ├── __tests__/
│   │   │   └── editorProvider.test.ts
│   │   ├── editorProvider.ts    # CustomTextEditorProvider
│   │   ├── extension.ts         # Entry point
│   │   └── outputChannel.ts     # Logging
│   ├── webview/                 # React WebView app
│   │   ├── __tests__/
│   │   │   ├── Editor.test.tsx
│   │   │   └── Toolbar.test.tsx
│   │   ├── components/
│   │   │   ├── Editor.tsx       # TipTap wrapper
│   │   │   ├── Toolbar.tsx      # Formatting controls
│   │   │   └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useVSCodeApi.ts
│   │   │   └── useVSCodeTheme.ts
│   │   ├── styles/
│   │   │   └── editor.css
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.html
│   └── shared/
│       ├── messages.types.ts
│       └── constants.ts
├── dist/                        # Build output
├── package.json
├── tsconfig.json
├── tsconfig.extension.json
├── tsconfig.webview.json
├── vite.config.ts
├── esbuild.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── vitest.config.ts
├── .vscodeignore
├── .gitignore
├── README.md
├── CHANGELOG.md
└── LICENSE
```

### Architectural Boundaries

**Extension ↔ WebView Boundary:**
- Extension runs in Node.js, owns TextDocument (file I/O)
- WebView runs in browser sandbox, owns TipTap editor state
- Communication via typed postMessage API only
- No direct file system access from WebView

**Build Boundaries:**
- Extension compiled separately with esbuild (CommonJS for Node)
- WebView compiled separately with Vite (ESM for browser)
- Shared types imported by both at compile time

### Requirements to Structure Mapping

| FR Category | Location | Key Files |
|-------------|----------|-----------|
| File Operations (FR1-4) | `src/extension/` | `editorProvider.ts` |
| Document Rendering (FR5-12) | `src/webview/components/` | `Editor.tsx` |
| Editing Capabilities (FR13-17) | `src/webview/components/` | `Editor.tsx` |
| Toolbar & Formatting (FR18-24) | `src/webview/components/` | `Toolbar.tsx` |
| Table Support (FR25-28) | `src/webview/components/` | `Editor.tsx`, `Toolbar.tsx`, `TableDialog.tsx` |
| Task Lists (FR29-30) | `src/webview/components/` | `Editor.tsx` (TaskList/TaskItem extensions) |
| YAML Frontmatter (FR31-32) | `src/webview/components/` | `FrontmatterEditor.tsx`, `Editor.tsx` |
| Editor Settings (FR33-38) | `src/extension/`, `src/webview/` | `editorProvider.ts`, `App.tsx` |

### Data Flow

1. File open → `resolveCustomTextEditor()` → create WebView
2. Extension reads `TextDocument.getText()` → `postMessage({ type: 'init' })`
3. WebView receives init → TipTap `.setContent(markdown)`
4. User edits → TipTap `onUpdate` → debounced `contentChanged` message
5. Extension receives message → `TextDocument.edit()` → VS Code saves

### Development Workflow

**Dev Server:**
- `npm run dev:extension` — watch + rebuild extension with esbuild
- `npm run dev:webview` — Vite dev server for WebView (HMR)
- F5 in VS Code — launch Extension Development Host

**Build:**
- `npm run build` — production build both targets
- `npm run package` — create VSIX for distribution

**Test:**
- `npm run test:extension` — VS Code extension tests
- `npm run test:webview` — Vitest for WebView

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices verified compatible. TypeScript 5.x, React 18.x, TipTap 3.x, Tailwind CSS 3.x, esbuild, and Vite work together without conflicts.

**Pattern Consistency:** Implementation patterns align with technology stack. Naming conventions, structure patterns, and communication patterns are internally consistent.

**Structure Alignment:** Project structure fully supports all architectural decisions. Extension/WebView boundary, shared types pattern, and test organization all enable the chosen architecture.

### Requirements Coverage Validation ✅

**Functional Requirements (FR1-24):** 100% coverage. All file operations, document rendering, editing capabilities, and toolbar features mapped to specific files and components.

**Non-Functional Requirements (NFR1-12):** 100% coverage. Performance (debounced sync, fast builds), reliability (error boundaries, source of truth), compatibility (VS Code API), and usability (standard shortcuts) all addressed.

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with specific versions. Technology stack fully specified with verified compatibility.

**Structure Completeness:** Complete project tree with all files, directories, and their responsibilities defined.

**Pattern Completeness:** Comprehensive patterns for naming, structure, communication, and error handling. Examples and anti-patterns provided.

### Gap Analysis Results

No critical or blocking gaps identified. Minor nice-to-have items (CI workflow details, specific theme variable mappings) can be addressed during implementation.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low complexity)
- [x] Technical constraints identified (VS Code APIs)
- [x] Cross-cutting concerns mapped (sync fidelity, performance, compatibility)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (postMessage, debounced sync)
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clean separation between extension host and WebView
- Type-safe communication via shared message types
- Proven technology stack (TipTap, React, VS Code APIs)
- Minimal complexity — simplicity over abstraction

**Areas for Future Enhancement:**
- E2E testing infrastructure (post-MVP)
- VS Code Marketplace publishing workflow
- Additional markdown features (tables, images, Mermaid)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
npx --package yo --package generator-code -- yo code -t=ts --bundle=esbuild
```
Then integrate CustomTextEditorProvider pattern and WebView React setup.
