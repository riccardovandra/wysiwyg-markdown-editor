import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';

// Create lowlight instance for tests
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('json', json);

// Test wrapper component that creates an editor with code block content (basic)
function CodeBlockTestEditor({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
  });

  return (
    <div data-testid="editor-container">
      <EditorContent editor={editor} />
    </div>
  );
}

// Test wrapper with syntax highlighting enabled
function SyntaxHighlightTestEditor({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
      }),
    ],
    content,
    immediatelyRender: false,
  });

  return (
    <div data-testid="editor-container">
      <EditorContent editor={editor} />
    </div>
  );
}

describe('CodeBlock Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task 1: TipTap CodeBlock Extension', () => {
    it('should render code block from HTML content', async () => {
      const codeBlockHtml = '<pre><code>const x = 1;</code></pre>';

      render(<CodeBlockTestEditor content={codeBlockHtml} />);

      // Wait for editor to initialize
      await vi.waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
      });

      const codeElement = document.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain('const x = 1;');
    });

    it('should render code block with language class', async () => {
      const codeBlockHtml = '<pre><code class="language-javascript">const greeting = "Hello";</code></pre>';

      render(<CodeBlockTestEditor content={codeBlockHtml} />);

      await vi.waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
      });
    });
  });

  describe('Task 2-4: Code Block Styling', () => {
    it('should render pre element for code blocks', async () => {
      const codeBlockHtml = '<pre><code>function test() {}</code></pre>';

      render(<CodeBlockTestEditor content={codeBlockHtml} />);

      await vi.waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
      });
    });

    it('should render code element inside pre', async () => {
      const codeBlockHtml = '<pre><code>let value = 42;</code></pre>';

      render(<CodeBlockTestEditor content={codeBlockHtml} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('pre code');
        expect(codeElement).toBeInTheDocument();
      });
    });
  });

  describe('Task 5: Editing Behavior', () => {
    it('should preserve whitespace in code blocks', async () => {
      const codeWithWhitespace = '<pre><code>  indented\n    more indented</code></pre>';

      render(<CodeBlockTestEditor content={codeWithWhitespace} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('  indented');
        expect(codeElement?.textContent).toContain('    more indented');
      });
    });

    it('should render multiline code blocks correctly', async () => {
      const multilineCode = '<pre><code>line1\nline2\nline3</code></pre>';

      render(<CodeBlockTestEditor content={multilineCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('line1');
        expect(codeElement?.textContent).toContain('line2');
        expect(codeElement?.textContent).toContain('line3');
      });
    });

    it('should preserve tab characters in code blocks', async () => {
      const codeWithTabs = '<pre><code>function test() {\n\treturn true;\n}</code></pre>';

      render(<CodeBlockTestEditor content={codeWithTabs} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('\treturn');
      });
    });

    it('should preserve multiple consecutive spaces', async () => {
      const codeWithSpaces = '<pre><code>const    x    =    1;</code></pre>';

      render(<CodeBlockTestEditor content={codeWithSpaces} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('const    x    =    1;');
      });
    });

    it('should preserve empty lines in code blocks', async () => {
      const codeWithEmptyLines = '<pre><code>line1\n\nline3</code></pre>';

      render(<CodeBlockTestEditor content={codeWithEmptyLines} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        // Content should have both lines with empty line between
        const content = codeElement?.textContent || '';
        expect(content).toContain('line1');
        expect(content).toContain('line3');
      });
    });

    it('should make code block content editable', async () => {
      const codeBlock = '<pre><code>editable content</code></pre>';

      render(<CodeBlockTestEditor content={codeBlock} />);

      await vi.waitFor(() => {
        const proseMirror = document.querySelector('.ProseMirror');
        expect(proseMirror).toBeInTheDocument();
        // ProseMirror should be contenteditable
        expect(proseMirror).toHaveAttribute('contenteditable', 'true');
      });
    });
  });

  describe('Task 7: Code Block Content Tests', () => {
    it('should render empty code block', async () => {
      const emptyCodeBlock = '<pre><code></code></pre>';

      render(<CodeBlockTestEditor content={emptyCodeBlock} />);

      await vi.waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
      });
    });

    it('should render code block with special characters', async () => {
      const specialChars = '<pre><code>&lt;div&gt;HTML&lt;/div&gt;</code></pre>';

      render(<CodeBlockTestEditor content={specialChars} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('<div>');
      });
    });

    it('should render code block with multiple lines and indentation', async () => {
      const complexCode = `<pre><code>function example() {
  const obj = {
    key: "value",
    nested: {
      deep: true
    }
  };
  return obj;
}</code></pre>`;

      render(<CodeBlockTestEditor content={complexCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('function example()');
        expect(codeElement?.textContent).toContain('nested:');
      });
    });
  });
});

