# Polymarket Feature Criteria

Purpose: convert same-cycle Polymarket audits into pass/fail Holiwyn criteria.

Rule: every completed Holiwyn feature must have criteria here or in a focused audit file linked from this file. Every P0 must be objectively auditable.

## Priority Definitions

P0: required for parity baseline. If any P0 fails, the feature is not complete.

P1: required for near parity. May remain open only when explicitly tracked and accepted for a later cycle.

P2: polish. May remain open when tracked and not confusing or blocking.

## Universal P0 Criteria

These apply to every page, feature, button, and interaction:

| ID | Criterion | Audit method |
| --- | --- | --- |
| U-P0-01 | Same-cycle Polymarket reference audit exists for the exact feature. | Audit file and reference screenshot/hierarchy path. |
| U-P0-02 | Holiwyn Android device proof exists for the exact feature. | Screenshot/hierarchy/proof log path. |
| U-P0-03 | Every visible button/control either performs the expected Polymarket-equivalent action, opens the correct Holiwyn equivalent, or is explicitly disabled with a clear reason. | Device smoke and UI hierarchy. |
| U-P0-04 | Selected market, line, outcome, and tab state persist through navigation/ticket/portfolio flows when Polymarket preserves them. | Device smoke, route test, or state test. |
| U-P0-05 | Holiwyn does not use copied Polymarket logos, trademarks, protected text, proprietary images, or private assets. | Review. |
| U-P0-06 | Empty, loading, disabled, and error states are not static placeholders when Polymarket has meaningful behavior. | Device smoke and screenshots. |
| U-P0-07 | Visual hierarchy is not meaningfully worse or confusing compared with the Polymarket reference for the selected feature. | Audit Gate comparison. |
| U-P0-08 | Audit Gate Agent marks the feature pass with 0 unresolved P0 gaps. | Audit Gate report. |

## Feature Criteria Register

