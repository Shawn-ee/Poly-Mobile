# Cycle ZAM - Quote Display Label Contract

Date: 2026-07-14

## Scope

Normalize sportsbook totals labels in the canonical quote route so mobile ticket pricing receives prediction-market style display labels while preserving raw provider labels for evidence and debugging.

This cycle does not change order matching, order payloads, provider refresh, market maker pricing, portfolio, cashout logic, settlement, or mobile screen layout.

## Behavior

`GET /api/markets/:marketId/quote` now returns:

- `outcomeName`: Holiwyn/mobile display label, for example `Over 2.5`.
- `referenceOutcomeLabel`: raw provider label, for example `Over +2.5`.

The normalization currently applies to `total_goals` and `team_total_goals` markets with `over`/`under` outcome sides. Other market types keep their existing outcome label/name behavior.

## Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Focused quote test | Pass | `npx jest --runInBand src/__tests__/market.quote.route.test.ts` |
| Root typecheck | Pass | `npx tsc --noEmit --pretty false --incremental false` |
| Mobile typecheck | Pass | `npm --prefix mobile run typecheck` |
| Runtime route proof | Pass | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |

Latest route proof for Spain vs. France Total Goals 2.5:

- `outcomeName`: `Over 2.5`
- `referenceOutcomeLabel`: `Over +2.5`
- `bestBid`: `0.46`
- `bestAsk`: `0.54`

## Acceptance Result

| Priority | Status | Notes |
| --- | --- | --- |
| P0 | Pass | Mobile quote route no longer leaks raw `+2.5` sportsbook totals label as the primary display label. |
| P1 | Open | Installed unattended provider/maker/lifecycle service ownership and production official-result auto-settlement remain open. |
| P2 | Open | Multi-event polling and production operator dashboard remain future work. |

