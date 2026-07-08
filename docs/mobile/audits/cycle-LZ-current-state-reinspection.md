# Cycle LZ Current State Reinspection

Date: 2026-07-08

## Scope

Reinspect the Local MVP service/app state before continuing the autonomous loop, because manual review raised two concerns:

- Regulation Winner might not be turned on.
- Spread/Totals markets might not be coming from Polymarket.

This cycle keeps the current Local MVP path:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: orderbook UI, chat, live stats, social features, deposit/location checks, and non-MVP feature work.

## Result

The backend service is running and the mobile-facing routes are ready enough for the Local MVP flow.

Key findings:

- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` returns 3 World Cup records.
- Mobile Home filters that feed to 2 match events and excludes the World Cup Winner future from the default MVP match list.
- `switzerland-vs-colombia` is the best current Local MVP proof event.
- Regulation Winner is provider-backed from Polymarket Gamma/CLOB-derived data.
- Spread/Totals/Team Totals are not provider-backed for this event. They are backend-shaped `contract-fixture` rows.
- Polymarket Gamma for `fifwc-che-col-2026-07-07` currently exposes 3 Regulation Winner markets and 0 checked line markets.

## Provider Audit

Provider event:

- Holiwyn event: `switzerland-vs-colombia`
- Polymarket Gamma slug: `fifwc-che-col-2026-07-07`
- Provider URL: `https://gamma-api.polymarket.com/events?slug=fifwc-che-col-2026-07-07`

Gamma market families:

| Family | Count |
| --- | ---: |
| `match_winner_1x2` | 3 |
| Spread/Totals/Team Totals/Halves/Corners/Correct Score | 0 |

## Holiwyn Route Audit

Route:

- `GET /api/mobile/events/switzerland-vs-colombia/live-detail`

Route market source summary:

| Source | Count | Families |
| --- | ---: | --- |
| `polymarket` | 3 | Regulation Winner / `match_winner_1x2` |
| `contract-fixture` | 4 | Spread, Totals, Team Totals |

## Adjusted Path

Continue the Local MVP loop with this service truth:

1. Use Polymarket-backed Regulation Winner where available.
2. Keep Spread/Totals/Team Totals as contract-shaped MVP fixtures for visible ticket/order proof while Gamma exposes no attach-ready line markets.
3. Do not block the MVP on `OPTIC_ODDS_API_KEY`.
4. Do not claim provider-backed line parity until real provider line markets exist or another provider is explicitly approved.
5. Continue visible S23 cycles for Home -> Event Detail -> line ticket -> Portfolio/history, using current route data.

## Evidence

- `docs/mobile/harness/cycle-LZ-current-state-reinspection/cycle-LZ-current-state-reinspection.json`
- `docs/mobile/harness/cycle-LZ-current-state-reinspection/cycle-LZ-provider-match-line-availability.json`
- `scripts/inspect_mobile_mvp_current_state.ts`
- `scripts/prove_mobile_provider_match_line_availability.ts`

Validation:

- `npm run -s mobile:mvp:inspect -- --cycle=LZ --summaryPath=docs/mobile/harness/cycle-LZ-current-state-reinspection/cycle-LZ-current-state-reinspection.json`
- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --cycle=LZ --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LZ-current-state-reinspection/cycle-LZ-provider-match-line-availability.json`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| S23 visible proof after this reinspection | P0 | Open for next visible cycle |
| Real Polymarket-backed Spread/Totals/Team Totals | P1 | Open; Gamma exposes none for selected event |
| Production-grade non-fixture liquidity for line markets | P1 | Open |
| Installed development APK is stale compared with Expo Go source | P1 | Open |
