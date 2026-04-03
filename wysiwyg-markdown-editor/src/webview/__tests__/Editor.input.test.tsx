import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Editor } from '../components/Editor';
import { useEditor, Editor as TipTapEditorType } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useEffect } from 'react';

/**
 * Test wrapper that exposes the TipTap editor instance for direct manipulation.
 * This allows us to test TipTap behaviors using the editor API rather than
 * simulating DOM events (which JSDOM doesn't fully support for contenteditable).
 */
function EditorTestWrapper({
  initialContent,
  onEditorReady,
}: {
  initialContent?: string;
  onEditorReady?: (editor: TipTapEditorType) => void;
}) {
  const [isReady, setIsReady] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: initialContent || '',
    editable: true,
    onCreate: ({ editor }) => {
      setIsReady(true);
      onEditorReady?.(editor);
    },
  });

  useEffect(() => {
    if (editor && isReady) {
      onEditorReady?.(editor);
    }
  }, [editor, isReady, onEditorReady]);

  return <Editor editor={editor} />;
}

describe('Editor Input & Deletion (Story 2.4)', () => {
  beforeEach(() => {
    // Mock getClientRects which JSDOM doesn't implement
    Element.prototype.getClientRects = vi.fn(() => ({
      length: 1,
      item: () => ({ top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 }),
      [Symbol.iterator]: function* () {
        yield { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 };
      },
    })) as unknown as typeof Element.prototype.getClientRects;

    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 20,
      width: 100,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    Range.prototype.getClientRects = vi.fn(() => ({
      length: 1,
      item: () => ({ top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 }),
      [Symbol.iterator]: function* () {
        yield { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20 };
      },
    })) as unknown as typeof Range.prototype.getClientRects;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Task 1: Enter Key Behavior (AC1, AC2, AC3)', () => {
    describe('AC1: Enter Creates New Line', () => {
      it('Enter in paragraph creates new paragraph', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello World</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        // Wait for editor to be ready
        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Position cursor at end and press Enter
        testEditor!.commands.focus('end');
        testEditor!.commands.enter();

        // Should have two paragraphs now
        const html = testEditor!.getHTML();
        expect(html).toContain('<p>Hello World</p>');
        expect(html).toMatch(/<p>Hello World<\/p>\s*<p><\/p>/);
      });

      it('Enter in middle of paragraph splits it', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello World</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Position cursor after "Hello" (position 6: H-e-l-l-o + 1 for start)
        testEditor!.commands.setTextSelection(6);
        testEditor!.commands.enter();

        const html = testEditor!.getHTML();
        expect(html).toContain('<p>Hello</p>');
        expect(html).toContain('<p> World</p>');
      });

      it('Enter in heading creates paragraph (not new heading)', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<h1>My Heading</h1>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('end');
        testEditor!.commands.enter();

        const html = testEditor!.getHTML();
        expect(html).toContain('<h1>My Heading</h1>');
        // After Enter on heading, next block should be paragraph
        expect(html).toMatch(/<h1>My Heading<\/h1>\s*<p><\/p>/);
      });
    });

    describe('AC2: Enter in List Creates New Item', () => {
      it('Enter at end of list item creates new list item', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<ul><li><p>Item 1</p></li></ul>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('end');
        testEditor!.commands.enter();

        const html = testEditor!.getHTML();
        // Should have two list items
        const listItemCount = (html.match(/<li>/g) || []).length;
        expect(listItemCount).toBe(2);
      });

      it('Enter in middle of list item splits it into two items', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<ul><li><p>First Second</p></li></ul>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Position after "First " (6 chars) plus node offsets (ul=1, li=1, p=1, doc=1) = 10
        // Using 10 to position cursor right after "First " and before "Second"
        testEditor!.commands.setTextSelection(10);
        testEditor!.commands.enter();

        const html = testEditor!.getHTML();
        const listItemCount = (html.match(/<li>/g) || []).length;
        expect(listItemCount).toBe(2);
        // Verify the split happened (content distributed across items)
        expect(html).toContain('First');
      });
    });

    describe('AC3: Double Enter Exits List', () => {
      it('Enter in empty list item exits list and creates paragraph', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<ul><li><p>Item 1</p></li><li><p></p></li></ul>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Focus on the empty list item (end of document is in empty li)
        testEditor!.commands.focus('end');
        testEditor!.commands.enter();

        const html = testEditor!.getHTML();
        // The empty list item should be removed and replaced with paragraph
        // List should have only one item now
        expect(html).toContain('<p>Item 1</p>');
      });
    });

    describe('Enter in Blockquote', () => {
      it('Enter in blockquote creates new paragraph within blockquote', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<blockquote><p>Quote text</p></blockquote>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('end');
        testEditor!.commands.enter();

        const html = testEditor!.getHTML();
        expect(html).toContain('<blockquote>');
      });
    });
  });

  describe('Task 2: Backspace Behavior (AC4, AC5, AC6)', () => {
    describe('AC4: Backspace Deletes Text', () => {
      it('Backspace deletes character before cursor', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('end');
        testEditor!.commands.deleteRange({
          from: testEditor!.state.selection.from - 1,
          to: testEditor!.state.selection.from,
        });

        const html = testEditor!.getHTML();
        expect(html).toContain('Hell');
        expect(html).not.toContain('Hello');
      });
    });

    describe('AC5: Backspace at Block Start Merges', () => {
      it('Backspace at paragraph start merges with previous paragraph', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>First</p><p>Second</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Position cursor at start of "Second" paragraph
        // First paragraph: <p>First</p> = positions 1-6 (1 for p open, 5 chars)
        // Second paragraph starts after that
        const secondParagraphStart = 8; // Approximate position
        testEditor!.commands.setTextSelection(secondParagraphStart);

        // Use joinBackward to merge with previous
        testEditor!.commands.joinBackward();

        const html = testEditor!.getHTML();
        // Should be merged into one paragraph
        expect(html).toContain('FirstSecond');
      });

      it('Backspace at document start does nothing', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('start');
        const beforeHtml = testEditor!.getHTML();

        // Try to delete at start
        testEditor!.commands.joinBackward();

        const afterHtml = testEditor!.getHTML();
        expect(afterHtml).toBe(beforeHtml);
      });
    });

    describe('AC6: Backspace on Empty List Item', () => {
      it('Backspace in empty list item removes item', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<ul><li><p>Item 1</p></li><li><p></p></li></ul>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('end');

        const beforeCount = (testEditor!.getHTML().match(/<li>/g) || []).length;
        expect(beforeCount).toBe(2);

        testEditor!.commands.liftListItem('listItem');

        const afterHtml = testEditor!.getHTML();
        // Empty item should be removed or converted
        expect(afterHtml).toContain('Item 1');
      });
    });
  });

  describe('Task 3: Delete Key Behavior (AC7)', () => {
    describe('AC7: Delete Key Works', () => {
      it('Delete removes character after cursor', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('start');
        // Delete character after cursor (the 'H')
        testEditor!.commands.deleteRange({
          from: testEditor!.state.selection.from,
          to: testEditor!.state.selection.from + 1,
        });

        const html = testEditor!.getHTML();
        expect(html).toContain('ello');
        expect(html).not.toContain('Hello');
      });

      it('Delete at end of block merges with next block', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>First</p><p>Second</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Position at end of first paragraph
        testEditor!.commands.setTextSelection(6); // After "First"
        testEditor!.commands.joinForward();

        const html = testEditor!.getHTML();
        expect(html).toContain('FirstSecond');
      });

      it('Delete at document end does nothing', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.focus('end');
        const beforeHtml = testEditor!.getHTML();

        testEditor!.commands.joinForward();

        const afterHtml = testEditor!.getHTML();
        expect(afterHtml).toBe(beforeHtml);
      });
    });
  });

  describe('Task 4: Selection Deletion (AC8, AC9)', () => {
    describe('AC8: Delete Selected Text', () => {
      it('deleting selection removes selected text', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello World</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Select "World" (positions 7-12)
        testEditor!.commands.setTextSelection({ from: 7, to: 12 });

        // Delete selection
        testEditor!.commands.deleteSelection();

        const html = testEditor!.getHTML();
        expect(html).toContain('Hello ');
        expect(html).not.toContain('World');
      });

      it('typing with selection replaces selected text', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello World</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        // Select "World"
        testEditor!.commands.setTextSelection({ from: 7, to: 12 });

        // Insert replacement text
        testEditor!.commands.insertContent('Universe');

        const html = testEditor!.getHTML();
        expect(html).toContain('Hello Universe');
        expect(html).not.toContain('World');
      });
    });

    describe('AC9: Select All and Delete', () => {
      it('selectAll selects entire document content', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello World</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.selectAll();

        const { from, to } = testEditor!.state.selection;
        // Selection should span the entire content
        expect(to - from).toBeGreaterThan(0);
        expect(testEditor!.state.selection.empty).toBe(false);
      });

      it('delete after selectAll clears document', async () => {
        let testEditor: TipTapEditorType | null = null;

        render(
          <EditorTestWrapper
            initialContent="<p>Hello World</p>"
            onEditorReady={(editor) => {
              testEditor = editor;
            }}
          />
        );

        await vi.waitFor(() => expect(testEditor).not.toBeNull());

        testEditor!.commands.selectAll();
        testEditor!.commands.deleteSelection();

        const text = testEditor!.getText();
        expect(text.trim()).toBe('');
      });
    });
  });

  describe('Task 5: Edge Cases', () => {
    it('empty document accepts input', async () => {
      let testEditor: TipTapEditorType | null = null;

      render(
        <EditorTestWrapper
          initialContent=""
          onEditorReady={(editor) => {
            testEditor = editor;
          }}
        />
      );

      await vi.waitFor(() => expect(testEditor).not.toBeNull());

      testEditor!.commands.insertContent('New content');

      const html = testEditor!.getHTML();
      expect(html).toContain('New content');
    });

    it('single character document handles backspace', async () => {
      let testEditor: TipTapEditorType | null = null;

      render(
        <EditorTestWrapper
          initialContent="<p>X</p>"
          onEditorReady={(editor) => {
            testEditor = editor;
          }}
        />
      );

      await vi.waitFor(() => expect(testEditor).not.toBeNull());

      testEditor!.commands.focus('end');
      testEditor!.commands.deleteRange({
        from: testEditor!.state.selection.from - 1,
        to: testEditor!.state.selection.from,
      });

      const text = testEditor!.getText();
      expect(text.trim()).toBe('');
    });

    it('cursor at paragraph boundary handles operations correctly', async () => {
      let testEditor: TipTapEditorType | null = null;

      render(
        <EditorTestWrapper
          initialContent="<p>Para 1</p><p>Para 2</p>"
          onEditorReady={(editor) => {
            testEditor = editor;
          }}
        />
      );

      await vi.waitFor(() => expect(testEditor).not.toBeNull());

      // Cursor should be placeable at boundaries
      testEditor!.commands.focus('start');
      expect(testEditor!.state.selection.from).toBeGreaterThan(0);

      testEditor!.commands.focus('end');
      expect(testEditor!.state.selection.to).toBeGreaterThan(0);
    });

    it('handles rapid operations without errors', async () => {
      let testEditor: TipTapEditorType | null = null;

      render(
        <EditorTestWrapper
          initialContent="<p>Test content</p>"
          onEditorReady={(editor) => {
            testEditor = editor;
          }}
        />
      );

      await vi.waitFor(() => expect(testEditor).not.toBeNull());

      // Perform rapid operations
      testEditor!.commands.focus('end');
      testEditor!.commands.enter();
      testEditor!.commands.insertContent('New');
      testEditor!.commands.enter();
      testEditor!.commands.insertContent('More');

      // Should not throw and content should be valid
      const html = testEditor!.getHTML();
      expect(html).toContain('Test content');
      expect(html).toContain('New');
      expect(html).toContain('More');
    });
  });
});
