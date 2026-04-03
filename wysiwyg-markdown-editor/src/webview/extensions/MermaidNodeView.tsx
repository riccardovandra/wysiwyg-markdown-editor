import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useCallback } from "react";
import { MermaidDiagram } from "../components/MermaidDiagram";

/**
 * MermaidNodeView
 *
 * React NodeView wrapper for the MermaidBlock TipTap extension.
 * Bridges TipTap's node system with the MermaidDiagram React component.
 */
export function MermaidNodeView({ node, getPos, editor }: NodeViewProps) {
  const code = node.textContent || "";

  // Handle code changes from the MermaidDiagram component
  const handleChange = useCallback(
    (newCode: string) => {
      if (typeof getPos === "function") {
        const pos = getPos();
        const { schema } = editor;

        editor.commands.command(({ tr }) => {
          // Create new node with updated content
          const newNode = schema.nodes.mermaidBlock.create(
            node.attrs,
            newCode ? schema.text(newCode) : null,
          );

          // Replace the current node with the new one
          tr.replaceWith(pos, pos + node.nodeSize, newNode);
          return true;
        });
      }
    },
    [getPos, editor, node.attrs, node.nodeSize],
  );

  // Handle focus to ensure proper editor interaction
  const handleFocus = useCallback(() => {
    if (typeof getPos === "function") {
      const pos = getPos();
      editor.commands.focus(pos);
    }
  }, [getPos, editor]);

  return (
    <NodeViewWrapper
      className="mermaid-node-view my-4"
      data-type="mermaidBlock"
    >
      <MermaidDiagram
        code={code}
        onChange={handleChange}
        onFocus={handleFocus}
      />
    </NodeViewWrapper>
  );
}
