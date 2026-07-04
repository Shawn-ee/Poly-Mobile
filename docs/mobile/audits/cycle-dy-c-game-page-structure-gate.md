# Cycle DY-C Game Page Structure Audit Gate

Status: audit failed after DY/DZ partial Holiwyn tablet proof. This document is an audit/reference gate for PM-GAP-073 live football / World Cup game page structure. It does not mark Holiwyn parity complete.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Full live football / World Cup game detail page structure.
- Header actions, Game/Chat segmented control, team/time/probability top area, chart, chat preview, primary outcomes, compact sticky match context, grouped market content, Player Props blank state, rules/lower content, Book action, Share action, and ticket opening from a primary outcome.
- Visible Android proof is required. Backend JSON, route tests, or component compile checks alone cannot pass this gate.

Out of scope for this gate:

- Re-opening the already verified focused PM-GAP-075 provider-ready Book path from DV/DW unless DY-A evidence shows a regression.
- Re-opening the already verified focused PM-GAP-074 line lifecycle path from DX unless DY-A evidence shows a regression.
- Certifying production order-entry/swipe confirmation parity. DQ-C reference was blocked by the production location gate.
- Deposit, location-resolution flow, notification page, and non-predicting World Cup detail/advertising content.
- Editing central trackers, mobile code, backend code, package files, or generated proof artifacts.

## Reference Evidence

DY-C reuses the Cycle DQ-C Samsung S23 official Polymarket reference. This is not a fresh S23 capture.

