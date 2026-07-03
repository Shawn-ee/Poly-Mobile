# Binary Side Ticket Audit

Status: Cycle AH pass for focused futures `Buy No` contract identity. Native full-screen/swipe confirmation parity remains tracked as a P1 follow-up.

## Cycle AH - Buy No Contract Side

Reference device:

- Samsung S23.

Polymarket app/browser:

- Polymarket Android app and Polymarket mobile web/native World Cup surfaces.

Reference route or page:

- Native World Cup match page: Australia vs Egypt.
- Native World Cup Futures list: World Cup Winner rows.
- Mobile web was also opened through Chrome, but it redirected to the current World Cup match route during this cycle.

Reference behavior:

| Action | Polymarket result | State/data change | Evidence |
| --- | --- | --- | --- |
| Open World Cup Futures list | Rows show outcome identity, large probability, and separate positive/negative contract controls such as `Buy Yes` and `Buy No` on web/reference surfaces; native futures list shows compact probability buttons. | Selected outcome and contract side are separate concepts. | `docs/mobile/reference/screenshots/cycle-AH-polymarket-futures-list.png`; `docs/mobile/reference/screenshots/cycle-AH-polymarket-web-futures-forced.png` |
| Tap a native World Cup match outcome | The app opens a tall, page-like blocked trading sheet because S23 location verification fails. | No order is placed; gate replaces the ticket body. | `docs/mobile/reference/screenshots/cycle-AH-polymarket-live-outcome-ticket.png`; `docs/mobile/reference/screenshots/cycle-AH-polymarket-live-outcome-ticket.xml` |
| Inspect native World Cup match page | The match page uses a full-screen game surface with large chart, large team buttons, Game/Chat top switch, Game Lines/Player Props tabs, and an anchored market list. | Outcome buttons select an exact contract context before ticket/gate. | `docs/mobile/reference/screenshots/cycle-AH-polymarket-live-start-real.png`; `docs/mobile/reference/screenshots/cycle-AH-polymarket-live-start.xml` |

Cycle AH acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| BS-AH-P0-01 | P0 | Holiwyn futures `Buy No` must open a Buy ticket, not a Sell ticket. | Tablet screenshot/XML. | Pass |
| BS-AH-P0-02 | P0 | Holiwyn ticket must preserve explicit `No` contract identity separately from transaction action. | Tablet screenshot/XML and unit test. | Pass |
| BS-AH-P0-03 | P0 | `Buy No` price, payout, order, latest order, and activity must use inverse contract probability. | Tablet smoke and order service test. | Pass |
| BS-AH-P0-04 | P0 | Server order payload must pass explicit `contractSide` so backend/schema work can model YES/NO shares. | Unit test and data-contract docs. | Pass |
| BS-AH-P1-01 | P1 | Holiwyn trade confirmation should move toward Polymarket's taller full-page/native swipe-up surface rather than a compact bottom sheet. | S23 reference screenshot and later visual proof. | Deferred |

Holiwyn implementation:

- `Ticket` and `TicketSelection` now carry `contractSide: "yes" | "no"`.
- Futures `Buy No` now opens `side="buy"` with `contractSide="no"`.
- Ticket display, payout, price, order service, Portfolio display, and activity rows preserve `No - France`.
- Server order requests now include `contractSide: "YES" | "NO"` in addition to transaction `side`.

Holiwyn proof:

- `docs/mobile/screenshots/cycle-current-holiwyn-future-list-buy-no-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-future-list-buy-no-ticket.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-future-list-buy-no-portfolio.png`
- `docs/mobile/harness/cycle-current-holiwyn-future-list-buy-no-portfolio.xml`

Verification:

- `npm run typecheck`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/orderService.test.ts`
- `cmd /c npm.cmd run smoke:tablet:future-list-buy-no`

Audit Gate:

Result: Pass for focused `Buy No` binary-side contract scope.

Unresolved P0 gaps: 0 for focused scope.

Remaining P1/P2 gaps:

- Native Polymarket trade confirmation should be re-audited when location is unblocked; current S23 proof shows the same tall sheet surface but location gate body, not the live order body.
- Holiwyn still uses a bottom sheet and should be moved toward the fuller page/tall sheet swipe-up confirmation model in a later ticket UI cycle.
