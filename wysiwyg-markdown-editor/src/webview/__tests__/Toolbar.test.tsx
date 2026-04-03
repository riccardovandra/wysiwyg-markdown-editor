import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../components/Toolbar';
import type { Editor } from '@tiptap/react';

// Create chainable mock functions for editor commands
const createChainableMock = () => {
  const runMock = vi.fn();
  const toggleBoldMock = vi.fn().mockReturnValue({ run: runMock });
  const toggleItalicMock = vi.fn().mockReturnValue({ run: runMock });
  const toggleHeadingMock = vi.fn().mockReturnValue({ run: runMock });
  const toggleBulletListMock = vi.fn().mockReturnValue({ run: runMock });
  const toggleOrderedListMock = vi.fn().mockReturnValue({ run: runMock });
  const toggleCodeBlockMock = vi.fn().mockReturnValue({ run: runMock });
  const setLinkMock = vi.fn().mockReturnValue({ run: runMock });
  const unsetLinkMock = vi.fn().mockReturnValue({ run: runMock });
  const undoMock = vi.fn().mockReturnValue({ run: runMock });
  const redoMock = vi.fn().mockReturnValue({ run: runMock });

  const focusMock = vi.fn().mockReturnValue({
    toggleBold: toggleBoldMock,
    toggleItalic: toggleItalicMock,
    toggleHeading: toggleHeadingMock,
    toggleBulletList: toggleBulletListMock,
    toggleOrderedList: toggleOrderedListMock,
    toggleCodeBlock: toggleCodeBlockMock,
    setLink: setLinkMock,
    unsetLink: unsetLinkMock,
    undo: undoMock,
    redo: redoMock,
  });

  const chainMock = vi.fn().mockReturnValue({ focus: focusMock });

  return {
    chainMock,
    focusMock,
    toggleBoldMock,
    toggleItalicMock,
    toggleHeadingMock,
    toggleBulletListMock,
    toggleOrderedListMock,
    toggleCodeBlockMock,
    setLinkMock,
    unsetLinkMock,
    undoMock,
    redoMock,
    runMock,
  };
};

// Mock editor for testing
const createMockEditor = (overrides: Partial<Editor> = {}): Editor => {
  const mocks = createChainableMock();

  return {
    isActive: vi.fn().mockReturnValue(false),
    can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
    chain: mocks.chainMock,
    on: vi.fn(),
    off: vi.fn(),
    getAttributes: vi.fn().mockReturnValue({}),
    commands: { focus: vi.fn() },
    ...overrides,
  } as unknown as Editor;
};

