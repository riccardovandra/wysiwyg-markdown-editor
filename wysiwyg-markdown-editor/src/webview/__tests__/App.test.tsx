import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import { mockVSCodeApi } from './setup';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Editor component', () => {
    render(<App />);
    // Editor renders a div with prose class containing the TipTap editor
    expect(document.querySelector('.prose')).toBeInTheDocument();
  });

  it('posts ready message on mount', () => {
    render(<App />);
    expect(mockVSCodeApi.postMessage).toHaveBeenCalledWith({ type: 'ready' });
  });

  it('only posts ready message once', () => {
    render(<App />);
    expect(mockVSCodeApi.postMessage).toHaveBeenCalledTimes(1);
  });

  it('applies VS Code theme classes to container', () => {
    const { container } = render(<App />);
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('bg-vscode-bg');
    expect(rootDiv).toHaveClass('text-vscode-fg');
  });
});
