# Trade Ticket Polymarket Audit

Status: Cycle AG P0 pass for focused trade-ticket first-view density, amount state, advanced-details toggle, and safe submit gate parity.

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

- Continue to Portfolio/open-order/activity parity or a dedicated binary Buy/Sell/No-share contract cycle.

## Cycle AI - Logged-In Ticket Surface

Reference device:

- Samsung S23.

Polymarket app/browser:

- Logged-in Polymarket Android app.

Reference route or URL:

- Native app World Cup tab, Futures, World Cup Winner detail page.

Reference behavior:

| Action | Polymarket result | State/data change | Evidence |
| --- | --- | --- | --- |
| Open logged-in World Cup tab on Home | Shows Polymarket header, Deposit, notification control, sports category rail, World Cup tab, Games/Futures switch, World Cup Winner card, outcome rows, bottom nav, and Portfolio balance. | User is logged in; World Cup Futures rows are visible. | `docs/mobile/reference/screenshots/cycle-AI-polymarket-logged-in-start.png`; `docs/mobile/reference/screenshots/cycle-AI-polymarket-logged-in-start.xml` |
| Tap France outcome from Futures list | Opens the World Cup Winner market page with Market/Chat segmented control, rules/book/share actions, date, title, image, multi-outcome chart, range controls `All`, `1H`, `1D`, `1W`, chat card, search, and outcome rows. | Selected market context changes from list to detail page. | `docs/mobile/reference/screenshots/cycle-AI-polymarket-logged-in-france-ticket.png`; `docs/mobile/reference/screenshots/cycle-AI-polymarket-logged-in-france-ticket.xml` |
| Scroll outcome row higher and tap France probability | Dims the full page and opens a tall bottom sheet. On this S23 session the sheet is a production `Location verification failed` state with one large `Contact support` action. | No trade is placed; production eligibility blocks order entry before confirmation. | `docs/mobile/reference/screenshots/cycle-AI-polymarket-after-france-row-tap.png`; `docs/mobile/reference/screenshots/cycle-AI-polymarket-after-france-row-tap.xml` |

Cycle AI acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| TT-AI-P0-01 | P0 | Holiwyn ticket opens over a dimmed game page as a tall sheet instead of the old compact bottom sheet. | Samsung tablet screenshot | Pass |
| TT-AI-P0-02 | P0 | After amount entry, the primary action keeps Polymarket's swipe-confirm mental model by showing `Swipe up to buy`/`Swipe up to sell`, not a plain `Trade` button. | Samsung tablet XML | Pass |
| TT-AI-P0-03 | P0 | Ticket still preserves selected market/outcome/contract identity and amount-to-win state after becoming taller. | Samsung tablet smoke | Pass |
| TT-AI-P0-04 | P0 | Futures `Buy No` remains a Buy action for the selected No contract after the ticket-surface change. | Samsung tablet smoke | Pass |
| TT-AI-P0-05 | P0 | Logged-in Polymarket production eligibility/location behavior is documented without implementing real-money production gates in fake-token Holiwyn mode. | Reference audit and docs | Pass |
| TT-AI-P1-01 | P1 | Production location/login/trading eligibility states should be implemented when real-money scope starts. | Future auth/wallet cycle | Deferred |
| TT-AI-P2-01 | P2 | Native drag physics and transition animation should be polished closer to Polymarket. | Visual QA | Deferred |

Holiwyn implementation:

- `mobile/src/components/TradeTicket.tsx` now gives the ticket surface a fixed tall sheet height, larger amount area, larger fixed swipe rail, and submit copy that remains `Swipe up to buy` or `Swipe up to sell` after amount entry.
- `mobile/scripts/smoke.ps1` now checks the updated swipe-ready label in focused ticket proofs.

Holiwyn proof:

- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket-amount.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket.xml`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket-amount.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-future-list-buy-no-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-future-list-buy-no-ticket.xml`

Verification:

