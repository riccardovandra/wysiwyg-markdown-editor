import { Node, mergeAttributes } from '@tiptap/core';

export interface InlineCheckboxOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineCheckbox: {
      /**
       * Insert an inline checkbox
       */
      insertInlineCheckbox: (checked?: boolean) => ReturnType;
    };
  }
}

/**
 * InlineCheckbox Extension
 *
 * A TipTap inline node that renders interactive checkboxes inside table cells.
 * Unlike TaskItem (which is block-level), this works in inline contexts.
 *
 * HTML format: <span data-type="inline-checkbox" data-checked="true/false">
 * Markdown format: [ ] or [x]
 */
export const InlineCheckbox = Node.create<InlineCheckboxOptions>({
  name: 'inlineCheckbox',

  // Inline configuration - works inside table cells
  inline: true,
  group: 'inline',
  atom: true, // Treated as single unit, cannot be split

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'inline-checkbox',
      },
    };
  },

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute('data-checked') === 'true';
        },
        renderHTML: (attributes) => {
          return {
            'data-checked': attributes.checked ? 'true' : 'false',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="inline-checkbox"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'inline-checkbox',
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      // Create container span
      const container = document.createElement('span');
      container.className = 'inline-checkbox-wrapper';
      container.setAttribute('data-type', 'inline-checkbox');
      container.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false');
      container.contentEditable = 'false';

      // Create checkbox input
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = node.attrs.checked;
      checkbox.className = 'inline-checkbox-input';

      // Handle click to toggle checkbox state
      checkbox.addEventListener('change', (event) => {
        event.stopPropagation();
        event.preventDefault();

        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            editor
              .chain()
              .focus()
              .command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  checked: !node.attrs.checked,
                });
                return true;
              })
              .run();
          }
        }
      });

      // Prevent editing issues when clicking container
      container.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      container.appendChild(checkbox);

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'inlineCheckbox') {
            return false;
          }
          checkbox.checked = updatedNode.attrs.checked;
          container.setAttribute('data-checked', updatedNode.attrs.checked ? 'true' : 'false');
          return true;
        },
        destroy: () => {
          // Cleanup if needed
        },
      };
    };
  },

  addCommands() {
    return {
      insertInlineCheckbox:
        (checked = false) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { checked },
          });
        },
    };
  },
});
