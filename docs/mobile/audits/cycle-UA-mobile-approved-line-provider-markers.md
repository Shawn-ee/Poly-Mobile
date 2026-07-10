# Cycle UA - Mobile Approved Line Provider Markers

## Scope

Carry Cycle TZ's approved line-provider route summary fields into the mobile source contract and hidden Event Detail audit markers.

No visible UI layout, order behavior, order book UI, chat, live stats, schema, or backend route changed in this cycle.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| UA-P0-01 | P0 | Mobile `MarketSourceSummary` types include approved line-provider counts returned by the backend. | Pass |
| UA-P0-02 | P0 | Bundled mock route data includes zero approved-provider counts so mock mode mirrors the backend shape. | Pass |
| UA-P0-03 | P0 | Event Detail hidden audit markers expose approved-provider count and per-family approved-provider count. | Pass |
| UA-P0-04 | P0 | Visible tester UI remains simple and does not expose new debug labels. | Pass |
| UA-P1-01 | P1 | Current MVP match still needs real approved provider identity before visible line rows become provider-backed. | Open |

## Proof

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- Mobile typecheck.

## Audit Result

Pass for mobile contract scope. Android proof was not rerun because this cycle adds hidden markers/types only and does not change visible mobile UI.
