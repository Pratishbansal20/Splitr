// Single source of truth for currency formatting — replaces the inline
// `.toFixed(0)` / `.toFixed(2)` mix that was inconsistent across screens.
// Expects a non-negative magnitude in cents; callers that need a sign
// (e.g. "+₹50.00" vs "-₹50.00") prepend it themselves, same as before.
export function formatINR(cents) {
  return `₹${(cents / 100).toFixed(2)}`;
}
