# Cycle EL-C Live Event Detail Depth Gate

Purpose: define the same-cycle Polymarket reference criteria and Audit Gate for the next Holiwyn live event page depth milestone.

Scope owner: Agent C audit/reference docs only.

Out of scope by user instruction: deposit verification, location verification, notification page proof, backend/mobile implementation edits, route maps, scripts, and data contract docs.

## Reference Status

Fresh S23 reference status: partial fresh reference available.

On 2026-07-04, Agent C confirmed a Samsung S23 reference device (`SM-S911U1`) connected over ADB with official Polymarket app `com.polymarket.android` version `4.2967`. The app opened to a current Canada vs Morocco event page. Agent C performed a limited, non-committed, read-only live probe of the official app:

- Swiped between top chart context and lower market sections.
- Observed Game and Chat sections.
- Observed provider-branded chart area with Canada/Morocco probability traces and live outcome buttons.
- Observed Game Lines and Player Props tab rail below the chart.
- Observed Regulation Time Winner, Spread, Totals, and 1st Half Winner sections.
- Observed inline Spread and Totals line/period controls.
- Opened Chat and confirmed the event header and outcome actions persist in the live game section.
- Opened Order Book from the event page.
- Observed Order Book title, event identity, Yes/No tabs, settings gear, grouped market selector, Price/Shares/Value columns, ask rows, and selected-market checkmark.

Fresh S23 limitation: Agent C did not commit new screenshot/XML artifacts because this lane is docs-only and the owned file list does not include proof artifact paths. The ticket did not open during the limited scrolled-row tap attempt, so ticket Buy/Sell details still rely on existing checked-in DQ-C/AG/AI stale reference context and must be freshly proven by Agent B on Holiwyn Android before pass.

Stale support context only:

- `docs/mobile/audits/live-football-world-cup-dq-c.md`
- `docs/mobile/audits/trade-ticket.md`
- `docs/mobile/audits/binary-side.md`
- `docs/mobile/audits/cycle-ec-c-orderbook-ticket-gate.md`
- `docs/mobile/audits/cycle-eb-c-chart-line-selector-gate.md`

## Gate Result

Result: Fail until Agent B provides same-build Android-visible proof for EL live event detail depth.

This is a criteria/gate cycle, not a Holiwyn parity pass. Fresh S23 reference observations define the behavior bar for page depth, chart, live sections, line controls, Book/orderbook, grouped selector, and market sections. Ticket Buy/Sell evidence is not fresh enough to pass implementation parity by itself.

## Lead Agent Target

Agent B must prove a real human path through one selected live event:

1. Open a current live event detail page.
2. Swipe from chart/top context to lower market sections and back without losing event or selected market identity.
3. Tap the chart and prove it is tied to the selected outcome/market rather than a static placeholder.
4. Change line/period selectors for Spread or Totals and prove visible row odds/probabilities update as one selected identity.
5. Open Book/orderbook for the same selected identity.
6. Use Book Yes/No tabs and grouped selector without losing event, market family, line, period, side/outcome, provider/source, or market id/selector key.
7. Open ticket from page row and Book row/action, prove Buy/Sell or side behavior, and preserve selected identity into the ticket.
8. Show Game and Chat/live-section behavior without navigating to deposit, location verification, or notification pages.

## Hard Fail Conditions

- Backend JSON alone is not enough for visible parity. Route JSON, provider fields, Jest/API tests, screenshots of server logs, source inspection, or compile checks cannot pass EL unless paired with Android-visible screenshots/XML/proof JSON for the same selected identity.
- Static placeholders fail. A chart image, inactive line rail, fake orderbook rows, dead buttons, or non-updating ticket surface fails even if the page looks dense.
- Line selection must preserve identity into ticket and orderbook. If Spread/Totals/period/line/side changes do not carry into Book/orderbook and ticket, the gate fails.
- Default/fallback reconstruction fails. Moneyline fallback, first-row fallback, event-only ticket labels, generic Team to Advance targets, stale-as-ready status, mock-ready rows, or fallback depth cannot count as pass evidence.
- Agent B is blocked if there is no Android-visible proof. Backend proof can support Agent B but cannot replace Samsung tablet/phone Android evidence.
- Stale reference evidence cannot be described as fresh. DQ-C/AG/AI evidence may explain expected behavior only; it cannot satisfy same-cycle fresh ticket reference proof.

## P0 Criteria

