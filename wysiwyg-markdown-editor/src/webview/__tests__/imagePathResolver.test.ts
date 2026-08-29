import { describe, it, expect } from 'vitest';
import {
  resolveImageSrc,
  unresolveImageSrc,
} from '../utils/imagePathResolver';

describe('imagePathResolver', () => {
  const baseUri = 'https://vscode-webview://abc/workspace/docs';

  describe('resolveImageSrc', () => {
    it('passes through https URLs unchanged', () => {
      expect(
        resolveImageSrc('https://example.com/image.png', baseUri)
      ).toBe('https://example.com/image.png');
    });

    it('passes through http URLs unchanged', () => {
      expect(
        resolveImageSrc('http://example.com/image.png', baseUri)
      ).toBe('http://example.com/image.png');
    });

    it('passes through data URIs unchanged', () => {
      const data = 'data:image/png;base64,iVBORw0KGgo';
      expect(resolveImageSrc(data, baseUri)).toBe(data);
    });

    it('passes through file URIs unchanged', () => {
      expect(
        resolveImageSrc('file:///Users/me/image.png', baseUri)
      ).toBe('file:///Users/me/image.png');
    });

    it('passes through blob URIs unchanged', () => {
      expect(
        resolveImageSrc('blob:https://example.com/abc-123', baseUri)
      ).toBe('blob:https://example.com/abc-123');
    });

    it('joins relative paths with baseUri', () => {
      expect(resolveImageSrc('./images/flow.png', baseUri)).toBe(
        `${baseUri}/images/flow.png`
      );
    });

    it('joins relative paths without leading "./"', () => {
      expect(resolveImageSrc('images/flow.png', baseUri)).toBe(
        `${baseUri}/images/flow.png`
      );
    });

    it('handles parent-relative paths (../) by leaving them as-is for browser URL resolution', () => {
      // Browser <img src> resolves '../foo' against the page URL
      const result = resolveImageSrc('../assets/photo.jpg', baseUri);
      expect(result).toBe(`${baseUri}/../assets/photo.jpg`);
    });

    it('returns empty string when src is empty', () => {
      expect(resolveImageSrc('', baseUri)).toBe('');
    });

    it('handles spaces in path (encoded by marked)', () => {
      // marked URL-encodes spaces; the resolver should pass through verbatim.
      expect(
        resolveImageSrc('./my%20image.png', baseUri)
      ).toBe(`${baseUri}/my%20image.png`);
    });

    it('handles src with query string', () => {
      expect(
        resolveImageSrc('./foo.png?v=2', baseUri)
      ).toBe(`${baseUri}/foo.png?v=2`);
    });

    it('returns src unchanged when baseUri is empty', () => {
      expect(resolveImageSrc('./flow.png', '')).toBe('./flow.png');
    });

    it('strips trailing slash on baseUri before joining', () => {
      expect(
        resolveImageSrc('./flow.png', `${baseUri}/`)
      ).toBe(`${baseUri}/flow.png`);
    });
  });

  describe('unresolveImageSrc', () => {
    it('strips baseUri prefix back to relative path', () => {
      expect(
        unresolveImageSrc(`${baseUri}/images/flow.png`, baseUri)
      ).toBe('./images/flow.png');
    });

    it('passes through https URLs unchanged', () => {
      expect(
        unresolveImageSrc('https://example.com/image.png', baseUri)
      ).toBe('https://example.com/image.png');
    });

    it('passes through file URIs unchanged', () => {
      expect(
        unresolveImageSrc('file:///Users/me/image.png', baseUri)
      ).toBe('file:///Users/me/image.png');
    });

    it('passes through data URIs unchanged', () => {
      const data = 'data:image/png;base64,iVBORw0KGgo';
      expect(unresolveImageSrc(data, baseUri)).toBe(data);
    });

    it('returns src unchanged when it does not start with baseUri', () => {
      expect(
        unresolveImageSrc('https://elsewhere.com/foo.png', baseUri)
      ).toBe('https://elsewhere.com/foo.png');
    });

    it('returns empty string when src is empty', () => {
      expect(unresolveImageSrc('', baseUri)).toBe('');
    });

    it('returns src unchanged when baseUri is empty', () => {
      expect(unresolveImageSrc('something', '')).toBe('something');
    });

    it('strips trailing slash on baseUri before comparing', () => {
      expect(
        unresolveImageSrc(`${baseUri}/flow.png`, `${baseUri}/`)
      ).toBe('./flow.png');
    });
  });

  describe('round-trip', () => {
    it('preserves relative path through resolve→unresolve', () => {
      const original = './images/flow.png';
      const resolved = resolveImageSrc(original, baseUri);
      const back = unresolveImageSrc(resolved, baseUri);
      expect(back).toBe(original);
    });

    it('preserves remote URL through resolve→unresolve', () => {
      const original = 'https://example.com/image.png';
      const resolved = resolveImageSrc(original, baseUri);
      const back = unresolveImageSrc(resolved, baseUri);
      expect(back).toBe(original);
    });

    it('preserves file URI through resolve→unresolve', () => {
      const original = 'file:///Users/me/image.png';
      const resolved = resolveImageSrc(original, baseUri);
      const back = unresolveImageSrc(resolved, baseUri);
      expect(back).toBe(original);
    });

    it('preserves data URI through resolve→unresolve', () => {
      const original = 'data:image/png;base64,iVBORw0KGgo';
      const resolved = resolveImageSrc(original, baseUri);
      const back = unresolveImageSrc(resolved, baseUri);
      expect(back).toBe(original);
    });
  });
});
