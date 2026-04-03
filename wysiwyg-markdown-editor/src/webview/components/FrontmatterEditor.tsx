import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FileCode, ChevronRight, ChevronDown } from "lucide-react";
import { lowlight } from "../hooks/useTipTapEditor";

/** Convert a hast node tree to an HTML string (lightweight, no external dep) */
function hastToHtml(nodes: readonly unknown[]): string {
  return nodes
    .map((node) => {
      const n = node as Record<string, unknown>;
      if (n.type === "text") return escapeHtml(n.value as string);
      if (n.type === "element") {
        const tag = n.tagName as string;
        const props = n.properties as Record<string, unknown> | undefined;
        const classes = props?.className as string[] | undefined;
        const classAttr = classes?.length
          ? ` class="${classes.join(" ")}"`
          : "";
        const children = n.children as unknown[];
        return `<${tag}${classAttr}>${hastToHtml(children)}</${tag}>`;
      }
      return "";
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface FrontmatterEditorProps {
  frontmatter: string;
  onChange: (value: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

/**
 * Collapsible YAML frontmatter editor with syntax highlighting.
 * Shows as a compact bar when collapsed, expands to reveal
 * a syntax-highlighted editing area.
 */
export function FrontmatterEditor({
  frontmatter,
  onChange,
  expanded,
  onToggleExpand,
}: FrontmatterEditorProps) {
  const [value, setValue] = useState(frontmatter);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setValue(frontmatter);
  }, [frontmatter]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  // Sync scroll position between textarea and highlight backdrop
  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (expanded && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    }
  }, [value, expanded]);

  // Generate syntax-highlighted HTML from YAML
  const highlightedHtml = useMemo(() => {
    try {
      const tree = lowlight.highlight("yaml", value);
      return hastToHtml(tree.children);
    } catch {
      // Fallback: return escaped plain text
      return escapeHtml(value);
    }
  }, [value]);

  // Count YAML properties (top-level keys)
  const propertyCount = useMemo(() => {
    const lines = value.split("\n").filter((line) => /^\S+\s*:/.test(line));
    return lines.length;
  }, [value]);

  return (
    <div className="frontmatter-container mb-4 border border-border-subtle rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 px-3 py-2 bg-dark-elevated
                   hover:bg-dark-hover text-text-secondary text-sm
                   transition-colors cursor-pointer select-none"
        type="button"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 transition-transform" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 transition-transform" />
        )}
        <FileCode className="w-4 h-4" />
        <span>Frontmatter</span>
        {!expanded && (
          <span className="text-text-muted ml-1">
            ({propertyCount} {propertyCount === 1 ? "property" : "properties"})
          </span>
        )}
      </button>

      {/* Expandable Editor with Syntax Highlighting */}
      {expanded && (
        <div className="frontmatter-editor-wrapper relative border-t border-border-subtle">
          {/* Syntax highlight backdrop */}
          <pre
            ref={preRef}
            className="frontmatter-highlight absolute inset-0 p-3 m-0 overflow-hidden
                       pointer-events-none bg-dark-surface font-mono text-sm
                       whitespace-pre-wrap break-words"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
          {/* Transparent textarea for editing */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onScroll={handleScroll}
            className="frontmatter-textarea relative w-full p-3 bg-transparent
                       text-transparent caret-text-primary font-mono text-sm
                       resize-none focus:outline-none whitespace-pre-wrap break-words"
            placeholder="title: My Document&#10;date: 2024-01-15"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
