import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook that returns a debounced version of the provided callback.
 *
 * The debounced function delays invoking the callback until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked. This is useful
 * for preventing excessive API calls or expensive operations during rapid user input.
 *
 * @param callback - The function to debounce
 * @param delay - The number of milliseconds to delay (default: 300ms from SYNC_DEBOUNCE_MS)
 * @returns A debounced version of the callback
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebounce((content: string) => {
 *   vscode.postMessage({ type: 'contentChanged', markdown: content });
 * }, SYNC_DEBOUNCE_MS);
 *
 * // Call debouncedSave on every keystroke - it will only fire after 300ms of inactivity
 * editor.on('update', () => debouncedSave(editor.getHTML()));
 * ```
 */
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
