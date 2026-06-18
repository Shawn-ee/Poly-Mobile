# High Risk Areas

Changes in this file require explicit human review. Automatic merge is forbidden for every area listed below.

| Area | Why High Risk | Required Validation | Automatic Merge |
|---|---|---|---|
| `prisma/schema.prisma` | Schema changes can break persisted data, generated clients, migrations, and financial invariants. | `npx prisma validate`, `npx prisma generate`, migration review, rollback/backfill plan. | Forbidden |
| Migrations | Migration mistakes can corrupt or block production data. | Apply to clean database, review SQL, document deploy order and rollback constraints. | Forbidden |
| `UserBalance` | Stores spendable and locked user funds. | Ledger reconciliation, negative-balance tests, transaction-boundary review. | Forbidden |
| `LedgerEntry` | Audit trail for balance-changing operations. | Idempotency checks, delta reconciliation, operation/reason review. | Forbidden |
| `LedgerTransaction` | External transaction history and legacy deposit state can affect crediting. | Duplicate transaction tests, external reference validation, reconciliation. | Forbidden |
| Order matching | Matching moves balances, shares, orders, fills, and fees. | Unit/integration tests for crossing, partial fills, self-crossing, locks, fees, invariants. | Forbidden |
| Trade/fill creation | Incorrect fills can misstate ownership, PnL, and public trade history. | Fill/trade consistency checks and orderbook event tests. | Forbidden |
| Position updates | Positions drive sell eligibility and settlement payouts. | Reserved-share tests, fill tests, settlement tests, invariant reconciliation. | Forbidden |
| Settlement/resolution | Resolution pays winners and closes markets. | Settlement conservation tests, collateral checks, admin auth checks. | Forbidden |
| Deposits | Deposits credit balances from external chain events. | Idempotency, confirmation, chain/token, minimum, duplicate-log, and reconciliation tests. | Forbidden |
| Withdrawals | Withdrawals lock and remove user funds. | Request/reject/complete tests, rate-limit tests, tx hash requirement, reconciliation. | Forbidden |
| Wallet private keys | Custody keys can move real funds. | No-secret scan, encryption review, key rotation plan, operational approval. | Forbidden |
| Admin auth | Admin APIs can create, resolve, pause, and operate markets and withdrawals. | Unauthorized/forbidden tests, dev-only bypass review, route inventory. | Forbidden |
| Production deployment config | Misconfiguration can expose unsafe services or secrets. | Environment review, smoke checklist, rollback plan, human deployment approval. | Forbidden |
| Bot live trading | Live bots can place orders and consume liquidity. | Dry-run report, risk-limit review, kill-switch check, market allowlist. | Forbidden |
| Market-making risk limits | Risk limits bound automated losses and inventory drift. | Strategy tests, cap tests, daily notional tests, live-readiness checks. | Forbidden |
