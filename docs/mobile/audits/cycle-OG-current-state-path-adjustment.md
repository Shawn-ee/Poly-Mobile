# Cycle OG - Current State Inspection And Path Adjustment

## Scope

Run a fresh inspection before continuing the Local MVP loop, because the app/service state looked mismatched:

- Confirm whether the current match has provider-backed Regulation Winner markets.
- Confirm whether Spread/Totals/Team Total are real Polymarket-backed markets or local fixtures.
- Confirm whether broader real provider World Cup data exists elsewhere.
- Adjust the next path without weakening the Polymarket/source gate.

No app runtime files, backend routes, schemas, orderbook UI, chat, live stats, or social features were changed in this inspection cycle.

## Inspection Results

Current MVP route:

- Home route: `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`
- Event count: 1
- Selected event: `argentina-vs-egypt`
- Event detail route: `/api/mobile/events/argentina-vs-egypt/live-detail`

Market readiness:

| Area | Result |
| --- | --- |
| Regulation Winner | Provider-backed by Polymarket. |
| Spread | Local MVP `contract-fixture`, not Polymarket-backed. |
| Totals | Local MVP `contract-fixture`, not Polymarket-backed. |
| Team Totals | Local MVP `contract-fixture`, not Polymarket-backed. |
| Current match Gamma line markets | 0 line markets discovered for `fifwc-arg-egy-2026-07-07`. |
| World Cup Winner provider data | Healthy broader provider-backed outright data exists with multiple real Polymarket markets. |

## Proof

- Current route inspection: `docs/mobile/harness/cycle-OG-current-state-path-adjustment/cycle-OG-current-state-inspection.json`
- Current match provider/line availability: `docs/mobile/harness/cycle-OG-current-state-path-adjustment/cycle-OG-provider-match-line-availability.json`
- World Cup Winner provider proof: `docs/mobile/harness/cycle-OG-current-state-path-adjustment/cycle-OG-real-provider-world-cup-winner.json`

## Decision

The service is partially ready:

- It is ready for a real Polymarket-backed Regulation Winner path on the current match.
- It is not ready for real Polymarket-backed Spread/Totals/Team Total on that match.
- It is also ready for broader provider-backed World Cup Winner outrights, but the current product focus remains the live/current match flow.

Adjusted path:

1. Do not block the Local MVP on missing provider-backed line markets.
2. Do not pretend line fixtures are Polymarket-backed.
3. Prioritize the current match Regulation Winner as the real provider-backed betting path.
4. Keep Spread/Totals/Team Total available only as explicit local-test fake-token fixtures.
5. Continue visible S23 MVP proof around Home -> Event Detail -> Regulation Winner ticket -> fake-token server order -> Portfolio/history.

## Remaining Gaps

- Real provider-backed current-match line markets remain unavailable from Polymarket Gamma/CLOB for `argentina-vs-egypt`.
- `prove_mobile_provider_match_line_availability.ts` still defaults to an older event slug if no `--eventSlug` is passed; the loop should pass the selected event explicitly or update the default in a later maintenance cycle.
- Chart history for some broader provider-backed World Cup Winner markets can be refresh-due even when quotes/depth are fresh.
