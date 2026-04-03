import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTipTapEditor } from '../hooks/useTipTapEditor';

describe('useTipTapEditor', () => {
  it('returns an editor instance', async () => {
    const { result } = renderHook(() => useTipTapEditor());

    // Editor may be null initially, wait for it to initialize
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toBeDefined();
  });

  it('accepts initial content parameter', async () => {
    const initialContent = '<p>Hello world</p>';
    const { result } = renderHook(() =>
      useTipTapEditor({ initialContent })
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.getHTML()).toContain('Hello world');
  });

  it('returns editor with editable set to true', async () => {
    const { result } = renderHook(() => useTipTapEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.isEditable).toBe(true);
  });

  it('editor has StarterKit extensions loaded', async () => {
    const { result } = renderHook(() => useTipTapEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    // StarterKit includes these extensions
    const extensionNames = result.current?.extensionManager.extensions.map(
      (ext) => ext.name
    );
    expect(extensionNames).toContain('paragraph');
    expect(extensionNames).toContain('text');
    expect(extensionNames).toContain('bold');
    expect(extensionNames).toContain('italic');
  });

  it('editor has Link extension loaded', async () => {
    const { result } = renderHook(() => useTipTapEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const extensionNames = result.current?.extensionManager.extensions.map(
      (ext) => ext.name
    );
    expect(extensionNames).toContain('link');
  });

  it('editor has Placeholder extension loaded', async () => {
    const { result } = renderHook(() => useTipTapEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const extensionNames = result.current?.extensionManager.extensions.map(
      (ext) => ext.name
    );
    expect(extensionNames).toContain('placeholder');
  });

  it('cleans up editor on unmount', async () => {
    const { result, unmount } = renderHook(() => useTipTapEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const editor = result.current;
    unmount();

    // After unmount, editor should be destroyed (may be async)
    await waitFor(() => {
      expect(editor?.isDestroyed).toBe(true);
    });
  });
});
