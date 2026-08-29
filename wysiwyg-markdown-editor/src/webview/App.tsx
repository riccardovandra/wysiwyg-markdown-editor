import { useEffect, useCallback, useRef, useState } from "react";
import { useVSCodeApi } from "./hooks/useVSCodeApi";
import { useTipTapEditor } from "./hooks/useTipTapEditor";
import { useDebounce } from "./hooks/useDebounce";
import { useLinkClickHandler } from "./hooks/useLinkClickHandler";
import { Editor } from "./components/Editor";
import { SourceEditor } from "./components/SourceEditor";
import { Toolbar } from "./components/Toolbar";
import { ToolbarToggleButton } from "./components/ToolbarToggleButton";
import { CommentsToggleButton } from "./components/CommentsToggleButton";
import { FrontmatterEditor } from "./components/FrontmatterEditor";
import { parseMarkdownToHtml } from "./utils/markdownParser";
import { serializeHtmlToMarkdown } from "./utils/markdownSerializer";
import {
  extractFrontmatter,
  combineFrontmatter,
} from "./utils/frontmatterParser";
import { preloadMermaid } from "./utils/mermaidPreloader";
import { renderMermaidSvg } from "./utils/mermaidRenderService";
import { SYNC_DEBOUNCE_MS } from "../shared/constants";
import type {
  ExtensionMessage,
  EditorSettings,
} from "../shared/messages.types";

// Start loading mermaid library immediately (before any components render)
// This eliminates async delays when rendering mermaid diagrams
preloadMermaid();

/**
 * Extract mermaid code blocks from markdown and pre-render them into the
 * render service cache. This must complete BEFORE setContent() so that
 * MermaidDiagram components find cached SVGs on their first render,
 * avoiding async timing issues with TipTap's NodeView lifecycle.
 */
