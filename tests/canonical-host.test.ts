import { describe, it, expect } from 'vitest';
import { isProductionHost } from '../src/lib/canonical-host';

describe('isProductionHost', () => {
  it('accepts the apex and www', () => {
    expect(isProductionHost('outsetsites.com')).toBe(true);
    expect(isProductionHost('www.outsetsites.com')).toBe(true);
    expect(isProductionHost('OutsetSites.com')).toBe(true);
  });
  it('rejects previews and localhost', () => {
    expect(isProductionHost('outset-sites.someone.workers.dev')).toBe(false);
    expect(isProductionHost('localhost:4321')).toBe(false);
    expect(isProductionHost('')).toBe(false);
  });
});
