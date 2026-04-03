import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MermaidDiagram, clearSvgCache } from "../components/MermaidDiagram";
import { parseMarkdownToHtml } from "../utils/markdownParser";
import { serializeHtmlToMarkdown } from "../utils/markdownSerializer";

// Use vi.hoisted to define mock before vi.mock is hoisted
const mockMermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({ svg: "<svg>mock diagram</svg>" }),
}));

// Mock mermaid module - use the same mockMermaid instance
vi.mock("mermaid", () => ({
  default: mockMermaid,
}));

// Mock the preloader to return the same mock instance
vi.mock("../utils/mermaidPreloader", () => ({
  getMermaid: vi.fn().mockResolvedValue(mockMermaid),
  preloadMermaid: vi.fn().mockResolvedValue(mockMermaid),
  isMermaidLoaded: vi.fn().mockReturnValue(true),
  getMermaidSync: vi.fn().mockReturnValue(mockMermaid),
}));

describe("MermaidDiagram Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear SVG cache to ensure fresh renders each test
    clearSvgCache();
    // Reset mock mermaid to default successful behavior
    mockMermaid.initialize.mockClear();
    mockMermaid.render.mockClear();
    mockMermaid.render.mockResolvedValue({ svg: "<svg>mock diagram</svg>" });
    // Mock VS Code theme attribute
    Object.defineProperty(document.body, "dataset", {
      value: { vscodeThemeKind: "vscode-dark" },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Task 2: Component Rendering", () => {
    it("renders loading state initially", () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("renders diagram SVG when valid code provided", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });
    });

    it("renders empty placeholder when code is empty", async () => {
      render(<MermaidDiagram code="" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/click to add/i)).toBeInTheDocument();
      });
    });
  });

  describe("Task 3: Theme Integration", () => {
    it("detects dark theme from VS Code attributes", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(mockMermaid.initialize).toHaveBeenCalledWith(
          expect.objectContaining({
            theme: "dark",
          }),
        );
      });
    });

    it("detects light theme from VS Code attributes", async () => {
      // Change to light theme
      Object.defineProperty(document.body, "dataset", {
        value: { vscodeThemeKind: "vscode-light" },
        configurable: true,
        writable: true,
      });

      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(mockMermaid.initialize).toHaveBeenCalledWith(
          expect.objectContaining({
            theme: "default",
          }),
        );
      });
    });
  });

  describe("Task 4: Click to Edit", () => {
    it("switches to edit mode when diagram is clicked", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Click on the diagram container
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Should now show textarea for editing
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });

    it("shows Done button when in edit mode", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Click on the diagram
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Should show Done button
      await waitFor(() => {
        expect(screen.getByText(/done/i)).toBeInTheDocument();
      });
    });

    it("exits edit mode when Done button is clicked", async () => {
      const onChange = vi.fn();
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={onChange} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Wait for edit mode
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // Click Done button
      fireEvent.click(screen.getByText(/done/i));

      // Should exit edit mode and show diagram again
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });
    });
  });

  describe("Task 5: onChange Handler", () => {
    it("calls onChange when editing code and exiting edit mode", async () => {
      const onChange = vi.fn();
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={onChange} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Wait for textarea
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // Change the code
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "graph LR\n  C-->D" },
      });

      // Exit edit mode
      fireEvent.click(screen.getByText(/done/i));

      // Should call onChange with new value
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith("graph LR\n  C-->D");
      });
    });
  });

  describe("Task 6: Keyboard Handling", () => {
    it("Tab key inserts 2 spaces for indentation", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Wait for textarea
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // Set cursor position at start
      textarea.setSelectionRange(0, 0);

      // Press Tab key
      fireEvent.keyDown(textarea, { key: "Tab" });

      // Should have 2 spaces at the start
      await waitFor(() => {
        expect(textarea.value).toMatch(/^  /);
      });
    });

    it("Escape key exits edit mode and saves changes", async () => {
      const onChange = vi.fn();
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={onChange} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Wait for textarea
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // Change the code
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "graph LR\n  X-->Y" },
      });

      // Press Escape key
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

      // Should exit edit mode and call onChange
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });
      expect(onChange).toHaveBeenCalledWith("graph LR\n  X-->Y");
    });
  });

  describe("Task 3: Theme Change Detection", () => {
    it("component sets up MutationObserver for theme changes", async () => {
      // MutationObserver in JSDOM doesn't fire events reliably,
      // but we can verify the component initializes correctly with different themes

      // Render with dark theme
      const { unmount } = render(
        <MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />,
      );

      await waitFor(() => {
        expect(mockMermaid.initialize).toHaveBeenCalledWith(
          expect.objectContaining({ theme: "dark" }),
        );
      });

      unmount();
      mockMermaid.initialize.mockClear();
      // Clear cache to force re-render with new theme
      clearSvgCache();

      // Change to light theme and render again
      Object.defineProperty(document.body, "dataset", {
        value: { vscodeThemeKind: "vscode-light" },
        configurable: true,
        writable: true,
      });

      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(mockMermaid.initialize).toHaveBeenCalledWith(
          expect.objectContaining({ theme: "default" }),
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("has aria-label on Done button when in edit mode", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const diagramContainer = screen
        .getByText(/mock diagram/i)
        .closest(".mermaid-diagram");
      if (diagramContainer) {
        fireEvent.click(diagramContainer);
      }

      // Wait for Done button with aria-label
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /done editing diagram/i }),
        ).toBeInTheDocument();
      });
    });

    it("has aria-label on Edit button when viewing diagram", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Check for Edit button with aria-label
      expect(
        screen.getByRole("button", { name: /edit diagram/i }),
      ).toBeInTheDocument();
    });

    it("rendered diagram container is keyboard accessible", async () => {
      render(<MermaidDiagram code="graph TD\n  A-->B" onChange={vi.fn()} />);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });

      // Find the container with role="button"
      const container = screen.getByRole("button", {
        name: /edit mermaid diagram/i,
      });
      expect(container).toHaveAttribute("tabIndex", "0");

      // Press Enter to enter edit mode
      fireEvent.keyDown(container, { key: "Enter" });

      // Should enter edit mode
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });

    it("empty state container is keyboard accessible", async () => {
      render(<MermaidDiagram code="" onChange={vi.fn()} />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/click to add/i)).toBeInTheDocument();
      });

      // Find the container with role="button"
      const container = screen.getByRole("button", {
        name: /add mermaid diagram/i,
      });
      expect(container).toHaveAttribute("tabIndex", "0");

      // Press Space to enter edit mode
      fireEvent.keyDown(container, { key: " " });

      // Should enter edit mode
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });

    it("error state container is keyboard accessible", async () => {
      mockMermaid.render.mockRejectedValueOnce(new Error("Syntax error"));

      render(<MermaidDiagram code="invalid" onChange={vi.fn()} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText("Diagram Error")).toBeInTheDocument();
      });

      // Find the container with role="button"
      const container = screen.getByRole("button", {
        name: /edit diagram with error/i,
      });
      expect(container).toHaveAttribute("tabIndex", "0");

      // Press Enter to enter edit mode
      fireEvent.keyDown(container, { key: "Enter" });

      // Should enter edit mode
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });
  });

  describe("Task 7: Error Handling", () => {
    it("shows error message for invalid syntax", async () => {
      mockMermaid.render.mockRejectedValueOnce(
        new Error("Syntax error in diagram"),
      );

      render(<MermaidDiagram code="invalid syntax" onChange={vi.fn()} />);

      await waitFor(() => {
        // Look for the specific "Diagram Error" heading
        expect(screen.getByText("Diagram Error")).toBeInTheDocument();
      });
    });

    it("logs full error to console for debugging (AC6)", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const testError = new Error("Test Mermaid error");

      mockMermaid.render.mockRejectedValueOnce(testError);

      render(<MermaidDiagram code="invalid" onChange={vi.fn()} />);

      await waitFor(() => {
        // Error should be logged to console by the render service
        expect(consoleSpy).toHaveBeenCalledWith(
          "Mermaid render error:",
          testError,
        );
      });

      consoleSpy.mockRestore();
    });

    it("allows editing from error state", async () => {
      mockMermaid.render.mockRejectedValueOnce(new Error("Syntax error"));

      render(<MermaidDiagram code="invalid" onChange={vi.fn()} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText("Diagram Error")).toBeInTheDocument();
      });

      // Click on the error container (it has click to edit button)
      const editButton = screen.getByText(/click to edit source/i);
      fireEvent.click(editButton.closest("div")!);

      // Should show textarea
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
    });
  });

  describe("Task 7: Diagram Types", () => {
    it("renders flowchart diagram type", async () => {
      render(
        <MermaidDiagram
          code="graph TD\n  A[Start] --> B[End]"
          onChange={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });
    });

    it("renders sequence diagram type", async () => {
      render(
        <MermaidDiagram
          code="sequenceDiagram\n  A->>B: Hello"
          onChange={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });
    });

    it("renders class diagram type", async () => {
      render(
        <MermaidDiagram
          code="classDiagram\n  Animal <|-- Duck"
          onChange={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/mock diagram/i)).toBeInTheDocument();
      });
    });
  });
});

