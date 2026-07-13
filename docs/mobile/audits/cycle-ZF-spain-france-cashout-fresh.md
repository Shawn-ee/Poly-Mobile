# Cycle ZF - Spain vs. France Fresh S23 Cashout Proof

## Scope

- Current `main` internal tester flow for the backend-owned Odds API event `Spain vs. France`.
- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Required path: Home -> Event Detail -> Total 2.5 -> Buy ticket -> fake-token order -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

## Result

Pass on 2026-07-13.

The first proof attempt exposed an Expo Go overlay/onboarding state. The product path was not changed; the S23 proof harness was tightened so it dismisses Expo's first-run developer overlay by tapping the explicit Continue/close controls instead of using Android Back, which can throw the phone into Samsung search.

## Evidence

- Summary: `docs/mobile/harness/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Home: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-home.png`
- Event Detail: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-line-market.png`
- Buy ticket: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-after-submit.png`
- Cashout Max: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio History: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-portfolio-history.png`

## Cashout Contract Evidence

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`
- Cashout ready XML includes `cashout-mode-active-true`, `cashout-source-position-present`, `cashout-effective-side-sell`, `cashout-available-shares-43.100000`, `cashout-max-owned-shares`, and `cashout-share-quantity-display`.
- Max displayed `43.1` shares, with `43.1 shares available at 58%`.
- The proof rejects wallet-sized cashout values including `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.

## Route and Runtime Dependencies

- Home/Event Detail: `GET /api/events`, `GET /api/mobile/events/:slug/live-detail`
- Quote/ticket identity: `GET /api/markets/:marketId/quote`
- Buy/Sell: `POST /api/orders`
- Portfolio/history: `GET /api/portfolio`, `GET /api/portfolio/history`
- Counterparty liquidity: proof-only seeding via `scripts/seed_mobile_route_spread_counterparty.ts`

## Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History path.
- P1: cashout proceeds still depend on current bid/seeded local liquidity; a dedicated preview route would make proceeds clearer to users.
- P2: Expo Go first-run overlay can still interrupt manual sessions, but the automated proof now handles it without using Android Back.