| Feature | Criteria owner file | P0 status | P1/P2 status | Latest gate |
| --- | --- | --- | --- | --- |
| Route-backed provider transition breadth after EJ | `docs/mobile/audits/cycle-ek-c-provider-transition-gate.md` | Fail-until-integrated-proof for EK transition breadth. EJ selected mixed route-backed Android path remains regression coverage, but EK requires visible route-backed unavailable/not-ready state, full same-selected-market stale -> refreshing/loading -> ready transition, selected identity preservation across live page/chart/Book/ticket, no fallback/default/generic market behavior, and real-provider family breadth if available. | P1/P2 remaining: expand transition proof to every real provider-backed family when available, repeat transitions across more than one family, fresh official S23 recapture, and status/density polish | EK-C docs gate; PM-GAP-085 open |
| Route-backed provider status breadth after EI | `docs/mobile/audits/cycle-ej-c-provider-status-breadth-gate.md` | Fail-until-integrated-proof for EJ breadth. EI selected route-backed ready/Book/ticket path remains verified, but EJ requires new Agent A/B/Lead proof for real provider-backed family breadth, route-backed stale/refresh-due, route-backed unavailable/not-ready, full stale -> refreshing/loading -> ready transition, and no fallback/default proof substitutes. | P1/P2 remaining: expand to every real provider-backed family when available, fresh official S23 recapture, repeated transition breadth, and status/density polish | EJ-C docs gate; PM-GAP-085 open |
| Live event route-backed provider lifecycle/status parity EI | `docs/mobile/audits/cycle-ei-c-route-backed-status-gate.md` | Pass for selected EI integrated route-backed tablet status proof. The selected path proves backend health/reachability, route-backed ready live page, Book refreshing/loading, route-backed ready depth, ticket provider identity, server mode, and no deterministic fixture/mock-ready/default fallback. | P1/P2 remaining moved to EJ breadth: fresh official S23 recapture, broader real provider-backed line-family status matrix, actual route-backed stale -> refreshing/loading -> ready transition proof, and status visual polish | EI integrated selected pass; PM-GAP-084 verified for selected path |
| Live event visible provider lifecycle/status parity EH | `docs/mobile/audits/cycle-eh-c-provider-status-gate.md` | Partial for selected EH integrated proof. Android proof now shows ready, refresh-due, refreshing, and not-ready states through live page, chart, Book/orderbook, and ticket handoff, and backend proof shows route status fields. P0 remains open for tablet-visible status rendering sourced from the live backend route rather than deterministic contract fixture status UI. | P1/P2 remaining: fresh official S23 recapture, broader real provider-backed line-family status matrix, actual stale -> refreshing/loading -> ready transition proof, and status visual polish | EH integrated partial; PM-GAP-084 remains open |
| Live event visible provider behavior and structural parity EG | `docs/mobile/audits/cycle-eg-c-live-event-visible-provider-gate.md` | Partial for selected EG integrated proof. Android proof now covers chart touch, line selector changes, chart-to-Book, and chart-to-ticket identity for the selected Spread path, and backend proof covers provider refresh lifecycle. P0 remains open for same-run visible ready/stale/refreshing/unavailable status proof tied to the backend route, no-fallback status handling, and prior-gate non-regression in the same build. | P1/P2 remaining: fresh official S23 recapture, broader real provider-backed line-family breadth, visible stale/refreshing/ready lifecycle, and live-page visual/status polish | EG integrated partial; PM-GAP-084 remains open |
| Book-origin snapshot durability after metadata drift EF | `docs/mobile/audits/cycle-ef-c-snapshot-durability-gate.md` | Pass for selected EF integrated gate. P0 proof preserves order-time/fill-time selected Book identity after mutable market/outcome/provider metadata drift in backend routes and Android Portfolio/activity, with no fallback/default reconstruction and explicit fake-token labels | P1/P2 remaining: repeat across real provider-backed line families, provider-refresh drift regression, official production history recapture, and Portfolio/history visual clarity | EF integrated gate pass; PM-GAP-083 verified for selected lifecycle |
| Book-origin order status breadth and selection snapshots EE | `docs/mobile/audits/cycle-ee-c-book-order-status-gate.md` | Pass for selected EE integrated gate. P0 proof preserves the same Book-origin Spread identity across open order, cancel/canceled status, filled position, recent activity/history, Android-visible fake-token status labels, backend route/data proof, guarded selection snapshots, and no fallback | P1/P2 remaining: real provider-backed line-family status matrix, official production confirmation/cancel/fill recapture, durability checks after metadata changes, and Portfolio/history visual status polish | EE integrated gate pass; PM-GAP-082 verified for selected lifecycle |
| Book-selected order to Portfolio/history ED lifecycle | `docs/mobile/audits/cycle-ed-c-book-order-portfolio-gate.md` | Pass for selected ED integrated gate. P0 proof starts on the live game page Book surface, selects Spread `1.5` regulation Yes, opens the matching ticket, submits a fake-token order, and preserves the same selected identity through Android-visible Portfolio open order/open position/activity plus backend order/portfolio/history route proof | P1/P2 remaining: real provider-backed line-family lifecycle breadth, open/cancel/fill status breadth, production confirmation recapture, immutable selection snapshots, and Portfolio/history visual polish | ED integrated gate pass; PM-GAP-081 verified for selected lifecycle |
| Line-market lifecycle DX | `docs/mobile/audits/cycle-dx-c-line-lifecycle-gate.md`; `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md`; `docs/mobile/audits/cycle-dw-c-book-selector-ticket-gate.md` | Pass for focused lifecycle gate. Backend proof preserves provider-shaped Spread identity through order request, order response, open order, canceled activity, filled position, and recent trade; Android proof preserves visible `MEX -2.5 1H` through row, ticket, order, Portfolio activity, and open order | P1/P2 remaining: repeat visible lifecycle on real provider-backed line market, official amount/swipe confirmation recapture, every line family, and production immutable selection storage | DX focused gate pass |
| Orderbook family/depth selector DW grouped selector/state breadth | `docs/mobile/audits/cycle-dw-c-book-selector-ticket-gate.md`; `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md` | Pass for focused DW gate. Android proof shows a grouped Book selector sheet with Moneyline/Totals/Spreads selection and Spread ticket carry-through; backend proof shows unavailable/empty, stale, and ready provider orderbook states are distinct and fallback rows are not counted as ready | P1/P2 remaining: real-provider selector breadth for every line family, full settings sheet, phone visual density, and selector identity through order/portfolio/history | DW focused gate pass |
| Orderbook family/depth selector DV provider-ready UI | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Verified for the focused same-market provider-ready Book path. DV ties backend `provider-orderbook-depth` JSON for market `d08da13e-80b8-4452-9067-f91d08f6fba4` to the Android-visible Book UI with selector key `spreads:first-half:1.5`, ready route status, Spread line/period state, Cents/Decimal setting preservation, and ticket carry-through to `Japan -1.5` | P1/P2 remaining: broader selector sheet coverage, richer settings sheet behavior, server non-ready recapture in the provider-specific harness, and phone-density/visual polish | DV focused gate pass |
| Orderbook family/depth selector DU integrated | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Superseded by DV. DU was partial because provider-ready backend depth and visible Book UI proof were separate evidence bundles | Keep DU evidence as background for settings/selector/ticket behavior; use DV as the same-market provider-ready regression proof | Superseded by DV |
| Orderbook family/depth selector DU-C final gate | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Passed for the focused same-market provider-ready path after DV proof. OB-DU-C-P0-01/02/03/04/05/06/09 now have Android-visible evidence; OB-DU-C-P0-07 remains covered by DT/DU regression evidence; OB-DU-C-P0-08 remains documented by non-ready/fallback evidence rather than recaptured in the DV ready-only server run | Remaining P1/P2 polish: complete Polymarket selector/settings parity and tighter phone visuals | DV focused gate pass |
| Orderbook family/depth selector DT integrated | `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Partial. DT integrated proof exists for Yes/No tab switching, selector carry-through into a Totals ticket, side-labelled ladder markers, and backend provider-backed ready depth route; PM-GAP-075 remains open | Required remaining proof: provider-backed ready depth visible in the same UI run, Spread/period/line selector carry-through, and Decimalize/equivalent Book setting. P1 broader selector coverage, row-to-ticket carry-through polish, and P2 visual polish remain open after gate pass | DT integrated partial; not parity-pass |
| Line-market ticket target parity DR-C | `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md` | Focused P0 pass after integrated Samsung tablet proof for selected market family, line, period, side/outcome, odds/probability, and ticket target identity | DQ-C production ticket amount/swipe recapture remains P1 due to location gate; Book/order/portfolio/history coupling stays under PM-GAP-074 | Pass for focused ticket-target gate |
| Live football / World Cup game detail DQ-C | `docs/mobile/audits/live-football-world-cup-dq-c.md` | Fresh S23 reference P0 criteria added for full page hierarchy, chart press, line-state coupling, Book/depth ladder, active buttons/actions, tab behavior, and scroll behavior; Holiwyn not marked complete | P1 ticket amount/swipe confirmation recapture remains blocked by Polymarket location gate; P1 full Book market-selector parity and P2 visual/motion polish remain open | Reference audit only |
| Live event detail | `docs/mobile/audits/live-event-detail.md`; `docs/mobile/audits/live-event-detail-super-round-dm.md` | DN super-round P0 criteria are documented for Polymarket-first match-winner provider mapping, CLOB chart history, route-backed depth, Buy/Sell ticket identity, and honest stale/closed state handling | P1 exact line-family provider markets, filled-order/history lifecycle proof, and scheduled refresh remain open; P2 visual density/motion polish remains deferred | Pass for Cycles DK-DM evidence; Agent A/B must re-run final device proof against implementation build |
| Game page | `docs/mobile/audits/game-page.md` | Verified for Cycle AJ focused logged-in game-page P0; Cycle AL sticky market-tab criterion passed; Cycle AM Player Props unavailable-state criterion passed | P1/P2 phone density and backend-backed market data remain tracked | Pass |
| Trade ticket | `docs/mobile/audits/trade-ticket.md` | Verified for Cycle AI focused logged-in/tall ticket-surface P0 | P1/P2 deferred in focused audit; production eligibility/location gates remain deferred for fake-token mode | Pass |
| Binary side ticket | `docs/mobile/audits/binary-side.md` | Verified for Cycle AH focused Buy No contract-side P0 | P1 full-page/native swipe confirmation deferred | Pass |
| Line adjustment | `docs/mobile/audits/line-adjustment.md` | Verified for Cycle Y focused Spreads/Totals P0 | P1/P2 deferred in focused audit | Pass |
| Portfolio | `docs/mobile/audits/portfolio.md` | Verified for Cycle AA focused fake-token P0 | P1/P2 deferred in focused audit | Pass |
| Search | `docs/mobile/audits/search.md` | Verified for Cycle AB focused Search/Explore P0 | P1/P2 deferred in focused audit | Pass |
| Account/settings | `docs/mobile/audits/account.md` | Verified for Cycle AC focused account/settings P0 | P1/P2 deferred in focused audit | Pass |
| Chart behavior | `docs/mobile/audits/chart-behavior.md` | Verified for Cycle AD focused chart P0 | P1/P2 deferred in focused audit | Pass |
| Market page | `docs/mobile/audits/market-page.md` | Verified for Cycle AE focused market-page P0 | P1/P2 deferred in focused audit | Pass |
| Event page top shell | `docs/mobile/audits/event-page-top-shell.md` | Verified for Cycle U focused P0 | P1/P2 deferred in focused audit | Pass |
| Futures market rows | `docs/mobile/audits/futures-market-rows.md` | Verified for Cycle AK focused logged-in catalog expansion P0 | P1/P2 backend-owned catalog/live pricing and visual density remain tracked | Pass |
| Futures chart range | `docs/mobile/audits/futures-chart-range.md` | Verified for Cycle W focused P0 | P1/P2 deferred in focused audit | Pass |
| Match market tabs/cards | `docs/mobile/audits/match-market-tabs-cards.md` | Verified for Cycle X focused P0 | P1/P2 deferred in focused audit | Pass |
| Navigation | `docs/mobile/audits/navigation.md` | Verified for Cycle T P0 | P1/P2 deferred in focused audit | Pass |

## Required Special Coverage

Adjustable line markets:

- Spreads.
- Totals.
- Team totals.
- Corners.
- Halves.
- Other discovered line-based markets.

Chart behavior:

- Probability movement.
- Selected outcome state.
- Time range if present.
- Tooltip or press behavior if present.
- Empty/loading behavior.

Trade ticket:

- Buy/Sell switching.
- Amount entry.
- Odds/probability updates.
- Payout/cost calculation.
- Line selection carry-through.
- Confirmation/error state.

Live event detail DN super-round required checks:

- Chart source must be `polymarket-clob-prices-history` or an explicitly documented unavailable/stale state for provider-backed markets.
- Line selectors must be provider-backed for the selected line/outcome, or explicitly unavailable/stale/unsupported when current Polymarket reference exposes no line-family market.
- Orderbook/depth must use route-backed provider data and expose best bid, best ask, spread, price, shares, and total.
- Buy/Sell ticket must preserve selected provider source, external market, condition, outcome token, outcome label, market type, group, period, line, and side.
- Closed/resolved events must not be shown as current-live ready; stale/ended state is acceptable and required when the provider says so.

## Cycle EK-C Provider Transition Breadth Gate Criteria

The focused EK-C gate in `docs/mobile/audits/cycle-ek-c-provider-transition-gate.md` tracks the remaining route-backed provider-status transition breadth after EJ. EJ remains selected mixed-path regression coverage; EK is fail-until-integrated-proof for visible unavailable/not-ready, full transition, selected identity preservation, no fallback/default/generic behavior, and real-provider family breadth if available.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EK-TRANSITION-P0-01 | P0 | EK proof must be same-build and integrated across Agent A backend proof, Agent B Android proof, and Lead proof summary. | One committed EK bundle pairing backend route state with Android-visible markers for the same event and selected market identities. |
| EK-TRANSITION-P0-02 | P0 | Visible unavailable/not-ready state must be route-backed. | Backend route unavailable/empty/not-ready fields match Android-visible unavailable/not-ready labels, disabled or explicit Book/ticket behavior, and reason text for the same selected market. |
| EK-TRANSITION-P0-03 | P0 | Full stale or refresh-due -> refreshing/loading -> ready transition must be route-backed. | One selected market begins stale or refresh-due, triggers route-backed refresh, shows Android-visible refreshing/loading, and resolves ready with matching backend route fields. |
| EK-TRANSITION-P0-04 | P0 | Selected identity must be preserved across the whole transition. | Proof matrix maps event slug, market id or selector key, family/type, line, period, side/outcome, provider/source, condition/token when available, chart status, Book/orderbook status, and ticket state before/during/after refresh. |
| EK-TRANSITION-P0-05 | P0 | Stale/refreshing/loading/ready states must not silently change the selected market. | Before/during/after Android XML and proof JSON show the same selected market identity, not a default moneyline, first row, generic market, event-only label, or generic Team to Advance target. |
| EK-TRANSITION-P0-06 | P0 | Book/orderbook must reflect selected route status honestly. | Ready cases show route-backed depth/source/status; non-ready cases show explicit loading/stale/unavailable state and no fallback depth counted as ready. |
| EK-TRANSITION-P0-07 | P0 | Ticket handoff must preserve selected identity or block honestly when not ready. | Ready tickets preserve selected identity and odds/price; stale/unavailable/not-ready tickets are disabled or explicit while preserving identity. |
| EK-TRANSITION-P0-08 | P0 | No fallback/default/generic market behavior may satisfy the gate. | Proof rejects fixture status source, mock-ready labels, backend-unreachable fallback, stale-as-ready labels, default moneyline, first-row, event-only, generic market, generic Team to Advance, fallback depth, source inspection, compile checks, and backend-only JSON. |
| EK-TRANSITION-P0-09 | P0 | Real-provider family breadth must be attempted and proven when available. | Lead includes real provider-backed family inventory. If two or more families are available, Android-visible proof covers Spread plus at least one of Totals, Moneyline, halves, team totals, corners, or props; otherwise Lead documents why breadth remains unavailable. |
| EK-TRANSITION-P0-10 | P0 | EJ selected proof remains regression evidence and cannot be used as the EK pass by substitution. | Lead summary separates EJ progress from EK pass evidence and names which EK P0 rows are newly proven. |
| EK-TRANSITION-P0-11 | P0 | Fresh S23 reference must not be claimed unless newly captured. | Audit notes, proof log, and Lead summary label DQ-C/S23 evidence stale/reference-only when reused. |
| EK-TRANSITION-P1-01 | P1 | Expand transition proof to every real provider-backed family exposed by current Polymarket data. | Additional transition/non-ready proof for Spread, Totals, Moneyline, halves, team totals, corners, and props when available. |
| EK-TRANSITION-P1-02 | P1 | Repeat the full transition for more than one provider-backed family. | At least two stale -> refreshing/loading -> ready transitions with Android-visible route-backed markers. |
| EK-TRANSITION-P1-03 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, selector/status states, and ticket/gated sheet. |
| EK-TRANSITION-P2-01 | P2 | Polish density, status language, chart touch feel, non-ready affordances, and Book/orderbook state styling. | Side-by-side review against fresh or reused Polymarket reference after P0 transition proof passes. |

## Cycle EJ-C Provider Status Breadth Gate Criteria

The focused EJ-C gate in `docs/mobile/audits/cycle-ej-c-provider-status-breadth-gate.md` tracks the remaining route-backed provider-status breadth after EI. EI remains a selected pass; EJ is fail-until-integrated-proof for breadth.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EJ-BREADTH-P0-01 | P0 | EJ proof must be same-build and integrated across Agent A backend proof, Agent B Android proof, and Lead proof summary. | One committed EJ bundle pairing backend route state with Android-visible markers for the same selected event/market identities. |
| EJ-BREADTH-P0-02 | P0 | Real provider-backed family breadth must be proven beyond the single EI disposable ready path. | Route-backed proof for at least two real provider-backed families when available, including Spread and one of Totals, Moneyline, halves, team totals, corners, or props. |
| EJ-BREADTH-P0-03 | P0 | Stale or refresh-due state must be route-backed and visible, not fixture-derived. | Backend route stale/refresh-due fields match Android-visible stale/refresh-due markers for the selected market with no silent conversion to ready. |
| EJ-BREADTH-P0-04 | P0 | Unavailable, empty, or not-ready state must be route-backed and visible. | Backend route unavailable/empty/not-ready fields match Android-visible state and messaging, with no default moneyline, first-row, or event-only fallback. |
| EJ-BREADTH-P0-05 | P0 | Full transition stale -> refreshing/loading -> ready must be proven route-backed. | One selected market begins stale or refresh-due, shows Android-visible refreshing/loading during route-backed refresh, and resolves ready with the same identity. |
| EJ-BREADTH-P0-06 | P0 | Selected identity must survive the whole breadth matrix. | Proof matrix maps event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, status, chart, Book/orderbook, and ticket state. |
| EJ-BREADTH-P0-07 | P0 | Book/orderbook state must match the route-backed selected status for ready and non-ready cases. | Ready cases show route-backed depth/source/status; non-ready cases show explicit loading/stale/unavailable state and no fallback depth counted as ready. |
| EJ-BREADTH-P0-08 | P0 | Ticket handoff must preserve route-backed selected status or block honestly when not ready. | Ready tickets preserve selected identity and odds/price; stale/unavailable/not-ready tickets are disabled or explicit while preserving identity. |
| EJ-BREADTH-P0-09 | P0 | Negative assertions must reject fallback and proof-only substitutes. | Proof rejects fixture status source, mock-ready labels, backend-unreachable fallback, stale-as-ready labels, default moneyline, first-row, event-only, fallback depth, backend-only JSON, source inspection, compile checks, and smoke logs without visible markers. |
| EJ-BREADTH-P0-10 | P0 | Fresh S23 reference must not be claimed unless newly captured. | Audit notes, proof log, and Lead summary label DQ-C/S23 evidence stale/reference-only when reused. |
| EJ-BREADTH-P0-11 | P0 | EI selected pass must stay regression coverage and must not be used as breadth proof. | Lead summary separates EI selected route-backed ready path from EJ breadth evidence. |
| EJ-BREADTH-P1-01 | P1 | Expand family breadth to every real provider-backed line family exposed by current Polymarket data. | Additional Spread, Totals, halves, team totals, corners, and props proof when available. |
| EJ-BREADTH-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, selector/status states, and ticket/gated sheet. |
| EJ-BREADTH-P1-03 | P1 | Repeat full transition proof across more than one provider-backed family. | At least two stale -> refreshing/loading -> ready transitions with Android-visible route-backed markers. |
| EJ-BREADTH-P2-01 | P2 | Polish density, status language, chart touch feel, non-ready affordances, and Book/orderbook state styling. | Side-by-side review against fresh or reused Polymarket reference after P0 breadth proof passes. |

## Cycle EI-C Route-Backed Provider Status Gate Criteria

The focused EI-C gate in `docs/mobile/audits/cycle-ei-c-route-backed-status-gate.md` tracked the remaining PM-GAP-084 blocker after EH: tablet-visible provider lifecycle/status had to be sourced from the live backend route. Current status is pass for the selected EI integrated route-backed ready/Book/ticket path; broader status breadth moved to EJ.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EI-ROUTE-STATUS-P0-01 | P0 | Backend health and route reachability must be proven from the tablet launch context before visible status can count. | Same-run proof JSON records backend base URL, health/reachability result, live-detail/status route URL or route id, HTTP success, and no tablet-side backend unavailable condition. |
| EI-ROUTE-STATUS-P0-02 | P0 | Tablet XML and proof JSON must contain route-backed status markers, not only fixture-compatible labels. | Android XML/proof includes route/source/status/freshness/provider markers matched to backend route response fields for the selected market. |
| EI-ROUTE-STATUS-P0-03 | P0 | Ready status must be live-route-backed and tied to the selected market identity. | Backend ready fields match tablet-visible ready markers plus event, family/type, line, period, side/outcome, provider/source, market id or selector key, and visible labels. |
| EI-ROUTE-STATUS-P0-04 | P0 | Stale or refresh-due status must be live-route-backed and tied to the same selected market identity. | Backend stale/refresh-due fields match tablet-visible stale/refresh-due markers without silent conversion to ready. |
| EI-ROUTE-STATUS-P0-05 | P0 | Refreshing or loading status must be live-route-backed and tied to the same selected market identity. | Backend refresh/loading state or documented refresh trigger is paired with tablet-visible loading/refreshing state while selected identity is preserved or explicitly disabled. |
| EI-ROUTE-STATUS-P0-06 | P0 | Unavailable, empty, or not-ready status must be live-route-backed and tied to the selected market identity. | Backend unavailable/not-ready fields match tablet-visible unavailable/not-ready state, with explicit messaging and no default ready ladder. |
| EI-ROUTE-STATUS-P0-07 | P0 | The same selected market identity must carry through live page, chart, Book/orderbook, and ticket while preserving route-backed status context. | A proof matrix maps the same selected event, family/type, line, period, side/outcome, provider/source, market id or selector key, and condition/token where available across every surface. |
| EI-ROUTE-STATUS-P0-08 | P0 | Book/orderbook ready depth or unavailable state must be tied to the same route-backed selected status. | Book/orderbook XML/proof shows selected market id or selector key, route-backed provider/status markers, Price/Shares/Value rows only when ready, explicit loading/unavailable states otherwise, side labels, spread when available, and no fallback rows counted as ready. |
| EI-ROUTE-STATUS-P0-09 | P0 | Ticket handoff must preserve the selected route-backed status context. | Ticket XML/proof shows matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, route-backed status marker, visible odds/price when ready, and disabled/loading/unavailable behavior when not ready. |
| EI-ROUTE-STATUS-P0-10 | P0 | Fixture, mock-ready, deterministic contract UI, default moneyline reconstruction, first-row fallback, and event-only labels must fail. | Proof-level assertions reject fixture status source, mock-ready labels, backend-unreachable tablet fallback, moneyline/default reconstruction, first visible row fallback, event-only labels, and stale labels counted as ready. |
| EI-ROUTE-STATUS-P0-11 | P0 | Backend-only route JSON is insufficient. | Backend proof may support the gate only when paired with matching Android-visible route-backed markers and selected market identity in the same proof bundle. |
| EI-ROUTE-STATUS-P0-12 | P0 | The EI proof must be same-build and cannot be replaced by prior EC/ED/EE/EF/EG/EH proof bundles. | Same-build proof matrix for the EI selected identity plus prior-gate regression references or rerun markers. |
| EI-ROUTE-STATUS-P0-13 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. |
| EI-ROUTE-STATUS-P1-01 | P1 | Repeat the route-backed status matrix across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. |
| EI-ROUTE-STATUS-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, and ticket/gated sheet. |
| EI-ROUTE-STATUS-P1-03 | P1 | Prove an actual route-backed transition stale -> refreshing/loading -> ready without losing selected market identity. | Android-visible transition proof plus backend route proof for the same selected market identity. |
| EI-ROUTE-STATUS-P2-01 | P2 | Polish status messaging, density, chart touch feel, and Book/orderbook state styling after P0 route-backed status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. |

Market page:

- Tabs.
- Grouped markets.
- Expanded/collapsed rows.
- Nested market options.
- Line selectors.
- Liquidity/depth display.

Portfolio:

- Positions.
- Open orders.
- Cancel behavior.
- Activity/history.
- Sell/close/retrade behavior.

Navigation:

- Back behavior.
- Tab persistence.
- Scroll position.
- Deep links if applicable.

## Cycle EH-C Provider Status Gate Criteria

The focused EH-C gate in `docs/mobile/audits/cycle-eh-c-provider-status-gate.md` tracks the remaining PM-GAP-084 blocker after EG: Android-visible provider lifecycle/status parity. Current status is partial after integrated Android proof; route-backed tablet status rendering remains open.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EH-STATUS-P0-01 | P0 | Same-cycle Holiwyn Android visible proof must exist for provider lifecycle/status on the exact live event detail feature. | Committed EH screenshots, XML, and proof JSON from one integrated Android run. |
| EH-STATUS-P0-02 | P0 | Ready state must be Android-visible and tied to the selected market identity. | Live page, chart, Book/orderbook, and ticket proof showing ready provider/source/status plus the same event, family/type, line, period, side/outcome, market id or selector key, and visible labels. |
| EH-STATUS-P0-03 | P0 | Stale or refresh-due state must be Android-visible and tied to the same selected market identity. | Android proof showing stale or refresh-due status on the selected market path, with no silent conversion to ready and no loss of chart, Book/orderbook, or ticket identity. |
| EH-STATUS-P0-04 | P0 | Refreshing or loading state must be Android-visible and tied to the same selected market identity. | Android proof showing refresh in progress or loading status for the selected market path while chart, Book/orderbook, and ticket either preserve identity or show an explicit disabled/loading state. |
| EH-STATUS-P0-05 | P0 | Unavailable, empty, or not-ready state must be Android-visible and tied to the selected market identity. | Android proof showing unavailable/not-ready status for the selected market path, with explicit messaging and without defaulting to a moneyline, first row, event-only label, or mock-ready ladder. |
| EH-STATUS-P0-06 | P0 | Backend-only lifecycle proof is insufficient. | Backend route/provider fields may support the gate only when paired with matching Android-visible status markers and selected market identity in the same proof bundle. |
| EH-STATUS-P0-07 | P0 | Generic fallback, fixture rows, mock-ready data, or default reconstructed status must fail. | Proof-level assertions and visible UI labels reject fallback/default reconstruction, including moneyline fallback, first-row fallback, event-only labels, stale labels counted as ready, and mock-ready provider rows. |
| EH-STATUS-P0-08 | P0 | Chart status must be tied to the selected market/outcome, not a generic chart placeholder. | Chart touch/context proof showing selected outcome or market context, provider/source/status, and no unintended navigation or ticket/Book side effect. |
| EH-STATUS-P0-09 | P0 | Book/orderbook status must be tied to the selected market identity when ready, stale, refreshing/loading, or unavailable/not-ready. | Book/orderbook proof showing selected market id or selector key, provider/status markers, Price/Shares/Value rows only when ready, explicit loading/unavailable states otherwise, side labels, spread when available, and no fallback rows counted as ready. |
| EH-STATUS-P0-10 | P0 | Ticket status handoff must preserve selected identity and status context from the selected row/line/orderbook action. | Ticket proof showing matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, visible odds/price when ready, disabled/loading/unavailable behavior when not ready, and fake-token/test labeling if applicable. |
| EH-STATUS-P0-11 | P0 | The EH proof must be integrated, same-build, and cannot be replaced by prior EC/ED/EE/EF/EG proof bundles. | Same-build proof matrix for the selected EH identity plus prior-gate regression references or rerun markers. |
| EH-STATUS-P0-12 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. |
| EH-STATUS-P1-01 | P1 | Repeat the visible provider lifecycle/status matrix across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. |
| EH-STATUS-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, and ticket/gated sheet. |
| EH-STATUS-P1-03 | P1 | Prove an actual provider refresh transition stale -> refreshing/loading -> ready without losing selected market identity. | Android-visible transition proof plus backend proof for the same selected market identity. |
| EH-STATUS-P2-01 | P2 | Polish status messaging, density, chart touch feel, and Book/orderbook state styling after P0 status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. |

## Cycle EG-C Live Event Visible Provider Gate Criteria

The focused EG-C gate in `docs/mobile/audits/cycle-eg-c-live-event-visible-provider-gate.md` opens PM-GAP-084 for structural live event detail parity and provider-backed visible behavior. Current status is fail until same-cycle integrated Android proof exists.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EG-LV-P0-01 | P0 | Same-cycle Holiwyn Android visible proof must exist for the exact live event detail feature. | Committed screenshots, XML, and proof JSON from an EG integrated Android run. |
| EG-LV-P0-02 | P0 | Backend-only proof is not sufficient. | Backend/provider fields must be paired to visible Android markers in the same selected flow; route JSON, compile checks, smoke logs, or source inspection cannot pass alone. |
| EG-LV-P0-03 | P0 | The live event page must visibly expose provider-backed ready, stale, refreshing, and unavailable/empty states honestly. | Android proof showing ready provider source/status and at least one stale/refreshing/unavailable state or a documented same-run reason it cannot be triggered. |
| EG-LV-P0-04 | P0 | Selected market identity must carry through live page, chart, Book/orderbook, and ticket. | One proof maps event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, and visible labels across each surface. |
| EG-LV-P0-05 | P0 | Chart state must be tied to the selected market/outcome and status, not a generic placeholder. | Chart screenshot/XML/proof showing selected outcome or market context, provider/source/status, and no unintended ticket/book/share/chat/navigation side effect after chart touch. |
| EG-LV-P0-06 | P0 | Book/orderbook must render provider-backed visible depth for the same selected market identity when claiming ready status. | Android Book proof showing event identity, selected market id or selector key, provider/status markers, Price/Shares/Value rows, side labels, spread, and no fallback rows counted as ready. |
| EG-LV-P0-07 | P0 | Ticket handoff must preserve selected identity from the selected row/line/orderbook action. | Android ticket proof showing matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, visible odds/price, and fake-token/test labeling if applicable. |
| EG-LV-P0-08 | P0 | Non-ready states must not silently fall back to moneyline, first visible row, event-only labels, or mock-ready rows. | Proof assertions and visible labels reject fallback/default reconstruction. |
| EG-LV-P0-09 | P0 | EC/ED/EE/EF regression markers must remain intact but cannot substitute for EG. | Same-build non-regression references or rerun markers for prior selected gates, plus separate EG live-event visible provider proof. |
| EG-LV-P0-10 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. |
| EG-LV-P1-01 | P1 | Repeat the integrated visible provider proof across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. |
| EG-LV-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same live event and interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book, selector, and ticket/gated sheet. |
| EG-LV-P1-03 | P1 | Prove provider refresh changing stale -> refreshing -> ready without losing selected market identity. | Android-visible refresh lifecycle plus backend proof for the same selected identity. |
| EG-LV-P2-01 | P2 | Polish live-page density, chart touch feel, orderbook row styling, and status messaging after P0 identity/status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. |

## Cycle EF-C Snapshot Durability Gate Criteria

The focused EF-C gate in `docs/mobile/audits/cycle-ef-c-snapshot-durability-gate.md` opens PM-GAP-083 for immutable Book-origin selection durability after current metadata drift. Current status is pass for the selected EF integrated proof.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EF-SD-P0-01 | P0 | Backend proof must create or select a Book-origin fake-token order and fill with complete order-time/fill-time selected snapshot fields before drift. | Backend proof JSON with event, market family/type, market id or selector key, line, period, side/outcome, provider/source, provider market/condition/token identity, amount, order id, fill id, and fake-token/test labels. |
| EF-SD-P0-02 | P0 | Current market, outcome, selector, and provider metadata must change after the order/fill exists. | Backend proof JSON listing drift mutations, including labels/default selector/provider freshness or source-display changes. |
| EF-SD-P0-03 | P0 | Backend Portfolio/history/order routes must still return the original Book identity from order-time/fill-time selected snapshots after drift. | Before/after route proof showing selected fields unchanged and no fallback/default reconstruction. |
| EF-SD-P0-04 | P0 | Android Portfolio and history/activity must render the original selected Book identity after drift. | Android screenshots/XML/proof JSON after drift showing the same Book identity as the pre-drift order/fill snapshot. |
| EF-SD-P0-05 | P0 | Fallback/default reconstruction is not acceptable pass evidence. | Assertions reject moneyline fallback, event-only labels, first-row/default selector identity, stale provider label substitution, missing snapshot fields, and fixture-only display reconstruction. |
| EF-SD-P0-06 | P0 | Fake-token/test labeling must survive drift in backend and Android evidence. | Backend and Android proof showing fake-token/test labels on order, position, and history/activity rows after metadata drift. |
| EF-SD-P0-07 | P0 | Agent A backend evidence and Agent B Android evidence must be integrated by Lead for the same selected identity and same drift scenario. | Lead-integrated bundle pairing backend before/after proof with Android post-drift recapture, including matching order/fill ids or deterministic proof ids. |
| EF-SD-P1-01 | P1 | Repeat metadata-drift durability across multiple real provider-backed line families when available. | Backend and Android before/after drift proof for Spread, Totals, halves, and other provider-backed families. |
| EF-SD-P1-02 | P1 | Add a regression that covers provider refresh replacing stale/ready/freshness labels after order creation. | Route proof and Android recapture after provider refresh state changes. |
| EF-SD-P1-03 | P1 | Recapture official Polymarket history behavior if production account/location gates allow completed order/cancel/fill history. | Fresh official-app reference screenshots/XML paired with Holiwyn comparison. |
| EF-SD-P2-01 | P2 | Historical Portfolio/activity visual treatment should make immutable order identity easy to scan after current metadata changes. | Side-by-side visual review after P0 durability passes. |

## Cycle DQ-C Live Football / World Cup Detail Criteria

The focused DQ-C S23 reference audit adds these criteria from `docs/mobile/audits/live-football-world-cup-dq-c.md`:

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| LD-DQ-C-P0-01 | P0 | Same-cycle S23 Polymarket reference exists for the World Cup game detail and core interactions. | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` |
| LD-DQ-C-P0-02 | P0 | Holiwyn must preserve full page hierarchy: header actions, Game/Chat, teams/time, chart, chat preview, primary outcomes, grouped markets, rules/lower content. | Android screenshot/XML compared with `pm-dq-c-03-world-cup-game-top.*` and lower-page captures. |
| LD-DQ-C-P0-03 | P0 | Chart interaction must be context-preserving and not static; no visible tooltip is required unless a later unblocked reference shows one. | Chart press proof compared with `pm-dq-c-04-chart-press.*`. |
| LD-DQ-C-P0-04 | P0 | Line markets must update selected team/subject, line, period, Yes/No side, odds, and probabilities as one state. | Line selector proof compared with `pm-dq-c-08-spread-line-dropdown.*`, `pm-dq-c-09-spread-line-25.*`, and `pm-dq-c-16-markets-scroll-2.*`. |
| LD-DQ-C-P0-05 | P0 | Book/depth must render a ladder with bid/ask sides, price, shares, value/total, spread, Yes/No tabs, and market selector. | Book proof compared with `pm-dq-c-12-top-book-action.*` and `pm-dq-c-13-orderbook-market-selector.*`. |
| LD-DQ-C-P0-06 | P0 | Game/Chat, Book, Share, group chevrons, line selectors, period pills, and outcome buttons must be functional or explicitly gated. | Button/action smoke plus reference `pm-dq-c-05-chat-tab.*`, `pm-dq-c-12-top-book-action.*`, and `pm-dq-c-17-share-sheet.*`. |
| LD-DQ-C-P0-07 | P0 | Scroll must retain compact match context and not lose selected market/line state. | Scroll proof compared with `pm-dq-c-07-markets-scroll-1.*` and `pm-dq-c-16-markets-scroll-2.*`. |
| LD-DQ-C-P1-01 | P1 | Ticket amount entry and swipe-like confirmation should be recaptured when the Polymarket location gate is unblocked. | Current DQ-C proof only reaches `pm-dq-c-11-ticket-sheet-settled.*`. |
| LD-DQ-C-P1-02 | P1 | Book market selector should support every visible family/period exposed in reference, including Moneyline and Spreads. | Holiwyn Book selector proof against `pm-dq-c-13-orderbook-market-selector.*`. |
| LD-DQ-C-P2-01 | P2 | Match native motion, density, red/green depth visualization, and chart touch feel after structural parity. | Side-by-side visual QA. |