| ID | Criterion | Required proof |
| --- | --- | --- |
| EL-DEPTH-P0-01 | Same-build Android-visible Holiwyn proof exists for live event detail depth. | Screenshots/XML/proof JSON from the same build and device session, covering live page, chart, market sections, Book/orderbook, selector, and ticket. |
| EL-DEPTH-P0-02 | Fresh/stale reference status is stated honestly. | Gate notes identify the partial fresh S23 reference and name stale ticket support as stale context only. |
| EL-DEPTH-P0-03 | Page swipe preserves event context and selected identity. | Before/after Android proof showing same event, team labels, selected market family/type, line, period, side/outcome, provider/source, and market id or selector key after scrolling. |
| EL-DEPTH-P0-04 | Chart is selected-market aware and interactive. | Chart tap proof showing selected event/outcome/market context, visible movement or selected point/press state, and no unintended ticket/Book/share/chat navigation. |
| EL-DEPTH-P0-05 | Live game sections behave like product surfaces, not placeholders. | Game/Chat tab proof plus live chat preview/section behavior, persistent event header, and outcome actions where present; no notification/deposit/location verification requirement. |
| EL-DEPTH-P0-06 | Market sections expose real depth comparable to Polymarket. | Regulation Time Winner, Spread, Totals, and at least one lower section or unavailable Player Props state are visible, expandable/collapsible where applicable, and not one static card. |
| EL-DEPTH-P0-07 | Line and period controls update one coherent selected identity. | Spread or Totals proof showing line value, period, subject/team/outcome, odds/probabilities, selected row styling, and provider/source identity update together. |
| EL-DEPTH-P0-08 | Book/orderbook opens from the selected live event and preserves identity. | Android proof of Book title/event, Yes/No tabs, grouped selector, selected family/line/period/side, provider/source/status, Price/Shares/Value columns, bid/ask rows, and spread/ask/bid distinction when depth exists. |
| EL-DEPTH-P0-09 | Book grouped selector preserves market family identity. | Selector proof showing Moneyline plus Spread/Totals or available families, visible selected check, and no reset to a default market after selection. |
| EL-DEPTH-P0-10 | Ticket handoff preserves selected page or Book identity. | Ticket proof from a page row and Book action/row showing event, family/type, line, period, side/outcome, provider/source, market id/selector key, price/odds, Buy/Sell or side state, and fake-token/test labels if applicable. |
| EL-DEPTH-P0-11 | Non-ready/loading/unavailable states are explicit. | Android proof or documented same-run reason showing stale/loading/unavailable states do not render as ready chart/depth/ticket placeholders. |
| EL-DEPTH-P0-12 | Negative no-fallback assertions are included. | Proof rejects backend-only pass, static placeholders, default moneyline, first visible row, event-only ticket labels, generic Team to Advance, mock-ready rows, stale-as-ready status, and fallback depth. |
| EL-DEPTH-P0-13 | Agent B cannot pass without Android visible proof. | Audit Gate entry lists Android-visible proof as a blocker; Lead cannot substitute Agent A backend JSON. |

## P1 Criteria

| ID | Criterion | Required proof |
| --- | --- | --- |
| EL-DEPTH-P1-01 | Repeat the full depth path across at least two real provider-backed market families when available. | Android proof for Moneyline plus Spread/Totals/halves or documented provider unavailability. |
| EL-DEPTH-P1-02 | Fresh S23 ticket Buy/Sell reference should be recaptured when non-confirming access allows. | Same-cycle official Polymarket ticket screenshots/XML through Buy/Sell or side switch, stopping before deposit/location/confirmation. |
| EL-DEPTH-P1-03 | Book row tap should carry row price/side into ticket. | Android proof from a specific orderbook row to ticket showing selected price, side, shares/value context where supported. |
| EL-DEPTH-P1-04 | Player Props and lower sections should cover unavailable and available states. | Android proof for Player Props tab/section behavior and lower-page sections. |
| EL-DEPTH-P1-05 | Repeat live-section behavior with a current in-play event when available. | Android proof where live time/status changes while preserving selected market identity. |

## P2 Criteria

| ID | Criterion | Required proof |
| --- | --- | --- |
| EL-DEPTH-P2-01 | Visual density, spacing, and hierarchy should feel close to the official app without copying brand assets. | Side-by-side review after P0 pass. |
| EL-DEPTH-P2-02 | Chart touch feel and Book row styling should be polished. | Visual QA for touch feedback, row bars, red/green or equivalent side styling, and scroll smoothness. |
| EL-DEPTH-P2-03 | Live chat preview and section transitions should feel native. | Device review for tab switching, chat preview updates, and return-to-game state. |

## Required Evidence Bundle For Agent B

- Fresh Holiwyn Android screenshots and XML for chart/top, after chart tap, mid/lower market sections, line selector changed state, Book, Book selector, Book row/action ticket, page-row ticket, and live Game/Chat sections.
- Proof JSON tying all surfaces to the same selected event and selected market identity.
- Backend route JSON only as supporting evidence for the exact visible market id/selector key.
- Validation summary from the relevant smoke/test command.
- Explicit statement of fresh vs stale Polymarket reference status.

## Audit Gate Decision

Pass/fail: Fail until integrated Android-visible proof.

Unresolved P0 gaps: all EL implementation proof rows remain open until Agent B evidence exists. Fresh S23 reference is partial; ticket Buy/Sell reference remains stale-context only.

Next cycle required: yes. Agent B is blocked from claiming live event detail depth parity until the Android-visible EL evidence bundle exists and this gate is updated to pass with 0 unresolved P0 rows.
