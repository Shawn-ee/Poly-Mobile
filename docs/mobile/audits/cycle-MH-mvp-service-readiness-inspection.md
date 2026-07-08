# Cycle MH - MVP Service Readiness Inspection

## Scope

Focused inspection before continuing Local MVP development after manual S23 feedback that the backend/service may not be ready for the current mobile app.

This cycle checks the current server-mode data contract for:

- Home match feed.
- Event Detail compact markets.
- Regulation Winner availability.
- Spread/Totals/Team Total line-market availability.
- Whether line markets are real Polymarket-backed data or explicit Local MVP contract fixtures.

Out of scope:

- Order book UI.
- Chat.
- Live stats.
- Social/watchlist.
- Backend schema migration.

## Route Evidence

Proof artifact:

- `docs/mobile/harness/cycle-MH-mvp-current-state-inspection/cycle-MH-current-state-inspection.json`

Route inspected:

- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`
- `GET /api/mobile/events/:slug/live-detail`

## Findings

| Area | Result | Notes |
| --- | --- | --- |
| Home match-only feed | Pass | The inspection now uses `mobileMvpMatches=1`; it returned 2 match events and 0 futures/outrights. |
| Regulation Winner | Pass for current Local MVP | The selected event has 3 `match_winner_1x2` markets with `referenceSource=polymarket`. |
| Spread line market | Partial | Spread rows exist, but they are `referenceSource=contract-fixture`, not real Polymarket-backed line markets. |
| Totals line market | Partial | Totals rows exist as `contract-fixture`. |
| Team Total line market | Partial | Team Total rows exist as `contract-fixture`. |
| Local MVP route readiness | Pass with caveat | The Home -> Event Detail -> line ticket -> server order -> Portfolio/history path can continue if the UI clearly treats line markets as current MVP contract-shaped data. |
| Real provider-backed line parity | Open P1 | No provider-backed spread/totals/team-total markets are attached for the inspected event. |

## Adjusted Path

Continue Local MVP development against the current server-mode path:

1. Use provider-backed Regulation Winner as the real Polymarket-backed market family.
2. Keep Spread/Totals/Team Total visible for MVP betting, but treat them as explicit backend-shaped fixtures.
3. Do not claim provider-backed line-market parity until Polymarket discovery attaches real line markets or another approved provider is configured.
4. Continue S23 proof on the current route-backed match events, not older disposable proof names.
5. Prioritize ticket/order/Portfolio lifecycle using the available line contract fields: `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, `label`, `probability`, provider/source status, and order/portfolio identity fields.

## Audit Gate

Cycle MH does not mark line-market provider parity complete.

Pass condition for this inspection:

- The current backend status is documented accurately.
- The inspection route matches the actual mobile match-only feed.
- Futures/outrights are rejected from the MVP Home inspection route.
- Remaining real-provider line-market gap is tracked.

Result: pass for inspection, partial for real provider-backed line parity.
