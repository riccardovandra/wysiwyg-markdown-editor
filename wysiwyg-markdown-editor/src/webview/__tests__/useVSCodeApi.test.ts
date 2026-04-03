import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVSCodeApi } from '../hooks/useVSCodeApi';

describe('useVSCodeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the VS Code API', () => {
    const api = useVSCodeApi();
    expect(api).toBeDefined();
    expect(typeof api.postMessage).toBe('function');
    expect(typeof api.getState).toBe('function');
    expect(typeof api.setState).toBe('function');
  });

  it('returns the same instance on multiple calls (singleton)', () => {
    const api1 = useVSCodeApi();
    const api2 = useVSCodeApi();
    expect(api1).toBe(api2);
  });

  it('can post messages', () => {
    const api = useVSCodeApi();
    api.postMessage({ type: 'ready' });
    // The mock should have been called
    expect(api.postMessage).toHaveBeenCalledWith({ type: 'ready' });
  });
});
