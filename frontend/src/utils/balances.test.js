import { computeMemberBalances, isEqualSplit } from './balances';

const group = {
  members: [{ _id: 'alice' }, { _id: 'bob' }, { _id: 'carol' }],
};

describe('computeMemberBalances', () => {
  it('nets an equal 3-way split to exactly zero (largest-remainder distribution)', () => {
    const expenses = [
      {
        paidBy: { _id: 'alice' },
        amountCents: 10000,
        split: [
          { user: { _id: 'alice' }, shareCents: 3334 },
          { user: { _id: 'bob' }, shareCents: 3333 },
          { user: { _id: 'carol' }, shareCents: 3333 },
        ],
      },
    ];
    const balances = computeMemberBalances(group, expenses);
    const byId = Object.fromEntries(balances.map(b => [b.id, b.netBalanceCents]));
    expect(byId.alice).toBe(6666);
    expect(byId.bob).toBe(-3333);
    expect(byId.carol).toBe(-3333);
    expect(balances.reduce((s, b) => s + b.netBalanceCents, 0)).toBe(0);
  });

  it('falls back to legacy rupee fields when cents are absent', () => {
    const expenses = [
      {
        paidBy: { _id: 'alice' },
        amount: 100,
        split: [
          { user: { _id: 'alice' }, share: 50 },
          { user: { _id: 'bob' }, share: 50 },
        ],
      },
    ];
    const balances = computeMemberBalances(group, expenses);
    const byId = Object.fromEntries(balances.map(b => [b.id, b.netBalanceCents]));
    expect(byId.alice).toBe(5000);
    expect(byId.bob).toBe(-5000);
  });

  it('returns an empty array when there is no group', () => {
    expect(computeMemberBalances(null, [])).toEqual([]);
  });
});

describe('isEqualSplit', () => {
  it('recognizes an exact equal split', () => {
    const splits = [{ shareCents: 5000 }, { shareCents: 5000 }];
    expect(isEqualSplit(100, splits)).toBe(true);
  });

  it('recognizes an equal split that used the largest-remainder distribution', () => {
    const splits = [{ shareCents: 3334 }, { shareCents: 3333 }, { shareCents: 3333 }];
    expect(isEqualSplit(100, splits)).toBe(true);
  });

  it('rejects a genuinely unequal split', () => {
    const splits = [{ shareCents: 8000 }, { shareCents: 2000 }];
    expect(isEqualSplit(100, splits)).toBe(false);
  });
});