## Cycle DR-C Line-Market Ticket Target Gate Criteria

The focused DR-C gate in `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md` converts DQ-C line-selector behavior into pass/fail criteria for Agent B's ticket target work. Integrated Android evidence now exists in `docs/mobile/harness/cycle-DR-C-integrated-line-market-ticket-proof.json`.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| LD-DR-C-P0-01 | P0 | Selected market family must match the tapped family: Spread taps open a Spread ticket, Totals taps open a Totals ticket, and lower-period rows do not fall back to a primary moneyline/fallback target. | Android screenshot/XML for at least one Spread and one Totals ticket opened from the DQ-C-style game detail after selection changes. |
| LD-DR-C-P0-02 | P0 | Selected line must match the user-selected row/selector value. | Before/after selector proof plus ticket XML showing the same selected line in `ticket-selection-line` and selected outcome label. |
| LD-DR-C-P0-03 | P0 | Selected period must carry through from row to ticket, including at least one non-default period. | Row proof and ticket proof both showing the selected period. |
| LD-DR-C-P0-04 | P0 | Selected side/outcome must carry through, including Yes/No or Over/Under/team subject changes caused by line selection. | Ticket XML showing side and outcome in `ticket-contract-outcome-row` and `ticket-selected-outcome-choice`, with screenshot agreement. |
| LD-DR-C-P0-05 | P0 | Odds/probability must come from the selected market/line/period/outcome, not stale row state. | Row odds/probability before tap and ticket odds/probability after tap for Spread and Totals. |
| LD-DR-C-P0-06 | P0 | Ticket target identity must preserve selected market family, line, period, side/outcome, event, provider/source identity where available, and order target through amount entry/ready state. | Clean Android ticket proof after entering amount, plus XML/proof JSON showing the selection fields used by the order payload or service layer. |
| LD-DR-C-P0-07 | P0 | Android visible proof must be clean and DR-C-owned. | Passing smoke/test summary plus committed `docs/mobile/screenshots/cycle-DR-C-*` and `docs/mobile/harness/cycle-DR-C-*` artifacts. |

