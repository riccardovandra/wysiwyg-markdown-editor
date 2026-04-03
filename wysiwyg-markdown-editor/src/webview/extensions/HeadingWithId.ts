import Heading from '@tiptap/extension-heading';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { generateHeadingId, generateUniqueHeadingId } from '../utils/generateHeadingId';

/**
 * Extended Heading extension that automatically generates unique IDs for headings.
 * IDs are slugified from heading text content and made unique with -1, -2 suffixes.
 */
export const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() || [];

    return [
      ...parentPlugins,
      new Plugin({
        key: new PluginKey('headingIds'),
        appendTransaction: (transactions, _oldState, newState) => {
          // Only process if document content changed
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          const { tr } = newState;
          let modified = false;
          const usedIds = new Set<string>();

          // First pass: collect all existing IDs to track uniqueness
          newState.doc.descendants((node) => {
            if (node.type.name === 'heading') {
              const existingId = node.attrs.id;
              if (existingId) {
                usedIds.add(existingId);
              }
            }
          });

          // Reset for second pass - regenerate all IDs for consistency
          usedIds.clear();

          // Second pass: generate/update IDs for all headings
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
              const textContent = node.textContent.trim();

              // Skip empty headings
              if (!textContent) {
                if (node.attrs.id !== null) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    id: null,
                  });
                  modified = true;
                }
                return;
              }

              const baseId = generateHeadingId(textContent);
              const uniqueId = generateUniqueHeadingId(baseId, usedIds);

              // Only update if ID changed
              if (node.attrs.id !== uniqueId) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  id: uniqueId,
                });
                modified = true;
              } else {
                // Still track the existing ID
                usedIds.add(uniqueId);
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
