import { toCents, splitEqually, expenseAmountCents, splitShareCents } from './money';

// Computes each group member's net balance in cents from a list of expenses.
// Settlements and expenses affect balance identically: the payer's balance
// goes up by the amount, each split participant's balance goes down by
// their share.
export function computeMemberBalances(group, expenses) {
  if (!group) return [];
  const balancesCents = {};
  group.members.forEach(m => { balancesCents[m._id] = 0; });

  expenses.forEach(exp => {
    const payerId = exp.paidBy._id;
    const amountCents = expenseAmountCents(exp);

    if (balancesCents[payerId] !== undefined) balancesCents[payerId] += amountCents;
    exp.split.forEach(s => {
      if (balancesCents[s.user._id] !== undefined) balancesCents[s.user._id] -= splitShareCents(s);
    });
  });

  return Object.entries(balancesCents).map(([userId, netBalanceCents]) => {
    const member = group.members.find(m => m._id === userId);
    return { id: userId, name: member ? member.name : 'Unknown', netBalanceCents };
  });
}

// An expense "is" an equal split if its shares match what splitEqually()
// would produce for this amount/participant count (allowing for the ±1 cent
// largest-remainder distribution) — an exact check now that everything is
// compared in cents.
export function isEqualSplit(amount, splits) {
  if (!splits || splits.length === 0) return true;
  const expectedCents = [...splitEqually(toCents(amount), splits.length)].sort((a, b) => a - b);
  const actualCents = splits.map(s => splitShareCents(s)).sort((a, b) => a - b);
  return actualCents.every((c, i) => c === expectedCents[i]);
}