- Reference audit: `docs/mobile/audits/live-football-world-cup-dq-c.md`
- Reference screenshots: `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`
- Reference XML: `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

DQ-C reference paths required for this gate:

| Area | Screenshot | XML | Reference behavior |
| --- | --- | --- | --- |
| Game top | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.xml` | Detail page opens with back, Game/Chat control, Book, Share, teams, date/time, probability chart, chat preview, primary outcome buttons, and first market group. |
| Chart press | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.xml` | Pressing the chart preserves page context and does not open a ticket or navigate away. No visible tooltip/crosshair was captured in this state. |
| Chat tab | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-05-chat-tab.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-05-chat-tab.xml` | Chat replaces the body with compact match summary, messages, composer/reactions, and pinned outcome buttons. |
| Return Game tab | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-06-back-game-tab.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-06-back-game-tab.xml` | Returning to Game restores market content. |
| Market scroll 1 | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-07-markets-scroll-1.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-07-markets-scroll-1.xml` | Scrolling into markets keeps compact match context pinned above market groups. |
| Market scroll 2 | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.xml` | Lower page shows Totals with line selector/period pills and a 1st Half Winner group while compact context remains visible. |
| Spread selector | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.xml` | Spread line selector opens inline around the selected line. |
| Changed spread line | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.xml` | Selecting another line updates subject/team text and prices. |
| Ticket open/gate | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.xml`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.xml` | Tapping a selected outcome dims the page and opens a bottom sheet; production reference settles at `Location verification failed`. |
| Book action | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.xml` | Book opens a dedicated Order Book page with event identity, tabs, selector, ladder columns, ask/bid rows, and spread. |
| Share action | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-17-share-sheet.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-17-share-sheet.xml` | Share opens the Android share sheet and preserves underlying page scroll state. |

## Existing Holiwyn Supporting Evidence

These prior cycles are useful baselines, but none replace DY-A full-page proof:

- DV verified the focused same-market provider-ready Book UI path for PM-GAP-075.
- DW expanded grouped Book selector/state breadth and preserved selector/ticket identity for the focused Book flow.
- DX verified focused selected line lifecycle identity through ticket, order, portfolio/open order, and history.

Supporting files:

- `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`
- `docs/mobile/audits/cycle-dw-c-book-selector-ticket-gate.md`
- `docs/mobile/audits/cycle-dx-c-line-lifecycle-gate.md`
- `docs/mobile/harness/cycle-DV-provider-line-orderbook-depth-proof.json`
- `docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-provider-line-orderbook-proof.json`
- `docs/mobile/harness/cycle-DW-integrated-provider-orderbook-state-matrix.json`
- `docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-proof.json`
- `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json`
- `docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-proof.json`

## DY/DZ Holiwyn Evidence Reviewed By EA-C

EA-C did not collect new S23 reference evidence or run a new Holiwyn device proof. This update only reviews checked-in DY/DZ artifacts.

DY-A partial Holiwyn tablet proof exists and is useful, but it is not a parity pass:

- Proof JSON: `docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-holiwyn-game-page-structure-partial-proof.json`
- Screenshots/XML folder: `docs/mobile/screenshots/cycle-DY-A-game-page-structure/`; `docs/mobile/harness/cycle-DY-A-game-page-structure/`
- Passed before failure: live detail launch, header actions, Game/Chat controls, team/time/probability top area, chart context, chat preview, primary outcomes, top Book/orderbook, Android share sheet, and Chat tab feed/input/reactions.
- Failed P0: tapping the visible AUS primary outcome did not open `trade-ticket`; the screen remained on the game page and manual ADB tap also failed to open the ticket.

DZ tightened the game-page ticket proof harness, but the checked-in evidence still does not show a complete passing full-page ticket interaction. PM-GAP-073 must stay open until an integrated Android run proves the full page and the selected outcome ticket in the same run.

## DY-A Required Evidence

DY-A must provide fresh Holiwyn Android tablet proof from the integrated DY build/run. Preferred paths:

- Screenshots: `docs/mobile/screenshots/cycle-DY-A-game-page-structure/`
- XML: `docs/mobile/harness/cycle-DY-A-game-page-structure/`
- Proof JSON: `docs/mobile/harness/cycle-DY-A-game-page-structure/cycle-DY-A-game-page-structure-proof.json`

The proof must include:

- Device identifier and app route/deep link used.
- Top game page screenshot/XML.
- Chart press or equivalent chart interaction screenshot/XML proving context is preserved.
- Chat tab screenshot/XML proving body replacement, compact match context, messages/composer/reactions or documented blank state, and pinned outcomes.
- Return-to-Game screenshot/XML proving markets restore.
- Scrolled market screenshot/XML proving compact sticky match context, grouped markets, sticky market tabs, and grouped rows.
- Lower market screenshot/XML proving additional market groups beyond primary moneyline, including at least one line-family group and one lower-period group when fixture/provider data exposes them.
- Player Props tab or section screenshot/XML proving the requested blank/unavailable state.
- Rules/lower content screenshot/XML.
- Ticket-open screenshot/XML from a primary outcome or line outcome. It must distinguish Holiwyn fake-token behavior from Polymarket production location-gated behavior.
- Share and Book action proof if those actions are included in the DY-A harness. If not included, this doc must keep those criteria open and Lead must not close PM-GAP-073.

## P0 Criteria

| ID | Priority | Criterion | Required evidence | Current DY-C status |
| --- | --- | --- | --- | --- |
| LD-DY-C-P0-01 | P0 | Holiwyn must show the full live game detail hierarchy: back, Game/Chat, Book, Share, teams/time, probability chart, chat preview, primary outcomes, grouped markets, and lower/rules content. | DY-A tablet top, mid-scroll, lower-scroll screenshots/XML plus proof JSON mapping each visible section. | Pending DY-A evidence |
| LD-DY-C-P0-02 | P0 | Chart interaction must preserve the game page context and must not navigate away or open a ticket. | DY-A screenshot/XML before and after chart press/touch, or a documented harness limitation with no parity pass for chart interaction. | Pending DY-A evidence |
| LD-DY-C-P0-03 | P0 | Game/Chat segmented control must be functional. Chat must replace body content and Game must restore market content. | DY-A Chat tab and returned Game tab screenshots/XML showing state changes without losing match identity. | Pending DY-A evidence |
| LD-DY-C-P0-04 | P0 | Scroll must retain compact match context and keep market state coherent. | DY-A market-scroll screenshots/XML showing compact team/probability context, sticky market tabs or equivalent, and no reset of selected market/line state. | Pending DY-A evidence |
| LD-DY-C-P0-05 | P0 | Market groups must be richer than primary moneyline and include first-class grouped rows for game lines and lower-period markets. | DY-A lower market screenshots/XML showing grouped markets such as Spread, Totals, and 1st/2nd Half market families or documented unavailable provider-backed equivalents. | Pending DY-A evidence |
| LD-DY-C-P0-06 | P0 | Line selectors and period pills must be visible and functional where Polymarket exposes line-based markets. | DY-A row/selector screenshots/XML or proof JSON showing selected line/period/subject/price updates, with DV/DW/DX allowed only as supporting evidence, not a substitute for the DY page proof. | Pending DY-A evidence |
| LD-DY-C-P0-07 | P0 | Book action must open the dedicated Book/orderbook surface or route while preserving event identity. | DY-A Book screenshot/XML, or Lead must keep this P0 open. DV/DW can support the behavior but DY must prove it did not regress in the full-page build. | Pending DY-A evidence |
| LD-DY-C-P0-08 | P0 | Share action must open Android share behavior or an explicitly gated/share-unavailable state while preserving page context. | DY-A share screenshot/XML or documented Android share harness limitation. Without evidence, keep open. | Pending DY-A evidence |
| LD-DY-C-P0-09 | P0 | Outcome buttons must open the correct ticket context rather than a generic/default ticket. | DY-A ticket screenshot/XML and proof JSON showing event, selected outcome, market identity, and fake-token vs production-gate distinction. | Pending DY-A evidence |
| LD-DY-C-P0-10 | P0 | Player Props must show the requested blank/unavailable state rather than a broken or misleading populated section. | DY-A Player Props screenshot/XML with blank/unavailable copy or empty state. | Pending DY-A evidence |
| LD-DY-C-P0-11 | P0 | Visible Android proof is mandatory for page-structure parity. | Committed tablet screenshots/XML/proof JSON from DY-A. Backend JSON or compile-only proof cannot pass. | Pending DY-A evidence |
| LD-DY-C-P0-12 | P0 | The gate must be honest about location-gated Polymarket ticket behavior. | DY-A/Holiwyn ticket evidence and this audit report must not claim production Polymarket order-entry/swipe parity from DQ-C. | Pending DY-A evidence |

## P1 / P2 Criteria

| ID | Priority | Criterion | Required evidence | Current DY-C status |
| --- | --- | --- | --- | --- |
| LD-DY-C-P1-01 | P1 | Ticket amount entry and swipe/rail confirmation should be recaptured against an unblocked Polymarket reference when available; Holiwyn fake-token behavior remains separate. | Fresh reference and Holiwyn Android evidence. | Open |
| LD-DY-C-P1-02 | P1 | Book selector breadth should cover every visible family/period exposed by the event, not only the currently verified focused paths. | Android selector proof across Moneyline, Spreads, Totals, halves, and other available groups. | Open |
| LD-DY-C-P1-03 | P1 | Live chat should approximate production behavior more closely, including message density, typing state, composer, and pinned outcome behavior. | Side-by-side S23/Holiwyn Android screenshots/XML. | Open |
| LD-DY-C-P1-04 | P1 | Chart should use provider-backed history and selected-outcome state across visible markets, with no static placeholder. | Route/provider proof plus Android chart screenshot/XML and interaction proof. | Open |
| LD-DY-C-P2-01 | P2 | Visual density, spacing, motion, chart rendering, and row transitions should be closer to Polymarket after P0 structure passes. | Side-by-side phone/tablet visual review or recording. | Open |

## Audit Method

Lead must apply this gate after DY-A finishes:

1. Verify DY-A committed screenshots, XML, and proof JSON under the expected paths.
2. Compare each DY-A screenshot/XML against the DQ-C reference paths listed above.
3. Check every P0 row in this document. Any missing screenshot/XML/proof JSON keeps that P0 open.
4. Treat DV/DW/DX evidence as supporting evidence only. It can prove no known regression for Book and line lifecycle, but it cannot pass the full game-page structure gate without DY-A full-page Android proof.
5. Fail the gate if the app only compiles, only returns backend JSON, or only proves isolated Book/line/ticket behavior without a full-page scroll/tap proof.
6. If a feature is intentionally unavailable, require an explicit Holiwyn UI state and backend/data-contract reason. Silent omission fails.

## Blocking Rules

Block PM-GAP-073 completion if any of these occur:

- DY-A Android screenshots/XML/proof JSON are missing.
- The top page omits Game/Chat, Book, Share, chart, chat preview, primary outcomes, or market groups without a documented P0 reason.
- Chat does not switch body content or loses match identity.
- Scrolling loses compact match context or resets selected market state.
- Market groups remain thin moneyline-only content while Polymarket exposes Spread, Totals, halves, and grouped rows.
- Line selector behavior is claimed only from prior focused cycles and not shown in the DY page proof.
- Book or Share actions are omitted from proof while PM-GAP-073 is claimed complete.
- Ticket opens with the wrong event/market/outcome or loses line/period identity.
- Backend JSON, provider route tests, or compile checks are used as the only evidence for visible parity.
- The gate claims production ticket confirmation parity despite the DQ-C location gate.

## EA-C Gate Decision After DY/DZ

Current result: fail/partial. PM-GAP-073 remains open.

P0 status after reviewing DY/DZ artifacts:

- Passed with DY-A partial proof: page launch, header actions, Game/Chat controls, team/time/probability top area, chart context visibility, chat preview, primary outcomes visibility, Book action, Share action, and Chat tab behavior.
- Still open: full scroll/lower-market completeness, chart press/touch behavior as an interaction, line selector behavior inside the full game page, Player Props blank/unavailable state in this DY proof bundle, and lower/rules content.
- Failed: primary outcome ticket open from the full game page. The ticket must open with the selected event, market, outcome, side, and any line/period identity preserved.

Backend JSON, provider route tests, focused Book evidence, focused line lifecycle evidence, or compile checks cannot close PM-GAP-073 without visible Android screenshots/XML/proof JSON for the full page and ticket interaction together.

Next required implementation cycle:

1. Fix the full live game page primary outcome tap path so it opens `trade-ticket`.
2. Rerun the full Samsung tablet game-page proof after clearing stale Expo/session state.
3. Capture top, chart interaction, Book, Share, Chat, returned Game, scroll/lower markets, Player Props blank state, and ticket-open evidence in one integrated proof bundle.
4. Re-run this Audit Gate. Do not mark PM-GAP-073 complete unless every P0 row has visible Android evidence and the ticket criterion passes.
