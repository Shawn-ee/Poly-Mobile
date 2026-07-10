# Cycle TP - Ticket Submit To Portfolio Reproof

Status: Samsung S23 full Local MVP proof pass.

## Scope

This cycle closes the follow-up proof gap from Cycle TO. It did not change source code. It reran the full Local MVP path on Samsung S23 after the ticket armed-state copy change:

Home -> Live/Event Detail -> Game Lines -> line-market ticket -> swipe submit -> server-backed fake-token order -> Portfolio History.

No order book, chat, live stats, social, backend schema, or UI polish work was touched.

## Acceptance Criteria

| Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P0 | Home and Live still expose the current match-only MVP route. | Pass | `docs/mobile/harness/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-s23-visible-flow.json` |
| P0 | Event Detail still shows Game Lines with provider-winner/local-line source disclosure. | Pass | `detailShowsGameLines=true`, `detailShowsProviderWinnerLocalLineSplit=true` |
| P0 | Ticket preserves selected spread line identity. | Pass | `ticketPreservesLine=true`; `cycle-TP-current-mvp-ticket-ready.xml` |
| P0 | Swipe submit reaches Portfolio. | Pass | `swipeSubmitReachedPortfolio=true`; `cycle-TP-current-mvp-after-submit.xml` |
| P0 | Portfolio History shows the filled line-market trade. | Pass | `filledHistoryVisible=true`; `cycle-TP-current-mvp-portfolio-history.xml` |
| P0 | Order book and chat remain hidden from the Local MVP path. | Pass | `orderbookHidden=true`; proof XML assertions |

## Android Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-s23-visible-flow.json`
- Counterparty proof: `docs/mobile/harness/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-counterparty.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-lines.png`
  - `docs/mobile/screenshots/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-ticket-ready.png`
  - `docs/mobile/screenshots/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-after-submit.png`
  - `docs/mobile/screenshots/cycle-TP-ticket-submit-portfolio-reproof/cycle-TP-current-mvp-portfolio-history.png`

## Validation

- `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -Cycle TP -OutputDir "docs\mobile\screenshots\cycle-TP-ticket-submit-portfolio-reproof" -HierarchyOutputDir "docs\mobile\harness\cycle-TP-ticket-submit-portfolio-reproof" -SeedCounterparty -ExpectFilledHistory`

## Remaining Gaps

- P1: real provider-backed spread/totals/team-total current-match lines remain unavailable from Polymarket Gamma; the filled proof uses the existing backend-shaped contract fixture row with explicit source disclosure.
