# Financial Safety Review

## Scope

This is a high-level read-only review of balances, ledger, matching, settlement, deposits, withdrawals, wallet custody, admin completion flows, bot accounts, and liquidity/risk limits. No financial code was changed.

## Critical Risks

1. Real deposit and withdrawal surfaces must remain disabled or gated until canonical funding architecture is approved.
2. Polygon per-user deposit addresses imply custody of generated private keys; production key management and sweep policy need human approval.
3. Legacy Base deposit verification and Polygon deposit monitor both exist; duplicate or ambiguous deposit paths must be resolved before launch.
4. Manual withdrawal completion can move real funds operationally; it needs human approval, tx hash, reconciliation, and audit trail.
5. Matching and settlement move balances, positions, locked funds, and payouts; every change must remain human-reviewed.
6. Bot live trading can consume liquidity or create loss if risk limits fail; live bot behavior must stay blocked until kill switch and caps are tested.

## High Risks

- `UserBalance.availableUSDC` and `UserBalance.lockedUSDC` are the spendable/locked fund state.
- `LedgerEntry` is the audit trail for balance deltas and idempotency.
- `LedgerTransaction` overlaps with external transaction history and legacy deposit state.
- Order placement locks USDC or reserves shares.
- Fill processing changes locked balances and positions.
- Cancellation must unlock funds or shares correctly.
- Settlement/resolution must conserve collateral and pay correct winners.
- Admin auth protects market resolution and withdrawal completion.
- Repair scripts can be dangerous if run against production.

## Medium Risks

- Portfolio and market UI can misstate balances, PnL, or locked funds.
- Test-credit faucet and wallet cap can distort beta expectations.
- Reference-market liquidity previews can confuse users if visible outside admin context.
- API keys allow automated trading and need policy enforcement.
- CI does not yet include broad reconciliation or Playwright coverage.

## Low Risks

- Display-only docs and UI copy changes.
- Read-only market discovery.
- Sports event card layout when no trading behavior changes.
- Agent workflow docs and templates.

## What Must Stay Human-Reviewed

- Prisma schema and migrations.
- `UserBalance`, `LedgerEntry`, `LedgerTransaction`.
- Matching, fills, trades, positions, settlement.
- Deposits, withdrawals, deposit addresses, private keys.
- Admin auth and admin market/withdrawal operations.
- Bot live trading, market making, liquidity, risk limits.
- Production deployment config and secrets.

## What Can Be Automated Safely

- Docs-only planning.
- UI display-only changes outside wallet/trading/admin auth.
- Test additions that do not touch production credentials or destructive database commands.
- Read-only audits that do not print secret contents.
- Dry-run orchestrator reports.

## Launch Blockers

Before public launch:

1. Canonical deposit architecture must be chosen and documented.
2. Funding UI/API gates must be explicit and tested.
3. Deposit monitor reconciliation must pass in CI or a launch-blocking smoke.
4. Withdrawal request/reject/complete flow must have strong tests and runbook.
5. Admin auth coverage must include all high-risk routes.
6. Balance reconciliation must be launch-blocking.
7. Settlement invariants must be tested.
8. Bot live trading must have allowlists, caps, kill switch, and dry-run/live separation.
9. Private key handling must have production custody and rotation plan.
10. Production secrets must be audited and protected.

## Positive Controls Already Present

- Balance-changing services use database transactions in many paths.
- `FOR UPDATE` row locks are used for balances and orders.
- Ledger idempotency keys exist.
- Deposit unique keys include chain, tx hash, and log index.
- Withdrawal completion requires tx hash and checks duplicate tx hashes.
- Withdrawal rejection unlocks funds.
- Config validation is strict in staging/production.
- Sensitive admin actions have rate limits in several routes.

## Safety Recommendations

- Add a `FUNDING_ENABLED` or equivalent gate for all deposit/withdraw UI and APIs.
- Add a canonical funding document that marks legacy deposit verification as legacy if Polygon is chosen.
- Add reconciliation smoke tests for balances, deposits, withdrawals, and market collateral.
- Add admin auth route inventory and test matrix.
- Add bot risk-control CI for dry-run only.
- Add a production private-key custody runbook before enabling deposits.
