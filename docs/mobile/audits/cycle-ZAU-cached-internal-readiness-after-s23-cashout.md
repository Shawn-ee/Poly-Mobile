# Cycle ZAU - Cached Internal Readiness After S23 Cashout

## Scope

- Reconcile the local internal tester readiness gate after the fresh S23 Spain vs. France cashout proof.
- Keep cached backend-owned trading ready without spending Odds API quota.
- Do not change mobile UI, backend order/cashout behavior, provider schema, or live provider refresh behavior.

## Evidence

- S23 cashout proof audit: `docs/mobile/audits/cycle-S23CASHOUT-spain-france-cashout.md`
- S23 proof summary: `docs/mobile/harness/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-odds-api-s23-visible-flow.json`
- S23 cashout screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-cashout-ticket-ready.png`
- Readiness gate summary: `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json`
- Operator snapshot: `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`
- Runtime status summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`

## Acceptance Result

- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Market: `Spain vs. France: Total Goals 2.5`
- Market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Outcome: `Over 2.5`
- Outcome id: `5a3f04ff-6efd-42c5-a225-8fae8070b509`
- `npm run mobile:internal-tester-readiness-gate`: pass.
- `providerQuotaUsedByThisGate`: false.
- `cachedTradingReady`: true.
- `liveOddsReady`: false.
- `quotaSpendingLoopRunning`: false.
- S23 cashout Max used `43.1 SHARES`, not wallet balance.
- S23 close-position ticket hid the Yes/No selector and submitted `SELL` against the owned market/outcome.

## Contract Clarification

The operator snapshot may accept cached internal testing even when `/api/internal/live-runtime/status` reports `needs_attention`.
That is intentional for this local MVP mode:

- Cached internal testing can continue when the selected backend event, maker quote, order flow, portfolio, cashout, and history are proven.
- Live mobile odds freshness is separate and remains explicit, key-gated, and quota-spending.
- The default recommended action is `cached_internal_testing`, not a live provider refresh.
- A live provider refresh should only run through the protected provider-secret command when fresh odds are specifically needed.

## P0/P1/P2

- P0: none for the current internal tester cached trading flow.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open and guarded by closed-market status plus explicit confirmation.
- P2: multi-event provider polling and production operator dashboard remain future work.
