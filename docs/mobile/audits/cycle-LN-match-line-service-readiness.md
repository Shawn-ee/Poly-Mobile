# Cycle LN Match Line Service Readiness Inspection

Date: 2026-07-08

## Scope

Inspect why the Holiwyn mobile app did not show soccer line markets such as Spread, Totals, and Team Totals while the user expected the World Cup/live match page to behave like Polymarket's match betting flow.

This cycle stays inside the Local MVP retail betting path:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: order book UI, chat, live stats, social features, deposit/location checks.

## Findings

### Current Branch

- Active branch: `cycle/fj-real-provider-home-ticket`
- Current focus before this inspection: provider-backed World Cup Winner/futures home-ticket work.

### Backend Route Inventory

The mobile app reads:

- Home: `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`
- Event Detail: `GET /api/mobile/events/:slug/live-detail`

Before this cycle, the running backend returned:

| Event slug | Event type | Route status | Mobile markets |
| --- | --- | ---: | --- |
| `mobile-fj-real-world-cup-winner` | `future` | 200 | 9 `outright` markets |
| `switzerland-vs-colombia` | `match` | 200 | 3 `match_winner_1x2` markets only |
| `argentina-vs-egypt` | `match` | 200 | 3 `match_winner_1x2` markets only |

Conclusion: the real provider-backed FJ path is working, but it is a futures/outright path. It cannot satisfy the local MVP match page requirement for Regulation Winner plus line markets.

### Regulation Winner

Regulation Winner is present for current match events as three separate `match_winner_1x2` rows:

- home win
- draw/tie
- away win

This is enough for current route rendering, but the data shape is still not exactly Polymarket's compact single 1x2 row. That remains a UI/data presentation gap, not a total service absence.

### Spread / Totals / Team Totals

Spread, Totals, and Team Totals were not present on the current match events. They were present only in older disposable proof artifacts and local fallback/proof data, not in the running backend state used by the app.

The current Polymarket-first provider import path also does not automatically discover and attach real Polymarket line markets for these match slugs. Until a Polymarket match exposes those markets and the provider mapping attaches them, Holiwyn needs deterministic, backend-shaped contract fixture rows for MVP UI/proof.

## Action Taken

Added `scripts/seed_mobile_mvp_match_line_markets.ts`.

The script:

- inspects a selected local match event
- preserves the existing Regulation Winner markets
- adds contract-shaped line markets for:
  - Spread
  - Totals
  - Team Totals
- writes `ReferenceQuoteSnapshot` rows so the mobile UI receives current probability/price fields
- marks the fixture source clearly as `contract-fixture`, not Polymarket-backed
- writes a route proof JSON

Proof output:

- `docs/mobile/harness/cycle-LN-match-line-service-readiness/cycle-LN-match-line-service-readiness.json`

After seeding `switzerland-vs-colombia`, the running server route returns:

| Route | Result |
| --- | --- |
| `GET /api/mobile/events/switzerland-vs-colombia/live-detail` | 200 |
| Market count | 7 |
| Market types | `match_winner_1x2`, `spread`, `total_goals`, `team_total_goals` |
| Market groups | `Regulation Winner`, `Spread`, `Totals`, `Team Totals` |

## Adjusted Path To Goal

1. Use match events, not `World Cup Winner`, for the Local MVP match betting loop.
2. Keep `World Cup Winner` as a futures surface only.
3. Treat line markets as Polymarket-backed only when Gamma/CLOB or provider mapping proves real token/market identity.
4. Otherwise, allow contract-shaped fixtures for UI proof, clearly marked as `contract-fixture`.
5. Next cycle should test the Android app from Home into `switzerland-vs-colombia`, select a line market, open the simple ticket, submit a fake-token order, and verify Portfolio/history.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Real Polymarket line-market discovery/attachment for match events | P1 | Open |
| Single compact 1x2 Regulation Winner presentation | P1 | Open |
| Android proof of enriched match line market selection and ticket submission | P0 | Next |
| Portfolio/history proof for a contract-fixture line market order | P0 | Next |
| Replace contract fixtures when provider-backed match line markets exist | P1 | Open |
