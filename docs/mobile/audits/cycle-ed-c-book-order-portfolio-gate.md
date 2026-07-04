# Cycle ED-C Book-Selected Order To Portfolio Lifecycle Gate

Status: passed for the selected ED integrated gate after Lead proof. This gate certifies the selected fake-token Book-origin lifecycle, not production wallet signing or full provider-family breadth.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Live game page Book-selected lifecycle: selected market/line/outcome in Book -> ticket -> fake-token order submit -> Portfolio open position/open order -> activity/history.
- Identity preservation from the live page and Book surface into backend order, portfolio, and history route data.
- Joint Android-visible proof and backend route/data proof for the same selected lifecycle identity.

This ED gate preserves previous passes:

- PM-GAP-073 remains verified for EA full-page structure/ticket smoke.
- PM-GAP-079 remains verified for EB chart/line selector ticket carry-through.
- PM-GAP-080 remains verified for EC live game page Book/orderbook to ticket carry-through.
- PM-GAP-074 remains verified for the focused DX row/selector line lifecycle.
- PM-GAP-071 remains verified for the DO dev-provider filled lifecycle.

ED does not reopen those passes unless new proof regresses them. ED promotes the remaining orderbook lifecycle debt into a strict gate for the selected path that starts from the live game page Book surface. EC ticket proof, DX row lifecycle proof, and DO provider filled lifecycle proof are supporting evidence only; none can substitute for one integrated Book-origin lifecycle bundle.

Out of scope:

- Further editing mobile source, backend source, scripts, tests, or generated proof artifacts inside this audit file.
- Certifying production Polymarket order submission or swipe confirmation. The DQ-C reference was location-gated before real order entry.
- Claiming full selector-family lifecycle breadth before real provider-backed line families are available.
- Fresh Polymarket device capture by Agent C.

## Reference Evidence Reused

No fresh Polymarket or Holiwyn device capture was collected by Agent C for ED-C. The Polymarket reference evidence is reused from checked-in Samsung S23 official app audits and provider artifacts. This evidence is useful but stale for ED; Lead should prefer a fresh reference recapture if live device access becomes practical.

| Reference area | Evidence | Behavior used by ED |
| --- | --- | --- |
| Official live game page and Book | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png`; `pm-dq-c-12-top-book-action.png`; `pm-dq-c-13-orderbook-market-selector.png`; `pm-dq-c-15-orderbook-depth-scroll.png`; matching XML under `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` | Live game page Book opens a dedicated orderbook with event identity, selector context, Yes/No or bid/ask sides, ladder columns, spread, depth scroll, and ticket handoff. |
| Official ticket limit | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png`; `pm-dq-c-11-ticket-sheet-settled.png`; matching XML | Polymarket opens a selected-context ticket/gated sheet, but production location verification blocks full order-entry proof. |
| Provider identity and lifecycle baselines | `docs/mobile/audits/live-event-detail-super-round-dm.md`; `docs/mobile/harness/cycle-current-mobile-provider-token-lifecycle.json`; `docs/mobile/harness/cycle-DO-mobile-provider-filled-lifecycle.json` | Provider market/condition/token identity must remain stable through ticket/order/portfolio/history. |
| EC Book-to-ticket baseline | `docs/mobile/audits/cycle-ec-c-orderbook-ticket-gate.md`; `docs/mobile/harness/cycle-EC-integrated-orderbook-ticket/cycle-EC-orderbook-ticket-proof.json`; `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json` | Live game page Book and ticket carry-through pass for the selected EC gate, but order/Portfolio/history are not proven from the Book-selected path. |
| DX row lifecycle baseline | `docs/mobile/audits/cycle-dx-c-line-lifecycle-gate.md`; `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json`; `docs/mobile/harness/cycle-DX-B-line-lifecycle/cycle-DX-B-holiwyn-line-lifecycle-proof.json` | Selected line identity survives row/ticket/order/Portfolio/history in a focused lifecycle, but the lifecycle does not start from the live game page Book ladder/selector. |
| Portfolio baseline | `docs/mobile/audits/portfolio.md` | Fake-token Portfolio has focused positions, open orders, activity/history, and cancel proof, but ED requires same-selected Book-origin identity. |

## Evidence And Debt Review

- EC evidence proves live game page Book/orderbook to ticket carry-through for a selected gate, with backend live-detail to Book identity proof. Its remaining tracked debt is richer Book settings/order lifecycle through Portfolio/history, broader real provider-backed line-family coverage, and visual polish.
- EB evidence proves chart touch and in-page Spread/Totals ticket carry-through. Its remaining tracked debt includes changed-line Book target proof, selected-market chart switching to backend `markets[].selection`, real provider-backed line families, lifecycle through Portfolio/history for every family, and visual polish.
- DX evidence proves row/selector-selected line lifecycle through ticket, order, Portfolio activity/open order, backend open order, canceled activity, filled position, and recent trade. Its remaining tracked debt is real provider-backed visible line market repeat, production confirmation recapture, and every-family lifecycle breadth.
- DO evidence proves a dev-provider filled lifecycle into Portfolio recent activity, but it is not a live game page Book-selected path and still leaves active real provider-backed repeat as later debt.
- Portfolio evidence proves focused fake-token positions/open orders/activity/cancel behavior, but Polymarket signed-in Portfolio reference remained blocked and ED still needs Book-origin identity preserved into the visible Portfolio/history surfaces.