async function preRenderMermaidBlocks(markdown: string): Promise<void> {
  const mermaidRegex = /```mermaid[ \t]*[\r\n]+([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = mermaidRegex.exec(markdown)) !== null) {
    blocks.push(match[1].trimEnd());
  }
  if (blocks.length === 0) return;

  const themeKind = document.body.dataset.vscodeThemeKind;
  const theme: "dark" | "default" =
    themeKind === "vscode-dark" || themeKind === "vscode-high-contrast"
      ? "dark"
      : "default";

  await Promise.all(
    blocks.map((code) => renderMermaidSvg(code, theme).catch(() => {})),
  );
}

export default function App() {
  const vscode = useVSCodeApi();
  const [isToolbarHidden, setIsToolbarHidden] = useState(true);
  const [showCard, setShowCard] = useState(true);
  const [contentPadding, setContentPadding] =
    useState<EditorSettings["contentPadding"]>("medium");
  const [textSize, setTextSize] =
    useState<EditorSettings["textSize"]>("medium");
  const [lineHeight, setLineHeight] =
    useState<EditorSettings["lineHeight"]>("normal");
  const [accentTheme, setAccentTheme] =
    useState<EditorSettings["accentTheme"]>("indigo");
  const [disableBoldAccentColor, setDisableBoldAccentColor] = useState(false);
  // Extension-controlled font settings
  const [fontFamily, setFontFamily] = useState<string>(
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  );
  const [fontSizePx, setFontSizePx] = useState<number | undefined>(undefined);
  const [lineHeightMultiplier, setLineHeightMultiplier] = useState<
    number | undefined
  >(undefined);
  // Comments are hidden by default; adding one turns them on.
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [frontmatter, setFrontmatter] = useState<string | null>(null);
  const [frontmatterExpanded, setFrontmatterExpanded] = useState(false);
  const frontmatterRef = useRef<string | null>(null);
  // View mode: visual (TipTap WYSIWYG) or source (raw markdown)
  const [viewMode, setViewMode] = useState<"visual" | "source">("visual");
  // Holds markdown content when in source mode
  const [sourceContent, setSourceContent] = useState("");
  // Document base URI for rewriting relative image paths (Story 13.1).
  // The extension pre-resolves `vscode.Uri.joinPath(document.uri, '..')`
  // through `webview.asWebviewUri()` and forwards it on init/externalChange.
  const documentBaseUriRef = useRef<string>("");

  // Toggle handler for toolbar visibility
  const handleToggleToolbar = useCallback(() => {
    setIsToolbarHidden((prev) => !prev);
  }, []);

  // Toggle handler for comment visibility
  const handleToggleComments = useCallback(() => {
    setShowComments((prev) => !prev);
  }, []);

  // Adding a comment always reveals comments
  const handleCommentAdded = useCallback(() => {
    setShowComments(true);
  }, []);

  // Toggle handler for frontmatter expanded/collapsed
  const handleToggleFrontmatter = useCallback(() => {
    setFrontmatterExpanded((prev) => !prev);
  }, []);

  // Apply all settings from extension
  const applySettings = useCallback((settings: EditorSettings) => {
    if (settings.hideToolbar !== undefined) {
      setIsToolbarHidden(settings.hideToolbar);
    }
    if (settings.showCard !== undefined) {
      setShowCard(settings.showCard);
    }
    if (settings.showComments !== undefined) {
      setShowComments(settings.showComments);
    }
    if (settings.contentPadding !== undefined) {
      setContentPadding(settings.contentPadding);
    }
    if (settings.textSize !== undefined) {
      setTextSize(settings.textSize);
    }
    if (settings.lineHeight !== undefined) {
      setLineHeight(settings.lineHeight);
    }
    if (settings.accentTheme !== undefined) {
      setAccentTheme(settings.accentTheme);
    }
    if (settings.disableBoldAccentColor !== undefined) {
      setDisableBoldAccentColor(settings.disableBoldAccentColor);
    }
    if (settings.fontFamily !== undefined) {
      setFontFamily(settings.fontFamily);
    }
    if (settings.fontSize !== undefined) {
      setFontSizePx(settings.fontSize);
    }
    if (settings.lineHeightMultiplier !== undefined) {
      setLineHeightMultiplier(settings.lineHeightMultiplier);
    }
  }, []);

  // Send content changes to extension (debounced)
  const sendContentToExtension = useCallback(
    (markdown: string) => {
      vscode.postMessage({ type: "contentChanged", markdown });
    },
    [vscode],
  );

  const debouncedSendContent = useDebounce(
    sendContentToExtension,
    SYNC_DEBOUNCE_MS,
  );

  // Handle editor content updates
  const handleEditorUpdate = useCallback(
    (html: string) => {
      const bodyMarkdown = serializeHtmlToMarkdown(
        html,
        documentBaseUriRef.current,
      );
      const fullMarkdown = combineFrontmatter(
        frontmatterRef.current,
        bodyMarkdown,
      );
      debouncedSendContent(fullMarkdown);
    },
    [debouncedSendContent],
  );

  const editor = useTipTapEditor({ onUpdate: handleEditorUpdate });

  // Handle link clicks - send to extension for navigation
  const handleLinkClick = useCallback(
    (href: string) => {
      vscode.postMessage({ type: "linkClicked", href });
    },
    [vscode],
  );

  // Handle anchor clicks - scroll to heading within the document (Story 11-7)
  const handleAnchorClick = useCallback((anchorId: string) => {
    if (!anchorId) return; // Empty anchor, do nothing

    // Find the element with matching ID in the editor
    const targetElement = document.getElementById(anchorId);
    if (targetElement) {
      // Scroll the heading into view with smooth animation
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // If element not found, do nothing (graceful handling per AC#3)
  }, []);

  // Set up link click handler for the editor
  useLinkClickHandler({
    editor,
    onLinkClick: handleLinkClick,
    onAnchorClick: handleAnchorClick,
  });

  // Toggle handler for view mode (visual/source)
  const handleToggleViewMode = useCallback(() => {
    if (viewMode === "visual") {
      // Switching TO source: serialize current TipTap content to markdown
      if (editor) {
        const html = editor.getHTML();
        const bodyMarkdown = serializeHtmlToMarkdown(
          html,
          documentBaseUriRef.current,
        );
        const fullMarkdown = combineFrontmatter(
          frontmatterRef.current,
          bodyMarkdown,
        );
        setSourceContent(fullMarkdown);
      }
      setViewMode("source");
    } else {
      // Switching FROM source: parse markdown and update TipTap
      const { frontmatter: fm, content } = extractFrontmatter(sourceContent);
      setFrontmatter(fm);
      frontmatterRef.current = fm;
      if (editor) {
        const html = parseMarkdownToHtml(content, documentBaseUriRef.current);
        editor.commands.setContent(html, { emitUpdate: false });
      }
      setViewMode("visual");
    }
  }, [viewMode, editor, sourceContent]);

  useEffect(() => {
    // Signal to the extension that the WebView is ready
    vscode.postMessage({ type: "ready" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle messages from the extension
  useEffect(() => {
    const handleMessage = async (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "init": {
          // Capture document base URI BEFORE any parse so relative image
          // paths can be rewritten to webview-safe URIs (Story 13.1).
          documentBaseUriRef.current = message.documentBaseUri || "";

          if (editor) {
            const { frontmatter: fm, content } = extractFrontmatter(
              message.content,
            );
            setFrontmatter(fm);
            frontmatterRef.current = fm;

            // Pre-render mermaid blocks into cache BEFORE setContent.
            // This ensures MermaidDiagram components find cached SVGs on their
            // first render, avoiding async timing issues with TipTap's NodeView lifecycle.
            const html = parseMarkdownToHtml(
              content,
              documentBaseUriRef.current,
            );
            const hasMermaid = html.includes("mermaid");

            if (hasMermaid) {
              // Pre-render mermaid SVGs into cache, then set content twice:
              // 1st setContent creates the editor structure
              // 2nd setContent (after a tick) forces fresh NodeViews that
              // find cached SVGs immediately on their first render.
              // This is necessary because TipTap's ReactNodeViewRenderer
              // destroys React components during the initial setContent processing.
              await preRenderMermaidBlocks(content);
              editor.commands.setContent(html, { emitUpdate: false });
              requestAnimationFrame(() => {
                editor.commands.setContent(html, { emitUpdate: false });
              });
            } else {
              editor.commands.setContent(html, { emitUpdate: false });
            }
          }
          // Apply initial settings
          if (message.settings) {
            applySettings(message.settings);
          }
          break;
        }
        case "externalChange": {
          // Refresh base URI - it should be stable, but external changes
          // are the canonical re-sync moment so trust the latest value.
          documentBaseUriRef.current = message.documentBaseUri || "";

          if (editor) {
            const { frontmatter: fm, content } = extractFrontmatter(
              message.content,
            );
            setFrontmatter(fm);
            frontmatterRef.current = fm;
            const html = parseMarkdownToHtml(
              content,
              documentBaseUriRef.current,
            );
            const hasMermaid = html.includes("mermaid");

            if (hasMermaid) {
              await preRenderMermaidBlocks(content);
              editor.commands.setContent(html, { emitUpdate: false });
              requestAnimationFrame(() => {
                editor.commands.setContent(html, { emitUpdate: false });
              });
            } else {
              editor.commands.setContent(html, { emitUpdate: false });
            }
          }
          break;
        }
        case "flushContent": {
          // Immediately sync content (bypass debounce) before save
          if (editor) {
            const html = editor.getHTML();
            const bodyMarkdown = serializeHtmlToMarkdown(
              html,
              documentBaseUriRef.current,
            );
            const fullMarkdown = combineFrontmatter(
              frontmatterRef.current,
              bodyMarkdown,
            );
            vscode.postMessage({
              type: "contentChanged",
              markdown: fullMarkdown,
            });
          }
          // Confirm flush complete
          vscode.postMessage({ type: "contentFlushed" });
          break;
        }
        case "settingsUpdate": {
          // Apply live settings changes
          applySettings(message.settings);
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editor, applySettings]);

  // Apply accent theme to document body for CSS variable scoping
  useEffect(() => {
    document.body.setAttribute("data-accent-theme", accentTheme || "indigo");
  }, [accentTheme]);

  // Apply bold accent color setting
  useEffect(() => {
    document.body.setAttribute(
      "data-disable-bold-accent",
      String(disableBoldAccentColor),
    );
  }, [disableBoldAccentColor]);

  // Apply font family as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--prose-font-family",
      fontFamily,
    );
  }, [fontFamily]);

  // Apply text size as CSS variable (fontSize takes priority over textSize enum)
  useEffect(() => {
    if (fontSizePx !== undefined) {
      // Numeric fontSize setting takes priority - apply in pixels
      document.documentElement.style.setProperty(
        "--prose-font-size",
        `${fontSizePx}px`,
      );
    } else {
      // Fall back to enum-based textSize
      const textSizeMap = {
        small: "0.85rem",
        medium: "0.95rem",
        large: "1rem",
      };
      document.documentElement.style.setProperty(
        "--prose-font-size",
        textSizeMap[textSize || "medium"],
      );
    }
  }, [textSize, fontSizePx]);

  // Apply line height as CSS variable (lineHeightMultiplier takes priority over lineHeight enum)
  useEffect(() => {
    if (lineHeightMultiplier !== undefined) {
      // Numeric lineHeightMultiplier takes priority
      document.documentElement.style.setProperty(
        "--prose-line-height",
        String(lineHeightMultiplier),
      );
    } else {
      // Fall back to enum-based lineHeight
      const lineHeightMap = {
        tight: "1",
        compact: "1.5",
        normal: "1.75",
        relaxed: "2",
      };
      document.documentElement.style.setProperty(
        "--prose-line-height",
        lineHeightMap[lineHeight || "normal"],
      );
    }
  }, [lineHeight, lineHeightMultiplier]);

  // Keyboard shortcut for view mode toggle (Cmd/Ctrl+Shift+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + V
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "V") {
        e.preventDefault();
        handleToggleViewMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleViewMode]);

  // Handle frontmatter changes from the editor
  const handleFrontmatterChange = useCallback(
    (newFrontmatter: string) => {
      setFrontmatter(newFrontmatter);
      frontmatterRef.current = newFrontmatter;
      // Trigger content sync with updated frontmatter
      if (editor) {
        const html = editor.getHTML();
        const bodyMarkdown = serializeHtmlToMarkdown(
          html,
          documentBaseUriRef.current,
        );
        const fullMarkdown = combineFrontmatter(newFrontmatter, bodyMarkdown);
        debouncedSendContent(fullMarkdown);
      }
    },
    [editor, debouncedSendContent],
  );

  // Handle source content changes in source view mode
  const handleSourceContentChange = useCallback(
    (newContent: string) => {
      setSourceContent(newContent);
      // Extract frontmatter and update ref
      const { frontmatter: fm } = extractFrontmatter(newContent);
      frontmatterRef.current = fm;
      setFrontmatter(fm);
      // Debounced sync to extension
      debouncedSendContent(newContent);
    },
    [debouncedSendContent],
  );

  return (
    <div className="flex flex-col h-screen bg-dark-base text-text-primary">
      {/* Fixed toolbar at top with integrated hide button */}
      {!isToolbarHidden && (
        <Toolbar
          editor={editor}
          onHide={handleToggleToolbar}
          hasFrontmatter={frontmatter !== null}
          showFrontmatter={frontmatterExpanded}
          onToggleFrontmatter={handleToggleFrontmatter}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
          showComments={showComments}
          commentCount={commentCount}
          onToggleComments={handleToggleComments}
        />
      )}

      {/* Show toolbar button (and comments toggle) when the toolbar is hidden */}
      {isToolbarHidden && (
        <>
          <ToolbarToggleButton onToggle={handleToggleToolbar} />
          <CommentsToggleButton
            active={showComments}
            count={commentCount}
            onToggle={handleToggleComments}
          />
        </>
      )}

      {/* Dark background area with document card */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        {/* Frontmatter editor - always visible when frontmatter exists */}
        {frontmatter !== null && viewMode === "visual" && (
          <div className="max-w-4xl mx-auto">
            <FrontmatterEditor
              frontmatter={frontmatter}
              onChange={handleFrontmatterChange}
              expanded={frontmatterExpanded}
              onToggleExpand={handleToggleFrontmatter}
            />
          </div>
        )}

        {/* Conditionally render visual or source editor */}
        {viewMode === "visual" ? (
          <Editor
            editor={editor}
            showCard={showCard}
            contentPadding={contentPadding}
            showComments={showComments}
            onCommentAdded={handleCommentAdded}
            onCommentCountChange={setCommentCount}
          />
        ) : (
          <SourceEditor
            content={sourceContent}
            onChange={handleSourceContentChange}
            showCard={showCard}
            contentPadding={contentPadding}
          />
        )}
      </div>
    </div>
  );
}
