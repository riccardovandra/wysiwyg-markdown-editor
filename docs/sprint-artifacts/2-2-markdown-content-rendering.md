# Story 2.2: Markdown Content Rendering

**Status:** Done

## Story

As a **user**,
I want my markdown file to render as beautiful, readable content,
So that I can read documents comfortably without seeing raw syntax.

## Acceptance Criteria

### AC1: Heading Rendering (FR5)
**Given** I open a `.md` file containing headings (H1-H6)
**When** the content loads in the editor
**Then** headings render with visually distinct sizes and weights

### AC2: Bold Text Rendering (FR6)
**Given** markdown content contains bold text (`**text**`)
**When** the content renders
**Then** bold text displays as visually bold

### AC3: Italic Text Rendering (FR7)
**Given** markdown content contains italic text (`*text*`)
**When** the content renders
**Then** italic text displays as visually italic

### AC4: Unordered List Rendering (FR8)
**Given** markdown content contains unordered lists (`- item`)
**When** the content renders
**Then** lists display with bullet points

### AC5: Ordered List Rendering (FR9)
**Given** markdown content contains ordered lists (`1. item`)
**When** the content renders
**Then** lists display with sequential numbers

### AC6: Link Rendering (FR10)
**Given** markdown content contains links (`[text](url)`)
**When** the content renders
**Then** links display as clickable, styled text

### AC7: Blockquote Rendering
**Given** markdown content contains blockquotes (`> text`)
**When** the content renders
**Then** blockquotes display with left border styling

### AC8: Horizontal Rule Rendering
**Given** markdown content contains horizontal rules (`---`)
**When** the content renders
**Then** horizontal rules display as visual dividers

### AC9: Paragraph Spacing
**Given** markdown content with multiple paragraphs
**When** the content renders
**Then** paragraphs have comfortable spacing between them

### AC10: Performance (NFR1)
**Given** a markdown file up to 10,000 lines
**When** I open it in the editor
**Then** content loads in < 500ms

### AC11: Extension Message Integration
**Given** a file is opened in the custom editor
**When** the extension sends `{ type: 'init', content: markdownString }`
**Then** the WebView receives and renders the markdown content

## Tasks / Subtasks

- [x] **Task 1: Implement markdown parsing** (AC: 1-9, 11)
  - [x] Research TipTap markdown parsing options (StarterKit vs @tiptap/pm/markdown vs remark)
  - [x] Install markdown parsing dependency if needed
  - [x] Create `src/webview/utils/markdownParser.ts` for markdown → ProseMirror conversion
  - [x] Handle all basic markdown elements (headings, bold, italic, lists, links, blockquotes, hr)

- [x] **Task 2: Handle init message from extension** (AC: 11)
  - [x] Add message listener in App.tsx for `{ type: 'init' }` messages
  - [x] Parse incoming markdown content
  - [x] Load content into TipTap editor via `editor.commands.setContent()`
  - [x] Use shared message types from `src/shared/messages.types.ts`

- [x] **Task 3: Update extension to send init message** (AC: 11)
  - [x] In `editorProvider.ts`, read `TextDocument.getText()` on open
  - [x] Send `{ type: 'init', content: markdown }` to WebView
  - [x] Handle the 'ready' message before sending init

- [x] **Task 4: Apply typography styling** (AC: 1-9)
  - [x] Ensure Tailwind Typography `prose` classes are applied
  - [x] Verify headings have distinct visual hierarchy
  - [x] Verify lists have proper bullet/number styling
  - [x] Verify blockquotes have left border
  - [x] Verify links are styled and distinguishable

- [x] **Task 5: Test with real markdown** (AC: 1-10)
  - [x] Create test markdown file with all element types
  - [x] Use project's PRD.md as real-world test case
  - [x] Verify all elements render correctly
  - [x] Measure load time for large files

- [x] **Task 6: Write unit tests** (AC: 1-11)
  - [x] Test markdown parser converts all element types
  - [x] Test init message handler loads content
  - [x] Test extension sends init on file open

## Dev Notes

### Markdown Parsing Strategy

**Option 1: TipTap's Native Parsing (Recommended)**
TipTap with StarterKit can parse HTML. Use a markdown-to-HTML converter:
```typescript
import { marked } from 'marked'; // or remark-html
const html = marked.parse(markdown);
editor.commands.setContent(html);
```

