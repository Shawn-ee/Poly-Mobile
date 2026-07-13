# Cycle YK - Spain vs. France Cashout S23 Proof

## Scope

- Goal: prove and polish the internal tester mobile trading flow for the current backend-owned Odds API event, `Spain vs. France`.
- Device: Samsung S23, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Event slug: `odds-api-single-soccer-test`.
- Market used: Totals, `Over 2.5`, provider source `sportsbook-odds`.
- Out of scope: order book UI, chat, live stats, social features, production trading, deposit, withdraw.

## Runtime Finding

The first S23 proof attempt reached the ticket submit path but failed before Portfolio because the backend was running with the safe default trading kill switch active. The phone displayed:

- `Order failed. Try again.`
- `Internal trading beta is temporarily disabled.`

This was a runtime configuration blocker, not a cashout UI implementation pass. The backend was restarted with the local internal-beta helper, which sets:

- `INTERNAL_TRADING_BETA_ENABLED=true`
- `TRADING_KILL_SWITCH=false`
- `NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true`

Startup proof: `docs/mobile/harness/cycle-YK-spain-france-cashout-s23/internal-beta-backend-start.json`.

## S23 Proof Result

Fresh S23 proof passed after the backend restart.

Proof summary:

- `docs/mobile/harness/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-odds-api-s23-visible-flow.json`

Key screenshots:

- Home: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-home.png`
- Event detail: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-line-market.png`
- Buy ticket: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-after-submit.png`
- Cashout ticket Max: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-cashout-ticket-ready.png`
- Portfolio history after cashout: `docs/mobile/screenshots/cycle-YK-spain-france-cashout-s23/cycle-YK-SPAIN-FRANCE-CASHOUT-portfolio-history.png`

## Cashout Contract Evidence

The close-position ticket on S23 showed:

- `Cash out Over +2.5`
- `44.64 SHARES`
- `Estimated proceeds $25.89`
- `Closing position`
- `44.64 shares available at 58%`
- `Odds 58% | 44.64 shares available`
- `Swipe to cash out`
- `Sell up to 44.64 shares`

The S23 XML contains the required close-position markers:

- `cashout-ticket-no-yes-no-selector`
- `cashout-close-existing-position`
- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-available-shares-44.640000`
- `cashout-sell-price-0.58`
- `cashout-max-owned-shares`
- `cashout-amount-is-shares`

The proof explicitly rejects wallet-sized cashout values such as `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.

## Assertions Passed

- Home shows backend-owned `Spain vs. France`.
- Event detail loads backend markets.
- Order book and chat remain hidden.
- Totals line `Over 2.5` is visible and provider-tagged.
- Buy ticket preserves market, line, outcome, provider, condition, token, and source identity.
- Swipe buy reaches Portfolio.
- Portfolio position preserves the sportsbook line identity.
- Cashout opens close-position mode, not the generic buy ticket.
- Cashout Max uses owned shares only.
- Cashout does not show the Yes/No selector.
- Cashout sell submits.
- Portfolio history shows the sold activity.

## Remaining Gaps

- P0: none for this cashout/internal tester trading proof.
- P1: backend must be started with the internal-beta helper for local tester trading; plain `npm run dev -p 3002` keeps trading disabled by default.
- P1: the current Spain vs. France event still uses a mix of sportsbook-backed totals and Holiwyn-owned contract fixtures for unavailable spread/extra line markets.
- P2: cashout visual polish can improve later, but current behavior is correct for internal testing.
