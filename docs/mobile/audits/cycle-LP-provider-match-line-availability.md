# Cycle LP Provider Match Line Availability Inspection

Date: 2026-07-08

## Scope

Inspect whether the current Local MVP match page is blocked because Holiwyn failed to ingest Polymarket soccer line markets, or because Polymarket Gamma currently exposes only Regulation Winner markets for the selected match.

This cycle stays inside the Local MVP retail betting path:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: order book UI, chat, live stats, social features, deposit/location checks, and visual page polishing.

## Reference Provider Result

Provider event checked:

- Holiwyn event: `switzerland-vs-colombia`
- Polymarket Gamma slug: `fifwc-che-col-2026-07-07`
- Provider URL: `https://gamma-api.polymarket.com/events?slug=fifwc-che-col-2026-07-07`

Gamma returned exactly 3 markets:

| Provider market | Classification |
| --- | --- |
| `Will Switzerland win on 2026-07-07?` | `match_winner_1x2` |
| `Will Switzerland vs. Colombia end in a draw?` | `match_winner_1x2` |
| `Will Colombia win on 2026-07-07?` | `match_winner_1x2` |

Gamma returned 0 checked line-market families for this event:

- Spread
- Totals
- Team Totals
- Halves
- Corners
- Correct Score

## Holiwyn Route Result

Route checked:

- `GET /api/mobile/events/switzerland-vs-colombia/live-detail`

The route returned 7 markets:

| Source | Count | Families |
| --- | ---: | --- |
| `polymarket` | 3 | Regulation Winner / `match_winner_1x2` |
| `contract-fixture` | 4 | Spread, Totals, Team Totals |

The current Spread, Totals, and Team Totals rows are backend-shaped fixtures, not provider-backed Polymarket lines. They are intentionally marked with `referenceSource=contract-fixture`.

## Audit Decision

Cycle LP passes as a provider/data inspection checkpoint, not as a final mobile Audit Gate pass.

Findings:

- Regulation Winner is real Polymarket-backed data for the selected event.
- The selected Polymarket Gamma event does not currently expose Spread, Totals, or Team Totals.
- Holiwyn did not silently lose real Gamma line markets in this selected event.
- Contract-fixture line rows are justified for Local MVP UI/order proof until real provider line markets exist or a separate approved provider is added.

## Adjusted Path To Goal

1. Continue Local MVP visible flow using `switzerland-vs-colombia` or the next active match event.
2. Keep Regulation Winner provider-backed from Polymarket Gamma/CLOB when available.
3. Keep Spread/Totals/Team Totals as contract-shaped fixtures only when Gamma has no real line markets.
4. Do not treat `OPTIC_ODDS_API_KEY` as a blocker.
5. Do not block the Local MVP on non-existent Gamma line markets.
6. Next P0 remains S23-visible proof: Home -> Event Detail -> line selector -> simple Buy/Sell ticket -> server fake-token order -> Portfolio/history.
7. Real provider-backed line-market replacement remains P1 and should only be promoted when a Polymarket event exposes attach-ready line markets or another approved provider is in scope.

## Evidence

- `scripts/prove_mobile_provider_match_line_availability.ts`
- `docs/mobile/harness/cycle-LP-provider-match-line-availability/cycle-LP-provider-match-line-availability.json`

Validation:

- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LP-provider-match-line-availability/cycle-LP-provider-match-line-availability.json`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| S23 visible proof of Home -> Event Detail -> line ticket -> Portfolio/history | P0 | Open; no ADB device visible during LP |
| Real Polymarket-backed line markets for Spread/Totals/Team Totals | P1 | Open; Gamma exposes none for selected event |
| Replace contract-fixture line rows when real provider line markets exist | P1 | Open |
| Compact single-row Regulation Winner presentation matching Polymarket | P1 | Open |
