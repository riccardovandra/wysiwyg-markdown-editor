import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock the VS Code API that would be injected by the extension host
const mockVSCodeApi = {
  postMessage: vi.fn(),
  getState: vi.fn(() => undefined),
  setState: vi.fn(),
};

// Mock acquireVsCodeApi global function
(globalThis as unknown as { acquireVsCodeApi: () => typeof mockVSCodeApi }).acquireVsCodeApi = () => mockVSCodeApi;

// Suppress TipTap's "duplicate extension" warning in tests
// This is a known false positive - StarterKit doesn't include Link extension
// but TipTap's extension manager may incorrectly detect duplicates across test runs
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('Duplicate extension names found')) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, args);
};

// Suppress React act() warnings for TipTap tests
// TipTap's ProseMirror internals manage state outside React's control flow,
// causing expected act() warnings that don't affect test validity
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('was not wrapped in act')) {
    return; // Suppress act() warnings from TipTap's internal state updates
  }
  originalError.apply(console, args);
};

// Export for use in tests
export { mockVSCodeApi };
