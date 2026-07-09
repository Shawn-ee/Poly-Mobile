# Cycle QY - Home/Live Retail Source Cleanup

## Scope

Local MVP visible cleanup for the Home and Live match-card surfaces.

The app had useful provider/source readiness labels, but they were visible as tester-facing copy such as `Winner: Polymarket / Holiwyn lines`. This cycle keeps those markers for audit/backend migration while removing the visible debug-style copy from Home and Live.

This cycle does not change backend routes, order logic, Event Detail, Trade Ticket, Portfolio data, order book, chat, live stats, social, deposit, or withdraw behavior.

## Polymarket Reference Behavior

- Polymarket match cards prioritize event identity, timing/status, and action probabilities.
- Source/provider implementation notes are not shown as primary retail card copy.
- Internal implementation state may exist, but it should not dominate the betting flow.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| QY-P0-01 | P0 | Home match cards do not visibly show `Winner: Polymarket / Holiwyn lines`, `Markets: Polymarket`, or `Holiwyn lines`. | S23 XML/screenshot proof. |
| QY-P0-02 | P0 | Live page does not visibly show the source-readiness banner copy. | S23 XML/screenshot proof. |
| QY-P0-03 | P0 | Home still exposes hidden audit markers for provider winner and local contract-line readiness. Live preserves the same hidden-marker code path when live events expose readiness. | Source contract test and S23 XML proof. |
| QY-P0-04 | P0 | Home/Live cards still expose event cards and retail outcome buttons. | S23 XML/screenshot proof. |
| QY-P0-05 | P0 | No backend route, order, schema, ticket, order book, chat, live stats, social, deposit, or withdraw code changes. | Git diff and docs. |

## Implementation

- Converted Home/Live match-card source readiness from visible text to hidden accessibility/test markers.
- Hid the Live top source-readiness banner while preserving `live-source-readiness` XML markers.
- Updated focused source-readiness contract tests.

## Backend/API Contract

- No backend route changed.
- Existing Home/Live route dependencies remain:
  - `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`
  - live feed uses the existing server event route with `filter=live` through the mobile service layer.
- Market source summary data remains consumed by mobile only for hidden audit markers.

## Audit Gate

Pass for QY scope.

Evidence:

- `docs/mobile/harness/cycle-QY-home-live-retail-source-cleanup/cycle-QY-home-live-retail-source-cleanup-proof.json`
- `docs/mobile/harness/cycle-QY-home-live-retail-source-cleanup/cycle-QY-home.xml`
- `docs/mobile/screenshots/cycle-QY-home-live-retail-source-cleanup/cycle-QY-home.png`
- `docs/mobile/harness/cycle-QY-home-live-retail-source-cleanup/cycle-QY-live.xml`
- `docs/mobile/screenshots/cycle-QY-home-live-retail-source-cleanup/cycle-QY-live.png`

Validation:

- `npm run typecheck --prefix mobile` passed.
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/liveSourceReadinessContract.test.ts mobile/src/__tests__/marketListChineseSourceCopy.test.ts mobile/src/__tests__/searchScreenContract.test.ts` passed.
- Samsung S23 proof passed on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.

Notes:

- Home XML confirmed match card, outcome rail, and hidden source-readiness marker, with visible source/debug copy absent.
- Live XML confirmed Live screen and visible source/debug copy absent. The current backend Live view did not expose a live source-readiness marker in this proof, so no marker was expected in the captured Live XML.

## Remaining Gaps

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- Full native Google OAuth callback/session/logout remains separate auth work.
