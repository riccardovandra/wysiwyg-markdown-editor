/**
 * Generates a URL-friendly ID from heading text.
 * Follows standard markdown anchor generation patterns.
 *
 * @param text - The heading text to convert to an ID
 * @returns A slugified ID suitable for use as an HTML element ID
 *
 * @example
 * generateHeadingId('Setup') // 'setup'
 * generateHeadingId('API Reference') // 'api-reference'
 * generateHeadingId("What's New?") // 'whats-new'
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/^#+\s*/, '') // Remove leading markdown heading markers (# ## ###)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]/g, '') // Remove special characters (keep alphanumeric and hyphens)
    .replace(/--+/g, '-') // Collapse multiple consecutive hyphens
    .replace(/^-|-$/g, ''); // Trim hyphens from start and end
}

/**
 * Generates a unique heading ID, handling duplicates by appending -1, -2, etc.
 *
 * @param baseId - The base ID generated from heading text
 * @param usedIds - Set of IDs already used in the document
 * @returns A unique ID (original or with suffix)
 *
 * @example
 * const usedIds = new Set(['setup', 'setup-1']);
 * generateUniqueHeadingId('setup', usedIds) // 'setup-2'
 */
export function generateUniqueHeadingId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let counter = 1;
  let uniqueId = `${baseId}-${counter}`;
  while (usedIds.has(uniqueId)) {
    counter++;
    uniqueId = `${baseId}-${counter}`;
  }

  usedIds.add(uniqueId);
  return uniqueId;
}
