/**
 * Regex pattern for YAML frontmatter.
 * Matches content between --- delimiters at the start of the document.
 */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface ParsedDocument {
  frontmatter: string | null;
  content: string;
}

/**
 * Extracts YAML frontmatter from markdown content.
 *
 * @param markdown - Raw markdown string
 * @returns Object with separated frontmatter and content
 */
export function extractFrontmatter(markdown: string): ParsedDocument {
  const match = markdown.match(FRONTMATTER_REGEX);

  if (match) {
    return {
      frontmatter: match[1].trim(),
      content: markdown.slice(match[0].length).trim(),
    };
  }

  return {
    frontmatter: null,
    content: markdown,
  };
}

/**
 * Combines frontmatter and content back into a markdown document.
 *
 * @param frontmatter - YAML frontmatter content (without delimiters)
 * @param content - Markdown body content
 * @returns Complete markdown string
 */
export function combineFrontmatter(
  frontmatter: string | null,
  content: string
): string {
  if (!frontmatter || frontmatter.trim() === '') {
    return content;
  }

  return `---\n${frontmatter}\n---\n\n${content}`;
}
