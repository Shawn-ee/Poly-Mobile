# Cycle ZBB S23 Cashout Owned-Shares Proof

Date: 2026-07-14

Scope: Internal tester mobile trading flow for the current Odds API event, Spain vs. France.

## Result

Pass. The real Samsung S23 flow opened the Portfolio cashout ticket in close-position mode, not the generic buy/sell ticket.

## Device

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

## Flow Proven

Home -> Spain vs. France -> Event Detail -> Totals 2.5 line -> Buy ticket -> swipe buy -> Portfolio position -> Cash out -> Max -> swipe cashout -> Portfolio History.

## Cashout Evidence

- Summary: `docs/mobile/harness/cycle-ZBB-s23-cashout-owned-shares/cycle-ZBB-S23-CASHOUT-odds-api-s23-visible-flow.json`
- Cashout ticket initial XML: `docs/mobile/harness/cycle-ZBB-s23-cashout-owned-shares/cycle-ZBB-S23-CASHOUT-cashout-ticket.xml`
- Cashout ticket after Max XML: `docs/mobile/harness/cycle-ZBB-s23-cashout-owned-shares/cycle-ZBB-S23-CASHOUT-cashout-ticket-ready.xml`
- Cashout ticket after Max screenshot: `docs/mobile/screenshots/cycle-ZBB-s23-cashout-owned-shares/cycle-ZBB-S23-CASHOUT-cashout-ticket-ready.png`
- Portfolio history XML: `docs/mobile/harness/cycle-ZBB-s23-cashout-owned-shares/cycle-ZBB-S23-CASHOUT-portfolio-history.xml`

Observed in the S23 XML:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-ticket-no-yes-no-selector`
- `cashout-available-shares-43.100000`
- amount display: `43.1` with unit `SHARES`
- price line: `Odds 58% | 43.1 shares available`
- swipe helper: `Sell up to 43.1 shares`

The proof rejects wallet-sized cashout values by asserting the cashout ticket XML does not contain `9,000 USDT`, `9000 USDT`, `10,000 USDT`, or `10000 USDT`.

## Validation

- S23 proof: passed.
- Mobile typecheck: passed.
- Mobile focused tests: 34 passed.
- Backend focused tests: 36 passed after loading local `DATABASE_URL`.

## Remaining Gaps

- P0: none for this cashout path.
- P1: Manual tester should still confirm by hand on S23 after the runtime is reopened, because Expo Go can retain old screen state until force-stopped/reloaded.
- P2: Cashout visual polish can continue later, but Max/share semantics are proven.
