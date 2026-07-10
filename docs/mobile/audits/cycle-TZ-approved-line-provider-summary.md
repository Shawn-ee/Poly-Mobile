# Cycle TZ - Approved Line Provider Source Summary

## Scope

Fix the live Event Detail source-summary contract so approved secondary line-provider identity can move Spread/Totals/Team Total rows out of `contract-fixture` status when Polymarket does not expose attach-ready line markets.

No visible mobile layout, order book UI, chat, live stats, schema, or order route changed in this cycle.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| TZ-P0-01 | P0 | Polymarket line markets still count as provider-backed. | Pass |
| TZ-P0-02 | P0 | Contract-fixture line markets without reviewed provider identity still report `contract-fixture`. | Pass |
| TZ-P0-03 | P0 | A reviewed approved secondary line-provider market with reviewed provider identity on every outcome counts as route-visible provider-backed line coverage. | Pass |
| TZ-P0-04 | P0 | Provider availability reports approved-provider counts separately from Polymarket counts and fixture counts. | Pass |
| TZ-P1-01 | P1 | Current MVP match still has no real provider-backed Spread/Totals/Team Total rows until a real provider identity is attached. | Open |

## Implementation Notes

- `buildMobileMarketSourceSummary()` now recognizes approved line-provider readiness through `approvedLineProviderReady`.
- Serialized live-detail markets now include `approvedLineProviderReady` based on reviewed `lineProviderIdentity` metadata on the market and every outcome.
- The current approved secondary source is `optic_odds`, but missing `OPTIC_ODDS_API_KEY` remains optional/unconfigured and is not a Polymarket parity blocker.

## Proof

- `npx jest src/__tests__/mobile-live-event-detail.test.ts --runInBand`
- `npx jest src/__tests__/mobile-live-line-provider-identity-review.test.ts src/__tests__/mobile-live-optic-odds-line-ingestion.test.ts --runInBand`

## Audit Result

Pass for backend/data-contract scope. Android proof was not rerun because no visible mobile UI changed; this cycle changes route classification so future imported approved line-provider markets can be displayed as provider-backed instead of fixture-only.
