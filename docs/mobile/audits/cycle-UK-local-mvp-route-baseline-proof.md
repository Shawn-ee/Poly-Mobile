# Cycle UK - Local MVP Route Baseline Proof

Status: backend/API route inspection pass; no visible UI change.

## Scope

Prove the current Local MVP backend route baseline after the order-book debug gate cleanup:

- Home match feed remains match-only and World Cup-focused.
- Selected Event Detail route exposes provider-backed Regulation Winner.
- Spread/Totals/Team Total remain explicit contract-shaped line fixtures.
- The route state is honest about missing real provider-backed line markets.

Out of scope: order book UI, chat, live stats, social/watchlist, deposit/withdraw, schema migration, ticket redesign, and Android UI proof.

## Proof

Output: `docs/mobile/harness/cycle-UK-local-mvp-route-baseline-proof/cycle-UK-state-inspection.json`

Command:

```powershell
npx tsx scripts/inspect_mobile_mvp_current_state.ts --summaryPath=docs/mobile/harness/cycle-UK-local-mvp-route-baseline-proof/cycle-UK-state-inspection.json
```

## Result Summary

| Check | Result |
| --- | --- |
| Home route event count | 7 |
| Home route match event count | 7 |
| Home route futures count | 0 |
| Selected MVP event | `argentina-vs-egypt` |
| Regulation Winner status | `provider-backed` |
| Line-market status | `contract-fixture` |
| Provider-backed line market count | 0 |
| Fixture line market count | 4 |
| Line families | Spread, Total, Team Total |
| Local MVP path ready | true |

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UK-P0-01 | P0 | Home route returns match events only for the Local MVP feed. | Pass |
| UK-P0-02 | P0 | Selected event has provider-backed Regulation Winner markets. | Pass |
| UK-P0-03 | P0 | Selected event exposes Spread/Totals/Team Total line rows for the MVP ticket path. | Pass |
| UK-P0-04 | P0 | Line rows are not mislabeled as Polymarket-backed when they are contract fixtures. | Pass |
| UK-P0-05 | P0 | Route diagnosis clearly states real provider-backed line markets are not ready. | Pass |

## Remaining Gaps

- P1: S23 visible proof is still needed for the full Home/Live -> Event Detail -> line ticket -> server order -> Portfolio/history journey against this current route data.
- P1: real provider-backed Spread/Totals/Team Total rows remain unavailable until Polymarket exposes attach-ready line rows or an approved secondary provider is configured.
