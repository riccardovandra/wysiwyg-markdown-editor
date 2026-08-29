import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLinkClickHandler } from '../hooks/useLinkClickHandler';

// Mock editor with view.dom element
function createMockEditor() {
  const dom = document.createElement('div');
  dom.innerHTML = `
    <p>Some text with <a href="./other.md">a link</a> to another file.</p>
    <p>And an <a href="https://example.com">external link</a>.</p>
  `;

  return {
    view: { dom },
    // Add other minimal editor properties if needed
  };
}

describe('useLinkClickHandler', () => {
  let mockEditor: ReturnType<typeof createMockEditor>;
  let onLinkClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEditor = createMockEditor();
    onLinkClick = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when editor is null', () => {
    renderHook(() =>
      useLinkClickHandler({ editor: null, onLinkClick })
    );

    // Should not throw and callback should not be called
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('attaches click handler to editor DOM', () => {
    const addEventListenerSpy = vi.spyOn(mockEditor.view.dom, 'addEventListener');

    renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
  });

  it('removes click handler on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(mockEditor.view.dom, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
  });

  it('calls onLinkClick when anchor is clicked', () => {
    renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    // Find the anchor element and simulate click
    const anchor = mockEditor.view.dom.querySelector('a[href="./other.md"]');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onLinkClick).toHaveBeenCalledWith('./other.md');
  });

  it('calls onLinkClick with external URL', () => {
    renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    // Find the external anchor and simulate click
    const anchor = mockEditor.view.dom.querySelector('a[href="https://example.com"]');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onLinkClick).toHaveBeenCalledWith('https://example.com');
  });

  it('prevents default navigation on link click', () => {
    renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    const anchor = mockEditor.view.dom.querySelector('a');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    anchor!.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not call onLinkClick when non-anchor is clicked', () => {
    renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    // Click on paragraph text, not anchor
    const paragraph = mockEditor.view.dom.querySelector('p');
    expect(paragraph).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    paragraph!.dispatchEvent(clickEvent);

    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('handles click on element inside anchor', () => {
    // Add anchor with nested element
    const complexDom = document.createElement('div');
    complexDom.innerHTML = `<a href="./nested.md"><strong>Bold link text</strong></a>`;
    mockEditor.view.dom.appendChild(complexDom);

    renderHook(() =>
      useLinkClickHandler({
        editor: mockEditor as any,
        onLinkClick,
      })
    );

    // Click on the strong element inside the anchor
    const strongElement = complexDom.querySelector('strong');
    expect(strongElement).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    strongElement!.dispatchEvent(clickEvent);

    // Should find the parent anchor and extract href
    expect(onLinkClick).toHaveBeenCalledWith('./nested.md');
  });

  it('updates handler when onLinkClick callback changes', () => {
    const { rerender } = renderHook(
      ({ onLinkClick }) =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
        }),
      { initialProps: { onLinkClick } }
    );

    // Click link with original callback
    const anchor = mockEditor.view.dom.querySelector('a');
    anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onLinkClick).toHaveBeenCalledTimes(1);

    // Update callback
    const newOnLinkClick = vi.fn();
    rerender({ onLinkClick: newOnLinkClick });

    // Click again
    anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(newOnLinkClick).toHaveBeenCalledTimes(1);
  });

  describe('code link handling (CodeLinks decorations)', () => {
    it('calls onLinkClick with data-href when a decorated URL in a code block is clicked', () => {
      const codeDom = document.createElement('div');
      codeDom.innerHTML =
        '<pre><code>see <span class="code-link" data-href="https://example.com/x">https://example.com/x</span></code></pre>';
      mockEditor.view.dom.appendChild(codeDom);

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
        })
      );

      const span = codeDom.querySelector('.code-link');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      span!.dispatchEvent(clickEvent);

      expect(onLinkClick).toHaveBeenCalledWith('https://example.com/x');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles clicks on nested highlight spans inside a code link', () => {
      const codeDom = document.createElement('div');
      codeDom.innerHTML =
        '<pre><code><span class="code-link" data-href="https://example.com/y"><span class="hljs-link">https://example.com/y</span></span></code></pre>';
      mockEditor.view.dom.appendChild(codeDom);

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
        })
      );

      codeDom.querySelector('.hljs-link')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onLinkClick).toHaveBeenCalledWith('https://example.com/y');
    });

    it('ignores code text that is not a decorated link', () => {
      const codeDom = document.createElement('div');
      codeDom.innerHTML = '<pre><code>const x = 1;</code></pre>';
      mockEditor.view.dom.appendChild(codeDom);

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
        })
      );

      codeDom.querySelector('code')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onLinkClick).not.toHaveBeenCalled();
    });
  });

  describe('anchor link handling (Story 11-7)', () => {
    it('does NOT call onLinkClick for anchor-only links', () => {
      // Add anchor link with # href
      const anchorDom = document.createElement('div');
      anchorDom.innerHTML = `<a href="#setup">Jump to Setup</a>`;
      mockEditor.view.dom.appendChild(anchorDom);

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
        })
      );

      const anchor = anchorDom.querySelector('a');
      anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Should NOT call onLinkClick for anchor links
      expect(onLinkClick).not.toHaveBeenCalled();
    });

    it('calls onAnchorClick callback for anchor-only links', () => {
      const anchorDom = document.createElement('div');
      anchorDom.innerHTML = `<a href="#api-reference">Jump to API</a>`;
      mockEditor.view.dom.appendChild(anchorDom);

      const onAnchorClick = vi.fn();

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
          onAnchorClick,
        })
      );

      const anchor = anchorDom.querySelector('a');
      anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onAnchorClick).toHaveBeenCalledWith('api-reference');
      expect(onLinkClick).not.toHaveBeenCalled();
    });

    it('still calls onLinkClick for file links', () => {
      const anchorDom = document.createElement('div');
      anchorDom.innerHTML = `<a href="./readme.md#section">File with anchor</a>`;
      mockEditor.view.dom.appendChild(anchorDom);

      const onAnchorClick = vi.fn();

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
          onAnchorClick,
        })
      );

      const anchor = anchorDom.querySelector('a');
      anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // File link with anchor should still go to extension
      expect(onLinkClick).toHaveBeenCalledWith('./readme.md#section');
      expect(onAnchorClick).not.toHaveBeenCalled();
    });

    it('handles anchor links with just hash', () => {
      const anchorDom = document.createElement('div');
      anchorDom.innerHTML = `<a href="#">Empty anchor</a>`;
      mockEditor.view.dom.appendChild(anchorDom);

      const onAnchorClick = vi.fn();

      renderHook(() =>
        useLinkClickHandler({
          editor: mockEditor as any,
          onLinkClick,
          onAnchorClick,
        })
      );

      const anchor = anchorDom.querySelector('a');
      anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Empty anchor should call with empty string
      expect(onAnchorClick).toHaveBeenCalledWith('');
      expect(onLinkClick).not.toHaveBeenCalled();
    });
  });
});
