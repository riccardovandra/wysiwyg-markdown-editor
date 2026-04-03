# WYSIWYG Markdown Editor for VS Code

A beautiful, distraction-free visual editor for Markdown files. Write and edit Markdown without memorizing syntax — just like using a word processor.

> **Works with VS Code, Cursor, Windsurf, and other VS Code-based editors.**

---

## Why This Editor?

Most Markdown editors force you to choose: either write in raw syntax or use a separate preview pane. This extension gives you the best of both worlds:

- **See formatting as you type** — Bold text looks bold, headings look like headings
- **No syntax memorization** — Use the toolbar or keyboard shortcuts
- **Perfect Markdown output** — Your files remain 100% valid Markdown
- **Designed for readability** — Medium.com-inspired typography that's easy on the eyes

Perfect for README files, documentation, notes, blog posts, and any Markdown content.

---

## Features

### Rich Text Editing
- **Text formatting**: Bold, italic, strikethrough, inline code
- **Headings**: H1 through H6 with visual hierarchy
- **Lists**: Bullet points, numbered lists, nested lists
- **Task lists**: Checkboxes that sync with GitHub-flavored Markdown
- **Code blocks**: Syntax highlighting for 12+ languages
- **Tables**: Insert and edit tables with a visual interface
- **Links**: Easy link insertion with dialog
- **Blockquotes**: Visual quote styling

### Editor Experience
- **Formatting toolbar**: Quick access to all formatting options
- **Keyboard shortcuts**: Fast formatting without leaving the keyboard
- **Undo/Redo**: Full history support
- **Auto-save**: Changes sync to your Markdown file automatically
- **Dark mode**: Follows your VS Code theme
- **Frontmatter support**: Edit YAML frontmatter visually

### Customization
- Multiple accent color themes
- Adjustable text size and line spacing
- Card or full-width layout
- Show/hide toolbar
- Configurable padding

---

## Installation

### Option 1: Install from VSIX file

1. Download the `.vsix` file from this repository
2. Open VS Code (or Cursor/Windsurf)
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
4. Type "Install from VSIX" and select **Extensions: Install from VSIX...**
5. Select the downloaded `.vsix` file
6. Reload VS Code when prompted

### Option 2: Build from source

```bash
# Clone the repository
git clone <repository-url>
cd wysiwyg-markdown-editor

# Install dependencies
npm install

# Build the extension
npm run build

# Package as VSIX
npm run package
```

Then install the generated `.vsix` file using Option 1.

---

## Usage

### Opening the Editor

**Method 1: Right-click menu**
1. Right-click any `.md` file in the Explorer
2. Select **"Open in Visual Editor"**

**Method 2: Command Palette**
1. Open a Markdown file
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Visual Editor" and select **"Markdown WYSIWYG: Open in Visual Editor"**

**Method 3: Auto-open (optional)**
Enable `markdownWysiwyg.autoOpen` in settings to always open `.md` files in the visual editor.

> **Note:** This setting takes effect immediately for newly opened files.

### Switching Back to Text Editor

- Click **"Open Original"** in the editor title bar, or
- Use the command palette: **"Markdown WYSIWYG: Open Original"**

---

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Bold | `Cmd+B` | `Ctrl+B` |
| Italic | `Cmd+I` | `Ctrl+I` |
| Strikethrough | `Cmd+Shift+S` | `Ctrl+Shift+S` |
| Inline Code | `Cmd+E` | `Ctrl+E` |
| Link | `Cmd+K` | `Ctrl+K` |
| Undo | `Cmd+Z` | `Ctrl+Z` |
| Redo | `Cmd+Shift+Z` | `Ctrl+Shift+Z` |

---

## Configuration

Open VS Code Settings (`Cmd+,` or `Ctrl+,`) and search for "Markdown WYSIWYG" to customize the editor.

### Available Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `autoOpen` | `true` / `false` | `false` | Automatically open `.md` files in the visual editor |
| `hideToolbar` | `true` / `false` | `false` | Hide the formatting toolbar by default |
| `showCard` | `true` / `false` | `true` | Display document in a card with shadow and rounded corners |
| `contentPadding` | `compact` / `medium` / `spacious` | `medium` | Padding around document content |
| `textSize` | `small` / `medium` / `large` | `medium` | Base text size for content |
| `lineHeight` | `tight` / `compact` / `normal` / `relaxed` | `normal` | Line spacing for paragraphs |
| `accentTheme` | `indigo` / `blue` / `purple` / `teal` / `neutral` | `indigo` | Accent color for links and highlights |
| `disableBoldAccentColor` | `true` / `false` | `false` | Use default text color for bold instead of accent |

### Example Configuration

Add to your `settings.json`:

```json
{
  "markdownWysiwyg.autoOpen": true,
  "markdownWysiwyg.contentPadding": "spacious",
  "markdownWysiwyg.textSize": "medium",
  "markdownWysiwyg.lineHeight": "relaxed",
  "markdownWysiwyg.accentTheme": "blue"
}
```

---

## Supported Markdown Features

### Text Formatting
- **Bold** (`**text**` or `__text__`)
- *Italic* (`*text*` or `_text_`)
- ~~Strikethrough~~ (`~~text~~`)
- `Inline code` (`` `code` ``)

### Structure
- Headings (H1-H6)
- Paragraphs with proper spacing
- Horizontal rules (`---`)
- Blockquotes (`>`)

### Lists
- Unordered lists (`-`, `*`, or `+`)
- Ordered lists (`1.`, `2.`, etc.)
- Nested lists (any depth)
- Task lists (`- [ ]` and `- [x]`)

### Code Blocks
Fenced code blocks with syntax highlighting:

````markdown
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

**Supported languages**: JavaScript, TypeScript, Python, JSON, XML, HTML, CSS, Markdown, Bash/Shell, SQL, Go, Rust, Java

### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Links and Images
- Links: `[text](url)`
- Images: `![alt text](url)`

### Frontmatter
YAML frontmatter is preserved and can be edited:

```yaml
---
title: My Document
date: 2024-01-15
tags: [markdown, editor]
---
```

---

## Requirements

- **VS Code** 1.107.0 or higher (also works with Cursor, Windsurf, and other VS Code forks)
- **Node.js** 18+ (only needed if building from source)

---

## Troubleshooting

### The editor doesn't open
- Make sure you're opening a `.md` file
- Try using the command palette instead of right-click
- Check if the extension is enabled in the Extensions panel

### Formatting isn't being saved
- Wait a moment — changes sync with a slight delay to prevent excessive saves
- Try saving the file manually (`Cmd+S` / `Ctrl+S`)

### The toolbar is missing
- Check if `markdownWysiwyg.hideToolbar` is set to `true` in settings
- Click the toolbar toggle button (if visible) to show it

### Styles look different than expected
- The editor follows your VS Code theme for colors
- Try adjusting `accentTheme`, `textSize`, and `lineHeight` settings

---

## License

This is a private repository. Access is granted on a per-user basis.

---

## Support

If you encounter issues or have questions:
1. Check the Troubleshooting section above
2. Contact the repository owner with your GitHub email

---

## Acknowledgments

Built with:
- [TipTap](https://tiptap.dev/) — Headless rich text editor framework
- [React](https://react.dev/) — UI library
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Marked](https://marked.js.org/) — Markdown parsing
- [Turndown](https://github.com/mixmark-io/turndown) — HTML to Markdown conversion