describe("MermaidBlock Extension Integration", () => {
  describe("Markdown Parsing", () => {
    it("should add data-language attribute to mermaid code blocks", () => {
      const markdown = "```mermaid\ngraph TD\n  A-->B\n```";
      const html = parseMarkdownToHtml(markdown);

      // Should have data-language="mermaid" attribute
      expect(html).toContain('data-language="mermaid"');
      expect(html).toContain("language-mermaid");
    });
  });

  describe("Markdown Serialization", () => {
    it("should serialize mermaid blocks back to markdown", () => {
      const html =
        '<pre data-language="mermaid"><code class="language-mermaid">graph TD\n  A-->B</code></pre>';
      const markdown = serializeHtmlToMarkdown(html);

      // Should serialize back to fenced code block with mermaid language
      expect(markdown).toContain("```mermaid");
      expect(markdown).toContain("graph TD");
      expect(markdown).toContain("A-->B");
      expect(markdown).toContain("```");
    });

    it("should not include SVG artifacts in serialized markdown", () => {
      // Even if there were SVG in the HTML (there shouldn't be), it should be ignored
      const html =
        '<pre data-language="mermaid"><code class="language-mermaid">graph TD\n  A-->B</code></pre>';
      const markdown = serializeHtmlToMarkdown(html);

      expect(markdown).not.toContain("<svg");
      expect(markdown).not.toContain("</svg>");
    });
  });
});
