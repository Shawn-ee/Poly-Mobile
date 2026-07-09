# Cycle RM - Current MVP Cashout Ticket Retail Pass

## Scope

Local MVP Portfolio cashout/sell after a filled current-match line-market buy. This cycle improves the cashout screen and proves the full buy-to-sell lifecycle on Samsung S23.

## Reference Criteria

P0:

- A user can reach cashout from Portfolio after a filled position exists.
- Cashout must show the event/outcome context, estimated proceeds, full-position state, and current price.
- Cashout submit must require an upward swipe gesture.
- The cashout swipe area must be visually separated from the dark ticket body.
- Server-mode cashout must submit a SELL order and refresh Portfolio/history.
- The sold History row must preserve line/source identity.

P1:

- Cashout should eventually be consolidated with the generic Buy/Sell amount-entry ticket if the product wants one unified trade ticket.
- Real provider-backed current-match line markets should replace contract-fixture rows when available.

## Implementation

- `CashoutTicket.tsx` now renders a full-screen dark retail ticket with a large proceeds amount and fixed red swipe area.
- The swipe handle still follows gesture progress and only submits after crossing the threshold.
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` now sets/restores the local `DATABASE_URL` default for counterparty seeding.

## Android Proof

Device:

- Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / model `SM_S911U1`

Evidence:

- `docs/mobile/harness/cycle-RM-current-mvp-cashout-ticket/cycle-RM-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-RM-current-mvp-cashout-ticket/cycle-RM-current-mvp-line-cashout-ticket.png`
- `docs/mobile/harness/cycle-RM-current-mvp-cashout-ticket/cycle-RM-current-mvp-line-cashout-ticket.xml`
- `docs/mobile/screenshots/cycle-RM-current-mvp-cashout-ticket/cycle-RM-current-mvp-line-cashout-history.png`

## Audit Gate

Result: Pass for RM scope.

Unresolved P0: 0.

Remaining P1:

- Dedicated cashout ticket should be revisited if unified Buy/Sell ticket parity becomes the next priority.
- Native Google OAuth callback/session/logout.
- Real provider-backed current-match Spread/Totals/Team Total line markets.
