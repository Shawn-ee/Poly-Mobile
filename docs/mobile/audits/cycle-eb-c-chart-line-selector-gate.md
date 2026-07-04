# Cycle EB-C Current Game Page Chart And Line Selector Audit Gate

Status: audit gate prepared; no Holiwyn implementation or device proof is certified by this document.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Current live World Cup game page chart touch/press behavior.
- Full-page in-page line selector behavior for Spread and Totals market groups.
- Proof that selected line, period, subject/team text, odds/probability, chart context, Book/orderbook target, and ticket target stay coupled inside the same live game page flow.

This gate intentionally preserves the Cycle EA pass for PM-GAP-073 integrated full-page structure and ticket-open smoke. EB does not reopen the EA P0 result unless a new implementation regresses the EA evidence. EB defines the next acceptance bar for the remaining P1/P2 structural parity gaps called out after EA.

Out of scope:

- Deposit, withdrawal, location-resolution flow, notification page, and non-predicting World Cup schedule/ad content.
- Production Polymarket order confirmation after location verification. DQ-C reference was location-gated at ticket open.
- New S23 reference capture. Agent C reuses existing DQ-C/AD/Y reference evidence only.
- Editing mobile source, backend source, scripts, tests, or generated proof artifacts.

## Reference Evidence Reused

No fresh Polymarket capture was collected for EB-C. This gate reuses existing checked-in reference evidence:

| Reference area | Evidence | Behavior used by EB |
| --- | --- | --- |
| Official World Cup game top | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.xml` | Game page shows chart, primary outcomes, market groups, Book, Share, and Game/Chat controls. |
| Official chart press | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.xml` | Long-press/touch preserves page context; no ticket opens and no navigation occurs. No visible tooltip/crosshair was captured. |
| Focused chart behavior | `docs/mobile/audits/chart-behavior.md`; `docs/mobile/reference/screenshots/cycle-AD-polymarket-chart-default.png`; `docs/mobile/reference/screenshots/cycle-AD-polymarket-chart-press.png` | Prior focused reference supports live/variable chart context and selected-point/press response expectations, but it was not a current World Cup native page proof. |
| Official spread selector | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.xml` | Spread line selector opens inline around the selected line. |
| Official changed spread line | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.xml` | Selecting `2.5` changes the subject/team text and prices in place without leaving the game page. |
| Official lower Totals/halves | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.xml` | Lower page shows Totals with line selector/period pills and a 1st Half Winner group while compact match context remains pinned. |
| Focused line adjustment | `docs/mobile/audits/line-adjustment.md`; `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-market-list.png`; `docs/mobile/reference/screenshots/cycle-Y-polymarket-spread-line-25.png`; `docs/mobile/reference/screenshots/cycle-Y-polymarket-totals-line-35.png` | Prior focused reference supports Spread/Totals line rails where line changes update labels and prices. |
| EA Holiwyn regression baseline | `docs/mobile/harness/cycle-EA-integrated-game-page/cycle-DY-A-holiwyn-game-page-structure-proof.json`; folders `docs/mobile/screenshots/cycle-EA-integrated-game-page/` and `docs/mobile/harness/cycle-EA-integrated-game-page/` | EA proves full-page structure/ticket smoke. EB must build on this without weakening it. |

## Polymarket Behavior To Match

Chart touch:

- The chart is part of the live game page context, not a static decoration.
- A chart press/touch must keep the user on the same game page.
- The touch must not open a ticket, trigger the Book page, trigger Share, switch tabs, or reset scroll/selected market state.
- DQ-C did not capture a visible native tooltip/crosshair, so EB must not require an exact tooltip if the current reference does not show one. Holiwyn may show a selected-point/nearest-price readout, but it must remain context-preserving.
- If Holiwyn shows provider-backed chart metadata, it must identify the selected market/outcome and history status honestly.

Line selector:

- Spread and Totals are first-class grouped market rows on the live game page.
- Line controls open or reveal inline, close to the market row, not as a detached unrelated screen.
- Changing a line updates the selected line, period, subject/team text, odds/probability, and selected market identity together.
- Period controls such as regulation time, first half, and second half must preserve the selected family and update visible labels/prices when available.
- Ticket open after a line change must carry the changed market family, line, period, side/outcome, and event identity.
- Book/orderbook open after a line change must target the changed market family/line/period when a provider-backed or contract-shaped market is available.
- If real provider-backed line markets are unavailable, Holiwyn may use deterministic contract-shaped fixture data for UI proof, but it must expose the source/status and must not claim real provider parity for that line family.

## EB Acceptance Criteria

### P0 Criteria For This EB Sub-Scope

These are required before EB chart-touch or in-page line selector parity can pass. They are scoped to the EB feature, not to reopening the completed EA full-page structure/ticket smoke.

| ID | Priority | Criterion | Required Android proof | Current EB status |
| --- | --- | --- | --- | --- |
| EB-CH-P0-01 | P0 | Current live game page chart touch/press is proven on Holiwyn Android in the same page context. | Before/after screenshot and XML from the live game page showing the chart area before touch and the page still on the same event after touch. | Not proven |
| EB-CH-P0-02 | P0 | Chart touch does not navigate away, open `trade-ticket`, open Book, open Share, switch to Chat, or reset the visible event identity. | Proof JSON/XML assertions for event title/team identity and absence of ticket/book/share/chat side effects after chart touch. | Not proven |
| EB-CH-P0-03 | P0 | Chart data/status is not a silent static placeholder. The UI must show either provider-backed history status or an explicit unavailable/stale state. | XML markers or screenshot text for chart source/status/selected outcome/history state. | Not proven |
| EB-LS-P0-01 | P0 | In the full live game page run, Spread line selector opens from the visible game page and changes the selected line in place. | Screenshot/XML before selector, selector open, and changed line state. | Not proven |
| EB-LS-P0-02 | P0 | In the full live game page run, Totals line selector opens from the visible game page and changes the selected line in place when fixture data exposes totals. | Screenshot/XML before selector, selector open, and changed line state, or explicit unavailable state tied to backend/provider contract. | Not proven |
| EB-LS-P0-03 | P0 | Changing line/period updates the coupled visible state: market family, line, period, subject/team or Over/Under text, odds/probability, and selected outcome identity. | XML/proof JSON must include stable identifiers such as `marketGroupId`, `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, and visible price/probability. | Not proven |
| EB-LS-P0-04 | P0 | After a line change, opening the ticket preserves the changed line/period/outcome instead of falling back to moneyline or the initially rendered line. | Ticket screenshot/XML after changed Spread or Totals row tap. | Not proven |
| EB-LS-P0-05 | P0 | After a line change, Book/orderbook target preserves the changed market identity when Book is available for that market. | Book screenshot/XML or route-backed proof tied to the same selected market/line/period; if unavailable, explicit unavailable state is required. | Not proven |
| EB-LS-P0-06 | P0 | EB proof must run on Holiwyn Android and must not rely only on focused old harnesses, backend JSON, component compile, or EA structure proof. | Committed EB proof folder with screenshots, XML, and proof JSON. | Not proven |
| EB-LS-P0-07 | P0 | EA full-page structure/ticket smoke must remain non-regressed while EB runs. | EB proof should include or reference preserved top page, ticket-open, grouped markets, and Player Props unavailable markers from the same app build. | Not proven |

