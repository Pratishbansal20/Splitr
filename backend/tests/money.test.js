const {
  toCents,
  fromCents,
  splitEqually,
  reconcileShareCents,
  validateSplitSum,
  computeGroupBalances,
} = require('../services/money');

describe('toCents / fromCents', () => {
  it('converts rupees to cents and back', () => {
    expect(toCents(33.33)).toBe(3333);
    expect(toCents(100)).toBe(10000);
    expect(fromCents(3333)).toBeCloseTo(33.33);
  });
});

describe('splitEqually', () => {
  it('splits evenly when it divides cleanly', () => {
    const result = splitEqually(10000, ['a', 'b']);
    expect(result.map((r) => r.shareCents)).toEqual([5000, 5000]);
  });

  it('distributes the remainder so shares sum exactly to the total (₹100 / 3)', () => {
    const result = splitEqually(10000, ['a', 'b', 'c']);
    const sum = result.reduce((s, r) => s + r.shareCents, 0);
    expect(sum).toBe(10000);
    expect(result.map((r) => r.shareCents).sort()).toEqual([3333, 3333, 3334]);
  });

  it('handles a split smaller than 1 cent per person', () => {
    const result = splitEqually(1, ['a', 'b', 'c']);
    expect(result.reduce((s, r) => s + r.shareCents, 0)).toBe(1);
  });
});

describe('reconcileShareCents', () => {
  it('fixes shares that were rounded independently and no longer sum to the total', () => {
    // The classic bug: 100 / 3 stored as 33.33 x3 = 99.99, not 100.00
    const result = reconcileShareCents(10000, [
      { user: 'a', share: 33.33 },
      { user: 'b', share: 33.33 },
      { user: 'c', share: 33.33 },
    ]);
    const sum = result.reduce((s, r) => s + r.shareCents, 0);
    expect(sum).toBe(10000);
  });

  it('is a no-op when shares already sum exactly', () => {
    const result = reconcileShareCents(10000, [
      { user: 'a', share: 40 },
      { user: 'b', share: 60 },
    ]);
    expect(result).toEqual([
      { user: 'a', shareCents: 4000 },
      { user: 'b', shareCents: 6000 },
    ]);
  });
});

describe('validateSplitSum', () => {
  it('returns true when shares sum to the total', () => {
    expect(validateSplitSum(10000, [{ shareCents: 4000 }, { shareCents: 6000 }])).toBe(true);
  });

  it('returns false when they do not', () => {
    expect(validateSplitSum(10000, [{ shareCents: 4000 }, { shareCents: 5999 }])).toBe(false);
  });
});

describe('computeGroupBalances', () => {
  const expenses = [
    {
      paidBy: 'alice',
      amountCents: 10000,
      split: [
        { user: 'alice', shareCents: 5000 },
        { user: 'bob', shareCents: 5000 },
      ],
    },
  ];

  it('computes the payer\'s net balance and per-counterparty balance', () => {
    const { myBalanceCents, balanceMapCents } = computeGroupBalances(expenses, 'alice');
    expect(myBalanceCents).toBe(5000);
    expect(balanceMapCents.bob).toBe(5000);
  });

  it('computes the non-payer\'s perspective', () => {
    const { myBalanceCents, balanceMapCents } = computeGroupBalances(expenses, 'bob');
    expect(myBalanceCents).toBe(-5000);
    expect(balanceMapCents.alice).toBe(-5000);
  });

  it('falls back to legacy rupee fields when cents fields are absent (pre-migration documents)', () => {
    const legacyExpenses = [
      {
        paidBy: 'alice',
        amount: 100,
        split: [
          { user: 'alice', share: 50 },
          { user: 'bob', share: 50 },
        ],
      },
    ];
    const { myBalanceCents } = computeGroupBalances(legacyExpenses, 'alice');
    expect(myBalanceCents).toBe(5000);
  });
});
