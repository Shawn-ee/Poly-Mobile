# Ledger And Wallet Rules

These rules apply to all future work that can affect balances, custody, deposits, withdrawals, orders, fills, positions, settlement, or bots.

1. User balances may only change through auditable ledger entries.
2. Every balance-changing operation must run inside a database transaction.
3. Available and locked balances must never become negative.
4. Deposits must have an external transaction reference before crediting.
5. Deposit crediting must be idempotent by chain, transaction hash, and log index or an equivalent unique external event key.
6. Withdrawals must have request, approval or rejection, and completion state.
7. Manual withdrawals must lock funds before any off-platform payment is made.
8. Admin withdrawal completion must require a transaction hash.
9. Withdrawal rejection must unlock funds back to the user.
10. Bot accounts must be separated from normal user accounts and identifiable by credentials or configuration.
11. Production private keys must never be committed, printed, logged, or copied into reports.
12. Test and mock wallet flows must be clearly separated from production wallet flows.
13. Legacy deposit flows must be marked legacy or explicitly justified before being used.
14. Any code path that updates balances must include focused tests or a documented reason why tests cannot be added in the same PR.
15. Reconciliation failures must block launch and high-risk merges until reviewed by a human.
