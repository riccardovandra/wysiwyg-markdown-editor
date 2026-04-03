# Story 11.7: Go to Definition for Header Anchors

Status: Ready for Review

## Story

As a user,
I want to click on links pointing to heading anchors within the same document,
so that I can navigate to that section without scrolling manually.

## Acceptance Criteria

1. **Given** I am viewing a markdown document with a link like `[see setup](#setup)`
   **And** the document contains a heading `## Setup`
   **When** I click on the link
   **Then** the editor scrolls to bring the "Setup" heading into view

2. **Given** a link with an anchor-only href (e.g., `#installation`, `#api-reference`)
   **When** I click the link
   **Then** the anchor is converted to a slug (lowercase, hyphens for spaces)
   **And** the matching heading is found and scrolled into view

3. **Given** I click an anchor link `#some-heading`
   **And** no heading with matching ID exists
   **When** the click is processed
   **Then** nothing happens (graceful handling, no error shown)

4. **Given** I click an anchor link
   **When** the scroll completes
   **Then** the heading should be positioned near the top of the visible editor area

5. **Given** anchor link detection in the click handler (from Story 11-1)
   **When** the href starts with `#`
   **Then** handle locally in WebView (scroll to heading)
   **And** do NOT send `linkClicked` message to extension

6. **Given** headings in the document
   **When** the document renders
   **Then** each heading element has an `id` attribute generated from its text (slugified)

## Tasks / Subtasks

