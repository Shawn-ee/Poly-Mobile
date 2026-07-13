# Cycle ZZC - Selected Outcome Quote Guard

## Scope

Backend Live Runtime Survey + One Event Live Pipeline.

This cycle tightens the local runtime gate for the current backend-owned Odds API event, `Spain vs. France`, so internal tester trading cannot be marked ready when the selected ticket outcome has no visible buy-side ask.

## Actual Issue

`npm run mobile:one-event-runtime-status` previously treated the selected quote route as healthy when `GET /api/markets/:marketId/quote` returned `200`, even if the current selected outcome had no ask. The same runtime summary could also display older live-provider proof outcome metadata while the current maker seed referenced the normalized live outcome used by the mobile ticket.

Observed before reseed:

- Selected current maker outcome: `Over 2.5`.
- Quote route returned the outcome.
- `bestBid` was visible.
- `bestAsk` was `null`.
- New guard failed P0 as `selectedOutcomeAskVisible=false`.

## Implementation

- `scripts/report_odds_api_one_event_runtime_status.ts`
  - Prefers the current maker-seeded selected market/outcome over older live-proof selected outcome metadata.
  - Reads the selected market quote route.
  - Finds the exact selected `outcomeId` in `quotes`.
  - Fails P0 unless that outcome has both visible bid and ask.
  - Emits `maker.selectedOutcomeQuote` with `quoteFound`, `showsBid`, and `showsAsk`.

- `scripts/report_odds_api_live_runtime_phase_audit.ts`
  - Uses the same selected-outcome quote guard for the `market-maker-liquidity` P0 requirement.
  - Emits `currentSelectedMarket` and `selectedOutcomeQuote` in the phase summary.

## Proof

- Failed before reseed:
  - `npm run mobile:one-event-runtime-status`
  - P0: `selectedOutcomeAskVisible`

- Reseeded local no-quota maker liquidity:
  - `npm run mobile:one-event-live-maker-seed`
  - Result: selected `Over 2.5` quote showed bid `0.58` and ask `0.6`.

- Passed after reseed:
  - `npm run mobile:one-event-runtime-status`
  - `npm run mobile:one-event-phase-audit`

## Evidence

- `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`

## Remaining Gaps

- P0: none for selected-outcome quote readiness.
- P1: installed unattended service ownership.
- P1: production official-result auto-settlement.
- P2: multi-event provider polling.
