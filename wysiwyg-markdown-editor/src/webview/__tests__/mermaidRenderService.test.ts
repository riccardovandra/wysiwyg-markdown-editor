import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderMermaidSvg,
  subscribe,
  getCachedSvg,
  clearCache,
  hashCode,
} from "../utils/mermaidRenderService";

// Use vi.hoisted to define mock before vi.mock is hoisted
const mockMermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({ svg: "<svg>test diagram</svg>" }),
}));

// Mock the preloader
vi.mock("../utils/mermaidPreloader", () => ({
  getMermaid: vi.fn().mockResolvedValue(mockMermaid),
}));

describe("mermaidRenderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    mockMermaid.render.mockResolvedValue({ svg: "<svg>test diagram</svg>" });
  });

  describe("hashCode", () => {
    it("returns consistent hash for same input", () => {
      expect(hashCode("graph TD")).toBe(hashCode("graph TD"));
    });

    it("returns different hash for different input", () => {
      expect(hashCode("graph TD")).not.toBe(hashCode("graph LR"));
    });
  });

  describe("renderMermaidSvg", () => {
    it("renders and caches SVG", async () => {
      const svg = await renderMermaidSvg("graph TD\n  A-->B", "dark");

      expect(svg).toBe("<svg>test diagram</svg>");
      expect(mockMermaid.render).toHaveBeenCalledTimes(1);
      expect(getCachedSvg("graph TD\n  A-->B")).toBe("<svg>test diagram</svg>");
    });

    it("returns cached SVG without re-rendering", async () => {
      // First render
      await renderMermaidSvg("graph TD\n  A-->B", "dark");
      expect(mockMermaid.render).toHaveBeenCalledTimes(1);

      // Second render should use cache
      const svg = await renderMermaidSvg("graph TD\n  A-->B", "dark");
      expect(svg).toBe("<svg>test diagram</svg>");
      expect(mockMermaid.render).toHaveBeenCalledTimes(1);
    });

    it("deduplicates concurrent renders for same code", async () => {
      // Start two renders simultaneously
      const promise1 = renderMermaidSvg("graph TD\n  A-->B", "dark");
      const promise2 = renderMermaidSvg("graph TD\n  A-->B", "dark");

      const [svg1, svg2] = await Promise.all([promise1, promise2]);

      expect(svg1).toBe("<svg>test diagram</svg>");
      expect(svg2).toBe("<svg>test diagram</svg>");
      // Only one actual render call
      expect(mockMermaid.render).toHaveBeenCalledTimes(1);
    });

    it("renders different codes independently", async () => {
      mockMermaid.render
        .mockResolvedValueOnce({ svg: "<svg>diagram A</svg>" })
        .mockResolvedValueOnce({ svg: "<svg>diagram B</svg>" });

      const [svgA, svgB] = await Promise.all([
        renderMermaidSvg("graph TD\n  A-->B", "dark"),
        renderMermaidSvg("graph LR\n  C-->D", "dark"),
      ]);

      expect(svgA).toBe("<svg>diagram A</svg>");
      expect(svgB).toBe("<svg>diagram B</svg>");
      expect(mockMermaid.render).toHaveBeenCalledTimes(2);
    });

    it("initializes mermaid with correct theme", async () => {
      await renderMermaidSvg("graph TD", "dark");
      expect(mockMermaid.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "dark" }),
      );

      clearCache();
      await renderMermaidSvg("graph TD", "default");
      expect(mockMermaid.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "default" }),
      );
    });

    it("rejects on mermaid syntax error without caching", async () => {
      const syntaxError = new Error("Syntax error");
      mockMermaid.render.mockRejectedValueOnce(syntaxError);

      await expect(renderMermaidSvg("invalid", "dark")).rejects.toThrow(
        "Syntax error",
      );
      expect(getCachedSvg("invalid")).toBeNull();
    });

    it("allows retry after error", async () => {
      mockMermaid.render.mockRejectedValueOnce(new Error("Syntax error"));
      await expect(renderMermaidSvg("code", "dark")).rejects.toThrow();

      // Retry should work
      mockMermaid.render.mockResolvedValueOnce({ svg: "<svg>fixed</svg>" });
      const svg = await renderMermaidSvg("code", "dark");
      expect(svg).toBe("<svg>fixed</svg>");
    });
  });

  describe("subscribe", () => {
    it("fires callback immediately if SVG is cached", async () => {
      // Pre-populate cache
      await renderMermaidSvg("graph TD", "dark");

      const callback = vi.fn();
      subscribe(hashCode("graph TD"), callback);

      expect(callback).toHaveBeenCalledWith("<svg>test diagram</svg>");
    });

    it("fires callback when render completes", async () => {
      const callback = vi.fn();
      const codeHash = hashCode("graph TD");

      subscribe(codeHash, callback);

      // Render hasn't started yet, so callback shouldn't have fired
      expect(callback).not.toHaveBeenCalled();

      // Start render
      await renderMermaidSvg("graph TD", "dark");

      expect(callback).toHaveBeenCalledWith("<svg>test diagram</svg>");
    });

    it("fires error callback on render failure", async () => {
      const onSvg = vi.fn();
      const onError = vi.fn();
      const codeHash = hashCode("invalid");

      subscribe(codeHash, onSvg, onError);

      mockMermaid.render.mockRejectedValueOnce(new Error("Bad syntax"));
      await renderMermaidSvg("invalid", "dark").catch(() => {});

      expect(onSvg).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("unsubscribe prevents callback from firing", async () => {
      const callback = vi.fn();
      const codeHash = hashCode("graph TD");

      const unsubscribe = subscribe(codeHash, callback);
      unsubscribe();

      await renderMermaidSvg("graph TD", "dark");

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("getCachedSvg", () => {
    it("returns null for uncached code", () => {
      expect(getCachedSvg("unknown")).toBeNull();
    });

    it("returns cached SVG after render", async () => {
      await renderMermaidSvg("graph TD", "dark");
      expect(getCachedSvg("graph TD")).toBe("<svg>test diagram</svg>");
    });
  });

  describe("clearCache", () => {
    it("clears all cached SVGs", async () => {
      await renderMermaidSvg("graph TD", "dark");
      expect(getCachedSvg("graph TD")).not.toBeNull();

      clearCache();
      expect(getCachedSvg("graph TD")).toBeNull();
    });
  });
});
