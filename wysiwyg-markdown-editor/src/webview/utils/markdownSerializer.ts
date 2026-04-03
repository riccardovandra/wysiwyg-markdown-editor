import TurndownService from 'turndown';

/**
 * Turndown service instance configured for markdown serialization.
 * Configured to match common markdown conventions.
 */
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

/**
 * Custom rule for serializing tables back to GFM markdown.
 * Converts HTML tables to pipe-delimited markdown table syntax.
 */
/**
 * Helper function to serialize cell content, handling inline checkboxes.
 */
function serializeCellContent(cell: Element): string {
  let content = '';

  cell.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      content += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      // Check for inline checkbox
      if (
        element.nodeName === 'SPAN' &&
        element.getAttribute('data-type') === 'inline-checkbox'
      ) {
        const isChecked = element.getAttribute('data-checked') === 'true';
        content += isChecked ? '[x]' : '[ ]';
      } else if (element.nodeName === 'P') {
        // Handle paragraph inside cell
        content += serializeCellContent(element);
      } else {
        // For other elements, get text content
        content += element.textContent || '';
      }
    }
  });

  return content.trim().replace(/\|/g, '\\|');
}

turndownService.addRule('table', {
  filter: 'table',
  replacement: function (_content, node) {
    const table = node as HTMLTableElement;
    const rows: string[][] = [];
    let headerRow: string[] | null = null;

    // Process all rows in the table
    const allRows = table.querySelectorAll('tr');
    allRows.forEach((tr, rowIndex) => {
      const cells: string[] = [];
      const cellElements = tr.querySelectorAll('th, td');

      cellElements.forEach((cell) => {
        // Serialize cell content, handling inline checkboxes
        const text = serializeCellContent(cell);
        cells.push(text);
      });

      // First row with th elements or first row is the header
      if (rowIndex === 0 || tr.querySelector('th')) {
        if (!headerRow) {
          headerRow = cells;
        } else {
          rows.push(cells);
        }
      } else {
        rows.push(cells);
      }
    });

    // If no header was found, use the first row as header
    if (!headerRow && rows.length > 0) {
      headerRow = rows.shift()!;
    }

    if (!headerRow || headerRow.length === 0) {
      return '';
    }

    // Build the markdown table
    const columnCount = headerRow.length;

    // Header row
    const headerLine = '| ' + headerRow.join(' | ') + ' |';

    // Separator row
    const separatorLine = '| ' + Array(columnCount).fill('---').join(' | ') + ' |';

    // Data rows
    const dataLines = rows.map((row) => {
      // Pad row to match column count
      while (row.length < columnCount) {
        row.push('');
      }
      return '| ' + row.slice(0, columnCount).join(' | ') + ' |';
    });

    return '\n\n' + [headerLine, separatorLine, ...dataLines].join('\n') + '\n\n';
  },
});

// Prevent default handling of table elements
turndownService.addRule('tableCell', {
  filter: ['th', 'td'],
  replacement: function (content) {
    return content;
  },
});

turndownService.addRule('tableRow', {
  filter: 'tr',
  replacement: function (content) {
    return content;
  },
});

turndownService.addRule('tableSection', {
  filter: ['thead', 'tbody', 'tfoot'],
  replacement: function (content) {
    return content;
  },
});

/**
 * Custom rule for serializing inline checkboxes back to markdown.
 * Converts <span data-type="inline-checkbox" data-checked="true/false">
 * back to [ ] or [x] syntax.
 */
turndownService.addRule('inlineCheckbox', {
  filter: function (node) {
    return (
      node.nodeName === 'SPAN' &&
      node.getAttribute('data-type') === 'inline-checkbox'
    );
  },
  replacement: function (_content, node) {
    const element = node as HTMLElement;
    const isChecked = element.getAttribute('data-checked') === 'true';
    return isChecked ? '[x]' : '[ ]';
  },
});

/**
 * Custom rule for serializing task list items back to markdown.
 * Converts <li data-type="taskItem" data-checked="true/false"> to [ ] or [x] syntax.
 */
turndownService.addRule('taskListItem', {
  filter: function (node) {
    return (
      node.nodeName === 'LI' &&
      node.getAttribute('data-type') === 'taskItem'
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const isChecked = element.getAttribute('data-checked') === 'true';
    const checkbox = isChecked ? '[x]' : '[ ]';
    // Clean up content - remove any leading/trailing whitespace
    const cleanContent = content.trim();
    return `${checkbox} ${cleanContent}\n`;
  },
});

/**
 * Custom rule for task list containers.
 * Ensures proper formatting of the task list.
 */
turndownService.addRule('taskList', {
  filter: function (node) {
    return (
      node.nodeName === 'UL' &&
      node.getAttribute('data-type') === 'taskList'
    );
  },
  replacement: function (content) {
    // Ensure each line starts with dash for proper list formatting
    const lines = content.trim().split('\n').filter(line => line.trim());
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      // If line already starts with checkbox, add dash
      if (trimmed.startsWith('[')) {
        return `- ${trimmed}`;
      }
      return trimmed;
    });
    return '\n' + formattedLines.join('\n') + '\n';
  },
});

/**
 * Custom rule for serializing Mermaid diagram blocks back to markdown.
 * Converts <pre data-language="mermaid"><code>...</code></pre> or
 * <div data-type="mermaidBlock">...</div> back to ```mermaid code blocks.
 *
 * Must be added before the default fenced code block rule to handle
 * Mermaid blocks specially and preserve the original source code.
 */
turndownService.addRule('mermaidBlock', {
  filter: function (node) {
    // Match NodeView wrapper div
    if (
      node.nodeName === 'DIV' &&
      node.getAttribute('data-type') === 'mermaidBlock'
    ) {
      return true;
    }
    // Match pre elements with mermaid language
    if (node.nodeName === 'PRE') {
      const element = node as HTMLElement;
      const code = element.querySelector('code');
      const isMermaid =
        element.getAttribute('data-language') === 'mermaid' ||
        element.classList.contains('language-mermaid') ||
        code?.classList.contains('language-mermaid') ||
        code?.dataset.language === 'mermaid';
      return isMermaid;
    }
    return false;
  },
  replacement: function (_content, node) {
    const element = node as HTMLElement;

    // Handle NodeView wrapper - find the code inside
    if (element.getAttribute('data-type') === 'mermaidBlock') {
      // For NodeView wrapper, get the code from the pre/code inside
      const pre = element.querySelector('pre');
      const code = pre?.querySelector('code') || pre;
      const text = code?.textContent || '';
      return '\n```mermaid\n' + text + '\n```\n';
    }

    // Handle pre element directly
    const code = element.querySelector('code');
    const text = code?.textContent || element.textContent || '';
    return '\n```mermaid\n' + text + '\n```\n';
  },
});

/**
 * Converts HTML content to Markdown format.
 *
 * Uses the Turndown library to convert HTML elements back to their
 * markdown equivalents. This is the inverse of parseMarkdownToHtml.
 *
 * @param html - HTML string from TipTap editor (via editor.getHTML())
 * @returns Markdown string ready to save to file
 *
 * @example
 * ```ts
 * const html = editor.getHTML(); // '<p>Hello <strong>World</strong></p>'
 * const markdown = serializeHtmlToMarkdown(html);
 * // Returns: 'Hello **World**'
 * vscode.postMessage({ type: 'contentChanged', markdown });
 * ```
 */
export function serializeHtmlToMarkdown(html: string): string {
  if (!html || html === '<p></p>') {
    return '';
  }

  const markdown = turndownService.turndown(html);
  return markdown.trim();
}
