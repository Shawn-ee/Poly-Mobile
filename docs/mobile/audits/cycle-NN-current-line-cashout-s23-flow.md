# Cycle NN - Current Line Cashout S23 Flow

## Scope

Local MVP retail betting flow only:

- Home -> Event Detail -> Spread line -> simple Buy ticket -> fake-token/server filled order -> Portfolio position -> cashout ticket -> fake-token/server SELL -> Portfolio History.

No order book, chat, live stats, social, schema migration, or non-MVP UI polish was included.

## Inspection Result Before Work

Current backend/mobile state:

- `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` returns one current match, `argentina-vs-egypt`.
- Regulation Winner has 3 provider-backed Polymarket markets.
- Spread/Totals/Team Total have 4 backend `contract-fixture` line rows.
- Real provider-backed line markets are still unavailable for this inspected event.

Path adjustment:

- Continue Local MVP proof around the currently available route data.
- Do not claim Polymarket line-market parity until provider-backed line rows exist.
- Close the next meaningful user-flow gap by proving the sell/cashout half of the line-market lifecycle.

## Acceptance Criteria

| Criterion ID | Priority | Expected behavior | Result |
| --- | --- | --- | --- |
| NN-P0-01 | P0 | S23 opens current Home/Live/Event Detail and selects the route-backed Spread `1.5` line. | Pass |
| NN-P0-02 | P0 | Ticket preserves market type, line, source, provider market/token identity, and local-pricing disclosure. | Pass |
| NN-P0-03 | P0 | Swipe buy submits a server fake-token order and lands in Portfolio with the filled position visible. | Pass |
| NN-P0-04 | P0 | Cashout button opens a cashout ticket for the same line position. | Pass |
| NN-P0-05 | P0 | Swipe cashout submits a crossing SELL against seeded backend liquidity and History shows a sold activity. | Pass |
| NN-P0-06 | P0 | Orderbook/chat remain hidden throughout the MVP path. | Pass |
| NN-P1-01 | P1 | Spread/Totals/Team Total are provider-backed Polymarket line markets. | Partial - still contract fixtures |

## Implementation

Changed:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

The S23 harness now supports `-ExpectCashout`. After the filled buy proof, it seeds a crossing backend BUY bid for the selected line position, opens `portfolio-position-cash-out-*`, verifies the cashout ticket, swipes to cash out, and checks Portfolio History for a sold activity preserving spread line/source identity.

No production app source, backend route, database schema, or order logic was changed.

## Android Proof

Device:

- Samsung S23
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

Evidence:

- `docs/mobile/harness/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-s23-visible-flow.json`
- `docs/mobile/harness/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-line-cashout-ticket.xml`
- `docs/mobile/harness/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-line-cashout-history.xml`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-line-cashout-ticket.png`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-after-line-cashout.png`
- `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-line-cashout-history.png`

## Validation

- Mobile typecheck: pass via `npm --prefix mobile run typecheck`.
- PowerShell harness syntax: pass.
- S23 visible proof: pass.
- Targeted backend script `tsc` check: not used as a blocker; it still hits existing repo-level path/target issues unrelated to this cycle (`@/` aliases and Prisma private identifiers).

## Audit Gate

Pass for Local MVP line cashout flow.

Not a final Polymarket line-market parity pass because Spread/Totals/Team Total remain backend contract fixtures rather than provider-backed Polymarket line markets.
