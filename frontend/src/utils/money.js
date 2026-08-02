// Client-side mirror of backend/services/money.js — kept in integer cents to
// avoid the float-drift bugs that come from doing arithmetic on rupee
// amounts. The server remains the source of truth for persisted balances;
// these helpers are for pre-submit previews and for aggregating
// server-provided rupee values without reintroducing float error.

export function toCents(rupees) {
  return Math.round(Number(rupees) * 100);
}

export function fromCents(cents) {
  return cents / 100;
}

// Splits amountCents across `count` people as evenly as possible so the
// shares sum exactly to amountCents (largest-remainder method; ties broken
// by index since every share has the same fractional remainder).
export function splitEqually(amountCents, count) {
  if (count <= 0) return [];
  const base = Math.floor(amountCents / count);
  const remainder = amountCents - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

// Reads the server's integer-cents field when present, otherwise derives it
// from the legacy rupee field (covers any not-yet-migrated document).
export function expenseAmountCents(expense) {
  return typeof expense.amountCents === 'number' ? expense.amountCents : toCents(expense.amount);
}

export function splitShareCents(splitEntry) {
  return typeof splitEntry.shareCents === 'number' ? splitEntry.shareCents : toCents(splitEntry.share);
}

// Sums a list of rupee values by converting each to cents first, avoiding
// the float accumulation error you'd get by summing the rupee floats directly.
export function sumRupeesAsCents(rupeeValues) {
  return rupeeValues.reduce((sum, v) => sum + toCents(v || 0), 0);
}
