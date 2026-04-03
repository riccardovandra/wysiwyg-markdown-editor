import { Node, mergeAttributes } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MermaidNodeView } from './MermaidNodeView';

export interface MermaidBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaidBlock: {
      /**
       * Insert a Mermaid diagram block
       */
      insertMermaidBlock: (code?: string) => ReturnType;
    };
  }
}

/**
 * MermaidBlock Extension
 *
 * A TipTap block node that renders Mermaid diagrams.
 * Detects code blocks with language "mermaid" and renders them as interactive diagrams.
 *
 * Features:
 * - Parses ```mermaid code blocks from markdown
 * - Renders using React NodeView for interactive editing
 * - Preserves diagram code in markdown serialization
 */
export const MermaidBlock = Node.create<MermaidBlockOptions>({
  name: 'mermaidBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,
  isolating: true,
  code: true,

  // Much higher priority than codeBlock (default 100) to handle mermaid blocks first
  priority: 200,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'mermaid-block',
      },
    };
  },

  addAttributes() {
    return {
      language: {
        default: 'mermaid',
        parseHTML: () => 'mermaid',
        renderHTML: () => ({ 'data-language': 'mermaid' }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const code = node.querySelector('code');
          const isMermaid =
            code?.classList.contains('language-mermaid') ||
            code?.dataset.language === 'mermaid' ||
            node.classList.contains('language-mermaid') ||
            node.getAttribute('data-language') === 'mermaid';
          return isMermaid ? {} : false;
        },
        getContent: (node, schema) => {
          if (typeof node === 'string') return null;
          const code = node.querySelector('code');
          const text = code?.textContent || node.textContent || '';
          if (!text) return null;
          // getContent must return a Fragment, not a Node
          return Fragment.from(schema.text(text));
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-language': 'mermaid',
      }),
      ['code', { class: 'language-mermaid' }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },

  addCommands() {
    return {
      insertMermaidBlock:
        (code = '') =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: code ? [{ type: 'text', text: code }] : [],
          });
        },
    };
  },
});
