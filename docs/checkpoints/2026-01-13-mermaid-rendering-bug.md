# Checkpoint: Mermaid Rendering Bug

**Date:** 2026-01-13 (resolved 2026-03-23)
**Status:** RESOLVED - Global render service decouples async rendering from React lifecycle
**Story:** 5-5-mermaid-diagram-rendering

## Problem

Mermaid diagrams are not rendering in the WYSIWYG editor on initial load. They DO render after user interaction (clicking sidebar, or clicking "edit source" → "done").

## Root Causes Found (Multiple)

### 1. Content Extraction Bug (FIXED)

**File:** `src/webview/extensions/MermaidBlock.ts:76-82`

`getContent` was returning a ProseMirror `Node` instead of a `Fragment`. TipTap silently discarded it.

**Fix applied:**

```typescript
import { Fragment } from "@tiptap/pm/model";
return Fragment.from(schema.text(text));
```

### 2. Dynamic Import Path Bug (FIXED)

**File:** `vite.config.ts`

Vite was using absolute paths (`/flowDiagram.js`) for dynamic imports, causing 403 Forbidden errors in VS Code webview.

**Fix applied:**

```typescript
base: './',  // Use relative paths
```

### 3. Component Unmounting During Async Render (RESOLVED 2026-03-23)

**Fixed via pre-rendering at parse time.**

TipTap's NodeView remounts the React component multiple times during editor initialization:

```
[MermaidDiagram] Calling renderDiagram immediately
[MermaidDiagram] Importing mermaid library...
[MermaidDiagram] Component unmounted during import, aborting  <-- Problem!
[MermaidDiagram] Calling renderDiagram immediately            <-- New mount
[MermaidDiagram] Component unmounted during import, aborting  <-- Unmounts again!
```

The async mermaid render starts but the component unmounts before it completes. The render eventually succeeds on a later mount, but by then the component has fresh state and shows "Loading...".

**Why it works after interaction:**

- Clicking "edit source" → "done" keeps the component mounted long enough for render to complete
- The SVG cache (added as workaround) then preserves the result for future mounts

## Final Resolution (2026-03-23)

**Root cause:** TipTap's ReactNodeViewRenderer destroys and recreates React components during `setContent()` processing. The MermaidDiagram component unmounts before the async `mermaid.render()` completes. The component never remounts, leaving an empty DOM container.

**Fix:** Pre-render mermaid blocks into a global cache BEFORE calling `setContent()`. In App.tsx, `preRenderMermaidBlocks()` extracts mermaid code from markdown, renders them via the render service, and awaits completion. When TipTap creates the MermaidDiagram component, `getCachedSvg()` returns the SVG immediately on the first render -- no async needed inside the component.

**Key detail:** The render service normalizes code with `.trim()` before hashing to ensure cache keys match between the regex extraction (from markdown) and TipTap's text extraction (from HTML).

### Files Modified:

| File                      | Change                                      | Status   |
| ------------------------- | ------------------------------------------- | -------- |
| `MermaidBlock.ts`         | Return Fragment from getContent             | ✅ Fixed |
| `vite.config.ts`          | Add `base: './'` for relative imports       | ✅ Fixed |
| `App.tsx`                 | Pre-render mermaid blocks before setContent | ✅ Fixed |
| `mermaidRenderService.ts` | Global render service with cache + dedup    | ✅ New   |
| `MermaidDiagram.tsx`      | Use render service, no abort-on-unmount     | ✅ Fixed |
| `mermaidPreloader.ts`     | Cleaned up debug logging                    | ✅ Fixed |

## Potential Solutions to Investigate

### Option A: Pre-render at Parse Time

Render mermaid SVGs during `parseMarkdownToHtml()` before TipTap sees the content.

- Pros: SVG is ready immediately, no async issues
- Cons: Adds latency to initial parse, complex to implement

**Files:** `src/webview/utils/markdownParser.ts`

### Option B: Stabilize NodeView Mounting

Investigate WHY TipTap is remounting the NodeView multiple times.

- Check if `ReactNodeViewRenderer` has options to prevent remounting
- Check if editor re-creation is causing this

**Files:** `src/webview/hooks/useTipTapEditor.ts`, `MermaidBlock.ts`

### Option C: Global Render Queue

Move mermaid rendering outside React entirely:

1. Create a singleton MermaidRenderer service
2. On component mount, request render from service
3. Service renders async and broadcasts results
4. Components subscribe to results

**Pros:** Renders survive component unmounting
**Cons:** More complex architecture

### Option D: Delay Initial Render

Wait for TipTap to "stabilize" before triggering mermaid render:

```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    if (isMountedRef.current) {
      renderDiagram(code);
    }
  }, 100); // Wait for remounting to settle
  return () => clearTimeout(timeout);
}, []);
```

**Pros:** Simple
**Cons:** Adds visible delay, may not be reliable

### Option E: Cache at Markdown Parser Level

When parsing markdown, generate a cache key for each mermaid block and check if SVG exists in a global cache before rendering the editor.

**Files:** `src/webview/utils/markdownParser.ts`, `MermaidDiagram.tsx`

## Investigation Commands

Check NodeView remounting behavior:

```bash
# Add this to MermaidNodeView.tsx to see full remount pattern
console.log('[MermaidNodeView] Mount/Unmount', {
  nodeSize: node.nodeSize,
  pos: typeof getPos === 'function' ? getPos() : 'unknown'
});
```

Check if editor is being recreated:

```bash
# Search for editor recreation patterns
grep -r "useEditor\|createEditor\|new Editor" src/webview/
```

## How to Test

1. Open `wysiwyg-markdown-editor` folder in VS Code
2. Press F5 to launch Extension Development Host
3. Open any `.md` file with a mermaid diagram
4. Check webview console for `[MermaidDiagram]` logs
5. Observe: Diagram should show "Loading..." then eventually error or empty
6. Click sidebar code button, then click back - diagram appears

## Next Session

1. Pick one of Options A-E to implement
2. Or investigate the NodeView remounting behavior further
3. Remove debug logging once fix is confirmed
4. Run tests: `npm run test:webview`
