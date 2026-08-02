import { formatINR } from './currency';

describe('formatINR', () => {
  it('formats cents as a two-decimal rupee string', () => {
    expect(formatINR(3333)).toBe('₹33.33');
    expect(formatINR(10000)).toBe('₹100.00');
    expect(formatINR(0)).toBe('₹0.00');
  });
});
