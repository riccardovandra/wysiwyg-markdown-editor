import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Editor } from '../components/Editor';
import { useTipTapEditor } from '../hooks/useTipTapEditor';

/**
 * Test wrapper component that provides a real TipTap editor instance.
 * This allows us to test Editor component behavior with actual TipTap functionality.
 */
function EditorWithHook() {
  const editor = useTipTapEditor();
  return <Editor editor={editor} />;
}

describe('Editor', () => {
  it('renders without error with null editor', () => {
    const { container } = render(<Editor editor={null} />);
    expect(container.querySelector('.prose')).toBeInTheDocument();
  });

  it('renders with prose styling classes', () => {
    const { container } = render(<Editor editor={null} />);
    const proseElement = container.querySelector('.prose');
    expect(proseElement).toHaveClass('prose-slate');
    expect(proseElement).toHaveClass('prose-lg'); // Story 5.1: Larger prose for readability
  });

  it('renders the TipTap editor content area', () => {
    render(<EditorWithHook />);
    // TipTap renders a contenteditable div with class "tiptap"
    const editorContent = document.querySelector('.tiptap');
    expect(editorContent).toBeInTheDocument();
  });

  it('editor is focusable (contenteditable)', () => {
    render(<EditorWithHook />);
    const editorContent = document.querySelector('.tiptap');
    expect(editorContent).toBeInTheDocument();
    // TipTap sets contenteditable="true" for editable editors
    expect(editorContent).toHaveAttribute('contenteditable', 'true');
  });

  it('shows placeholder text when editor is empty', () => {
    render(<EditorWithHook />);
    // TipTap adds data-placeholder attribute to empty paragraphs
    const placeholder = document.querySelector('[data-placeholder]');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('data-placeholder', 'Start typing...');
  });

  it('has comfortable padding with responsive classes', () => {
    const { container } = render(<Editor editor={null} />);
    // Story 5.1: Content container with constrained width and responsive padding
    const contentContainer = container.querySelector('.max-w-3xl');
    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass('mx-auto'); // Centered
    expect(contentContainer).toHaveClass('py-8'); // Vertical padding
  });

  it('fills available height (min-h-screen)', () => {
    const { container } = render(<Editor editor={null} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen');
  });
});
