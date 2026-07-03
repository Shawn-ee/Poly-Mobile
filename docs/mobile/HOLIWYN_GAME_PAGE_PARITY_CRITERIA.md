# Holiwyn Game Page Polymarket Parity Criteria

Date: 2026-07-02

Source reference: `docs/mobile/POLYMARKET_GAME_PAGE_REFERENCE_AUDIT.md`

Scope: single soccer game page only.

These criteria replace the older prototype game-page Definition of Done for this milestone. A feature is not complete unless the listed evidence proves it on mobile.

## Audit Rule

Every implementation cycle for this page must include:

- Real Polymarket reference evidence or a link to the Cycle A audit section being matched.
- Written acceptance criteria covered by the change.
- Implementation against those criteria.
- An audit pass after implementation.
- Samsung S23 proof for Holiwyn.
- Gap tracker update with remaining P0/P1/P2 gaps.

The implementation agent cannot self-certify final parity. Final parity requires an audit note that maps current Holiwyn evidence against every P0 criterion.

## P0 Criteria

P0 means minimum soccer game-page parity baseline. Each P0 item must be auditable by screenshot, XML, route/smoke harness, or unit/API test.

| ID | Requirement | Required Evidence |
| --- | --- | --- |
| GP-P0-01 | Game page uses real Polymarket-style header: back, Game/Chat segmented control with live chat badge, book/rules icon, share icon. | Samsung screenshot and XML contain `Game`, `Chat`, badge count, back control, book/rules control, share control. |
| GP-P0-02 | Live soccer scoreboard supports flags, team abbreviations, score, live clock, and per-team probabilities in the compressed/scrolling layout. | Samsung screenshot/XML show flags or flag labels, `POR`/`CRO`-style abbreviations, `0 - 0` score, live clock, and both team percentages. |
| GP-P0-03 | Chart is not a static decorative placeholder. It must render two outcome-specific probability traces with changing data points and labels for selected outcome percent. | Component data test or route proof shows two independent series; Samsung screenshot shows green/red traces and selected outcome label/percent. |
| GP-P0-04 | Chart area includes trade/value marker text or comparable tick annotations, and an `All / Game / Live` filter control with selected state. | Samsung screenshot/XML show marker values and `All`, `Game`, `Live`. |
| GP-P0-05 | Game tab contains a live social preview card above primary outcomes, including chat count, avatar, username, trade badge, and message. | Samsung screenshot/XML contain count ending in `chatting`, a username, a market/trade badge, and a message. |
| GP-P0-06 | Primary outcomes are large side-by-side action buttons with team abbreviation and current percent, opening the correct ticket. | Samsung smoke taps each primary side at least once or route test taps deterministic side; ticket screenshot/XML proves correct market/outcome. |
| GP-P0-07 | Game Lines tab includes expanded `Regulation Time Winner` with subtitle `90 Minutes Plus Stoppage Time`. | Samsung screenshot/XML show title, subtitle, and expanded outcomes. |
| GP-P0-08 | Regulation Time Winner has three rows: home reg-time, tie, away reg-time. Each row has icon, label, colored mini-line, odds multiplier, and probability button. | Samsung screenshot/XML show all three labels, odds like `1.6x`, `3.9x`, `6.7x`, and probability buttons. |
| GP-P0-09 | Game Lines includes `Spread` with dynamic sentence, line-value dropdown pill, Reg. Time / 1st Half / 2nd Half segmented controls, and Yes/No outcome rows. | Samsung screenshot/XML show `Spread`, line value such as `1.5`, three segment labels, `Yes`, `No`, odds, and probabilities. |
| GP-P0-10 | Game Lines includes `Totals` with Over/Under or Yes/No style outcome rows and probability buttons. | Samsung scroll proof shows `Totals` title and both outcome rows. |
| GP-P0-11 | Game Lines includes `1st Half Winner` with three winner rows. | Samsung scroll proof shows `1st Half Winner` and three outcome rows/probabilities. |
| GP-P0-12 | Game Lines includes `2nd Half Winner` with three winner rows. | Samsung scroll proof shows `2nd Half Winner` and three outcome rows/probabilities. |
| GP-P0-13 | Game Lines includes team total goals for full game/regulation time. | Samsung scroll proof shows `Full Game Team Total Goals` or equivalent and at least one expanded Over/Under group. |
| GP-P0-14 | Player Props tab is not blank. It must show a soccer prop group matching the reference pattern, starting with `Goals (Reg. Time)` or equivalent, and the expanded group must include player rows. | Samsung screenshot/XML after tapping Player Props show selected tab, an expanded goals group, team filter chips, player names, stat-line dropdowns, odds multipliers, and probability buttons. |
| GP-P0-15 | Market groups are expandable/collapsible with visible chevrons, and collapsed state hides outcome rows. | Samsung smoke taps at least one group and proves outcome rows disappear/reappear. |
| GP-P0-16 | Ticket overlay matches core Polymarket behavior: close, event title, selected side/outcome, Yes/No toggle, amount display, odds/available line, quick amount buttons, numeric keypad, disabled amount prompt. | Samsung screenshot/XML show all named ticket elements. |
| GP-P0-17 | Chat tab is a real page state, not a placeholder. It shows scoreboard context, message feed, typing indicator, input placeholder, quick reactions, emoji picker, and sticky primary outcomes. | Samsung screenshot/XML after tapping Chat show all listed pieces. |
| GP-P0-18 | Top book/order-book and share controls are present and tappable without breaking the page. | Smoke taps Order Book, closes it, opens/dismisses share, or verifies control existence if native share cannot be automated; screenshot/XML captures controls. |
| GP-P0-19 | Lower page content includes Market Rules and More Events after the market/prop groups. | Samsung scroll proof shows `Market Rules`, a rule selector/text or equivalent, `View Full Rules`, and `More Events`. |
| GP-P0-20 | Full-page scroll proof exists for the soccer game page from top through deeper markets, Player Props, rules, and More Events. | Samsung evidence set includes at least top, first market, mid-market, deeper-market, Player Props, rules, and bottom screenshots/XML. |
| GP-P0-21 | Final audit gate reports zero unresolved P0 gaps before milestone completion. | `docs/mobile/GAME_PAGE_PARITY_GAP_TRACKER.md` shows all P0 rows as `Verified` and final audit note maps each P0 to evidence. |

