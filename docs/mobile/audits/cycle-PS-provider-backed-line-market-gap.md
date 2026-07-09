# Cycle PS - Provider-Backed Line Market Gap

Status: P0 Audit Gate passed for provider gap inspection. No mobile UI or backend route behavior changed.

## Scope

Cycle PS inspects the current Local MVP match, `argentina-vs-egypt`, to verify whether Polymarket-backed Spread, Totals, or Team Total line markets are available for the Event Detail page.

This cycle intentionally avoids order book UI, chat, live stats, social/watchlist features, source-label micro-polish, and new arbitrary frontend-only mock structures.

## Reference Audit

Provider source checked:

- Polymarket Gamma event route: `https://gamma-api.polymarket.com/events?slug=fifwc-arg-egy-2026-07-07`
- Holiwyn route: `/api/mobile/events/argentina-vs-egypt/live-detail`

Observed Polymarket Gamma markets:

| Market | Provider family |
| --- | --- |
| `Will Argentina win on 2026-07-07?` | `match_winner_1x2` |
| `Will Argentina vs. Egypt end in a draw?` | `match_winner_1x2` |
| `Will Egypt win on 2026-07-07?` | `match_winner_1x2` |

Observed provider line-market count: `0`.

Observed Holiwyn live-detail route:

- Total markets: `7`
- Real Polymarket markets: `3`
- Contract fixture markets: `4`
- Contract fixture line families: `spread`, `total_goals`, `team_total_goals`
- Regulation Winner status: `provider-backed`
- Line Markets status: `contract-fixture`

## Acceptance Criteria

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PS-P0-01 | P0 | The current MVP match provider event is checked directly against Polymarket Gamma. | `cycle-PS-provider-match-line-availability.json` includes provider URL and event slug. |
| PS-P0-02 | P0 | Provider-backed Regulation Winner remains available and route-visible. | Gamma has 3 winner markets; live-detail has 3 `referenceSource=polymarket` markets. |
| PS-P0-03 | P0 | Spread/Totals/Team Total rows are not claimed as Polymarket-backed when Gamma exposes no line markets. | Proof shows `lineMarketCount: 0` and route `lineMarkets.status: contract-fixture`. |
| PS-P0-04 | P0 | Existing line rows remain backend-shaped fixtures for Local MVP order proof only. | Proof shows four `referenceSource=contract-fixture` line markets with stable external fixture ids. |
| PS-P0-05 | P0 | The next path is documented without opening a new visual micro-polish cycle. | This audit plus route/data-contract docs. |

## Proof

- Backend health passed at `http://127.0.0.1:3002/api/health`.
- Provider availability proof: `docs/mobile/harness/cycle-PS-provider-backed-line-market-gap/cycle-PS-provider-match-line-availability.json`.

No new S23 proof was run in this cycle because no visible mobile UI changed. Cycle PR remains the latest full S23 proof for the current Local MVP route after the same provider/fixture contract:

- `docs/mobile/harness/cycle-PR-service-readiness-inspection/cycle-PR-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-PR-service-readiness-inspection/`

## Result

Unresolved P0 gaps for provider availability honesty: `0`.

Remaining P1/P2 gaps:

- P1: Real provider-backed Spread/Totals/Team Total markets are still unavailable for `argentina-vs-egypt`.
- P1: The next meaningful provider cycle should discover/import another Polymarket-backed current match with richer attach-ready markets, or define an approved non-Polymarket provider contract for line markets.
- P2: Existing older provider-line probes still contain Colombia/Ghana defaults and should not be used as current MVP evidence unless parameterized for the active Home match.
