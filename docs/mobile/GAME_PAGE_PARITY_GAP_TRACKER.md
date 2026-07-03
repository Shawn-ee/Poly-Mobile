# Holiwyn Game Page Parity Gap Tracker

Date: 2026-07-02

Scope: single soccer game page parity against the real Polymarket Android app on Samsung S23.

Reference audit: `docs/mobile/POLYMARKET_GAME_PAGE_REFERENCE_AUDIT.md`

Criteria: `docs/mobile/HOLIWYN_GAME_PAGE_PARITY_CRITERIA.md`

Status meanings:

- `Open`: missing or not implemented deeply enough.
- `Partial`: visible or partly interactive, but below the P0 criterion.
- `Verified`: proven by current Holiwyn Samsung evidence and an audit pass.

## P0 Gaps

| ID | Current Holiwyn Status | State | Evidence Needed | Next Cycle |
| --- | --- | --- | --- | --- |
| GP-P0-01 | Header presence is now proven on Samsung with back, Game/Chat segmented control, badge, book/rules, and share icons. Tappable behavior for book/share remains tracked under GP-P0-18. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png` and `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`. | Done |
| GP-P0-02 | Live scoreboard is now proven on Samsung with flags, team abbreviations, `0 - 0`, `15'`, and both team probabilities. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png` and XML. | Done |
| GP-P0-03 | Chart now renders two independent outcome traces with selected label/percent. It is still local deterministic data, which remains GP-P1-01. | Verified | Samsung screenshot/XML show two traces and selected outcome label/percent. | Done |
| GP-P0-04 | Chart now shows trade/value markers and `All / Game / Live` filter controls. | Verified | Samsung screenshot/XML show `+$9`, `+$39`, `+$479`, `All`, `Game`, and `Live`. | Done |
| GP-P0-05 | Social preview card is now proven with chatting count, avatar, username, trade badge, and message. | Verified | Samsung screenshot/XML show `78914 chatting`, `gigglyeel0550`, `BTTS $36`, and `VAMOS`. | Done |
| GP-P0-06 | Primary team buttons now open the correct Polymarket-style ticket for both sides. Samsung smoke taps Mexico, closes the sheet, then taps Ecuador and proves the selected side/outcome changes correctly. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket.png`, `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-away-ticket.png`, and `docs/mobile/harness/cycle-current-holiwyn-event-detail-away-ticket.xml`. | Done |
| GP-P0-07 | Regulation Time Winner group is now separated from the generic winner market and includes the required subtitle. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-game-line-expanded.png` and XML. | Done |
| GP-P0-08 | Three-row regulation-time winner is now proven with home, tie, away rows, icons, mini-lines, odds, and probability buttons. | Verified | Samsung focused smoke `smoke:samsung:event-detail-outcome-depth` passed. | Done |
| GP-P0-09 | Spread group now includes dynamic sentence, line-value pill, Reg. Time / 1st Half / 2nd Half segmented controls, and Yes/No rows. Full selector behavior remains GP-P1-03/04. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-game-line-groups.png` and XML. | Done |
| GP-P0-10 | Totals group now shows Over/Under rows with odds and probability buttons. | Verified | Samsung scroll proof shows `Totals`, `Total goals over 2.5`, `Over 2.5`, and `Under 2.5`. | Done |
| GP-P0-11 | 1st Half Winner now shows three rows. | Verified | Samsung scroll proof shows `1st Half Winner`, `Mexico 1H`, `Tie 1H`, and `Ecuador 1H`. | Done |
| GP-P0-12 | 2nd Half Winner now shows three rows. | Verified | Samsung scroll proof shows `2nd Half Winner`, `Mexico 2H`, `Tie 2H`, and `Ecuador 2H`. | Done |
| GP-P0-13 | Full Game Team Total Goals now shows Over/Under rows. | Verified | Samsung scroll proof shows `Full Game Team Total Goals (Reg. Time)`, `MEX Over 1.5`, and `MEX Under 1.5`. | Done |
| GP-P0-14 | Player Props now shows `Goals (Reg. Time)`, team filter chips, player rows, stat-line dropdowns, odds multipliers, probability buttons, `Show all`, and additional collapsed prop groups. | Verified | Samsung props proof captures header, rows, and lower prop groups. | Done |
| GP-P0-15 | Expand/collapse behavior is proven for Regulation Time Winner; richer groups still need their own rows in later cycles. | Verified | Samsung focused smoke captures expanded and collapsed states. | Done |
| GP-P0-16 | Ticket overlay now matches the P0 Polymarket-style numeric-entry sheet: close, event title, selected side/outcome, settings icon, large `$0` amount, Yes/No toggle, odds/available line, `+$5`/`+$10`/`+$25`, numeric keypad, and disabled `Choose an amount` prompt. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket.png` and `docs/mobile/harness/cycle-current-holiwyn-event-detail-ticket.xml`. | Done |
| GP-P0-17 | Chat tab is not yet proven as a real feed/input/reaction page state. | Partial | Samsung Chat proof with feed, typing indicator, input, reactions, emoji, sticky outcomes. | Cycle F |
| GP-P0-18 | Save/book and share controls need tappable proof and non-breaking behavior. | Partial | Smoke taps controls and captures stable/dismissed state. | Cycle F |
| GP-P0-19 | Market Rules and More Events now appear after market/prop groups. | Verified | Samsung proof `cycle-current-holiwyn-event-detail-props-rules-more.png` / XML shows rules, `View Full Rules`, `More Events`, and event rows. | Done |
| GP-P0-20 | Full-page Holiwyn scroll proof now exists across top, Game Lines, Player Props, rules, and More Events. | Verified | Combined Samsung evidence from Cycle C, Cycle D, and Cycle E. | Done |
| GP-P0-21 | Final independent audit has not happened and P0 gaps remain unresolved. | Open | Final audit maps every P0 to evidence and leaves zero P0 gaps. | Final Audit |

