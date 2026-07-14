# Cycle ZAE - Runtime Liquidity After Cashout

## Scope

Refresh the local internal tester runtime evidence after the Cycle ZAD S23 cashout proof consumed selected-market ask liquidity.

No mobile UI, backend trading logic, provider schema, order book UI, chat, live stats, or social features were changed.

## Issue

After the S23 cashout proof, the runtime status gate detected that the selected Spain vs. France market still had a bid but no visible ask. That made the internal tester runtime unsafe to present as ready, because a tester could open the proven market but not complete a fresh buy path against maker liquidity.

## Fix

- Ran the shifted local maker seed for the current backend-owned Spain vs. France market.
- Restored quote-route-visible ask liquidity for:
  - Event: Spain vs. France
  - Market: Total Goals 2.5
  - Outcome: Over 2.5
  - Market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
  - Outcome id: `cf189c8a-cadc-4742-9f1f-e64a4911f228`
- Aligned the phase-audit top-level `selectedMarket` field with the current quote-visible selected market, so future reports do not show the stale legacy `Over +2.5` proof label while testing `Over 2.5`.

## Proof

- `npm run mobile:one-event-live-maker-seed`
  - Passed.
  - Restored visible selected-outcome quote with bid `0.58` and ask `0.60`.
- `npm run mobile:live-runtime-audit-gate`
  - Passed.
  - Runtime status, phase audit, and completion audit all passed in order.
  - Provider quota used by the gate: `false`.
  - P0 gaps: none.

Evidence:

- `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json`
- S23 cashout proof remains `docs/mobile/harness/cycle-ZAD-server-cashout-estimate-s23/cycle-ZAD-odds-api-s23-visible-flow.json`

## Remaining Gaps

P0: none for the local internal tester trading flow.

P1:

- Installed unattended provider/maker/lifecycle service ownership remains open.
- Production official-result auto-settlement remains open; active-event execution is still guarded by closed-market status and exact confirmation.

P2:

- Multi-event provider polling and production dashboard/operator UI remain future work.
