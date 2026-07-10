# Cycle SW - Current Route Server-Filled Line Readiness

## Scope

Cycle SW verifies the current Local MVP route for `argentina-vs-egypt` on Samsung S23:

- Home / live-detail loads the provider-normalized current match.
- Regulation winner remains provider-backed by Polymarket Gamma.
- Spread, totals, and team-total rows are present as backend-shaped contract fixtures where real attach-ready Polymarket line markets are not yet available.
- A team-total line selection preserves market, outcome, period, line, side, provider/source, and token identity into the simple Trade Ticket.
- Swipe-style fake-token buy submits through the real local server route.
- Portfolio Positions, Orders, and History preserve the selected line/provider identity after the server-backed fill.

## Acceptance Criteria

P0 criteria for this cycle:

- Event Detail top shows the current World Cup match context and no default order book, chat, chart, or live-stat surfaces.
- Game Lines exposes backend-shaped line rows, including team total `1.5`.
- The selected ticket exposes `ticket-market-type-team-total`, `ticket-line-1.5`, `ticket-period-regulation`, and source/token identity.
- `POST /api/orders` succeeds in server mode with the mobile proof credential.
- `/api/portfolio` and `/api/portfolio/history` return the filled position/activity with preserved team-total line identity.
- S23 proof exists for Event Detail, line rows, ticket ready, swipe progress, Portfolio landing, Orders, and History.

P1 gaps:

- Replace contract-fixture spread/totals/team-total rows with real attach-ready Polymarket line markets when Gamma/CLOB discovery can map them safely.
- Expand provider breadth beyond the single current MVP match.

P2 gaps:

- Manual tester polish on exact Event Detail density can continue after provider breadth and the trade/Portfolio path remain stable.

## Device Proof

- Device: Samsung S23, `SM_S911U1`, ADB target `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Proof summary: `docs/mobile/harness/cycle-SW-current-route-server-filled/cycle-SW-local-mvp-current-route-server-filled-flow-proof.json`.
- Screenshots: `docs/mobile/screenshots/cycle-SW-current-route-server-filled/`.
- Result: pass.

## Audit Result

P0 pass. The route-backed Local MVP trading path is usable for internal testing:

`Home -> Event Detail -> team-total line market -> simple Buy ticket -> server fake-token order -> Portfolio Positions/Orders/History`.

Remaining provider gaps are tracked as P1 because the current UI uses backend-shaped fixtures for line markets that are not yet real Polymarket-attached markets.
