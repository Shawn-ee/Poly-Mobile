# Event Lifecycle Runbook

## Local MVP Lifecycle

| State | Meaning | Current support |
| --- | --- | --- |
| Open / LIVE | Users can quote, buy, sell, and see Portfolio/history. | Supported by `Market.status=LIVE` and existing order routes. |
| Refresh due | Provider quote snapshot is still usable but should refresh. | Surfaced by event detail provider lifecycle fields. |
| Stale | Provider quote snapshot is older than route stale threshold. | Surfaced by event detail provider lifecycle fields. Trading is still governed by market status unless a guard is explicitly added. |
| Suspended / PAUSED | Trading disabled manually. | Admin pause route sets `Market.status=PAUSED`. |
| Closed | Trading disabled manually. | Admin close route sets `Market.status=CLOSED` and cancels open orders. |
| Settled / resolved | Winning outcome selected and collateral settled. | Admin/manual orderbook resolve route exists. Automatic soccer settlement is not implemented. |

## Operator Steps For One Local Live Event

1. Start Postgres and backend.
2. For the quota-free consolidated readiness pass, run `npm run mobile:one-event-live-readiness`.
3. For only a quota-free restart check, run `npm run mobile:one-event-live-runtime`.
4. To leave local fake-token liquidity available for testers, run `npm run mobile:one-event-live-runtime -- -SeedMaker`.
5. For a live provider refresh proof, set `THE_ODDS_API_KEY` in the local process environment and run `npm run mobile:one-event-live-runtime:provider`.
6. Confirm the proof reports provider refresh `ready`.
7. Confirm local shifted maker quotes exist.
8. Open mobile and trade the selected event with fake tokens.
9. To prove local lifecycle controls only, run `npm run mobile:one-event-lifecycle-proof`.
10. If provider goes stale or event starts, pause/close the market manually.
11. Do not settle automatically unless official result input and admin review are added.

## Completion Boundary

This runbook supports internal fake-token testing. It does not approve real-money deployment, automatic settlement, public liquidity, or unattended production bots.

## Latest Lifecycle Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Restart/runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- S23 visible proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`
- Open state: selected market was `LIVE`, visible on Home, visible on Event Detail, and accepted fake-token orders.
- Stale state: proof forced selected quote snapshots stale and Event Detail reported stale provider quote lifecycle.
- Refreshed state: live Odds API refresh restored selected quote lifecycle to ready.
- Closed state: temporarily setting the selected market to `CLOSED` caused order placement to fail with `MARKET_UNAVAILABLE`.
- Lifecycle controls proof: selected market accepted an order in `LIVE`, rejected orders in `PAUSED` and `CLOSED`, produced a non-mutating settlement preview, and restored the market to its original state.
- Settlement readiness: manual settlement preview/resolve service exists, but automatic soccer result ingestion and automatic settlement remain P1.
