/**
 * Mermaid Preloader
 *
 * Eagerly loads the mermaid library at app startup to avoid async import
 * delays during component rendering.
 */

import type Mermaid from "mermaid";

// Cached mermaid instance
let mermaidInstance: typeof Mermaid | null = null;
let loadPromise: Promise<typeof Mermaid> | null = null;

/**
 * Start preloading the mermaid library.
 * Call this early in app initialization (e.g., in App.tsx or index.tsx).
 * Safe to call multiple times - will only load once.
 */
export function preloadMermaid(): Promise<typeof Mermaid> {
  if (mermaidInstance) {
    return Promise.resolve(mermaidInstance);
  }

  if (loadPromise) {
    return loadPromise;
  }

  console.log("[DIAG:Preloader] Starting mermaid import...");
  loadPromise = import("mermaid")
    .then((module) => {
      mermaidInstance = module.default;
      console.log(
        "[DIAG:Preloader] Mermaid loaded successfully, instance:",
        !!mermaidInstance,
      );
      return mermaidInstance;
    })
    .catch((err) => {
      console.error("[DIAG:Preloader] Mermaid import FAILED:", err);
      throw err;
    });

  return loadPromise;
}

/**
 * Get the mermaid instance if it's already loaded.
 * Returns null if not yet loaded - use getMermaid() for async access.
 */
export function getMermaidSync(): typeof Mermaid | null {
  return mermaidInstance;
}

/**
 * Get the mermaid instance, waiting for load if necessary.
 * Prefer this over dynamic import in components.
 */
export async function getMermaid(): Promise<typeof Mermaid> {
  if (mermaidInstance) {
    return mermaidInstance;
  }

  if (!loadPromise) {
    return preloadMermaid();
  }

  return loadPromise;
}

/**
 * Check if mermaid is already loaded (synchronously available).
 */
export function isMermaidLoaded(): boolean {
  return mermaidInstance !== null;
}