## Polymarket Behavior To Match

- A selected Book market must remain the same selected market when it opens a ticket and then becomes an order, position/open order, and activity/history row.
- The selected event, market family/type, market id or selector key, line, period, outcome/side, row side/price when applicable, and provider/source identity must move together.
- Backend order and portfolio/history routes must preserve the same identity Android displays. Backend-only route proof cannot pass without visible Android proof for the same selection; screenshot-only proof cannot pass without matching backend route/data proof.
- Holiwyn fake-token submit is acceptable for P0 only when it is explicitly labeled as fake-token/test flow and does not claim production Polymarket order-entry parity.
- Any fallback, fixture, unavailable, stale, or non-ready provider state must be labeled honestly and cannot be used as provider-ready lifecycle proof.

## P0 Criteria

All P0 rows must pass before ED can mark the selected Book-order-Portfolio lifecycle complete.

| ID | Priority | Criterion | Required proof | Current ED status |
| --- | --- | --- | --- | --- |
| ED-LC-P0-01 | P0 | The lifecycle must start on the live game page, open Book from the selected market context, and identify the selected Book market/line/outcome before ticket open. | Android screenshot/XML/proof JSON showing live page event, Book entry, opened Book, selected market id or selector key, family/type, line, period, outcome/side, source/status, and row/action target. | Pass for selected ED proof |
| ED-LC-P0-02 | P0 | Ticket opened from Book must preserve the selected Book identity and must not fall back to moneyline, default event, first rendered line, or stale selector state. | Android ticket screenshot/XML plus proof JSON showing matching event, market id or selector key, family/type, line, period, outcome/side, row side/price where applicable, provider/source fields, and ticket order target. | Pass for selected ED proof |
| ED-LC-P0-03 | P0 | Fake-token order submit must preserve the same selected Book/ticket identity in the backend order request and order response. | Backend route/proof artifact for order request/response fields paired with Android visible submit/result proof for the same selection and order id. | Pass for selected ED proof |
| ED-LC-P0-04 | P0 | Portfolio open order must preserve the selected Book identity when the order remains open. | Backend portfolio/open-orders route proof plus Android Portfolio/open-order screenshot/XML showing matching market/outcome, family/type, line, period, side/outcome, amount, status, and order id. | Pass for selected ED proof |
| ED-LC-P0-05 | P0 | Portfolio position/open position must preserve the selected Book identity when the fake-token order is filled or represented as a position. | Backend position/fill proof plus Android Portfolio position/open-position screenshot/XML showing matching market/outcome, family/type, line, period, side/outcome, amount, status, and provider/source fields where available. | Pass for selected ED proof |
| ED-LC-P0-06 | P0 | Activity/history must preserve selected lifecycle identity, including order/fill linkage and visible status. | Backend `/api/portfolio/history` or equivalent route proof plus Android activity/history screenshot/XML with matching event, market, line, period, side/outcome, order/fill id, amount, and status. | Pass for selected ED proof |
| ED-LC-P0-07 | P0 | Identity must be consistent across Book, ticket, order request, order response, Portfolio/open order/open position, and history/activity. | A single integrated proof bundle mapping each step to the same market id or selector key, outcome id, family/type, line, period, side/outcome, display label, provider fields, and order/fill ids. | Pass for selected ED proof |
| ED-LC-P0-08 | P0 | Android-visible proof and backend route/data proof are both mandatory for identity preservation. | Committed Android screenshots/XML/proof JSON plus backend route/data proof for the same selected lifecycle. Backend-only, screenshot-only, compile-only, and reused EC/DX/DO-only evidence cannot pass. | Pass for selected ED proof |
| ED-LC-P0-09 | P0 | Non-ready/fallback/provider-unavailable states must remain honest throughout the lifecycle and cannot be counted as provider-ready evidence. | Proof fields distinguishing provider-ready depth/source from fixture/fallback/unavailable/stale/error states, plus visible UI labels or documented skip reason. | Pass for selected ED proof |
| ED-LC-P0-10 | P0 | The ED proof must be integrated, same-build, Android-visible, and preserve EA/EB/EC regression markers for the live page and Book path. | One committed ED proof bundle under the ED paths with live page, Book, ticket, submit, Portfolio, and history artifacts, plus same-build references or assertions for EA/EB/EC markers. | Pass for selected ED proof |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current ED status |
| --- | --- | --- | --- | --- |
| ED-LC-P1-01 | P1 | Repeat the Book-origin lifecycle against real provider-backed line families beyond the selected fixture/proof path when Polymarket exposes them. | Backend provider mapping/depth/order proof plus Android lifecycle proof for each claimed family. | Open |
| ED-LC-P1-02 | P1 | Cover both open-order and filled-position branches, including cancel/status transitions into history. | Backend status-transition proof plus Android Portfolio/history proof. | Open |
| ED-LC-P1-03 | P1 | Recapture official Polymarket order amount/swipe confirmation when reference location/auth gates allow it. | Fresh reference evidence and Holiwyn comparison. | Open |
| ED-LC-P1-04 | P1 | Consider immutable first-class order/trade selection snapshots before production so downstream history cannot drift if display labels change. | Backend schema/route review and tests. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current ED status |
| --- | --- | --- | --- | --- |
| ED-LC-P2-01 | P2 | Portfolio/history visual density, order status hierarchy, transitions, and return-to-game context should feel close to Polymarket after P0 identity passes. | Side-by-side visual review or recording. | Open |