- [x] Task 1: Generate heading IDs from text content (AC: #2, #6)
  - [x] Create `generateHeadingId(text: string): string` utility function
  - [x] Slugify: lowercase, replace spaces with hyphens, remove special chars
  - [x] Apply IDs to headings via TipTap extension or HTML attributes
  - [x] Handle duplicate headings (append `-1`, `-2`, etc. if needed)

- [x] Task 2: Detect anchor-only links in click handler (AC: #5)
  - [x] In click handler (from Story 11-1), check if `href.startsWith('#')`
  - [x] If anchor-only: handle locally, don't send to extension
  - [x] If file link: send `linkClicked` message (Story 11-1 behavior)

- [x] Task 3: Implement scroll-to-heading logic (AC: #1, #4)
  - [x] Extract anchor from href (remove leading `#`)
  - [x] Find element with matching `id` in editor DOM
  - [x] Use `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - [x] Handle scroll within the editor container, not the whole page

- [x] Task 4: Handle missing heading gracefully (AC: #3)
  - [x] If no element with matching ID found, do nothing
  - [x] No error message or console warning needed
  - [x] User can still interact with editor normally

- [x] Task 5: Add tests (AC: #1-6)
  - [x] Unit test for `generateHeadingId` function (slugification)
  - [x] Unit test for duplicate heading ID handling
  - [x] WebView test for anchor link detection
  - [x] WebView test for scroll behavior
  - [x] Integration test with actual headings and anchor links

## Dev Notes

### Dependency on Story 11-1

This story **depends on Story 11-1** (Open Linked Files in WYSIWYG) which establishes:
- Click handler for links in the editor (DOM event delegation)
- `linkClicked` message type in `messages.types.ts`
- Extension-side handler for file links

**Implementation Order:**
1. Story 11-1 implements base click handler infrastructure
2. Story 11-7 extends click handler to detect anchor links and handle them locally

### Architecture Compliance

- **File Locations:**
  - Utility function: `src/webview/utils/generateHeadingId.ts`
  - Click handler modification: `src/webview/App.tsx` or dedicated hook
  - Tests: `src/webview/__tests__/`

- **Message Protocol:** Anchor links are handled entirely in WebView (no extension message needed)

### Heading ID Generation (Slugification)

Standard markdown anchor generation follows this pattern:
```typescript
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // spaces to hyphens
    .replace(/[^\w-]/g, '')      // remove special chars
    .replace(/--+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '');      // trim hyphens from ends
}
```

**Examples:**
| Heading Text | Generated ID |
|-------------|--------------|
| `# Setup` | `setup` |
| `## API Reference` | `api-reference` |
| `### Getting Started!` | `getting-started` |
| `## What's New?` | `whats-new` |

### TipTap Heading ID Generation

Two approaches to add IDs to headings:

**Option A (Recommended): Custom Heading Extension**
```typescript
import Heading from '@tiptap/extension-heading';

const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },
});
```

**Option B: Post-render DOM manipulation**
- After TipTap renders, query all heading elements
- Generate and set `id` attributes based on text content
- Simpler but less integrated

Recommend **Option A** for cleaner TipTap integration.

### Click Handler Pattern (extends Story 11-1)

```typescript
// In the click handler established by Story 11-1:
const handleLinkClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const anchor = target.closest('a');
  if (!anchor) return;

  event.preventDefault();
  const href = anchor.getAttribute('href');
  if (!href) return;

  // Anchor-only links: handle locally (Story 11-7)
  if (href.startsWith('#')) {
    const targetId = href.slice(1); // remove #
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  // File/external links: send to extension (Story 11-1)
  vscode.postMessage({ type: 'linkClicked', href });
};
```

### Scroll Behavior Considerations

- Use `behavior: 'smooth'` for pleasant UX
- Use `block: 'start'` to position heading at top of view
- The editor container may have its own scroll context
- May need to find the scrollable parent and scroll within it:
  ```typescript
  const editorContainer = document.querySelector('.ProseMirror')?.parentElement;
  // Scroll within the correct container
  ```

### Testing Standards

- Unit tests with Vitest for `generateHeadingId` utility
- WebView tests with Testing Library for:
  - Anchor detection logic
  - Scroll behavior (mock `scrollIntoView`)
  - Graceful handling of missing headings

### Project Structure Notes

- New utility: `src/webview/utils/generateHeadingId.ts`
- Modifies existing click handler from Story 11-1
- No new components needed
- No extension-side changes required

### Edge Cases to Handle

1. **Duplicate headings:** `## Setup` appears twice - first one wins
2. **Empty heading:** `# ` (just whitespace) - skip ID generation
3. **Non-ASCII characters:** `## Über uns` → `uber-uns` (simplified) or preserve
4. **Deep links with path:** `./other.md#section` - let Story 11-1 handle the file, this story only handles pure anchors

### References

- [Source: docs/sprint-artifacts/11-1-open-linked-files-wysiwyg.md] - Base click handler infrastructure
- [Source: docs/architecture.md#API & Communication Patterns] - Message protocol spec
- [Source: useTipTapEditor.ts:120-125] - Link extension with openOnClick: false
- [Source: messages.types.ts:8] - linkClicked message type definition

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Created `generateHeadingId` utility function with comprehensive slugification (lowercase, hyphens, special char removal)
- Created `generateUniqueHeadingId` helper for handling duplicate headings with -1, -2 suffixes
- Implemented `HeadingWithId` TipTap extension that auto-generates IDs for all headings using ProseMirror plugins
- Extended `useLinkClickHandler` hook with optional `onAnchorClick` callback for anchor-only links
- Updated `App.tsx` to handle anchor clicks with smooth scrollIntoView
- Added 33 comprehensive tests covering all acceptance criteria
- Updated contentSync test to be compatible with HeadingWithId extension

### File List

**New Files:**
- wysiwyg-markdown-editor/src/webview/utils/generateHeadingId.ts
- wysiwyg-markdown-editor/src/webview/extensions/HeadingWithId.ts
- wysiwyg-markdown-editor/src/webview/__tests__/generateHeadingId.test.ts
- wysiwyg-markdown-editor/src/webview/__tests__/HeadingWithId.test.tsx

**Modified Files:**
- wysiwyg-markdown-editor/src/webview/hooks/useLinkClickHandler.ts (added onAnchorClick support)
- wysiwyg-markdown-editor/src/webview/hooks/useTipTapEditor.ts (integrated HeadingWithId extension)
- wysiwyg-markdown-editor/src/webview/App.tsx (added handleAnchorClick handler)
- wysiwyg-markdown-editor/src/webview/__tests__/useLinkClickHandler.test.ts (added anchor link tests)
- wysiwyg-markdown-editor/src/webview/__tests__/contentSync.test.tsx (updated for HeadingWithId compatibility)

## Change Log

- 2026-01-07: Implemented Story 11-7 - Go to Definition for Header Anchors
  - Added heading ID generation with slugification
  - Added HeadingWithId TipTap extension for automatic ID assignment
  - Extended link click handler to detect and handle anchor-only links locally
  - Implemented smooth scroll to heading on anchor click
  - Added comprehensive test coverage (33 tests)
