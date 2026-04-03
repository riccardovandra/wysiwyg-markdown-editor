# Story 12.2: Paragraph Break Visibility

**Status:** ready-for-dev

## Story

As a **user**,
I want a clear visual distinction between paragraph breaks (double newlines) and line breaks within a paragraph,
So that I can see document structure at a glance.

## Acceptance Criteria

### AC1: Paragraph Gap Increase

**Given** a document with multiple paragraphs separated by double newlines
**When** rendered in the WYSIWYG editor
**Then** the gap between paragraphs is visibly larger than a single line break
**And** the gap is approximately 1em (collapsed margin)

### AC2: Line Break Distinction

**Given** a paragraph with a soft line break (Shift+Enter / `<br>`)
**When** rendered
**Then** the line break produces no extra vertical gap (just a new line)
**And** the visual difference between a line break and paragraph break is obvious

### AC3: Heading-Paragraph Spacing Maintained

**Given** a heading followed by a paragraph
**When** rendered
**Then** the spacing between heading and first paragraph is proportional
**And** the heading-paragraph gap is visually tighter than paragraph-paragraph gap

### AC4: No Cascading Side Effects

**Given** paragraphs inside list items, table cells, or task items
**When** rendered
**Then** the increased paragraph margin does not affect spacing within these elements
**And** existing override rules (`margin: 0 !important`) continue to work

### AC5: Blockquote Paragraph Spacing

**Given** multiple paragraphs inside a blockquote
**When** rendered
**Then** paragraph spacing inside blockquotes is proportional to the increased margin

## Tasks / Subtasks

- [ ] **Task 1: Increase paragraph margin in CSS**
  - [ ] Change `.prose p` margin from `0.5em` to `1em` (top and bottom)
  - [ ] With CSS margin collapsing, adjacent paragraphs get 1em gap (not 2em)

- [ ] **Task 2: Adjust heading-after-paragraph margin**
  - [ ] Update `.prose h1 + p` etc. from `0.35em` to `0.5em` for proportion

- [ ] **Task 3: Verify no cascading issues**
  - [ ] Confirm `li[data-type="taskItem"] > div > p { margin: 0 !important }` still overrides
  - [ ] Confirm `.ProseMirror td > p, .ProseMirror th > p { margin: 0 }` still overrides
  - [ ] Check blockquote paragraph spacing looks reasonable

- [ ] **Task 4: Verification**
  - [ ] Test document with multiple paragraphs (clear gap visible)
  - [ ] Test Shift+Enter line break within paragraph (no extra gap)
  - [ ] Test paragraphs in lists, tables, task items (unaffected)
  - [ ] Test paragraphs in blockquotes (proportional spacing)
  - [ ] Test with different line-height settings (tight, compact, normal, relaxed)
  - [ ] Run `npm run build` to verify no build errors

## Dev Notes

### Current CSS (index.css lines 180-186)

```css
.prose p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
```

### Target CSS

```css
.prose p {
  margin-top: 1em;
  margin-bottom: 1em;
}
```

### CSS Margin Collapsing

Adjacent block-level elements collapse their vertical margins to the larger of the two. So two paragraphs with `margin-bottom: 1em` and `margin-top: 1em` produce a 1em gap, not 2em. This is standard CSS behavior and works in our favor.

### Existing Overrides (no changes needed)

These rules already prevent the margin increase from affecting nested contexts:

- `li[data-type="taskItem"] > div > p { margin: 0 !important; }` (line 362-365)
- `.ProseMirror td > p, .ProseMirror th > p { margin: 0; }` (line 838-841)

### Files to Modify

- `src/webview/styles/index.css` - Paragraph margin values only

### Scope

This is a one-CSS-property change with high visual impact. No JavaScript changes required.

## References

- [Source: docs/sprint-artifacts/5-1-improved-padding-spacing.md]
- [Tailwind Typography defaults use 1.25em paragraph margins]
