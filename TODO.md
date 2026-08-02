# Suggested Future Features

Ideas surfaced during the engineering audit/refactor, not yet built. Roughly ordered by how much value they'd add relative to effort.

## High value

- **Debt simplification ("settle up" suggestions).** The original project README lists "calculate and display minimized transactions for settling debts" as a goal — it was never built. Right now a group's balances are shown per-member, but there's no suggestion like "Alice pays Bob ₹500, Bob pays Carol ₹200" that minimizes the number of payments. This is the single most "Splitwise-like" feature missing.
- **Friend-request accept/reject flow.** Adding a friend is currently instant and mutual with no consent step (`backend/controllers/friendsController.js`) — anyone who knows your email can add themselves as your friend. A request/accept flow closes this.
- **Password reset.** There's no way to recover an account — only register/login exist.
- **Group invite links.** A "Copy Invite ID" button existed but was broken (pointed at a `/join/:groupId` route that was never built) and was removed during cleanup. Worth building properly if you want people to join groups without manually being added by ID.

## Medium value

- **Expense categories** (food, travel, rent, utilities...) with icons — enables filtering and eventually spending breakdowns.
- **Recurring expenses** (rent, subscriptions split monthly) — currently every expense is a one-off.
- **Activity feed search/filter** — by group, date range, or person; the feed is currently a flat unfiltered list capped at 50.
- **Receipt photo attachment** per expense.

## Lower priority / nice-to-have

- **CSV export** of a group's ledger.
- **Multi-currency support** — everything currently assumes ₹ (INR).
- **Email or push notifications** for new expenses or a nudge to settle up.
- **A light-mode variant of the default "finance" theme** — right now the default theme is dark-only; a light/dark toggle independent of the secret "girly" theme could be added if wanted.