### P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EB status |
| --- | --- | --- | --- | --- |
| EB-CH-P1-01 | P1 | Chart touch should visibly select a nearest point or update a compact readout if Holiwyn implements that behavior. | Before/after chart screenshot/XML with selected point/readout marker. | Open |
| EB-CH-P1-02 | P1 | Chart should switch selected market/outcome when the user changes visible outcome or line context. | Android proof from selected outcome/line change into chart context; backend route fields for per-market `chartHistory`. | Open |
| EB-LS-P1-01 | P1 | Line selector breadth should cover regulation time, first half, and second half for Spread and Totals when available. | Full-page Android proof across at least two periods per family, or documented backend unavailability. | Open |
| EB-LS-P1-02 | P1 | Real provider-backed line market data should replace deterministic contract fixtures when Polymarket exposes those markets. | Backend/provider proof plus Android proof showing source/status fields. | Open |
| EB-LS-P1-03 | P1 | Selected line identity should carry through order submit, Portfolio open order, Portfolio activity, and history for the changed current-page line. | Backend/mobile lifecycle proof and Android Portfolio proof. | Open |

### P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EB status |
| --- | --- | --- | --- | --- |
| EB-CH-P2-01 | P2 | Chart gesture feel, point selection geometry, animation, and density should be closer to Polymarket native behavior. | Side-by-side visual review or recording. | Open |
| EB-LS-P2-01 | P2 | Line selector spacing, row transitions, selected-pill motion, and phone-density layout should be closer to Polymarket. | Side-by-side visual review or recording. | Open |

## Required EB Holiwyn Proof Bundle

The EB implementation/audit gate cannot pass without a committed Holiwyn Android proof bundle. Preferred paths:

- Screenshots: `docs/mobile/screenshots/cycle-EB-integrated-chart-line-selector/`
- XML: `docs/mobile/harness/cycle-EB-integrated-chart-line-selector/`
- Proof JSON: `docs/mobile/harness/cycle-EB-integrated-chart-line-selector/cycle-EB-chart-line-selector-proof.json`

The bundle must include:

- Device id and route/deep link used.
- Current live game page top screenshot/XML.
- Chart before-touch screenshot/XML.
- Chart after-touch screenshot/XML.
- Spread row baseline screenshot/XML.
- Spread selector-open screenshot/XML.
- Spread changed-line screenshot/XML.
- Spread changed-line ticket screenshot/XML.
- Totals baseline/selector/changed state, or explicit unavailable contract/status evidence.
- Book/orderbook evidence for changed selected line, or explicit unavailable status tied to backend/provider contract.
- Regression markers showing EA structure/ticket smoke still works or has not been invalidated.

## Audit Gate Decision

Current result: fail until proof.

Unresolved EB P0 gaps: all EB P0 rows are open because this Agent C cycle is docs-only and no new Holiwyn Android implementation proof was collected.

PM-GAP-073 remains verified for the Cycle EA integrated full-page structure/ticket smoke. EB should be tracked as the next chart/line-selector parity gate rather than as a reversal of EA.

Next required work:

1. Agent B implements or exposes current-page chart-touch and in-page line-selector flows against the criteria above.
2. Agent A confirms any route/data contract needed for per-market chart history, line market source/status, Book target, and selected identity.
3. Lead runs a Samsung tablet EB proof bundle.
4. Audit Gate compares the EB proof against this document. Any failed EB P0 row blocks chart/line-selector parity completion.