## Cycle DS-C Orderbook Audit Gate Criteria

The focused DS-C gate in `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` converts DQ-C Book/orderbook evidence into pass/fail criteria for PM-GAP-075. The DT re-gate in `docs/mobile/audits/cycle-dt-c-orderbook-regate.md` rechecks the same gap using DS integrated evidence. Current status is fail-until-proof after integrated Android proof in `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json`; PM-GAP-075 is not passed yet.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| OB-DS-C-P0-01 | P0 | Book action opens a dedicated orderbook surface and preserves event identity. | Android screenshot/XML after tapping Book from the DS Holiwyn game detail. |
| OB-DS-C-P0-02 | P0 | Yes/No tabs are visible and interactive without losing selected market identity. | Before/after tab proof in XML or proof JSON. |
| OB-DS-C-P0-03 | P0 | Market selector is grouped by family and exposes Moneyline plus Spread choices. | Open selector screenshot/XML comparable to `pm-dq-c-13-orderbook-market-selector.*`. |
| OB-DS-C-P0-04 | P0 | Family, period, line, side/outcome, and selected market identity carry through selector, ladder, and ticket action. | Selector before/after plus ladder/ticket XML or proof JSON. |
| OB-DS-C-P0-05 | P0 | Ladder has Price, Shares, and Value/total columns with multiple rows when depth exists. | Android XML and screenshot comparable to `pm-dq-c-12-top-book-action.*`. |
| OB-DS-C-P0-06 | P0 | Ask and bid sides are visually distinct, with asks above spread and bids below spread. | Screenshot proof of red/green side styling plus row-side metadata. |
| OB-DS-C-P0-07 | P0 | Spread separator is visible and reflects the active ladder. | Android XML/screenshot with spread value. |
| OB-DS-C-P0-08 | P0 | Loading, empty, unavailable, stale, and error states are explicit and not mistaken for ready Polymarket-backed depth. | Ready plus at least one non-ready state proof, or documented unavailable-state reason. |
| OB-DS-C-P0-09 | P0 | Proof is integrated and DS-C-owned. | Committed `cycle-DS-C-*` screenshots/XML/proof JSON plus passing smoke/test summary. |
| OB-DS-C-P1-01 | P1 | Settings expose `Decimalize book` or documented display equivalent. | Settings screenshot/XML and state-preservation proof. |
| OB-DS-C-P1-02 | P1 | Selector coverage extends to every visible family/period when the event exposes them. | Additional selector proof for Totals/halves/team totals when available. |
| OB-DS-C-P1-03 | P1 | Ladder row tap carries price, side, shares/value, and selected market identity into ticket/order. | Row tap ticket/order proof JSON/XML. |
| OB-DS-C-P2-01 | P2 | Phone density, motion, row bars, and red/green styling are close to DQ-C reference. | Side-by-side visual QA after P0 pass. |

