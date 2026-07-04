# Cycle EC-C Live Game Page Orderbook And Ticket Carry-Through Gate

Status: fail until proof. This is a docs-only audit/reference gate and does not certify implementation.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Current live World Cup game page orderbook ladder/depth from the selected market context.
- Selected market, line, period, outcome/side, and row action carrying into the trade ticket from the live page flow.
- Visible Polymarket-like Book behavior: event identity, selector context, Yes/No or bid/ask side, Price/Shares/Value ladder rows, spread, row/ticket action, ticket handoff, and honest ready/non-ready depth states.

This EC gate preserves previous passes:

- PM-GAP-073 remains verified for the EA integrated full-page structure/ticket smoke.
- PM-GAP-079 remains verified for the EB selected chart/line selector ticket gate.
- PM-GAP-075 remains verified for the focused same-market provider-ready Book UI path and DW selector/state breadth.

EC does not reopen those passes unless new proof regresses them. EC defines the stricter current feature gate for Book/orderbook visibility and ticket carry-through inside the live game page context. Backend JSON alone cannot pass this gate.

Out of scope:

- Editing mobile source, backend source, scripts, tests, proof scripts, or generated proof artifacts.
- Certifying production order confirmation/swipe behavior. The DQ-C Polymarket ticket reference was location-gated.
- Claiming full Polymarket selector breadth for every future line family before provider markets exist.
- Fresh Polymarket device capture by Agent C.

## Reference Evidence Reused

No fresh Polymarket or Holiwyn device capture was collected by Agent C for EC-C. The Polymarket reference evidence is reused from the checked-in Cycle DQ-C Samsung S23 official app audit. That reference is useful but stale relative to EC; Lead should prefer a fresh S23 recapture if live device access becomes practical.

| Reference area | Evidence | Behavior used by EC |
| --- | --- | --- |
| Official live game page | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.xml` | Game page has top Book action, chart, primary outcomes, line groups, Game/Chat, and event context. |
| Official Book page | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.xml` | Book opens a dedicated Order Book page with event identity, selector, tabs, columns, ladder rows, and spread. |
| Official Book selector | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.xml` | Selector is grouped by market family and includes Moneyline and Spreads entries. |
| Official Book settings | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.xml` | Settings exposes `Decimalize book`. |
| Official depth scroll | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.png`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.xml` | Ladder preserves context while showing multiple ask rows, spread, and bid rows. |
| Official line/ticket context | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.png`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png`; matching XML under `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` | Changed line state opens a ticket sheet/gate for that selected context; production settles at location verification. |

Useful Holiwyn regression baselines:

- EA integrated page/ticket proof: `docs/mobile/harness/cycle-EA-integrated-game-page/cycle-DY-A-holiwyn-game-page-structure-proof.json`
- EB integrated chart/line ticket proof: `docs/mobile/harness/cycle-EB-integrated-chart-line/cycle-DY-A-holiwyn-game-page-structure-proof.json`
- DV focused provider-ready Book proof: `docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-provider-line-orderbook-proof.json`
- DW grouped selector/state proof: `docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-proof.json`

These baselines are supporting evidence only. They cannot replace an EC integrated Android proof bundle for the current live game page orderbook/ticket flow.

## Polymarket Behavior To Match

- The live game page Book action must resolve to the currently selected event/market context, not a generic/default Book.
- The orderbook must visibly read as a real ladder: Price/Shares/Value or equivalent columns, ask/bid side separation, spread row, multiple rows where depth exists, and state-preserving scroll.
- Selector context must be coupled with market identity: family, market id or selector key, period, line, outcome/side, and provider/source status move together.
- Selecting or carrying a line/outcome from the live game page must not silently fall back to moneyline, the initial line, or a placeholder fixture.
- A row action or Buy/Sell/ticket action from the ladder must open a ticket with the same selected event, market, line/period, outcome/side, and provider identity when available.
- Ready depth must be visibly tied to route/provider evidence for the same market id or selector key. Backend JSON can support the gate, but cannot pass without Android-visible proof.
- Non-ready states must be honest. Loading, stale, empty, unavailable, suspended, delayed, error, or fallback rows must not be labeled as provider-ready depth.