**Option 2: remark + ProseMirror**
Use remark to parse markdown, then convert AST to ProseMirror schema.
More complex but preserves markdown structure better.

**Recommendation:** Start with Option 1 (simpler), refactor to Option 2 if needed for bidirectional sync (Story 2.5).

### Message Flow

```
1. Extension: resolveCustomTextEditor() called
2. Extension: Creates WebView, waits for 'ready' message
3. WebView: Mounts, sends { type: 'ready' }
4. Extension: Receives ready, reads TextDocument.getText()
5. Extension: Sends { type: 'init', content: markdown }
6. WebView: Receives init, parses markdown, renders in TipTap
```

### Architecture Requirements

**File Locations:**
- Utils: `src/webview/utils/` (camelCase `.ts`)
- Extension changes: `src/extension/editorProvider.ts`

**Message Types (already defined in messages.types.ts):**
```typescript
type ExtensionMessage =
  | { type: 'init'; content: string }
  | { type: 'externalChange'; content: string };
```

### Dependencies to Consider

```bash
# If using marked for markdown parsing
npm install marked
npm install -D @types/marked

# Or if using remark ecosystem
npm install remark remark-html
```

### Current Codebase State

**From Story 2.1 (prerequisite):**
- TipTap editor integrated with StarterKit
- `useTipTapEditor.ts` hook available
- `Editor.tsx` component rendering

**From Story 1.4:**
- Message handler skeleton exists
- Ready message already implemented

### Tailwind Typography Classes

Already configured. Apply to editor content:
```tsx
<EditorContent
  editor={editor}
  className="prose prose-slate dark:prose-invert max-w-none"
/>
```

Prose classes automatically style:
- Headings (h1-h6) with proper sizing
- Bold/italic with proper weight/style
- Lists with bullets/numbers
- Blockquotes with left border
- Links with underline styling
- Horizontal rules as dividers

### Anti-Patterns to Avoid

- DO NOT try to render raw markdown as text
- DO NOT skip the ready message handshake
- DO NOT parse markdown on every keystroke (only on init/external change)
- DO NOT block UI while parsing large files

### Performance Considerations

- Use Web Workers for parsing large files (>5000 lines) if needed
- Debounce is for outgoing changes (Story 2.5), not init
- Consider virtualization for very large documents (post-MVP)

### References

- [Source: docs/epics.md#Story 2.2: Markdown Content Rendering]
- [Source: docs/architecture.md#Communication Patterns]
- [Source: docs/architecture.md#API & Communication Patterns]

## Dev Agent Record

### Context Reference

Story created by create-story workflow.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Implemented markdown parsing using `marked` library for markdown → HTML conversion
- Created `parseMarkdownToHtml` utility function with comprehensive test coverage (12 tests)
- Added message handler in App.tsx for `init` and `externalChange` messages from extension
- Lifted editor state to App.tsx level for proper message handling
- Updated Editor component to accept editor prop instead of creating its own
- Modified extension editorProvider.ts to send init message with document content when WebView is ready
- Verified Tailwind Typography (`@tailwindcss/typography`) properly configured with prose classes
- Performance test confirms 10,000 lines parse in <500ms (AC10 satisfied)
- All 33 webview tests and 5 extension tests pass

### File List

**New Files:**
- `wysiwyg-markdown-editor/src/webview/utils/markdownParser.ts` - Markdown to HTML parser utility
- `wysiwyg-markdown-editor/src/webview/__tests__/markdownParser.test.ts` - Parser unit tests (12 tests + performance)
- `wysiwyg-markdown-editor/test-files/comprehensive-test.md` - Manual test file with all markdown elements

**Modified Files:**
- `wysiwyg-markdown-editor/src/webview/App.tsx` - Added message listener, lifted editor hook
- `wysiwyg-markdown-editor/src/webview/components/Editor.tsx` - Accept editor prop instead of creating own
- `wysiwyg-markdown-editor/src/webview/__tests__/Editor.test.tsx` - Updated tests for new editor prop
- `wysiwyg-markdown-editor/src/extension/editorProvider.ts` - Send init message on 'ready'
- `wysiwyg-markdown-editor/package.json` - Added `marked` dependency

### Change Log

- 2025-12-11: Story created with comprehensive developer context
- 2025-12-11: Implemented all tasks - markdown parsing, init message handling, extension integration, typography styling, testing
