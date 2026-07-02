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
| GP-P0-06 | Primary team buttons exist, but each side opening the correct Polymarket-style ticket needs proof. | Partial | Samsung smoke taps home and away primary buttons and captures correct ticket states. | Cycle C |
| GP-P0-07 | Regulation Time Winner group is now separated from the generic winner market and includes the required subtitle. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-game-line-expanded.png` and XML. | Done |
| GP-P0-08 | Three-row regulation-time winner is now proven with home, tie, away rows, icons, mini-lines, odds, and probability buttons. | Verified | Samsung focused smoke `smoke:samsung:event-detail-outcome-depth` passed. | Done |
| GP-P0-09 | Spread group with dynamic sentence, line dropdown, time segments, and Yes/No rows is missing. | Open | Samsung proof showing Spread group and interactions. | Cycle D |
| GP-P0-10 | Totals group with Over/Under style rows is missing or not complete. | Open | Samsung scroll proof showing Totals rows. | Cycle D |
| GP-P0-11 | 1st Half Winner group with three rows is missing. | Open | Samsung scroll proof showing three first-half rows. | Cycle D |
| GP-P0-12 | 2nd Half Winner group with three rows is missing. | Open | Samsung scroll proof showing three second-half rows. | Cycle D |
| GP-P0-13 | Full Game Team Total Goals group is missing. | Open | Samsung scroll proof showing team total goals rows. | Cycle D |
| GP-P0-14 | Player Props was previously treated as blank, but real Polymarket shows expanded player prop rows. | Open | Samsung proof showing Goals group, filter chips, player rows, stat dropdowns, odds, and probabilities. | Cycle E |
| GP-P0-15 | Expand/collapse behavior is proven for Regulation Time Winner; richer groups still need their own rows in later cycles. | Verified | Samsung focused smoke captures expanded and collapsed states. | Done |
| GP-P0-16 | Ticket exists in prototype form but does not match Polymarket's numeric-entry sheet closely enough. | Partial | Samsung ticket screenshot/XML with close, event, selected side, Yes/No, quick amounts, keypad, odds/available, disabled prompt. | Cycle F |
| GP-P0-17 | Chat tab is not yet proven as a real feed/input/reaction page state. | Partial | Samsung Chat proof with feed, typing indicator, input, reactions, emoji, sticky outcomes. | Cycle F |
| GP-P0-18 | Save/book and share controls need tappable proof and non-breaking behavior. | Partial | Smoke taps controls and captures stable/dismissed state. | Cycle F |
| GP-P0-19 | Market Rules and More Events are missing from the lower page. | Open | Samsung scroll proof showing rules and more events. | Cycle E |
| GP-P0-20 | Full-page Holiwyn scroll proof through top, markets, props, rules, and bottom does not exist yet. | Open | Samsung evidence set covering the full page. | Final Audit |
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