## P0 Criteria

All P0 rows must pass before EC can mark the current selected feature complete.

| ID | Priority | Criterion | Required Android proof | Current EC status |
| --- | --- | --- | --- | --- |
| EC-OB-P0-01 | P0 | The current live game page opens Book/orderbook from the selected market context rather than a generic/default context. | Same-run screenshot/XML showing selected live page market/line/outcome, Book entry, and opened Book with the same event identity. | Fail until proof |
| EC-OB-P0-02 | P0 | The Book surface visibly renders a Polymarket-like ladder with Price/Shares/Value columns, ask/bid side separation, spread, and multiple rows when depth exists. | Android screenshot/XML plus proof JSON for visible columns, ask/bid rows, spread, row count, and side labels or equivalent color/state markers. | Fail until proof |
| EC-OB-P0-03 | P0 | Selected market identity is coupled from live page into Book: family, market id or selector key, line, period, outcome/side, and provider/source status stay consistent. | Proof JSON/XML with stable markers for `marketId` or selector key, family/type, line, period, outcome/side, source/status before and after Book open. | Fail until proof |
| EC-OB-P0-04 | P0 | Any provider-ready depth claim is app-visible for the same backend market identity. Backend JSON alone is insufficient. | Backend route/proof fields for `depthSource`, readiness, level counts, and market identity paired with Android-visible markers for the same market id or selector key. | Fail until proof |
| EC-OB-P0-05 | P0 | Ladder row action, Buy/Sell, or ticket action opens a ticket preserving the selected event, market, line, period, outcome/side, row side/price when applicable, and provider/source identity when available. | Ticket screenshot/XML and proof JSON after the orderbook action; no fallback to moneyline, first rendered line, or generic outcome. | Fail until proof |
| EC-OB-P0-06 | P0 | Closing the ticket or Book preserves the live game page context and selected market state. | Before/after Android proof showing the same event and selected line/outcome context after closing/dismissing. | Fail until proof |
| EC-OB-P0-07 | P0 | Non-ready/fallback states are explicit and cannot masquerade as ready depth. | Android screenshot/XML for non-ready or documented skip reason, plus proof fields distinguishing ready provider rows from fallback/unavailable/empty/stale/error rows. | Fail until proof |
| EC-OB-P0-08 | P0 | EC proof is integrated, Android-visible, and same-cycle for the current build; EA/EB/DV/DW evidence may support but cannot substitute. | Committed EC screenshots, XML, and proof JSON from one integrated run, with preserved EA page/ticket and EB chart/line markers or explicit non-regression references from the same build. | Fail until proof |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EC status |
| --- | --- | --- | --- | --- |
| EC-OB-P1-01 | P1 | Selector breadth should cover every visible family/period exposed by the event, including Moneyline, Spread, Totals, halves, and other real provider-backed families when available. | Android selector proof across available families or documented provider unavailability. | Open |
| EC-OB-P1-02 | P1 | Full Book settings parity should go beyond the Cents/Decimal equivalent when Holiwyn exposes richer settings. | Screenshot/XML for settings controls and before/after state preservation. | Open |
| EC-OB-P1-03 | P1 | Selected orderbook identity should carry through order submit, Portfolio open order/activity, and history for every Book selector family. | Backend/mobile lifecycle proof plus Android Portfolio/history proof. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EC status |
| --- | --- | --- | --- | --- |
| EC-OB-P2-01 | P2 | Phone-density, red/green ladder visualization, scroll feel, selector transitions, and ticket sheet motion should be side-by-side polished against Polymarket. | Side-by-side visual review or recording after P0 proof passes. | Open |

## Required EC Proof Bundle

Preferred final paths for Lead integration:

