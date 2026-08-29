import { useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import { InlineCheckbox } from "../extensions/InlineCheckbox";
import { MermaidBlock } from "../extensions/MermaidBlock";
import { HeadingWithId } from "../extensions/HeadingWithId";
import { CommentMark } from "../extensions/CommentMark";
import { CommentAnchor } from "../extensions/CommentAnchor";
import { createLowlight } from "lowlight";

// Import specific languages for smaller bundle size (~50KB vs ~1MB for all)
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import markdown from "highlight.js/lib/languages/markdown";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import java from "highlight.js/lib/languages/java";
import yaml from "highlight.js/lib/languages/yaml";

// Create lowlight instance and register languages with aliases
const lowlight = createLowlight();

// JavaScript/TypeScript
lowlight.register("javascript", javascript);
lowlight.register("js", javascript);
lowlight.register("jsx", javascript);
lowlight.register("typescript", typescript);
lowlight.register("ts", typescript);
lowlight.register("tsx", typescript);

// Python
lowlight.register("python", python);
lowlight.register("py", python);

// Data formats
lowlight.register("json", json);

// Web technologies
lowlight.register("html", xml);
lowlight.register("xml", xml);
lowlight.register("css", css);

// Documentation
lowlight.register("markdown", markdown);
lowlight.register("md", markdown);

// Shell/Scripts
lowlight.register("bash", bash);
lowlight.register("shell", bash);
lowlight.register("sh", bash);
lowlight.register("zsh", bash);

// Database
lowlight.register("sql", sql);

// Systems languages
lowlight.register("go", go);
lowlight.register("golang", go);
lowlight.register("rust", rust);
lowlight.register("rs", rust);
lowlight.register("java", java);

// YAML (for frontmatter syntax highlighting)
lowlight.register("yaml", yaml);
lowlight.register("yml", yaml);

// Export lowlight instance for reuse (e.g., FrontmatterEditor)
export { lowlight };

interface UseTipTapEditorOptions {
  initialContent?: string;
  onUpdate?: (html: string) => void;
}

/**
 * Custom hook that initializes and manages a TipTap editor instance.
 *
 * This hook encapsulates the TipTap configuration, providing a reusable
 * and typed editor instance with StarterKit, Link, and Placeholder extensions.
 *
 * @param options - Configuration options including initialContent and onUpdate callback
 * @returns The TipTap Editor instance, or null during initialization
 *
 * @example
 * ```tsx
 * const editor = useTipTapEditor({
 *   initialContent: '<p>Hello world</p>',
 *   onUpdate: (html) => console.log('Content changed:', html)
 * });
 * ```
 */
export function useTipTapEditor(
  options: UseTipTapEditorOptions = {},
): Editor | null {
  const { initialContent, onUpdate } = options;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable StarterKit's CodeBlock, use CodeBlockLowlight instead
        heading: false, // Disable StarterKit's Heading, use HeadingWithId instead
      }),
      HeadingWithId,
      // MermaidBlock must come before CodeBlockLowlight to handle mermaid blocks first
      MermaidBlock,
      // Extend CodeBlockLowlight to skip mermaid blocks (let MermaidBlock handle them)
      CodeBlockLowlight.extend({
        parseHTML() {
          return [
            {
              tag: "pre",
              preserveWhitespace: "full",
              getAttrs: (node) => {
                if (typeof node === "string") return false;
                const code = node.querySelector("code");
                // Skip mermaid blocks - let MermaidBlock handle them
                const isMermaid =
                  code?.classList.contains("language-mermaid") ||
                  code?.dataset.language === "mermaid" ||
                  node.classList.contains("language-mermaid") ||
                  node.getAttribute("data-language") === "mermaid";
                if (isMermaid) {
                  return false; // Reject mermaid blocks
                }
                return {}; // Accept other code blocks
              },
            },
          ];
        },
      }).configure({
        lowlight,
        defaultLanguage: null, // No highlighting if no language specified (AC4)
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
      }),
      TaskItem.configure({
        nested: true, // Allow nested task lists
        HTMLAttributes: {
          class: "task-item",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      InlineCheckbox,
      CommentMark,
      CommentAnchor,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded",
        },
      }),
    ],
    content: initialContent || "",
    editable: true,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
  });

  return editor;
}
