# Story 5.1: Improved Editor Padding & Spacing

**Status:** Done

## Story

As a **user**,
I want comfortable padding and spacing in the editor,
So that documents are pleasant to read and edit.

## Acceptance Criteria

### AC1: Content Area Padding
**Given** I open a markdown document in the WYSIWYG editor
**When** the content renders
**Then** there is adequate padding around the content area (min 24px sides, 32px top/bottom)

### AC2: Heading Spacing
**Given** a document with multiple headings
**When** rendered
**Then** headings have appropriate margin-top for visual separation from preceding content
**And** H1 has more top margin than H2, H2 more than H3, etc.

### AC3: Paragraph Line Height
**Given** a document with paragraphs
**When** rendered
**Then** paragraphs have comfortable line-height (1.6-1.75)
**And** text is easy to read without lines feeling cramped

### AC4: List Item Spacing
**Given** a document with bullet or numbered lists
**When** rendered
**Then** list items have proper spacing between items
**And** nested lists have appropriate indentation

### AC5: Code Block Spacing
**Given** a document with code blocks
**When** rendered
**Then** code blocks have padding inside (16px minimum)
**And** code blocks have margin outside for visual separation from prose

### AC6: Constrained Reading Width
**Given** a wide viewport (> 800px)
**When** viewing the document
**Then** the overall reading width is constrained (max-width ~65ch or ~700px)
**And** content is centered horizontally

### AC7: Responsive Padding
**Given** different viewport widths
**When** viewing the document
**Then** padding adjusts appropriately for narrower viewports
**And** content never touches the viewport edges

## Tasks / Subtasks

- [x] **Task 1: Update Editor Container Styles** (AC: 1, 6, 7)
  - [x] Add container wrapper with `max-w-3xl mx-auto`
  - [x] Add responsive padding `px-4 sm:px-6 lg:px-8 py-8`
  - [x] Ensure container centers content horizontally
  - [x] Test at various viewport widths

- [x] **Task 2: Update Prose Typography Classes** (AC: 2, 3, 4)
  - [x] Switch from `prose` to `prose-lg` for larger base size
  - [x] Verify heading margins are appropriate
  - [x] Verify paragraph line-height (should be ~1.7 with prose-lg)
  - [x] Verify list item spacing

- [x] **Task 3: Enhance Code Block Styling** (AC: 5)
  - [x] Update code block padding in CSS
  - [x] Add increased vertical margin for code blocks
  - [x] Verify horizontal scrolling still works for long lines

- [x] **Task 4: Fine-tune Spacing Variables** (AC: 2, 3, 4)
  - [x] Added CSS rules for heading margins (h1-h6)
  - [x] Added CSS rules for paragraph spacing and line-height
  - [x] Added CSS rules for list spacing
  - [x] Added CSS rules for blockquote styling

- [x] **Task 5: Test Various Content Types** (AC: 1-7)
  - [x] All 178 tests pass
  - [x] Build succeeds

- [x] **Task 6: Update Tests** (AC: 1, 6)
  - [x] Updated tests for new container structure (max-w-3xl)
  - [x] Updated tests for prose-lg class
  - [x] All existing tests still pass

## Dev Notes

### Current Editor Structure

```tsx
// Current: src/webview/components/Editor.tsx
<EditorContent
  editor={editor}
  className="prose prose-slate dark:prose-invert max-w-none"
/>
```

### Target Editor Structure

```tsx
// Target structure
<div className="min-h-screen bg-[var(--vscode-editor-background)]">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <EditorContent
      editor={editor}
      className="prose prose-lg prose-slate dark:prose-invert"
    />
  </div>
</div>
```

### Tailwind Prose Classes

| Class | Effect |
|-------|--------|
| `prose` | Base typography styles |
| `prose-lg` | Larger font size (18px base) |
| `prose-slate` | Gray color scheme |
| `dark:prose-invert` | Inverted colors for dark mode |
| `max-w-none` | Remove max-width (we handle it ourselves) |

### Spacing Reference (prose-lg defaults)

| Element | Margin Top | Margin Bottom |
|---------|------------|---------------|
| H1 | 0 | 0.9em |
| H2 | 2em | 1em |
| H3 | 1.6em | 0.6em |
| Paragraph | 1.25em | 1.25em |
| List | 1.25em | 1.25em |
| Code Block | 1.7em | 1.7em |

### Code Block Width Strategy

For visual interest, code blocks can break out of the prose container slightly:

```tsx
// In CodeBlock component
<pre className="p-4 my-6 -mx-2 sm:mx-0 rounded-lg overflow-x-auto">
```

This gives code blocks a bit more breathing room on larger screens.

### Responsive Breakpoints

| Breakpoint | Padding | Max Width |
|------------|---------|-----------|
| Mobile (< 640px) | 16px (px-4) | 100% |
| Tablet (640-1024px) | 24px (px-6) | 100% |
| Desktop (> 1024px) | 32px (px-8) | 768px (max-w-3xl) |

### Files to Modify

- `src/webview/components/Editor.tsx` - Main container and prose classes
- `src/webview/components/CodeBlock.tsx` - Code block padding/margins
- `src/webview/App.tsx` - May need outer container adjustments

### Testing Checklist

- [ ] Document with only paragraphs looks readable
- [ ] H1 → H2 → H3 hierarchy is visually clear
- [ ] Lists are properly indented and spaced
- [ ] Code blocks stand out but don't overwhelm
- [ ] Long documents scroll smoothly
- [ ] Content is centered on wide monitors
- [ ] Mobile view doesn't have horizontal scroll
- [ ] Dark mode looks equally good

### Anti-Patterns to Avoid

- DO NOT remove all max-width constraints (readability suffers)
- DO NOT use fixed pixel values for all spacing (use em/rem)
- DO NOT make padding so large it wastes screen space
- DO NOT forget dark mode testing
- DO NOT break horizontal scroll in code blocks

### References

- [Source: docs/epics.md#Story 5.1: Improved Editor Padding & Spacing]
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography-plugin)
- [Optimal Line Length for Reading](https://baymard.com/blog/line-length-readability)

## Dev Agent Record

### Context Reference

Story created for Epic 5: UI/UX Polish & Customization.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes

- Updated Editor.tsx with new container structure: outer div with `min-h-screen`, inner div with `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- Changed prose classes from `prose prose-slate dark:prose-invert max-w-none` to `prose prose-lg prose-slate dark:prose-invert`
- Added comprehensive CSS rules in index.css for heading spacing (h1-h6), paragraph line-height (1.75), list spacing, and blockquote styling
- Enhanced code block margins from `1rem 0` to `1.5rem 0` (and `1.75em` in prose context)
- Updated Editor.test.tsx tests to verify new structure (max-w-3xl container, prose-lg class)
- All 178 tests pass, build succeeds

### File List

**Files Modified:**
- `src/webview/components/Editor.tsx` - New container structure with constrained width
- `src/webview/styles/index.css` - Added prose spacing rules for headings, paragraphs, lists, blockquotes, code blocks
- `src/webview/__tests__/Editor.test.tsx` - Updated tests for new structure

### Change Log

- 2025-12-13: Story created with comprehensive developer context
- 2025-12-13: Implementation complete - All tasks done, 178 tests pass