- Screenshots: `docs/mobile/screenshots/cycle-EC-integrated-orderbook-ticket/`
- XML: `docs/mobile/harness/cycle-EC-integrated-orderbook-ticket/`
- Proof JSON: `docs/mobile/harness/cycle-EC-integrated-orderbook-ticket/cycle-EC-orderbook-ticket-proof.json`

The proof bundle must include:

- Device id, app mode, route/deep link, and build/run identifier.
- Live game page selected market baseline screenshot/XML.
- Book entry screenshot/XML from that selected context.
- Opened Book screenshot/XML with event identity and selected market identity.
- Ladder proof with columns, ask/bid rows, spread, row count, source/status, and selector key or market id.
- Backend route/proof fields for any provider-ready claim, tied to the same visible market id or selector key.
- Selector proof if the selected context changes family, line, period, or outcome before Book open.
- Ticket proof after ladder row/Buy/Sell/ticket action, preserving selected event/market/line/period/outcome/side.
- Close/dismiss proof returning to the same live game page context.
- Non-ready state proof or documented skip reason.
- EA/EB regression markers from the same EC build, or explicit same-build references proving page/ticket and chart/line behavior were not invalidated.

## Blocking Rules

Block EC pass if any of these occur:

- Android screenshots/XML/proof JSON are missing.
- Book opens for a generic/default market while the live page has a selected line/outcome context.
- The ladder omits visible depth columns, ask/bid side separation, spread, or row proof.
- Backend ready JSON is used without same-market Android-visible ready/source markers.
- The UI shows fixture/fallback/unavailable rows while claiming provider-ready depth.
- Ticket opens with the wrong event, market family, line, period, outcome/side, or provider identity.
- Closing Book or ticket resets the selected live page state without an explicit acceptable reason.
- The gate claims fresh S23 reference or production ticket confirmation parity without matching new artifacts.

## Audit Gate Decision

Current result: fail until proof.

Unresolved EC P0 gaps: all EC P0 rows are open because this Agent C cycle is docs-only and no integrated Android proof was collected.

Next required work:

1. Agent A/Lead ensure the selected Book market route exposes depth/source/status for the same market id or selector key the app renders.
2. Agent B/Lead run the integrated Android proof bundle under the EC paths above.
3. Audit Gate compares every P0 row against the EC proof. Any missing visible proof keeps EC failed.

## Lead Post-Proof Placeholder

Result: pass for the selected PM-GAP-080 EC orderbook/depth and orderbook-to-ticket gate.

Integrated evidence:

- Proof JSON: `docs/mobile/harness/cycle-EC-integrated-orderbook-ticket/cycle-EC-orderbook-ticket-proof.json`
- Screenshots: `docs/mobile/screenshots/cycle-EC-integrated-orderbook-ticket/`
- XML: `docs/mobile/harness/cycle-EC-integrated-orderbook-ticket/`
- Backend/provider identity proof: `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json`
- Command: `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke.ps1 -Deep -EventDetailOrderBookInteractions -Port 8302 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -ExpoHost 127.0.0.1 -OutputDir docs/mobile/screenshots/cycle-EC-integrated-orderbook-ticket -HierarchyOutputDir docs/mobile/harness/cycle-EC-integrated-orderbook-ticket`

Decision after proof:

- Pass/fail: pass for selected EC gate.
- Unresolved P0 gaps: 0 for this selected gate.
- Remaining P1/P2 gaps: broader real provider-backed line-family breadth, richer Book settings, order/Portfolio/history carry-through for every family, and phone-density/visual/motion polish.

Post-proof notes:

- Agent A backend proof starts at live-detail, selects a provider-backed compact market, calls Book, and proves market/selector/outcome/token/source/status/freshness identity matches.
- Integrated Android proof opens Book from the live event, shows ladder columns, ask/bid rows, spread, Yes/No switching, selector changes for Totals and Spread, cents/decimal settings, and a Spread ticket preserving selected line/period/outcome identity.
- This pass does not claim production line-family provider breadth. Current line-family gaps stay tracked as P1/P2 until real provider-backed line markets are available and proven.
