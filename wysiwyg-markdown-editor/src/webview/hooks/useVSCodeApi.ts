import type { WebViewMessage } from '../../shared/messages.types';

/**
 * VS Code API interface exposed to WebViews.
 * This API is acquired via the acquireVsCodeApi() function.
 */
interface VSCodeApi {
  /**
   * Post a message to the extension host.
   */
  postMessage(message: WebViewMessage): void;

  /**
   * Get the persistent state stored for this webview.
   */
  getState(): unknown;

  /**
   * Set the persistent state for this webview.
   */
  setState(state: unknown): void;
}

/**
 * Declare the global acquireVsCodeApi function that VS Code injects into webviews.
 */
declare function acquireVsCodeApi(): VSCodeApi;

/**
 * Singleton instance of the VS Code API.
 * acquireVsCodeApi() can only be called once per webview session.
 */
let vscodeApi: VSCodeApi | undefined;

/**
 * Access the VS Code API from within a WebView React component.
 *
 * Note: Named with "use" prefix for React convention consistency, though this
 * is technically a singleton getter rather than a true React hook (it doesn't
 * use useState, useEffect, etc.). The singleton pattern is required because
 * acquireVsCodeApi() can only be called once per webview session.
 *
 * The VS Code API provides:
 * - postMessage: Send messages to the extension host
 * - getState/setState: Persist state across webview reloads
 *
 * @example
 * ```tsx
 * const vscode = useVSCodeApi();
 * vscode.postMessage({ type: 'ready' });
 * ```
 *
 * @returns The VS Code API singleton
 */
export function useVSCodeApi(): VSCodeApi {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}
