# Cycle ZG - Spain vs France S23 Cashout Current Runtime Proof

Generated: 2026-07-13

## Scope

Fresh S23 proof for the current backend-owned Odds API Spain vs France internal tester event. This cycle validates the Local MVP trading path that was at risk on the real phone:

Home -> Event Detail -> totals line market -> Buy ticket -> fake-token/server-backed order -> Portfolio -> Cash out -> Max -> Sell -> Portfolio History.

No order book, chat, live stats, schema, or new runtime/operator infrastructure work was added.

## Runtime

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend: local `3002`, `/api/health` returned `ok` with DB connected before proof.
- Mobile mode: `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`.
- Event: `Spain vs. France`, slug `odds-api-single-soccer-test`.
- Selected market: totals, line `2.5`, outcome `Over 2.5`.
- Cashout bid used for proof liquidity: `0.58`.

## Evidence

Summary:

- `docs/mobile/harness/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-odds-api-s23-visible-flow.json`

Key screenshots/XML:

- Home: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-home.png`
- Event detail top: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-line-market.png`
- Buy ticket: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-after-submit.png`
- Cashout ticket after Max: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-cashout-ticket-ready.png`
- Cashout ticket XML after Max: `docs/mobile/harness/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-cashout-ticket-ready.xml`
- Portfolio history after sell: `docs/mobile/screenshots/cycle-ZG-spain-france-cashout-current/cycle-ZG-SPAIN-FRANCE-CASHOUT-CURRENT-portfolio-history.png`

## Assertions Passed

- Home shows the backend-owned Spain vs France event.
- Event detail loads provider-shaped Game Lines from backend.
- Order book and chat remain hidden for Local MVP.
- Buy ticket preserves sportsbook line identity.
- Swipe submit reaches Portfolio.
- Portfolio position preserves sportsbook line identity.
- Cashout ticket opens from Portfolio.
- Cashout ticket is close-position mode.
- Cashout Max uses owned shares.
- Cashout ticket hides the Yes/No selector.
- Cashout sell submits.
- Portfolio history updates after sell.

## Cashout Runtime Finding

The S23 cashout ticket after tapping Max showed owned shares, not wallet balance:

- `cashout-ticket-no-yes-no-selector`
- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-max-owned-shares`
- `cashout-amount-is-shares`
- Amount text: `43.1`
- Unit text: `SHARES`
- Price line: `Odds 58% | 43.1 shares available`
- Helper text: `Sell up to 43.1 shares`

The cashout XML did not contain the wallet-sized failure values `9000 USDT`, `9,000 USDT`, `10000 USDT`, or `10,000 USDT`.

## P0/P1/P2

P0:

- None for the current Spain vs France cashout path. Fresh S23 proof passed.

P1:

- Current proof uses a local proof credential and local fake-token liquidity seed. Internal tester runtime should keep this as local-only until a real test-user onboarding path is finalized.
- Cached provider restore is quota-free; fresh live provider refresh still requires explicitly configured provider credentials.

P2:

- The reusable local test slug should be replaced by per-provider-event slugs before multi-event onboarding.
- Cashout copy can be further polished, but behavior is correct for internal testing.
