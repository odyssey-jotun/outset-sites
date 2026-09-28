import { describe, it, expect } from 'vitest';
import { responsiveWidths } from '../src/lib/responsive-widths';

describe('responsiveWidths', () => {
  it('keeps requested widths below the source width', () => {
    expect(responsiveWidths(1200, [400, 800, 1200])).toEqual([400, 800, 1200]);
  });
  it('never asks for a width above the source', () => {
    expect(responsiveWidths(800, [480, 760, 1100])).toEqual([480, 760, 800]);
  });
  it('falls back to the source width alone when it is smaller than every request', () => {
    expect(responsiveWidths(400, [480, 760, 1100])).toEqual([400]);
  });
  it('returns ascending widths', () => {
    const out = responsiveWidths(1000, [800, 400, 1000]);
    expect(out).toEqual([...out].sort((a, b) => a - b));
  });
  it('handles a missing or zero source width without throwing', () => {
    expect(responsiveWidths(0, [400, 800])).toEqual([400, 800]);
  });
});
