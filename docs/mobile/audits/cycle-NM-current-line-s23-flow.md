# Cycle NM - Current Line Ticket S23 Flow

Date: 2026-07-08

## Scope

Current Local MVP retail betting flow:

Home -> Event Detail -> contract-shaped line market -> simple Buy ticket -> fake-token/server-backed filled order -> Portfolio/history.

This cycle intentionally did not work on order book UI, chat, live stats, social features, backend schema, or new market families.

## Reference/Criteria

Polymarket parity target for this Local MVP slice is the simple retail ticket behavior:

- Home/Live surfaces show a World Cup match entry.
- Event Detail exposes Game Lines without chat/orderbook UI.
- Line markets preserve selected market, line, period, outcome, and source identity.
- Ticket submit uses the simple swipe-to-buy flow.
- Portfolio/history show the resulting position/trade and preserve the selected line identity.

## Acceptance Criteria

| ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| NM-P0-01 | P0 | Pass | Home route selected `argentina-vs-egypt` with provider-backed Regulation Winner and contract-fixture line markets. |
| NM-P0-02 | P0 | Pass | Detail route exposed Spread `1.5` line and preserved contract source/token/condition identity. |
| NM-P0-03 | P0 | Pass | Backend route proof filled a server order and verified Portfolio/history line identity. |
| NM-P0-04 | P0 | Pass | S23 visible proof completed Home -> Live -> Home -> Event Detail -> Spread line -> ticket -> swipe -> Portfolio/history. |
| NM-P0-05 | P0 | Pass | Orderbook and chat remained absent from the visible proof hierarchy. |
| NM-P1-01 | P1 | Partial | Line markets remain `contract-fixture`, not provider-backed Polymarket line markets. |

## Evidence

- `docs/mobile/harness/cycle-NM-current-line-s23-flow/cycle-NM-home-to-portfolio-route-journey.json`
- `docs/mobile/harness/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-portfolio-history.png`

## Audit Result

Pass for the current Local MVP line-ticket user journey on Samsung S23.

This is not a final Polymarket line-market parity pass because the current line markets are backend-shaped fixtures until attach-ready provider-backed line markets exist.