## Cycle DU-C Orderbook Final Gate Criteria

The focused DU-C gate in `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md` is the final pre-integration blocker for PM-GAP-075. It reuses DQ-C S23 Polymarket reference evidence and DS/DT Holiwyn progress evidence. No fresh DU-C S23 reference or Holiwyn Android proof was captured by Agent C.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| OB-DU-C-P0-01 | P0 | Provider-backed ready depth must be visible in the Android Book UI, not only returned by backend JSON. | Integrated Android screenshot/XML/proof JSON showing ready provider source/status, event title, selected market identity, Price/Shares/Value rows, bid/ask rows, and spread. |
| OB-DU-C-P0-02 | P0 | Backend ready JSON must be tied to the app-visible market id or selector key in the same run. | Proof JSON showing the visible UI market id/selector key matches backend `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`. |
| OB-DU-C-P0-03 | P0 | Spread selector carry-through must preserve family, period, line, side/outcome, and selected market identity through selector, ladder, and ticket. | Before/after Android selector proof plus ladder/ticket XML or proof JSON with matching Spread family, non-default line, period, side/outcome, market id or selector key, and odds/depth source. |
| OB-DU-C-P0-04 | P0 | Spread period and line fields must not collapse to `none` when claiming Spread/period/line parity. | Proof JSON with non-null/non-`none` line and period fields, or documented unavailability that prevents pass. |
| OB-DU-C-P0-05 | P0 | Settings must expose `Decimalize book` or documented Holiwyn equivalent and preserve selected state. | Settings screenshot/XML plus before/after proof that event, selected market, selected side, line, period, ready depth status, and ticket identity do not reset. |
| OB-DU-C-P0-06 | P0 | Ticket/identity preservation must cover the final integrated provider-ready Spread path. | Ticket XML/proof JSON preserving event, family, period, line, side/outcome, market id/selector key, provider/source identity, and selected row price/side where applicable. |
| OB-DU-C-P0-07 | P0 | DT-passed Yes/No switching and side-labelled ladder behavior must not regress. | Same integrated bundle includes tab switch before/after and ask/bid row-side markers above/below spread. |
| OB-DU-C-P0-08 | P0 | Non-ready states must remain honest and visually distinct from provider-ready depth. | Integrated proof includes a non-ready state or documented skip reason; fallback/idle/unavailable rows cannot be used as ready evidence. |
| OB-DU-C-P0-09 | P0 | Final evidence must be integrated, Android-visible, and committed under DU-owned proof paths. | Passing smoke/test summary plus committed screenshots/XML/proof JSON from the integrated DU build. |
