# Trade Ticket Polymarket Audit

Status: Cycle Z P0 pass for focused game-page ticket open, amount chips, amount calculation, and swipe-submit readiness.

## Scope

- Buy/Sell switching.
- Outcome and line carry-through.
- Amount entry and keypad behavior.
- Odds/probability updates.
- Cost, payout, profit, fees if present.
- Confirmation interaction, including swipe/press patterns if present.
- Error, disabled, loading, and insufficient-balance states.
- Post-submit order/portfolio/history effects.

## Reference Audit

Reference device:

- Samsung S23.

Polymarket app/browser:

- Polymarket mobile web.

Route or URL if available:

- `https://polymarket.com/event/fifwc-usa-bel-2026-07-06-first-to-score`

Screenshots/UI hierarchy:

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open ticket from market row | Opens a bottom-sheet ticket over the dimmed market page. Shows `Buy`, settings icon, line rail, selected matchup/outcome, large `$0`, team selector, quick amount chips, and a large `Trade` button. | Ticket carries selected line `United States -2.5` and selected team. | `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-open.png` |
| Enter amount | Tapping `+$10` changes amount to `$10`, reveals `To win $138.87`, and keeps odds visible as `7c`. | Amount and payout estimate update in place. | `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-amount.png` |
| Try submit/confirmation pattern without real trade completion | Tapping `Trade` on Polymarket mobile web in the US opens a view-only/download/login gate instead of placing a trade. | User is diverted to view-only mode, Google/email login, and app download prompt. | `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-trade.png` |
| Switch Buy/Sell | Not fully audited in Cycle Z. The captured line ticket exposes team/outcome selection rather than Holiwyn's generic Yes/No control. | Deferred. | Pending |
| Change outcome/line before ticket | Covered by Cycle Y for line selection and Cycle Z for selected line carry-through into ticket. | Selected `-2.5` line is preserved. | `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-open.png` |
| Trigger validation/error state safely | Not completed in Cycle Z. | Deferred. | Pending |

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-open.png`
- `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-open.xml`
- `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-amount.png`
- `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-trade.png`
- `docs/mobile/reference/screenshots/cycle-Z-polymarket-ticket-trade.xml`

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| TT-P0-01 | P0 | Ticket opens from a game-page market button and carries selected market/outcome. | Device smoke/state proof | Pass |
| TT-P0-02 | P0 | Ticket exposes Polymarket-style quick amount chips `+$1`, `+$5`, `+$10`, and `+$100`. | Device smoke | Pass |
| TT-P0-03 | P0 | Amount entry updates cost, payout/profit, shares, and submit readiness without stale data. | Device smoke/unit test | Pass |
| TT-P0-04 | P0 | Submit/confirmation interaction is not a dead button and exposes swipe-up safety copy for fake-token trading. | Device smoke | Pass |
| TT-P0-05 | P0 | Ticket can be closed and reopened for another outcome without stale selected outcome data. | Device smoke | Pass |
| TT-P1-01 | P1 | Ticket visual hierarchy and motion match Polymarket closely. | Screenshot/manual audit | Deferred |
| TT-P1-02 | P1 | US view-only/download/login gate is represented for unauthenticated or restricted states. | Reference audit + auth-state design | Deferred |

Holiwyn proof:

- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket-amount.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket-amount.xml`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket-closed.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-away-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-away-ticket.xml`

Verification:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailTrade -Port 8199`

## Audit Gate

Result: Pass for focused game-page ticket open, amount chips, amount calculation, and swipe-submit readiness.

Unresolved P0 gaps: 0 for focused scope.

Remaining P1/P2 gaps:

- Polymarket's ticket has a cleaner first view with less keypad-heavy density; Holiwyn still exposes full keypad/slippage/estimate grid on the first sheet.
- Polymarket mobile web in the US gates Trade into view-only/download/login; Holiwyn fake-token flow intentionally allows mock orders.
- Polymarket line ticket exposes selected teams in a two-option selector, while Holiwyn currently uses Yes/No side labels for many markets.
- Full submit-to-portfolio/open-order parity remains covered by other smokes and should be re-audited in the Portfolio/Open Orders cycle.

Recommended next cycle:

- Continue to Portfolio/open-order/activity parity or create a dedicated ticket visual-density cycle.
