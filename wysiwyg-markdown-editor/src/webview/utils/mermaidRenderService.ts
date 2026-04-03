import { getMermaid } from "./mermaidPreloader";

// Simple hash function for cache keys
export function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
}

type SvgCallback = (svg: string) => void;
type ErrorCallback = (error: Error) => void;

interface Subscriber {
  onSvg: SvgCallback;
  onError?: ErrorCallback;
}

// Cache: code hash -> rendered SVG
const svgCache = new Map<string, string>();

// In-flight renders: code hash -> promise (deduplicates concurrent requests)
const pendingRenders = new Map<string, Promise<string>>();

// Subscribers waiting for render completion
const subscribers = new Map<string, Set<Subscriber>>();

function notifySubscribers(codeHash: string, svg: string): void {
  const subs = subscribers.get(codeHash);
  if (subs) {
    for (const sub of subs) {
      sub.onSvg(svg);
    }
    subscribers.delete(codeHash);
  }
}

function notifyError(codeHash: string, error: Error): void {
  const subs = subscribers.get(codeHash);
  if (subs) {
    for (const sub of subs) {
      sub.onError?.(error);
    }
    subscribers.delete(codeHash);
  }
}

/**
 * Render a mermaid diagram to SVG. Results are cached and concurrent
 * renders for the same code are deduplicated. Renders always run to
 * completion regardless of component lifecycle.
 */
export function renderMermaidSvg(
  code: string,
  theme: "dark" | "default",
): Promise<string> {
  code = code.trim(); // Normalize whitespace for consistent cache keys
  const codeHash = hashCode(code);

  // Cache hit
  const cached = svgCache.get(codeHash);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Deduplicate in-flight render
  const pending = pendingRenders.get(codeHash);
  if (pending) {
    return pending;
  }

  // Start new render
  const renderPromise = (async () => {
    try {
      const mermaid = await getMermaid();

      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: "strict",
      });

      const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { svg } = await mermaid.render(uniqueId, code);

      svgCache.set(codeHash, svg);
      notifySubscribers(codeHash, svg);
      return svg;
    } catch (e) {
      console.error("Mermaid render error:", e);
      const error =
        e instanceof Error ? e : new Error("Invalid diagram syntax");
      notifyError(codeHash, error);
      throw error;
    } finally {
      pendingRenders.delete(codeHash);
    }
  })();

  pendingRenders.set(codeHash, renderPromise);
  return renderPromise;
}

/**
 * Subscribe to render completion for a given code hash.
 * If the SVG is already cached, the callback fires immediately.
 * Returns an unsubscribe function.
 */
export function subscribe(
  codeHash: string,
  onSvg: SvgCallback,
  onError?: ErrorCallback,
): () => void {
  // If already cached, fire immediately
  const cached = svgCache.get(codeHash);
  if (cached) {
    onSvg(cached);
    return () => {};
  }

  const sub: Subscriber = { onSvg, onError };

  let subs = subscribers.get(codeHash);
  if (!subs) {
    subs = new Set();
    subscribers.set(codeHash, subs);
  }
  subs.add(sub);

  return () => {
    subs!.delete(sub);
    if (subs!.size === 0) {
      subscribers.delete(codeHash);
    }
  };
}

/**
 * Synchronous cache check.
 */
export function getCachedSvg(code: string): string | null {
  return svgCache.get(hashCode(code.trim())) ?? null;
}

/**
 * Clear all caches and pending state. For testing.
 */
export function clearCache(): void {
  svgCache.clear();
  pendingRenders.clear();
  subscribers.clear();
}
