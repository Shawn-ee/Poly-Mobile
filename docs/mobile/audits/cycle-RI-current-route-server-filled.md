# Cycle RI - Current Route Server-Filled MVP Proof

## Scope

Local MVP retail betting flow only:

Home -> Event Detail -> Team Total line market -> simple Trade Ticket -> fake-token/server-backed buy -> Portfolio positions/orders/history.

Out of scope for this cycle:

- Order book UI
- Chat
- Live stats
- Social/watchlist features
- Deposit/withdraw
- Backend schema migration

## Reference/Inspection Summary

- Current visible route: `argentina-vs-egypt`
- Provider event slug: `fifwc-arg-egy-2026-07-07`
- Regulation Winner: provider-backed from Polymarket data.
- Spread/Totals/Team Total: contract fixtures because the provider breadth scan found zero attach-ready Polymarket line markets for the current World Cup live route.

Inspection evidence:

- `docs/mobile/harness/cycle-RI-current-mvp-inspection/cycle-RI-current-mvp-inspection.json`
- `docs/mobile/harness/cycle-RI-provider-line-breadth-scan/cycle-RI-provider-line-breadth-scan.json`

## Acceptance Criteria

P0:

- S23 opens current Home route and current match.
- Event Detail shows provider-backed winner data and Game Lines.
- Player Props remains visible but blank for MVP.
- Team Total line market opens a simple Trade Ticket.
- Ticket preserves market id, outcome id, market type, line, period, source, and token identity.
- Swipe buy submits through `/api/orders` in server mode.
- Portfolio positions show the filled line-market position with parent match context.
- Orders tab shows no open order after full fill.
- History shows one `$75` filled buy with selected line/source/token identity.
- Default orderbook UI is not exposed.

P1:

- Replace contract-fixture Spread/Totals/Team Total rows with real provider-backed Polymarket line markets when attach-ready markets are discovered/imported.
- Improve Team Total display wording in Portfolio/history.

P2:

- Native Google OAuth session/deep-link callback/logout.

## Implementation Notes

- `local-mvp-current-route-server-filled-proof.ps1` restores the current provider match, seeds contract-shaped line markets, creates a temporary mobile credential, cleans stale fillable proof asks, and runs S23 proof.
- `/api/portfolio` and `/api/portfolio/history` now include parent event title/slug on market objects.
- Mobile portfolio services preserve parent event context for line-market position/history rows.

## Audit Gate Result

Pass.

Device:
Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM_S911U1`.

Proof:
`docs/mobile/harness/cycle-RI-current-route-server-filled/cycle-RI-local-mvp-current-route-server-filled-flow-proof.json`

Screenshots:

- `docs/mobile/screenshots/cycle-RI-current-route-server-filled/cycle-RI-holiwyn-route-server-mvp-line-markets.png`
- `docs/mobile/screenshots/cycle-RI-current-route-server-filled/cycle-RI-holiwyn-route-server-mvp-team-total-ticket-ready.png`
- `docs/mobile/screenshots/cycle-RI-current-route-server-filled/cycle-RI-holiwyn-route-server-mvp-team-total-ticket-swipe-progress.png`
- `docs/mobile/screenshots/cycle-RI-current-route-server-filled/cycle-RI-holiwyn-route-server-mvp-portfolio.png`
- `docs/mobile/screenshots/cycle-RI-current-route-server-filled/cycle-RI-holiwyn-route-server-mvp-portfolio-orders.png`
- `docs/mobile/screenshots/cycle-RI-current-route-server-filled/cycle-RI-holiwyn-route-server-mvp-portfolio-history.png`

## Remaining Gaps

P0:

- None for this current-route server-filled MVP proof.

P1:

- Real provider-backed line markets remain unavailable for the current route.
- Portfolio/history Team Total wording can be cleaner.

P2:

- Native Google OAuth callback/session/logout.
