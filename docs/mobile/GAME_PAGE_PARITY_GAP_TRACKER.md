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
| GP-P0-01 | Header has a back button and Game/Chat style controls, but book/rules and share behavior need proof. | Partial | Samsung screenshot/XML and tap proof for back, Game/Chat, badge, book/rules, share. | Cycle C |
| GP-P0-02 | Scoreboard is visually simplified and does not yet prove live score, live clock, compressed scroll state, and both team probabilities. | Partial | Top and scrolled Samsung proof with flags, abbreviations, score, live clock, and probabilities. | Cycle C |
| GP-P0-03 | Chart was previously a prototype/static-looking visual and is below Polymarket's live dual-trace movement. | Open | Data proof plus Samsung screenshot showing two outcome traces and selected label/percent. | Cycle C |
| GP-P0-04 | Chart filter and trade marker parity are missing or insufficient. | Open | Samsung screenshot/XML showing marker text plus `All`, `Game`, and `Live` selected states. | Cycle C |
| GP-P0-05 | Social preview exists only as a shallow card if present; it needs the reference structure and realistic content. | Partial | Samsung proof with chatting count, avatar, username, trade badge, and message. | Cycle C |
| GP-P0-06 | Primary team buttons exist, but each side opening the correct Polymarket-style ticket needs proof. | Partial | Samsung smoke taps home and away primary buttons and captures correct ticket states. | Cycle C |
| GP-P0-07 | Regulation Time Winner group is missing or not separated from generic winner market with required subtitle. | Open | Samsung proof showing title, subtitle, and expanded rows. | Cycle C |
| GP-P0-08 | Three-row regulation-time winner with icon, label, mini-line, odds, and probability is missing. | Open | Samsung proof showing home, tie, away rows with odds/probability. | Cycle C |
| GP-P0-09 | Spread group with dynamic sentence, line dropdown, time segments, and Yes/No rows is missing. | Open | Samsung proof showing Spread group and interactions. | Cycle D |
| GP-P0-10 | Totals group with Over/Under style rows is missing or not complete. | Open | Samsung scroll proof showing Totals rows. | Cycle D |
| GP-P0-11 | 1st Half Winner group with three rows is missing. | Open | Samsung scroll proof showing three first-half rows. | Cycle D |
| GP-P0-12 | 2nd Half Winner group with three rows is missing. | Open | Samsung scroll proof showing three second-half rows. | Cycle D |
| GP-P0-13 | Full Game Team Total Goals group is missing. | Open | Samsung scroll proof showing team total goals rows. | Cycle D |
| GP-P0-14 | Player Props was previously treated as blank, but real Polymarket shows expanded player prop rows. | Open | Samsung proof showing Goals group, filter chips, player rows, stat dropdowns, odds, and probabilities. | Cycle E |
| GP-P0-15 | Expand/collapse behavior needs deterministic proof and richer grouped markets. | Partial | Smoke taps a group and captures rows hiding/reappearing. | Cycle C |
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