- `npm run typecheck`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/orderService.test.ts`
- `cmd /c npm.cmd run smoke:tablet:event-detail-trade`
- `cmd /c npm.cmd run smoke:tablet:future-list-buy-no`

Audit Gate:

Result: Pass for focused logged-in/tall ticket-surface parity.

Unresolved P0 gaps: 0 for this focused scope.

Remaining P1/P2 gaps:

- Polymarket's real production eligibility/location sheet is documented but not implemented in fake-token Holiwyn mode.
- Native sheet drag physics and transition polish remain below Polymarket.

## Cycle AG - Ticket Visual Density And Advanced Details

Reference device:

- Samsung S23.

Polymarket app/browser:

- Polymarket Android app and Polymarket mobile web in Chrome.

Reference route or URL:

- Native app: Australia vs Egypt World Cup event from the Home/World Cup surface.
- Web: `https://polymarket.com/event/fifwc-aus-egy-2026-07-03`.

Reference behavior:

| Action | Polymarket result | State/data change | Evidence |
| --- | --- | --- | --- |
| Open native event and tap bottom trade button | Native app shows location verification failure before a trade ticket can proceed. | No trade is placed. User can only contact support from the blocked sheet. | `docs/mobile/reference/screenshots/cycle-AG-polymarket-ticket-open.png` |
| Open mobile web event and scroll to Game Lines | Web shows Australia vs Egypt, Market/Live stats switch, chart, combos, Game Lines, and Team to Advance/Moneyline rows. | Market row buttons expose prices such as `EGY 61c`. | `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-rows.png` |
| Tap EGY Team to Advance row | Opens a bottom sheet over a dimmed page with drag handle, `Buy` pill, settings icon, market/outcome identity, large `$0`, selected-team pill, quick chips, and one large `Trade` button. | Ticket preserves `Team to Advance` and `Egypt`. | `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-ticket-open.png`; `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-ticket-open.xml` |
| Tap `+$10` | Amount becomes `$10`, payout line appears as `To win $16.20`, price shows `62c`, quick chips remain visible, and `Trade` stays primary. | Amount and payout estimate update in place. | `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-ticket-amount.png`; `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-ticket-amount.xml` |
| Tap `Trade` in US web view | Web shows view-only/download/login gate, including Google/email options and continue-view-only affordance. | No trade is placed. | `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-ticket-trade.png`; `docs/mobile/reference/screenshots/cycle-AG-polymarket-web-ticket-trade.xml` |

Cycle AG acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| TT-AG-P0-01 | P0 | Ticket first view is a clean bottom sheet with drag handle, active Buy/Sell pill, settings control, market/outcome identity, large amount, quick chips, and one primary action. | Samsung tablet screenshot/XML | Pass |
| TT-AG-P0-02 | P0 | `+$10` updates amount, `To win` payout, price line, and submit readiness without opening dense advanced controls. | Samsung tablet smoke | Pass |
| TT-AG-P0-03 | P0 | Settings/options button is functional and opens advanced depth, keypad, slippage, and estimate details. | Samsung tablet smoke | Pass |
| TT-AG-P0-04 | P0 | Ticket closes and reopens for another outcome without stale selected outcome data. | Samsung tablet smoke | Pass |
| TT-AG-P0-05 | P0 | Native/web blocked trade states are documented and Holiwyn fake-token mode remains explicit rather than pretending to be real-money production trading. | Reference audit and docs | Pass |
| TT-AG-P1-01 | P1 | Polymarket's true binary/team selector and Buy/Sell/No-share contract semantics should be modeled more exactly. | Future reference plus backend contract audit | Deferred |
| TT-AG-P1-02 | P1 | Holiwyn should eventually show auth/location/trading eligibility gates when production requirements are defined. | Future auth/compliance product cycle | Deferred |

Holiwyn implementation:

- `mobile/src/components/TradeTicket.tsx` now resets advanced details per ticket, uses a drag handle, active Buy/Sell pill, compact selection summary, large dollar amount, selected-outcome row, Polymarket-like `To win` and price line, and hides keypad/depth/estimate details until the settings control is tapped.
- `mobile/scripts/smoke.ps1` and `mobile/package.json` now include focused tablet proof for this updated ticket behavior.

Holiwyn proof:

- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket-amount.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket-amount.xml`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket-details.xml`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket-closed.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-away-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-away-ticket.xml`

Verification:

- `npm run typecheck`
- `cmd /c npm.cmd run smoke:tablet:event-detail-trade`

Audit Gate:

Result: Pass for focused trade-ticket first-view density and advanced-details behavior.

Unresolved P0 gaps: 0 for focused scope.

Remaining P1/P2 gaps:

- True binary Buy/Sell/No-share semantics still need a dedicated contract cycle.
- Production auth/location/trading eligibility gates remain future work and are not part of fake-token mock trading.
