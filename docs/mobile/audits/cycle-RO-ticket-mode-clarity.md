# Cycle RO - Trade Ticket Sell Mode Clarity

## Scope

Local MVP retail ticket clarity only: Portfolio Cash out -> full-screen Sell Trade Ticket -> visible Sell mode badge -> amount preset -> swipe-to-sell ready state.

No order book UI, chat, live stats, social, backend schema, provider service, deposit, or withdrawal work was included.

## Reference / Rationale

The Polymarket-style amount-entry ticket makes the user's trading action feel explicit before swipe confirmation. Cycle RN proved Holiwyn could open the Sell ticket from Portfolio, but the visible ticket still depended on a Yes/No selector and did not clearly say the user was selling.

## Acceptance Criteria

P0:

- Sell ticket shows a visible order-mode indicator separate from the Yes/No selector.
- Indicator includes the selected outcome, e.g. `Sell France`.
- Yes/No outcome selector remains visible and usable.
- Ticket amount entry and red/pink swipe area remain separated on Samsung S23.
- Selecting `$25` reaches visible `Swipe to sell`.
- S23 proof exists.

P1:

- Full native Google OAuth callback/session/logout remains separate auth work.

P2:

- Final ticket typography and source-pill polish can continue after the core Local MVP flow is stable.

## Implementation

- `mobile/src/components/TradeTicket.tsx`: adds `modeLabel`, `modeOutcomeLabel`, and a visible `ticket-order-mode-visible` badge.
- `mobile/src/__tests__/tradeTicketModeClarityContract.test.ts`: preserves the visible Buy/Sell mode badge separately from the Yes/No outcome selector.
- `mobile/scripts/smoke.ps1`: requires `ticket-order-mode-sell` and `Sell France` in the focused S23 Portfolio-to-Sell-ticket proof.

## Device Proof

Holiwyn device:

- Samsung S23 `SM-S911U1`
- ADB: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Expo port: `8343`
- Backend: `http://127.0.0.1:3002`

Evidence:

- `docs/mobile/screenshots/cycle-RO-ticket-mode-clarity/home.png`
- `docs/mobile/screenshots/cycle-RO-ticket-mode-clarity/portfolio-position-ready.png`
- `docs/mobile/screenshots/cycle-RO-ticket-mode-clarity/sell-ticket-mode.png`
- `docs/mobile/harness/cycle-RO-ticket-mode-clarity/home.xml`
- `docs/mobile/harness/cycle-RO-ticket-mode-clarity/portfolio-position-ready.xml`
- `docs/mobile/harness/cycle-RO-ticket-mode-clarity/sell-ticket-mode.xml`
- `docs/mobile/harness/cycle-RO-ticket-mode-clarity/sell-ticket-button.xml`

Proof markers:

- `ticket-order-mode-visible`
- `ticket-order-mode-sell`
- `Sell France`
- `ticket-side-sell`
- `$25`
- `Swipe to sell`

## Result

Audit Gate: Pass for focused RO scope.

Remaining gap:

- P1: prove real native Google OAuth callback/session/logout when auth becomes an active milestone.
