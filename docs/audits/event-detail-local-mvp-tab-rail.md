# Cycle IK - Event Detail Local MVP Tab Rail

## Scope

Event Detail market tab rail only, inside the Local MVP route-backed soccer betting path. No order book, chat, live stats, social, deposit, withdraw, or backend route work.

## Product Direction Applied

- The current Local MVP should prioritize `Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history`.
- Event Detail should focus on predicting and trading around the game.
- Player Props remains intentionally blank for now.
- Nonessential or unfinished tab areas should not look complete in the default user path.

## Holiwyn Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Default Event Detail market rail shows `Game Lines` and `Player Props`. | P0 | Pass |
| Default Event Detail market rail does not show `Exact Score` or `Halves` as tappable tabs. | P0 | Pass |
| Player Props tab opens a deliberate blank MVP state. | P0 | Pass |
| Returning from Player Props to Game Lines preserves the line-market ticket path. | P0 | Pass |
| Route-backed totals ticket, swipe buy, Portfolio, and History still pass. | P0 | Pass |
| Legacy exact-score/half-market component branches may remain hidden for future non-MVP work. | P2 | Tracked |

## Implementation Notes

- `src/components/EventDetail.tsx` now builds the same Local MVP tab array for inline and sticky rails: `Game Lines`, `Player Props`.
- Proof labels include `event-detail-market-tabs-local-mvp`, `exact-score-hidden-local-mvp`, and `half-tabs-hidden-local-mvp`.
- `scripts/smoke.ps1` rejects `event-detail-exact-score-tab`, `event-detail-halves-tab`, visible `Exact Score`, and visible `Halves` in the Local MVP route-backed proof.

## Backend/API

No backend or request/response contract changed.

- Event Detail still consumes existing event, market, outcome, line, period, provider source, and provider token fields.
- Submit route remains `POST /api/orders`.
- Portfolio verification still consumes `GET /api/portfolio` and Portfolio History state.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Typecheck: `npm run typecheck` passed.
- Smoke: `scripts\local-mvp-route-server-filled-totals-proof.ps1` passed on port `8354`.
- Line-market screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IK-event-detail-local-mvp-tab-rail-s23-proof\cycle-EY-holiwyn-route-server-mvp-line-markets.png`.
- Player Props blank screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IK-event-detail-local-mvp-tab-rail-s23-proof\cycle-EY-holiwyn-route-server-mvp-player-props-blank.png`.
- Portfolio History screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IK-event-detail-local-mvp-tab-rail-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.