## Required ED Proof Bundle

Preferred final paths for Lead integration:

- Screenshots: `docs/mobile/screenshots/cycle-ED-integrated-book-order-portfolio/`
- XML: `docs/mobile/harness/cycle-ED-integrated-book-order-portfolio/`
- Proof JSON: `docs/mobile/harness/cycle-ED-integrated-book-order-portfolio/cycle-ED-book-order-portfolio-proof.json`
- Backend route/data proof: `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`

The proof bundle must include:

- Device id, app mode, route/deep link, build/run identifier, and fake-token/test-flow labeling.
- Live game page selected market baseline screenshot/XML.
- Book opened from that selected context with selected market identity and depth/source/status markers.
- Ticket opened from Book with selected identity and amount/submit-ready state.
- Fake-token order submit/result screenshot/XML and backend request/response proof.
- Portfolio open order and/or position screenshot/XML tied to the same order/market identity.
- Activity/history screenshot/XML and backend route proof tied to the same order/fill identity.
- One lifecycle identity map proving no field drift across Book, ticket, order, Portfolio, and history.
- Non-ready/fallback handling or documented skip reason.
- EA/EB/EC regression markers from the same build or explicit same-build non-regression references.

## Blocking Rules

Block ED pass if any of these occur:

- Android screenshots/XML/proof JSON are missing for Book, ticket, order submit, Portfolio, or history.
- Backend order/portfolio/history route proof is missing for the same selected identity.
- Book or ticket uses a generic/default market while the selected Book market has line/outcome context.
- Order request/response drops market id, outcome id, line, period, side/outcome, provider/source, or selector key fields that were visible in Book/ticket.
- Portfolio or history shows an event-only label, moneyline fallback, stale row, or amount/status without selected market identity.
- Backend-only, screenshot-only, compile-only, EC-only, DX-only, or DO-only evidence is used as pass evidence.
- Fixture/fallback/unavailable rows are labeled or implied as provider-ready Book lifecycle proof.
- The gate claims fresh Polymarket reference or production order confirmation parity without matching new artifacts.

## Audit Gate Decision

Current result: pass for the selected ED integrated gate.

Unresolved ED P0 gaps: 0 for the selected Book-selected fake-token lifecycle proven by Lead integration.

Tracked gap: PM-GAP-081 is verified for the selected ED lifecycle.

Next required work:

1. Keep the ED proof as regression coverage for future Book/order/Portfolio changes.
2. Promote remaining P1/P2 debt into later cycles when broader real provider-backed line-family lifecycle, cancel/fill status breadth, production confirmation recapture, immutable snapshots, or Portfolio/history visual polish become the selected scope.

## Lead Post-Proof Placeholder

Result: pass.

Integrated evidence:

- Proof JSON: `docs/mobile/harness/cycle-ED-integrated-book-order-portfolio/cycle-ED-book-order-portfolio-proof.json`
- Screenshots: `docs/mobile/screenshots/cycle-ED-integrated-book-order-portfolio/`
- XML: `docs/mobile/harness/cycle-ED-integrated-book-order-portfolio/`
- Backend route/data proof: `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`
- Command: `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBookLifecycle -Port 8308 -Device 172.16.200.30:41299 -OutputDir docs/mobile/screenshots/cycle-ED-integrated-book-order-portfolio -HierarchyOutputDir docs/mobile/harness/cycle-ED-integrated-book-order-portfolio`

Decision after proof:

- Pass/fail: pass for selected PM-GAP-081 gate.
- Unresolved P0 gaps: 0 for the selected ED integrated lifecycle.
- Remaining P1/P2 gaps: broader real provider-backed line-family lifecycle breadth, open/cancel/fill status breadth, official production confirmation recapture, immutable selection snapshots, and visual/motion polish.
