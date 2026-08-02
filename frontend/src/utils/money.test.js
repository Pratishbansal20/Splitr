import { toCents, fromCents, splitEqually, expenseAmountCents, splitShareCents, sumRupeesAsCents } from './money';

describe('toCents / fromCents', () => {
  it('converts rupees to cents and back', () => {
    expect(toCents(33.33)).toBe(3333);
    expect(toCents(100)).toBe(10000);
    expect(fromCents(3333)).toBeCloseTo(33.33);
  });
});

describe('splitEqually', () => {
  it('splits evenly when it divides cleanly', () => {
    expect(splitEqually(10000, 2)).toEqual([5000, 5000]);
  });

  it('distributes the remainder so shares sum exactly to the total (₹100 / 3)', () => {
    const shares = splitEqually(10000, 3);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    expect([...shares].sort()).toEqual([3333, 3333, 3334]);
  });
});

describe('expenseAmountCents / splitShareCents', () => {
  it('reads the cents field when present', () => {
    expect(expenseAmountCents({ amountCents: 5000, amount: 999 })).toBe(5000);
    expect(splitShareCents({ shareCents: 2500, share: 999 })).toBe(2500);
  });

  it('falls back to the legacy rupee field when cents are absent', () => {
    expect(expenseAmountCents({ amount: 50 })).toBe(5000);
    expect(splitShareCents({ share: 25 })).toBe(2500);
  });
});

describe('sumRupeesAsCents', () => {
  it('sums rupee values without reintroducing float drift', () => {
    expect(sumRupeesAsCents([33.33, 33.33, 33.34])).toBe(10000);
  });
});