## P1 Criteria

P1 means important parity but not required to claim minimum baseline if explicitly tracked.

| ID | Requirement | Required Evidence |
| --- | --- | --- |
| GP-P1-01 | Chart uses real backend or persisted market movement data instead of purely deterministic mock data. | API/unit test or route proof that chart series comes from data source. |
| GP-P1-02 | Pressing or holding the chart trace exposes an odds-at-time affordance if a later reference capture proves this persistent behavior. Current Samsung captures did not show a persistent tooltip, so this remains tracked as P1 rather than P0. | Samsung proof captures tooltip/crosshair/value label or audit note confirms no persistent app behavior. |
| GP-P1-03 | Spread line-value dropdown opens a selector and changes the displayed line. | Samsung smoke opens dropdown and selects another line. |
| GP-P1-04 | First-half/second-half Spread segments change the visible row prices/labels. | Samsung smoke taps each segment and captures changed state. |
| GP-P1-05 | Ticket amount-entered state shows enabled submit/swipe affordance without placing an order. | Samsung screenshot/XML after safe test amount shows enabled state. |
| GP-P1-06 | Share opens native share sheet or app share modal and can be dismissed. | Samsung screenshot/XML of share state. |
| GP-P1-07 | Book/rules icon opens a real rules/details sheet. | Samsung screenshot/XML of rules/details sheet. |
| GP-P1-08 | Chat input and reaction buttons have safe non-trading interaction states. | Samsung smoke taps input/reaction without sending real content. |
| GP-P1-09 | Market rows display liquidity/order-depth details when expanded. | Samsung screenshot/XML show bid/ask/depth details or equivalent. |

## P2 Criteria

P2 means polish or advanced parity.

| ID | Requirement | Required Evidence |
| --- | --- | --- |
| GP-P2-01 | Pixel-level spacing, typography, and animation match the real Polymarket app closely across Samsung and emulator. | Side-by-side audit screenshots. |
| GP-P2-02 | Live chat badge and chat count update in real time. | Timed Samsung proof shows count changes without relaunch. |
| GP-P2-03 | Chart animates smoothly and responds to All/Game/Live filters. | Video/screenshot sequence or automated pixel proof. |
| GP-P2-04 | Game page handles closed/suspended/no-liquidity states matching Polymarket. | Fixture route proof for each state. |
| GP-P2-05 | Player-specific prop groups are comprehensive for real soccer slates. | Data fixture and Samsung scroll proof of multiple player props. |

## Completion Gate

The milestone is not complete until:

- Cycle A reference audit exists from the real Polymarket app on Samsung S23.
- This criteria file exists and is committed.
- Gap tracker exists and is updated after every implementation cycle.
- All P0 criteria are implemented and verified on Holiwyn with Samsung proof.
- Final audit maps every P0 criterion to current Holiwyn evidence.
- No unresolved P0 gaps remain.
