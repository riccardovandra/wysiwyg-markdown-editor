# Change Log

All notable changes to the "wysiwyg-markdown-editor" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Comments: select text and press Comment to leave a note in the left margin. Comments are stored inline as CriticMarkup (`{==text==}{>>note<<}`), so agents can read and resolve them directly in the file. Threads, replies, and comments on code blocks are supported.
- Comment history: resolved comments are appended to `<name>.comments.md` next to the document (setting `markdownWysiwyg.commentHistory`).
- Command "Copy Agent Instructions for Comments" with a protocol for applying comments with an AI agent.
- Standalone browser harness (`src/webview/dev.html`) for developing the webview without VS Code.

### Fixed

- Wide tables and long code blocks no longer force the whole page to scroll sideways; they extend past the reading column, centered, and scroll inside their own box when wider than the window.
- Table columns can be resized by dragging header borders (cells wrap text instead of forcing a single line).
- The first edit after opening a document was not synced to the file until a second edit happened.

- Initial release