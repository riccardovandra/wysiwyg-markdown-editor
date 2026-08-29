/**
 * Pure URI helpers used to bridge markdown image paths and the
 * sandboxed `vscode-webview://` origin used inside WebViews.
 *
 * The extension host pre-resolves the document's directory to a
 * webview-safe URI (`baseUri`) and forwards it via `init` /
 * `externalChange` messages. The functions here use `baseUri` to
 * (re)write image `src` values:
 *
 *   resolveImageSrc:   markdown `![](./flow.png)` -> `<img src="${baseUri}/flow.png">`
 *   unresolveImageSrc: `<img src="${baseUri}/flow.png">` -> `![](./flow.png)`
 *
 * Round-trip MUST preserve the original path on disk; webview-internal
 * URIs are never written to markdown files.
 */

const PASSTHROUGH = /^(https?:|data:|file:|blob:)/i;

/**
 * Convert a markdown image src to a value usable as `<img src>` inside the WebView.
 *
 * - Passthrough for absolute URLs (`http(s)`, `data:`, `file:`, `blob:`).
 * - Empty / falsy values are returned unchanged.
 * - Anything else is treated as a relative path and joined to baseUri.
 */
export function resolveImageSrc(src: string, baseUri: string): string {
  if (!src || PASSTHROUGH.test(src)) {
    return src;
  }
  if (!baseUri) {
    return src;
  }
  const cleanBase = baseUri.replace(/\/$/, '');
  const cleanSrc = src.replace(/^\.\//, '');
  return `${cleanBase}/${cleanSrc}`;
}

/**
 * Inverse of {@link resolveImageSrc}: strips a webview-prefixed URI back
 * to a relative path so the markdown on disk keeps its original form.
 *
 * - If `renderedSrc` does not start with `baseUri`, return as-is.
 * - Empty / falsy values are returned unchanged.
 */
export function unresolveImageSrc(renderedSrc: string, baseUri: string): string {
  if (!renderedSrc) {
    return renderedSrc;
  }
  if (!baseUri) {
    return renderedSrc;
  }
  const cleanBase = baseUri.replace(/\/$/, '');
  if (renderedSrc.startsWith(cleanBase + '/')) {
    return './' + renderedSrc.slice(cleanBase.length + 1);
  }
  return renderedSrc;
}
