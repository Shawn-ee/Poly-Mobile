# Cycle RN - Portfolio Cash Out to Sell Ticket

## Scope

Local MVP retail betting flow only: Portfolio position -> visible Cash out action -> full-screen Sell Trade Ticket -> amount preset -> swipe-to-sell ready state.

No order book UI, chat, live stats, social, backend schema, provider service, deposit, or withdrawal work was included.

## Reference / Rationale

Polymarket-style retail flow keeps the trading interaction centered on a simple amount-entry ticket and swipe confirmation. Holiwyn previously had a visible Cash out action plus a hidden/off-screen Sell trade affordance, which made the generic Sell ticket path hard to prove on Samsung S23.

## Acceptance Criteria

P0:

- Portfolio visible position action opens the generic ticket path for selling.
- Ticket preserves the selected World Cup winner position and France outcome identity.
- Ticket amount entry is visible on Samsung S23.
- Selecting a preset amount reaches a visible `Swipe to sell` state.
- S23 proof exists.

P1:

- Ticket copy should clearly distinguish order mode (`Sell`) from outcome choice (`Yes/No`).
- Native Google OAuth callback/session/logout remains to be proven separately.

P2:

- Further Portfolio visual polish can wait until the Local MVP full-flow proof is stable.

## Implementation

- `mobile/src/components/Portfolio.tsx`: visible `portfolio-position-cash-out-*` now calls `openPositionTrade(position, "sell")`.
- `mobile/src/__tests__/portfolioPositionTradeContract.test.ts`: locks visible Cash out and hidden Sell affordances to the generic Sell ticket route.
- `mobile/scripts/smoke.ps1`: focused `-ServerPositionTrade` proof now taps the visible Cash out action and checks the current retail ticket instead of stale server/debug text and orderbook depth labels.

## Device Proof

Holiwyn device:

- Samsung S23 `SM-S911U1`
- ADB: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Expo port: `8342`
- Backend: `http://127.0.0.1:3002`

Evidence:

- `docs/mobile/screenshots/cycle-RN-position-sell-ticket/home.png`
- `docs/mobile/screenshots/cycle-RN-position-sell-ticket/portfolio-position-ready.png`
- `docs/mobile/screenshots/cycle-RN-position-sell-ticket/sell-ticket.png`
- `docs/mobile/harness/cycle-RN-position-sell-ticket/home.xml`
- `docs/mobile/harness/cycle-RN-position-sell-ticket/portfolio-position-ready.xml`
- `docs/mobile/harness/cycle-RN-position-sell-ticket/sell-ticket.xml`
- `docs/mobile/harness/cycle-RN-position-sell-ticket/sell-ticket-button.xml`

Proof markers:

- `portfolio-position-cash-out-`
- `trade-ticket`
- `World Cup winner`
- `France`
- `ticket-side-sell`
- `ticket-preset-25`
- `$25`
- `Swipe to sell`

## Google Login Note

Google login did not disappear from code. It was intentionally moved out of Home during Home cleanup and now lives in Portfolio/Account. Cycle RN S23 proof still contains `portfolio-account-entry-google` and `Continue with Google`.

## Result

Audit Gate: Pass for focused RN scope.

Remaining gaps:

- P1: make Sell ticket copy clearer for retail users.
- P1: prove real native Google OAuth callback/session/logout when auth becomes an active milestone.
