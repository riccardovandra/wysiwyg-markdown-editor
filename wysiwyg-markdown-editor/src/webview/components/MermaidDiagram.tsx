import { useState, useRef, useEffect, useCallback } from "react";
import { Edit2, Eye, AlertCircle } from "lucide-react";
import {
  renderMermaidSvg,
  getCachedSvg,
  clearCache,
} from "../utils/mermaidRenderService";

// Re-export for test compatibility
export const clearSvgCache = clearCache;

interface MermaidDiagramProps {
  code: string;
  onChange: (code: string) => void;
  onFocus?: () => void;
}

/**
 * MermaidDiagram component for rendering and editing Mermaid diagrams.
 *
 * Features:
 * - Uses a global render service that survives component unmount/remount cycles
 * - Supports dark/light theme detection via VS Code theme attributes
 * - Click-to-edit functionality with live preview
 * - Error handling with user-friendly messages
 */
export function MermaidDiagram({
  code,
  onChange,
  onFocus,
}: MermaidDiagramProps) {
  const cachedSvg = getCachedSvg(code || "");

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>(cachedSvg || "");
  const [isLoading, setIsLoading] = useState(!!code?.trim() && !cachedSvg);
  const [editingCode, setEditingCode] = useState(code);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current VS Code theme
  const getTheme = useCallback((): "dark" | "default" => {
    const themeKind = document.body.dataset.vscodeThemeKind;
    return themeKind === "vscode-dark" || themeKind === "vscode-high-contrast"
      ? "dark"
      : "default";
  }, []);

  // Render diagram via the global render service
  const triggerRender = useCallback(
    (codeToRender: string) => {
      if (!codeToRender.trim()) {
        setSvg("");
        setError(null);
        setIsLoading(false);
        return;
      }

      // Check cache first (synchronous)
      const cached = getCachedSvg(codeToRender);
      if (cached) {
        setSvg(cached);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      renderMermaidSvg(codeToRender, getTheme())
        .then((renderedSvg) => {
          setSvg(renderedSvg);
          setError(null);
          setIsLoading(false);
        })
        .catch((e) => {
          const errorMessage =
            e instanceof Error ? e.message : "Invalid diagram syntax";
          const cleanError = errorMessage
            .replace(/Syntax error in graph.*$/gm, "Syntax error in diagram")
            .split("\n")[0];
          setError(cleanError);
          setSvg("");
          setIsLoading(false);
        });
    },
    [getTheme],
  );

  // Debounced render for live preview during editing
  const debouncedRender = useCallback(
    (codeToRender: string) => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      renderTimeoutRef.current = setTimeout(() => {
        triggerRender(codeToRender);
      }, 500);
    },
    [triggerRender],
  );

  // Start render when code changes (not in edit mode).
  // Uses promise directly -- no subscribe/unsubscribe, no cleanup.
  // React 18 safely ignores setState on unmounted components.
  // When the component remounts, getCachedSvg (called during render) picks up the cached result.
  useEffect(() => {
    if (isEditing || !code?.trim()) {
      return;
    }

    const cached = getCachedSvg(code);
    if (cached) {
      setSvg(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    renderMermaidSvg(code, getTheme())
      .then((renderedSvg) => {
        setSvg(renderedSvg);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Invalid diagram syntax";
        const cleanError = errorMessage
          .replace(/Syntax error in graph.*$/gm, "Syntax error in diagram")
          .split("\n")[0];
        setError(cleanError);
        setSvg("");
        setIsLoading(false);
      });

    // Intentionally no cleanup. The render service caches results, and
    // React 18 safely ignores setState calls on unmounted components.
  }, [code, isEditing, getTheme]);

  // Cache sync: if this component (re)mounts after the render service already
  // cached the SVG, the useState initializer picks it up. But if we re-render
  // without remounting, state is stale. This effect polls briefly to catch that case.
  useEffect(() => {
    if (svg || !code?.trim() || isEditing || error) return;

    const interval = setInterval(() => {
      const cached = getCachedSvg(code);
      if (cached) {
        setSvg(cached);
        setIsLoading(false);
        setError(null);
        clearInterval(interval);
      }
    }, 100);

    // Stop polling after 10 seconds
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [svg, code, isEditing, error]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Update editing code when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditingCode(code);
    }
  }, [isEditing, code]);

  // Live preview when editing
  useEffect(() => {
    if (isEditing) {
      debouncedRender(editingCode);
    }
  }, [editingCode, isEditing, debouncedRender]);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-vscode-theme-kind") {
          if (!isEditing) {
            debouncedRender(code);
          } else {
            debouncedRender(editingCode);
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, [isEditing, code, editingCode, debouncedRender]);

  // Handle exiting edit mode
  const handleExitEditMode = useCallback(() => {
    if (editingCode !== code) {
      onChange(editingCode);
    }
    setIsEditing(false);
  }, [editingCode, code, onChange]);

  // Handle Enter key for new lines, Tab for indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newValue =
          editingCode.substring(0, start) + "  " + editingCode.substring(end);
        setEditingCode(newValue);
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      } else if (e.key === "Escape") {
        handleExitEditMode();
      }
    },
    [editingCode, handleExitEditMode],
  );

  // Handle keyboard activation for clickable containers (accessibility)
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onFocus?.();
        setIsEditing(true);
      }
    },
    [onFocus],
  );

  // Edit mode UI
  if (isEditing) {
    return (
      <div className="mermaid-editor border border-[var(--vscode-panel-border)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--vscode-editor-background)] border-b border-[var(--vscode-panel-border)]">
          <span className="text-xs text-[var(--vscode-descriptionForeground)]">
            Mermaid Source
          </span>
          <button
            onClick={handleExitEditMode}
            aria-label="Done editing diagram"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-foreground)]"
          >
            <Eye className="w-3 h-3" /> Done
          </button>
        </div>
        <div className="flex flex-col md:flex-row">
          {/* Code editor */}
          <div className="flex-1 min-w-0">
            <textarea
              value={editingCode}
              onChange={(e) => setEditingCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-64 p-4 font-mono text-sm bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] resize-none focus:outline-none border-none"
              style={{
                fontFamily:
                  "var(--vscode-editor-font-family, 'Menlo', 'Monaco', 'Courier New', monospace)",
              }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="Enter Mermaid diagram code..."
            />
          </div>
          {/* Live preview */}
          <div className="flex-1 min-w-0 border-t md:border-t-0 md:border-l border-[var(--vscode-panel-border)] p-4 bg-[var(--vscode-editor-background)]">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <span className="text-[var(--vscode-descriptionForeground)] text-sm">
                  Rendering...
                </span>
              </div>
            )}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertCircle className="w-5 h-5 text-[var(--vscode-errorForeground)] mb-2" />
                <span className="text-xs text-[var(--vscode-errorForeground)]">
                  {error}
                </span>
              </div>
            )}
            {svg && !isLoading && !error && (
              <div
                className="flex justify-center [&>svg]:max-w-full overflow-auto"
                // Security: SVG is rendered via dangerouslySetInnerHTML. Mermaid's
                // securityLevel: 'strict' sanitizes the output to prevent XSS.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
            {!svg && !isLoading && !error && (
              <div className="flex items-center justify-center h-full">
                <span className="text-[var(--vscode-descriptionForeground)] text-sm">
                  Preview will appear here
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--vscode-editor-background)] rounded-lg border border-[var(--vscode-panel-border)]">
        <span className="text-[var(--vscode-descriptionForeground)]">
          Loading diagram...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Edit diagram with error"
        className="p-4 border border-[var(--vscode-inputValidation-errorBorder)] bg-[var(--vscode-inputValidation-errorBackground)] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
        onClick={() => {
          onFocus?.();
          setIsEditing(true);
        }}
        onKeyDown={handleContainerKeyDown}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle
            className="w-5 h-5 text-[var(--vscode-errorForeground)]"
            aria-hidden="true"
          />
          <span className="font-medium text-[var(--vscode-errorForeground)]">
            Diagram Error
          </span>
        </div>
        <p className="text-sm text-[var(--vscode-errorForeground)] mb-2">
          {error}
        </p>
        <span className="text-xs text-[var(--vscode-textLink-foreground)] hover:underline flex items-center gap-1">
          <Edit2 className="w-3 h-3" aria-hidden="true" /> Click to edit source
        </span>
      </div>
    );
  }

  // Empty state
  if (!svg) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Add Mermaid diagram"
        className="p-8 text-center bg-[var(--vscode-editor-background)] rounded-lg cursor-pointer border-2 border-dashed border-[var(--vscode-panel-border)] hover:border-[var(--vscode-focusBorder)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)] transition-colors"
        onClick={() => {
          onFocus?.();
          setIsEditing(true);
        }}
        onKeyDown={handleContainerKeyDown}
      >
        <span className="text-[var(--vscode-descriptionForeground)]">
          Click to add Mermaid diagram
        </span>
      </div>
    );
  }

  // Rendered diagram
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Edit Mermaid diagram"
      className="mermaid-diagram relative group cursor-pointer p-4 bg-[var(--vscode-editor-background)] rounded-lg border border-[var(--vscode-panel-border)] hover:border-[var(--vscode-focusBorder)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)] transition-colors"
      onClick={() => {
        onFocus?.();
        setIsEditing(true);
      }}
      onKeyDown={handleContainerKeyDown}
      ref={containerRef}
    >
      {/* Security: SVG is rendered via dangerouslySetInnerHTML. Mermaid's
          securityLevel: 'strict' sanitizes the output to prevent XSS. */}
      <div
        className="flex justify-center [&>svg]:max-w-full overflow-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          aria-label="Edit diagram"
          className="p-1.5 rounded bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]"
        >
          <Edit2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
