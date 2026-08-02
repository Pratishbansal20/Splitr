// Pure money/split helpers — no Mongoose/Express dependency, safe to unit test
// directly. Everything here works in integer cents (paise) to avoid the
// float-drift bugs that come from doing arithmetic on rupee amounts.

function toCents(rupees) {
  return Math.round(Number(rupees) * 100);
}

function fromCents(cents) {
  return cents / 100;
}

// Splits `amountCents` across `userIds` as evenly as possible so the shares
// always sum to exactly `amountCents` (largest-remainder method; ties broken
// by input order since every share has the same fractional remainder).
function splitEqually(amountCents, userIds) {
  const n = userIds.length;
  if (n === 0) return [];

  const base = Math.floor(amountCents / n);
  const remainder = amountCents - base * n;

  return userIds.map((user, i) => ({
    user,
    shareCents: base + (i < remainder ? 1 : 0),
  }));
}

// Converts a set of raw rupee shares (which may not sum exactly to the total
// due to independent client-side rounding) into integer cents that sum
// EXACTLY to `amountCents`, redistributing the rounding error via the
// largest-remainder method.
function reconcileShareCents(amountCents, rawShares) {
  if (rawShares.length === 0) return [];

  const entries = rawShares.map((s) => {
    const exact = Number(s.share) * 100;
    const rounded = Math.round(exact);
    return { user: s.user, shareCents: rounded, remainder: exact - rounded };
  });

  const diff = amountCents - entries.reduce((sum, e) => sum + e.shareCents, 0);

  if (diff !== 0) {
    const order = entries
      .map((_, i) => i)
      .sort((a, b) =>
        diff > 0 ? entries[b].remainder - entries[a].remainder : entries[a].remainder - entries[b].remainder
      );
    const step = diff > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(diff); i += 1) {
      entries[order[i % order.length]].shareCents += step;
    }
  }

  return entries.map(({ user, shareCents }) => ({ user, shareCents }));
}

function validateSplitSum(amountCents, splitCents) {
  const sum = splitCents.reduce((total, s) => total + s.shareCents, 0);
  return sum === amountCents;
}

// Reads the integer-cents field if present, otherwise derives it from the
// legacy float rupee field — lets balance math work on both migrated and
// not-yet-migrated documents.
function expenseAmountCents(expense) {
  return typeof expense.amountCents === 'number' ? expense.amountCents : toCents(expense.amount);
}

function splitShareCents(splitEntry) {
  return typeof splitEntry.shareCents === 'number' ? splitEntry.shareCents : toCents(splitEntry.share);
}

// Computes, for `userId`, their net balance and per-counterparty balances
// across `expenses`. Mirrors the balance logic that used to live inline in
// groupController's list endpoint — now in one tested, reusable place.
function computeGroupBalances(expenses, userId) {
  let myBalanceCents = 0;
  const balanceMapCents = {};

  expenses.forEach((exp) => {
    const payerId = exp.paidBy.toString();
    const amountCents = expenseAmountCents(exp);
    const mySplit = exp.split.find((s) => s.user.toString() === userId);

    if (payerId === userId) {
      exp.split.forEach((s) => {
        const otherId = s.user.toString();
        if (otherId !== userId) {
          balanceMapCents[otherId] = (balanceMapCents[otherId] || 0) + splitShareCents(s);
        }
      });
      myBalanceCents += amountCents;
    } else if (mySplit) {
      balanceMapCents[payerId] = (balanceMapCents[payerId] || 0) - splitShareCents(mySplit);
    }

    if (mySplit) {
      myBalanceCents -= splitShareCents(mySplit);
    }
  });

  return { myBalanceCents, balanceMapCents };
}

module.exports = {
  toCents,
  fromCents,
  splitEqually,
  reconcileShareCents,
  validateSplitSum,
  expenseAmountCents,
  splitShareCents,
  computeGroupBalances,
};