## P1 Gaps

| ID | Current Holiwyn Status | State | Notes |
| --- | --- | --- | --- |
| GP-P1-01 | Chart data is not proven backend-backed. | Open | Can remain P1 if deterministic local series passes P0 visual parity. |
| GP-P1-02 | Chart press/hold tooltip is not implemented. | Open | Reference proof did not capture a persistent tooltip; keep tracked without blocking P0. |
| GP-P1-03 | Spread line selector is not implemented. | Open | P0 needs visible pill; selector can follow. |
| GP-P1-04 | Spread time segments do not yet change data. | Open | P0 needs visible segments and rows; behavior can follow. |
| GP-P1-05 | Amount-entered ticket submit/swipe state is incomplete. | Open | Avoid accidental real trades in reference; safe Holiwyn proof can be added. |
| GP-P1-06 | Native share state is unproven. | Open | Needs dismissible smoke proof. |
| GP-P1-07 | Rules sheet from book icon is unproven. | Open | Lower Market Rules section is P0; icon sheet remains P1. |
| GP-P1-08 | Chat reactions/input interactions are unproven. | Open | Chat visual page is P0; richer safe input behavior is P1. |
| GP-P1-09 | Liquidity/order-depth expansion is missing. | Open | Useful after P0 layout parity. |

## P2 Gaps

| ID | Current Holiwyn Status | State | Notes |
| --- | --- | --- | --- |
| GP-P2-01 | Pixel-level spacing and animation parity is not yet audited. | Open | Requires side-by-side audit after P0. |
| GP-P2-02 | Real-time chat badge/count updates are not proven. | Open | Requires timed proof. |
| GP-P2-03 | Smooth chart animation is not proven. | Open | Requires video or screenshot sequence. |
| GP-P2-04 | Closed/suspended/no-liquidity states are not implemented. | Open | Outside current P0 capture. |
| GP-P2-05 | Comprehensive real soccer player props are not implemented. | Open | P0 requires representative player props only. |

## Cycle Notes

- Cycle A produced the real Samsung Polymarket reference audit.
- Cycle B produced criteria and this initial gap tracker. It intentionally marks the game page as not complete because the old prototype Definition of Done is not strict enough for Polymarket parity.
- Cycle C upgraded the visible top game page and Regulation Time Winner rows. Verified on Samsung with `npm run smoke:samsung:event-detail-summary`, `npm run smoke:samsung:event-detail-outcome-depth`, and `npm run typecheck`. Remaining P0 work is still substantial: ticket parity, Spread/Totals/half markets/team totals, Player Props rows, Chat page, book/share behavior, rules, More Events, full-page scroll proof, and final independent audit.
- Cycle D added the remaining P0 Game Lines market groups: Spread, Totals, 1st Half Winner, 2nd Half Winner, and Full Game Team Total Goals. Verified on Samsung with `npm run smoke:samsung:event-detail-outcome-depth` and `npm run typecheck`. Remaining P0 work: Player Props rows, ticket parity, Chat page, book/share behavior, lower Market Rules/More Events, full-page proof, and final audit.
- Cycle E added Player Props rows, collapsed prop groups, Market Rules, and More Events. Verified on Samsung with `npm run smoke:samsung:event-detail-props` and `npm run typecheck`. Remaining P0 work: ticket parity, Chat tab page, book/share behavior, and final independent audit.
- Cycle F rebuilt the game-page ticket into a Polymarket-style numeric sheet and expanded the Samsung proof to tap both primary outcomes. Verified on Samsung with `npm run smoke:samsung:event-detail-buy-ticket` and `npm run typecheck`. Remaining P0 work: Chat tab page, book/share behavior, and final independent audit.
