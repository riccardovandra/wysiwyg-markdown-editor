# Story 6.3: Table Markdown Serialization

**Status:** Done

## Story

As a **user**,
I want tables to be properly saved as markdown,
So that the table format is preserved in the file.

## Acceptance Criteria

### AC1: Pipe-Delimited Format
**Given** I have a table in the editor
**When** the content is saved
**Then** the table is serialized as pipe-delimited markdown:
```markdown
| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
```

### AC2: Header Row Separator
**Given** a table with a header row
**When** serialized to markdown
**Then** a separator row with dashes follows the header

### AC3: Special Character Escaping
**Given** table cells contain pipe characters (`|`)
**When** serialized to markdown
**Then** pipe characters in content are properly escaped

### AC4: Round-Trip Preservation
**Given** a markdown file containing tables
**When** opened and saved without edits
**Then** the table structure is preserved

### AC5: Table Parsing
**Given** a markdown file with pipe-delimited tables
**When** the content loads
**Then** tables render correctly in the editor

## Tasks / Subtasks

- [x] **Task 1: Implement Table Parsing**
  - [x] Use `marked` library with GFM tables enabled
  - [x] Transform table HTML for TipTap compatibility
  - [x] Handle header vs body row detection

- [x] **Task 2: Implement Table Serialization**
  - [x] Create custom Turndown rule for tables
  - [x] Generate header separator row
  - [x] Escape special characters in cell content

- [x] **Task 3: Test Round-Trip**
  - [x] Verify tables survive open-edit-save cycle
  - [x] Test various table sizes and content

## Dev Notes

### Files Modified
- `src/webview/utils/markdownParser.ts` - Table HTML transformation
- `src/webview/utils/markdownSerializer.ts` - Custom Turndown rules

### Serialization Logic
```typescript
// Custom Turndown rule for tables
turndown.addRule('table', {
  filter: 'table',
  replacement: function(content, node) {
    // Generate pipe-delimited format
    // Add header separator row
    // Escape pipe characters
  }
});
```

### Dependencies
- `marked` - Markdown to HTML parsing with GFM
- `turndown` - HTML to Markdown serialization

## References

- [Source: docs/epics.md#Epic 6: Table Support]
- [PRD: FR25 - Render markdown tables]

## Dev Agent Record

### Completion Notes

- Tables parse correctly from markdown
- Custom Turndown rule generates proper pipe-delimited format
- Header separator row added automatically
- Special characters escaped in cell content
- Round-trip preservation verified

### Change Log

- 2025-12-29: Story documented (feature was previously implemented)
