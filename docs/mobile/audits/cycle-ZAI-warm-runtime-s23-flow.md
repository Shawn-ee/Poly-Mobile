# Cycle ZAI - Warm Runtime S23 Trading Proof

## Scope

Fresh S23 device proof for the current Spain vs. France local internal tester flow while the cached internal tester runtime is warm.

## Runtime State

- Device: Samsung S23 `SM-S911U1` at `172.16.200.27:44029`
- Backend: `http://127.0.0.1:3002`
- Mobile API base used by proof: `http://172.16.200.14:3002`
- Provider quota: not used by the S23 proof or follow-up audit gate
- Runtime mode: cached no-quota local runtime
- Supervisor/result-poller: running during proof
- Expo: S23 proof used a temporary Expo port and cleaned it up after the run

## Acceptance Criteria

| Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P0 | Home shows the backend-owned Spain vs. France event. | Pass | `cycle-ZAI-warm-runtime-s23-home.png` |
| P0 | Event Detail loads backend markets for `odds-api-single-soccer-test`. | Pass | `cycle-ZAI-warm-runtime-s23-detail-top-retry.xml` |
| P0 | Line market selection preserves sportsbook market identity. | Pass | `ticketPreservesSportsbookLineIdentity=true` |
| P0 | Fake-token buy submits and reaches Portfolio. | Pass | `swipeSubmitReachedPortfolio=true` |
| P0 | Portfolio preserves sportsbook line identity. | Pass | `portfolioPreservesSportsbookLineIdentity=true` |
| P0 | Cashout opens close-position mode, not generic buy mode. | Pass | `cashoutTicketIsClosePositionMode=true` |
| P0 | Cashout Max uses owned shares, not wallet balance. | Pass | `cashoutMaxUsesOwnedShares=true` |
| P0 | Cashout ticket hides Yes/No selector. | Pass | `cashoutTicketHidesYesNoSelector=true` |
| P0 | Cashout SELL submits and History updates. | Pass | `cashoutSellSubmitted=true`, `cashoutHistoryVisible=true` |
| P0 | Backend rejects no-position sell and oversell while accepting a valid owned-position sell. | Pass | `docs/mobile/harness/cycle-JS-cashout-route-sell-safety/cycle-JS-cashout-route-sell-safety.json` |
| P0 | Runtime audit has zero open P0 after S23 proof. | Pass | `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json` |

## Follow-Up Repair

The first post-proof runtime audit found stale maker evidence: the quote route exposed the normalized `Over 2.5` outcome while the prior maker summary still pointed at an older `Over +2.5` outcome id. `npm run mobile:one-event-live-maker-seed` refreshed shifted maker evidence for the current quote-visible outcome, and the ordered audit gate passed afterward.

## Remaining Gaps

- P0: none
- P1: installed unattended provider/maker/lifecycle service ownership; production official-result auto-settlement
- P2: multi-event provider polling and production dashboard/operator UI

## Evidence

- S23 summary: `docs/mobile/harness/cycle-ZAI-warm-runtime-s23/cycle-ZAI-warm-runtime-s23-odds-api-s23-visible-flow.json`
- Backend sell-safety proof: `docs/mobile/harness/cycle-JS-cashout-route-sell-safety/cycle-JS-cashout-route-sell-safety.json`
- Runtime audit gate: `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Maker seed: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
