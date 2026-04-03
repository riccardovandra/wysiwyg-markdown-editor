import { marked } from 'marked';

/**
 * Transforms GFM task list HTML to TipTap-compatible format.
 *
 * marked outputs: <li><input type="checkbox" disabled> Task text</li>
 * TipTap expects: <li data-type="taskItem" data-checked="false">Task text</li>
 */
function transformTaskListHtml(html: string): string {
  // Transform checked task items first (order matters)
  // Match: <li><input checked="" disabled="" type="checkbox"> or variations
  html = html.replace(
    /<li><input[^>]*checked[^>]*type="checkbox"[^>]*>\s*/gi,
    '<li data-type="taskItem" data-checked="true">'
  );
  html = html.replace(
    /<li><input[^>]*type="checkbox"[^>]*checked[^>]*>\s*/gi,
    '<li data-type="taskItem" data-checked="true">'
  );

  // Transform unchecked task items
  // Match: <li><input disabled="" type="checkbox"> (without checked)
  html = html.replace(
    /<li><input(?![^>]*checked)[^>]*type="checkbox"[^>]*>\s*/gi,
    '<li data-type="taskItem" data-checked="false">'
  );

  // Transform parent <ul> containing task items to task list
  html = html.replace(
    /<ul>\n(<li data-type="taskItem")/g,
    '<ul data-type="taskList">\n$1'
  );

  return html;
}

/**
 * Transforms checkbox syntax in table cells to inline checkbox HTML.
 *
 * Matches patterns like:
 * - `[ ]` -> unchecked inline checkbox
 * - `[x]` or `[X]` -> checked inline checkbox
 *
 * Only applies within table cell contexts (after parsing to HTML).
 */
/**
 * Transforms Mermaid code blocks to TipTap-compatible format.
 *
 * marked outputs: <pre><code class="language-mermaid">...</code></pre>
 * TipTap expects: <pre data-language="mermaid"><code class="language-mermaid">...</code></pre>
 *
 * This ensures the MermaidBlock extension can properly parse and render the blocks.
 */
function transformMermaidBlocks(html: string): string {
  // Add data-language attribute to pre elements containing mermaid code blocks
  // Match: <pre><code class="language-mermaid">...</code></pre>
  html = html.replace(
    /<pre><code class="language-mermaid">/gi,
    '<pre data-language="mermaid"><code class="language-mermaid">'
  );

  return html;
}

function transformTableCellCheckboxes(html: string): string {
  // Transform checkboxes inside table cells
  // We need to match content inside <td> or <th> tags that contain [ ] or [x]

  // Use a more robust approach: parse and replace within td/th content
  // Match <td>...</td> or <th>...</th> and transform checkbox patterns within

  // Transform checked checkboxes [x] or [X] in table cells
  html = html.replace(
    /(<t[dh][^>]*>)([\s\S]*?)\[x\]([\s\S]*?)(<\/t[dh]>)/gi,
    (match, openTag, before, after, closeTag) => {
      const checkbox = '<span data-type="inline-checkbox" data-checked="true" class="inline-checkbox"></span>';
      return openTag + before + checkbox + after + closeTag;
    }
  );

  // Transform unchecked checkboxes [ ] in table cells
  html = html.replace(
    /(<t[dh][^>]*>)([\s\S]*?)\[ \]([\s\S]*?)(<\/t[dh]>)/gi,
    (match, openTag, before, after, closeTag) => {
      const checkbox = '<span data-type="inline-checkbox" data-checked="false" class="inline-checkbox"></span>';
      return openTag + before + checkbox + after + closeTag;
    }
  );

  return html;
}

/**
 * Parses markdown text and converts it to HTML for TipTap consumption.
 *
 * Uses the 'marked' library to convert markdown syntax to HTML elements
 * that TipTap's StarterKit can render natively.
 *
 * @param markdown - Raw markdown string to parse
 * @returns HTML string ready for TipTap editor
 *
 * @example
 * ```ts
 * const html = parseMarkdownToHtml('# Hello **World**');
 * // Returns: '<h1>Hello <strong>World</strong></h1>'
 * editor.commands.setContent(html);
 * ```
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) {
    return '';
  }

  // Configure marked for synchronous parsing
  marked.setOptions({
    // Use synchronous parsing for simpler integration
    async: false,
    // Enable GitHub Flavored Markdown features
    gfm: true,
    // Enable line breaks on single newlines (GFM style)
    breaks: false,
  });

  // Parse markdown to HTML synchronously
  let html = marked.parse(markdown, { async: false }) as string;

  // Transform task list HTML to TipTap-compatible format
  html = transformTaskListHtml(html);

  // Transform Mermaid code blocks to TipTap-compatible format
  html = transformMermaidBlocks(html);

  // Transform checkbox syntax in table cells to inline checkboxes
  html = transformTableCellCheckboxes(html);

  return html.trim();
}
