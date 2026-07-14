# Cycle ZBC S23 Cashout Fresh Proof

Date: 2026-07-14

Scope: Fresh internal tester mobile trading proof for the current Odds API event, Spain vs. France.

## Result

Pass. The real Samsung S23 flow opened Portfolio Cash out in close-position mode. Max used the owned position share amount, not wallet balance.

## Device

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

## Flow Proven

Home -> Spain vs. France -> Event Detail -> Totals 2.5 line -> Buy ticket -> swipe buy -> Portfolio position -> Cash out -> Max -> swipe cashout -> Portfolio History.

## Cashout Evidence

- Summary: `docs/mobile/harness/cycle-ZBC-s23-cashout-fresh/cycle-ZBC-S23-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout ticket initial XML: `docs/mobile/harness/cycle-ZBC-s23-cashout-fresh/cycle-ZBC-S23-CASHOUT-FRESH-cashout-ticket.xml`
- Cashout ticket after Max XML: `docs/mobile/harness/cycle-ZBC-s23-cashout-fresh/cycle-ZBC-S23-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Cashout ticket after Max screenshot: `docs/mobile/screenshots/cycle-ZBC-s23-cashout-fresh/cycle-ZBC-S23-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio history XML: `docs/mobile/harness/cycle-ZBC-s23-cashout-fresh/cycle-ZBC-S23-CASHOUT-FRESH-portfolio-history.xml`

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
- Mobile focused Vitest contract tests: 21 passed.
- Backend focused Jest tests: 45 passed.
- Backend route sell-safety proof: passed; no-position sell and oversell returned `INSUFFICIENT_BALANCE`, while a valid owned-share sell was accepted.
- Root TypeScript check: passed.
- Full root CI Jest suite: 35 suites / 177 tests passed.

## Remaining Gaps

- P0: none for this cashout path.
- P1: Manual tester should still confirm by hand on S23 after any Expo cache reset or runtime restart.
- P2: Cashout visual polish can continue later, but Max/share semantics are proven on the physical phone.
