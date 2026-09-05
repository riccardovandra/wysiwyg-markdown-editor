import { describe, it, expect } from 'vitest';
import { wideBlockMax } from '../hooks/useWideBlockBounds';

describe('wideBlockMax', () => {
  it('uses the whole pane when the column is centered', () => {
    // Pane 1200px wide, column 800px wide and centered
    expect(wideBlockMax({ left: 0, right: 1200 }, { left: 200, right: 1000 })).toBe(1200);
  });

  it('is limited by the nearer edge when the column is shifted right (comment gutter)', () => {
    // Column center at 700 in a 1200px pane: 500px of room on the right, 700px on the left
    expect(wideBlockMax({ left: 0, right: 1200 }, { left: 400, right: 1000 })).toBe(1000);
  });

  it('is limited by the nearer edge when the column is shifted left', () => {
    expect(wideBlockMax({ left: 0, right: 1200 }, { left: 100, right: 700 })).toBe(800);
  });

  it('never returns less than the column width', () => {
    // Column wider than the pane (pane narrower than the reading column)
    expect(wideBlockMax({ left: 100, right: 600 }, { left: 50, right: 650 })).toBe(600);
  });

  it('works with viewport offsets', () => {
    expect(wideBlockMax({ left: 300, right: 1500 }, { left: 500, right: 1300 })).toBe(1200);
  });
});