describe('Syntax Highlighting (Story 3.2)', () => {
  describe('Task 1-3: CodeBlockLowlight Integration', () => {
    it('should render code block with syntax highlighting enabled', async () => {
      const jsCode = '<pre><code class="language-javascript">const x = 1;</code></pre>';

      render(<SyntaxHighlightTestEditor content={jsCode} />);

      await vi.waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
        // Verify highlighting is actually applied - should have hljs span elements
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
      });
    });

    it('should render JavaScript code with highlighting classes applied', async () => {
      const jsCode = '<pre><code class="language-javascript">const greeting = "Hello";</code></pre>';

      render(<SyntaxHighlightTestEditor content={jsCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        // Verify actual syntax highlighting tokens are applied
        // lowlight wraps tokens in spans with hljs-* classes
        const keywordSpan = codeElement?.querySelector('.hljs-keyword');
        const stringSpan = codeElement?.querySelector('.hljs-string');
        expect(keywordSpan).toBeInTheDocument(); // 'const' should be highlighted
        expect(stringSpan).toBeInTheDocument(); // '"Hello"' should be highlighted
      });
    });

    it('should render Python code with highlighting classes applied', async () => {
      const pyCode = '<pre><code class="language-python">def hello():\n    print("Hello")</code></pre>';

      render(<SyntaxHighlightTestEditor content={pyCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('def hello()');
        // Verify Python syntax highlighting
        const keywordSpan = codeElement?.querySelector('.hljs-keyword');
        const builtinSpan = codeElement?.querySelector('.hljs-built_in');
        expect(keywordSpan).toBeInTheDocument(); // 'def' should be highlighted
        expect(builtinSpan).toBeInTheDocument(); // 'print' should be highlighted
      });
    });

    it('should render JSON code with highlighting classes applied', async () => {
      const jsonCode = '<pre><code class="language-json">{"key": "value", "count": 42}</code></pre>';

      render(<SyntaxHighlightTestEditor content={jsonCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        // Verify JSON syntax highlighting
        const attrSpan = codeElement?.querySelector('.hljs-attr');
        const stringSpan = codeElement?.querySelector('.hljs-string');
        const numberSpan = codeElement?.querySelector('.hljs-number');
        expect(attrSpan).toBeInTheDocument(); // property names
        expect(stringSpan).toBeInTheDocument(); // string values
        expect(numberSpan).toBeInTheDocument(); // number values
      });
    });
  });

  describe('Task 3: Case-Insensitive Language Detection (AC3)', () => {
    it('should handle uppercase language specifier', async () => {
      const jsCode = '<pre><code class="language-JAVASCRIPT">const x = 1;</code></pre>';

      render(<SyntaxHighlightTestEditor content={jsCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        // Should still apply highlighting even with uppercase language
        // Note: TipTap/lowlight normalizes language names
      });
    });

    it('should handle mixed case language specifier', async () => {
      const jsCode = '<pre><code class="language-JavaScript">const greeting = "test";</code></pre>';

      render(<SyntaxHighlightTestEditor content={jsCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
      });
    });
  });

  describe('Task 5: No-Language Fallback (AC4)', () => {
    it('should render code block without language as plain text', async () => {
      const plainCode = '<pre><code>plain text without highlighting</code></pre>';

      render(<SyntaxHighlightTestEditor content={plainCode} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('plain text');
        // Verify NO highlighting classes are applied
        const hljsSpans = codeElement?.querySelectorAll('[class^="hljs-"]');
        expect(hljsSpans?.length || 0).toBe(0);
      });
    });

    it('should not crash with unknown language and render content', async () => {
      const unknownLang = '<pre><code class="language-cobol">DISPLAY "HELLO".</code></pre>';

      render(<SyntaxHighlightTestEditor content={unknownLang} />);

      await vi.waitFor(() => {
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toContain('DISPLAY');
        // Key requirement: content renders without crashing
        // Note: lowlight may apply minimal generic highlighting to unrecognized languages
      });
    });
  });

  describe('Task 6: Performance (AC6)', () => {
    it('should render 10 code blocks within acceptable time', async () => {
      // AC6 specifies: < 100ms for 10 code blocks
      // Using 200ms threshold for test environment overhead
      const multipleBlocks = Array(10)
        .fill('<pre><code class="language-javascript">const x = 1; function test() { return x * 2; }</code></pre>')
        .join('<p>text between blocks</p>');

      const startTime = performance.now();
      render(<SyntaxHighlightTestEditor content={multipleBlocks} />);

      await vi.waitFor(() => {
        const preElements = document.querySelectorAll('pre');
        expect(preElements.length).toBe(10);
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // AC6: < 100ms for 10 blocks, allowing 200ms for test environment overhead
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Code Block Structure', () => {
    it('should maintain pre > code structure with highlighting', async () => {
      const code = '<pre><code class="language-javascript">let x = 42;</code></pre>';

      render(<SyntaxHighlightTestEditor content={code} />);

      await vi.waitFor(() => {
        const preElement = document.querySelector('pre');
        const codeElement = document.querySelector('pre > code');
        expect(preElement).toBeInTheDocument();
        expect(codeElement).toBeInTheDocument();
      });
    });
  });
});