describe('Toolbar', () => {
  describe('Task 1: Component Structure', () => {
    it('renders the toolbar component', () => {
      const editor = createMockEditor();
      render(<Toolbar editor={editor} />);

      // Toolbar should render
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('renders with null editor (disabled state)', () => {
      render(<Toolbar editor={null} />);

      // Toolbar should still render even with null editor
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('exports Toolbar component from correct path', async () => {
      // Verify the export exists
      const { Toolbar: ToolbarExport } = await import('../components/Toolbar');
      expect(ToolbarExport).toBeDefined();
      expect(typeof ToolbarExport).toBe('function');
    });
  });

  describe('Task 2: Sticky Positioning', () => {
    it('has sticky positioning classes', () => {
      const editor = createMockEditor();
      render(<Toolbar editor={editor} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveClass('sticky');
      expect(toolbar).toHaveClass('top-0');
      expect(toolbar).toHaveClass('z-10');
    });

    it('has border-bottom for visual separation', () => {
      const editor = createMockEditor();
      render(<Toolbar editor={editor} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveClass('border-b');
    });
  });

  describe('Task 4: Icon Buttons', () => {
    it('renders all expected toolbar buttons', () => {
      const editor = createMockEditor();
      render(<Toolbar editor={editor} />);

      // Check for all expected buttons by their tooltip/title
      expect(screen.getByTitle(/Bold/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Italic/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Heading 1/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Heading 2/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Heading 3/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Bullet List/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Numbered List/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Link/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Code/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Undo/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Redo/i)).toBeInTheDocument();
    });

    it('renders button group dividers', () => {
      const editor = createMockEditor();
      render(<Toolbar editor={editor} />);

      // Dividers should separate button groups
      const dividers = document.querySelectorAll('[data-testid="toolbar-divider"]');
      expect(dividers.length).toBeGreaterThanOrEqual(3); // At least 3 dividers for 4 groups
    });
  });

  describe('Story 4.2: Text Formatting Functionality', () => {
    describe('Bold Button (AC1)', () => {
      it('calls toggleBold when bold button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        fireEvent.click(boldButton);

        expect(mocks.chainMock).toHaveBeenCalled();
        expect(mocks.focusMock).toHaveBeenCalled();
        expect(mocks.toggleBoldMock).toHaveBeenCalled();
        expect(mocks.runMock).toHaveBeenCalled();
      });

      it('shows active state when cursor is in bold text', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'bold'),
        });

        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        // Active state is indicated by the bg-dark-active class (maps to --vscode-toolbar-activeBackground)
        expect(boldButton.className).toContain('bg-dark-active');
      });
    });

    describe('Italic Button (AC2)', () => {
      it('calls toggleItalic when italic button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const italicButton = screen.getByTitle(/Italic/i);
        fireEvent.click(italicButton);

        expect(mocks.toggleItalicMock).toHaveBeenCalled();
        expect(mocks.runMock).toHaveBeenCalled();
      });

      it('shows active state when cursor is in italic text', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'italic'),
        });

        render(<Toolbar editor={editor} />);

        const italicButton = screen.getByTitle(/Italic/i);
        expect(italicButton.className).toContain('bg-dark-active');
      });
    });

    describe('Heading Buttons (AC3)', () => {
      it('calls toggleHeading with level 1 when H1 button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const h1Button = screen.getByTitle(/Heading 1/i);
        fireEvent.click(h1Button);

        expect(mocks.toggleHeadingMock).toHaveBeenCalledWith({ level: 1 });
      });

      it('calls toggleHeading with level 2 when H2 button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const h2Button = screen.getByTitle(/Heading 2/i);
        fireEvent.click(h2Button);

        expect(mocks.toggleHeadingMock).toHaveBeenCalledWith({ level: 2 });
      });

      it('calls toggleHeading with level 3 when H3 button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const h3Button = screen.getByTitle(/Heading 3/i);
        fireEvent.click(h3Button);

        expect(mocks.toggleHeadingMock).toHaveBeenCalledWith({ level: 3 });
      });

      it('shows active state for H1 when cursor is in heading level 1', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string, attrs?: { level?: number }) => {
            return type === 'heading' && attrs?.level === 1;
          }),
        });

        render(<Toolbar editor={editor} />);

        const h1Button = screen.getByTitle(/Heading 1/i);
        const h2Button = screen.getByTitle(/Heading 2/i);

        expect(h1Button.className).toContain('bg-dark-active');
        expect(h2Button.className).not.toContain('bg-dark-active');
      });
    });

    describe('Active State Updates (AC5)', () => {
      it('subscribes to editor selectionUpdate and transaction events', () => {
        const onMock = vi.fn();
        const editor = createMockEditor({ on: onMock });

        render(<Toolbar editor={editor} />);

        expect(onMock).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
        expect(onMock).toHaveBeenCalledWith('transaction', expect.any(Function));
      });

      it('unsubscribes from events on unmount', () => {
        const offMock = vi.fn();
        const editor = createMockEditor({ off: offMock });

        const { unmount } = render(<Toolbar editor={editor} />);
        unmount();

        expect(offMock).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
        expect(offMock).toHaveBeenCalledWith('transaction', expect.any(Function));
      });

      it('shows multiple active states for nested formatting (bold + italic)', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => {
            return type === 'bold' || type === 'italic';
          }),
        });

        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        const italicButton = screen.getByTitle(/Italic/i);

        expect(boldButton.className).toContain('bg-dark-active');
        expect(italicButton.className).toContain('bg-dark-active');
      });
    });

    describe('Disabled State', () => {
      it('disables all buttons when editor is null', () => {
        render(<Toolbar editor={null} />);

        const boldButton = screen.getByTitle(/Bold/i);
        const italicButton = screen.getByTitle(/Italic/i);
        const h1Button = screen.getByTitle(/Heading 1/i);

        expect(boldButton).toBeDisabled();
        expect(italicButton).toBeDisabled();
        expect(h1Button).toBeDisabled();
      });

      it('shows disabled styling when editor is null', () => {
        render(<Toolbar editor={null} />);

        const boldButton = screen.getByTitle(/Bold/i);
        expect(boldButton.className).toContain('opacity-40');
        expect(boldButton.className).toContain('cursor-not-allowed');
      });
    });
  });

  describe('Story 4.3: Structure Formatting Functionality', () => {
    describe('Bullet List Button (AC1)', () => {
      it('calls toggleBulletList when bullet list button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const bulletListButton = screen.getByTitle(/Bullet List/i);
        fireEvent.click(bulletListButton);

        expect(mocks.toggleBulletListMock).toHaveBeenCalled();
      });

      it('shows active state when cursor is in bullet list', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'bulletList'),
        });

        render(<Toolbar editor={editor} />);

        const bulletListButton = screen.getByTitle(/Bullet List/i);
        expect(bulletListButton.className).toContain('bg-dark-active');
      });
    });

    describe('Numbered List Button (AC2)', () => {
      it('calls toggleOrderedList when numbered list button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const numberedListButton = screen.getByTitle(/Numbered List/i);
        fireEvent.click(numberedListButton);

        expect(mocks.toggleOrderedListMock).toHaveBeenCalled();
      });

      it('shows active state when cursor is in ordered list', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'orderedList'),
        });

        render(<Toolbar editor={editor} />);

        const numberedListButton = screen.getByTitle(/Numbered List/i);
        expect(numberedListButton.className).toContain('bg-dark-active');
      });
    });

    describe('Code Block Button (AC4)', () => {
      it('calls toggleCodeBlock when code block button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const codeBlockButton = screen.getByTitle(/Code Block/i);
        fireEvent.click(codeBlockButton);

        expect(mocks.toggleCodeBlockMock).toHaveBeenCalled();
      });

      it('shows active state when cursor is in code block', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'codeBlock'),
        });

        render(<Toolbar editor={editor} />);

        const codeBlockButton = screen.getByTitle(/Code Block/i);
        expect(codeBlockButton.className).toContain('bg-dark-active');
      });
    });

    describe('Link Button (AC3)', () => {
      it('opens link dialog when link button is clicked', () => {
        const editor = createMockEditor({
          getAttributes: vi.fn().mockReturnValue({}),
        });

        render(<Toolbar editor={editor} />);

        const linkButton = screen.getByTitle(/Link/i);
        fireEvent.click(linkButton);

        // Dialog should be visible
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Insert Link')).toBeInTheDocument();
      });

      it('pre-populates URL when editing existing link', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'link'),
          getAttributes: vi.fn().mockReturnValue({ href: 'https://example.com' }),
        });

        render(<Toolbar editor={editor} />);

        const linkButton = screen.getByTitle(/Link/i);
        fireEvent.click(linkButton);

        const input = screen.getByTestId('link-url-input') as HTMLInputElement;
        expect(input.value).toBe('https://example.com');
        expect(screen.getByText('Edit Link')).toBeInTheDocument();
      });

      it('shows active state when cursor is in link', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'link'),
        });

        render(<Toolbar editor={editor} />);

        const linkButton = screen.getByTitle(/Link/i);
        expect(linkButton.className).toContain('bg-dark-active');
      });

      it('calls setLink when URL is confirmed', () => {
        const setLinkMock = vi.fn().mockReturnValue({ run: vi.fn() });
        const focusMock = vi.fn().mockReturnValue({
          setLink: setLinkMock,
          toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
          toggleCodeBlock: vi.fn().mockReturnValue({ run: vi.fn() }),
          undo: vi.fn().mockReturnValue({ run: vi.fn() }),
          redo: vi.fn().mockReturnValue({ run: vi.fn() }),
          run: vi.fn(),
        });
        const chainMock = vi.fn().mockReturnValue({ focus: focusMock });

        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        // Open dialog
        const linkButton = screen.getByTitle(/Link/i);
        fireEvent.click(linkButton);

        // Enter URL
        const input = screen.getByTestId('link-url-input');
        fireEvent.change(input, { target: { value: 'https://test.com' } });

        // Confirm
        const confirmButton = screen.getByTestId('link-confirm-button');
        fireEvent.click(confirmButton);

        expect(setLinkMock).toHaveBeenCalledWith({ href: 'https://test.com' });
      });

      it('shows remove button when editing existing link', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockImplementation((type: string) => type === 'link'),
          getAttributes: vi.fn().mockReturnValue({ href: 'https://example.com' }),
        });

        render(<Toolbar editor={editor} />);

        const linkButton = screen.getByTitle(/Link/i);
        fireEvent.click(linkButton);

        expect(screen.getByTestId('link-remove-button')).toBeInTheDocument();
      });

      it('calls unsetLink when remove button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockImplementation((type: string) => type === 'link'),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({ href: 'https://example.com' }),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        // Open dialog for existing link
        const linkButton = screen.getByTitle(/Link/i);
        fireEvent.click(linkButton);

        // Click remove button
        const removeButton = screen.getByTestId('link-remove-button');
        fireEvent.click(removeButton);

        // Verify unsetLink was called
        expect(mocks.chainMock).toHaveBeenCalled();
        expect(mocks.focusMock).toHaveBeenCalled();
        expect(mocks.unsetLinkMock).toHaveBeenCalled();
        expect(mocks.runMock).toHaveBeenCalled();

        // Dialog should be closed
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('shows Link shortcut in tooltip', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        // Should show Cmd+K or Ctrl+K shortcut
        const linkButton = screen.getByTitle(/Link.*\+K/i);
        expect(linkButton).toBeInTheDocument();
      });

      it('closes dialog on cancel', () => {
        const editor = createMockEditor({
          getAttributes: vi.fn().mockReturnValue({}),
        });

        render(<Toolbar editor={editor} />);

        // Open dialog
        const linkButton = screen.getByTitle(/Link/i);
        fireEvent.click(linkButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Cancel
        const cancelButton = screen.getByTestId('link-cancel-button');
        fireEvent.click(cancelButton);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Story 4.4: Undo/Redo Support', () => {
    describe('Undo Button (AC3)', () => {
      it('calls undo command when undo button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => true, redo: () => false }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const undoButton = screen.getByTitle(/Undo/i);
        fireEvent.click(undoButton);

        expect(mocks.chainMock).toHaveBeenCalled();
        expect(mocks.focusMock).toHaveBeenCalled();
        expect(mocks.undoMock).toHaveBeenCalled();
        expect(mocks.runMock).toHaveBeenCalled();
      });

      it('shows keyboard shortcut in tooltip', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const undoButton = screen.getByTitle(/Undo.*\+Z/i);
        expect(undoButton).toBeInTheDocument();
      });
    });

    describe('Redo Button (AC4)', () => {
      it('calls redo command when redo button is clicked', () => {
        const mocks = createChainableMock();
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => true }),
          chain: mocks.chainMock,
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const redoButton = screen.getByTitle(/Redo/i);
        fireEvent.click(redoButton);

        expect(mocks.chainMock).toHaveBeenCalled();
        expect(mocks.focusMock).toHaveBeenCalled();
        expect(mocks.redoMock).toHaveBeenCalled();
        expect(mocks.runMock).toHaveBeenCalled();
      });

      it('shows keyboard shortcut in tooltip', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        // Should show either Cmd+Shift+Z (Mac) or Ctrl+Y (Windows)
        const redoButton = screen.getByTitle(/Redo.*(\+Shift\+Z|\+Y)/i);
        expect(redoButton).toBeInTheDocument();
      });
    });

    describe('Disabled States (AC5)', () => {
      it('disables undo button when cannot undo', () => {
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => false }),
          chain: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const undoButton = screen.getByTitle(/Undo/i);
        expect(undoButton).toBeDisabled();
        expect(undoButton.className).toContain('opacity-40');
      });

      it('disables redo button when cannot redo', () => {
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => true, redo: () => false }),
          chain: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const redoButton = screen.getByTitle(/Redo/i);
        expect(redoButton).toBeDisabled();
        expect(redoButton.className).toContain('opacity-40');
      });

      it('enables undo button when can undo', () => {
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => true, redo: () => false }),
          chain: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const undoButton = screen.getByTitle(/Undo/i);
        expect(undoButton).not.toBeDisabled();
        expect(undoButton.className).not.toContain('opacity-40');
      });

      it('enables redo button when can redo', () => {
        const editor = {
          isActive: vi.fn().mockReturnValue(false),
          can: vi.fn().mockReturnValue({ undo: () => false, redo: () => true }),
          chain: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          getAttributes: vi.fn().mockReturnValue({}),
        } as unknown as Editor;

        render(<Toolbar editor={editor} />);

        const redoButton = screen.getByTitle(/Redo/i);
        expect(redoButton).not.toBeDisabled();
        expect(redoButton.className).not.toContain('opacity-40');
      });
    });
  });

  describe('Story 5.3: Theme-Aware Toolbar', () => {
    describe('AC1/AC2: Toolbar Background (Dark/Light Theme)', () => {
      it('uses theme-aware background class', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const toolbar = screen.getByRole('toolbar');
        // bg-dark-base maps to --vscode-editor-background
        expect(toolbar.className).toContain('bg-dark-base');
      });
    });

    describe('AC7: Border Integration', () => {
      it('uses theme-aware border class', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const toolbar = screen.getByRole('toolbar');
        // border-border-panel maps to --vscode-panel-border
        expect(toolbar.className).toContain('border-border-panel');
      });

      it('dividers use theme-aware border color', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const dividers = document.querySelectorAll('[data-testid="toolbar-divider"]');
        dividers.forEach((divider) => {
          expect(divider.className).toContain('bg-border-panel');
        });
      });
    });

    describe('AC4: Hover States', () => {
      it('buttons have theme-aware hover class', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        // hover:bg-dark-hover maps to --vscode-toolbar-hoverBackground
        expect(boldButton.className).toContain('hover:bg-dark-hover');
      });
    });

    describe('AC5: Active States', () => {
      it('active buttons use theme-aware active class', () => {
        const editor = createMockEditor({
          isActive: vi.fn().mockReturnValue(true),
        });
        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        // bg-dark-active maps to --vscode-toolbar-activeBackground
        expect(boldButton.className).toContain('bg-dark-active');
      });
    });

    describe('AC6: Focus States for Accessibility', () => {
      it('buttons have focus-visible ring class', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        // focus-visible:ring-focus-border maps to --vscode-focusBorder
        expect(boldButton.className).toContain('focus-visible:ring-2');
        expect(boldButton.className).toContain('focus-visible:ring-focus-border');
      });

      it('buttons have outline removed on focus-visible', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        expect(boldButton.className).toContain('focus-visible:outline-none');
      });
    });

    describe('Theme Variable Usage', () => {
      it('buttons use theme-aware text color', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const boldButton = screen.getByTitle(/Bold/i);
        // text-text-primary maps to --vscode-editor-foreground
        expect(boldButton.className).toContain('text-text-primary');
      });

      it('does not use hardcoded color values in class names', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        const toolbar = screen.getByRole('toolbar');
        const boldButton = screen.getByTitle(/Bold/i);

        // Check that no hardcoded hex colors are in the class names
        const hexColorPattern = /#[0-9A-Fa-f]{3,6}/;
        expect(toolbar.className).not.toMatch(hexColorPattern);
        expect(boldButton.className).not.toMatch(hexColorPattern);
      });
    });
  });

  describe('Story 5.4: Source/Visual Toggle', () => {
    describe('AC1: Toggle Button in Toolbar', () => {
      it('renders toggle button when onToggleViewMode is provided', () => {
        const editor = createMockEditor();
        const mockToggle = vi.fn();
        render(
          <Toolbar
            editor={editor}
            viewMode="visual"
            onToggleViewMode={mockToggle}
          />
        );

        // Should find the toggle button by its tooltip
        const toggleButton = screen.getByTitle(/View Source/i);
        expect(toggleButton).toBeInTheDocument();
      });

      it('does not render toggle button when onToggleViewMode is not provided', () => {
        const editor = createMockEditor();
        render(<Toolbar editor={editor} />);

        // Should not find the toggle button
        expect(screen.queryByTitle(/View Source/i)).not.toBeInTheDocument();
        expect(screen.queryByTitle(/Visual View/i)).not.toBeInTheDocument();
      });

      it('shows keyboard shortcut in tooltip', () => {
        const editor = createMockEditor();
        render(
          <Toolbar
            editor={editor}
            viewMode="visual"
            onToggleViewMode={vi.fn()}
          />
        );

        // Should show Cmd+Shift+V or Ctrl+Shift+V shortcut
        const toggleButton = screen.getByTitle(/View Source.*\+Shift\+V/i);
        expect(toggleButton).toBeInTheDocument();
      });
    });

    describe('AC2: Switch to Source View', () => {
      it('shows Code2 icon with "View Source" tooltip when in visual mode', () => {
        const editor = createMockEditor();
        render(
          <Toolbar
            editor={editor}
            viewMode="visual"
            onToggleViewMode={vi.fn()}
          />
        );

        const toggleButton = screen.getByTitle(/View Source/i);
        expect(toggleButton).toBeInTheDocument();
        // The button should contain the Code2 icon (SVG)
        const svg = toggleButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });

      it('calls onToggleViewMode when toggle button is clicked', () => {
        const editor = createMockEditor();
        const mockToggle = vi.fn();
        render(
          <Toolbar
            editor={editor}
            viewMode="visual"
            onToggleViewMode={mockToggle}
          />
        );

        const toggleButton = screen.getByTitle(/View Source/i);
        fireEvent.click(toggleButton);

        expect(mockToggle).toHaveBeenCalledTimes(1);
      });
    });

    describe('AC5: Switch Back to Visual View', () => {
      it('shows Eye icon with "Visual View" tooltip when in source mode', () => {
        const editor = createMockEditor();
        render(
          <Toolbar
            editor={editor}
            viewMode="source"
            onToggleViewMode={vi.fn()}
          />
        );

        const toggleButton = screen.getByTitle(/Visual View/i);
        expect(toggleButton).toBeInTheDocument();
        // The button should contain the Eye icon (SVG)
        const svg = toggleButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });

      it('calls onToggleViewMode when in source mode and button clicked', () => {
        const editor = createMockEditor();
        const mockToggle = vi.fn();
        render(
          <Toolbar
            editor={editor}
            viewMode="source"
            onToggleViewMode={mockToggle}
          />
        );

        const toggleButton = screen.getByTitle(/Visual View/i);
        fireEvent.click(toggleButton);

        expect(mockToggle).toHaveBeenCalledTimes(1);
      });
    });

    describe('Toggle Button Position', () => {
      it('renders divider before toggle button', () => {
        const editor = createMockEditor();
        render(
          <Toolbar
            editor={editor}
            viewMode="visual"
            onToggleViewMode={vi.fn()}
          />
        );

        // Toggle button should have a divider before it
        const dividers = document.querySelectorAll('[data-testid="toolbar-divider"]');
        // Should have multiple dividers including one for the toggle section
        expect(dividers.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
