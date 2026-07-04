# Cycle EJ-C Provider Status Breadth Gate

Status: docs gate prepared; breadth proof remains open after EI. EI stays verified for the selected route-backed ready/Book/ticket path, but EJ does not pass broader provider-status breadth until new integrated proof exists.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Preserve the EI selected pass: backend health from tablet launch context, route-backed ready status, Book refreshing/loading, route-backed ready depth, ticket provider identity, ticket settings `Trading mode: Server mode`, and no fixture/mock/default fallback.
- Define the next breadth gate for route-backed provider lifecycle/status after EI.
- Required EJ breadth: real provider-backed family coverage, stale or refresh-due route-backed state, unavailable or not-ready route-backed state, and a full stale -> refreshing/loading -> ready transition without losing selected identity.
- Backend-only proof, stale prior proof, fixture status UI, deterministic contract-shaped status fixtures, fallback rows, default moneyline reconstruction, first-row fallback, event-only labels, and fresh-reference claims without fresh S23 evidence fail this gate.

This EJ gate does not reopen EI's selected pass. It also does not convert EH's fixture-visible stale/unavailable coverage into route-backed EJ breadth. EH and EI remain regression/support evidence only.

Out of scope for Agent C:

- Editing backend source, mobile source, smoke scripts, proof JSON, screenshots, generated XML, or generated proof artifacts.
- Claiming fresh Samsung S23 Polymarket reference evidence. Agent C did not capture fresh EJ reference proof.
- Claiming production Polymarket order submission, signing, settlement, wallet, or geolocation parity.

## Reference Evidence Reused

Agent C did not collect fresh Cycle EJ Polymarket or Holiwyn device proof. The evidence below is checked-in prior evidence and may define the acceptance bar only. It cannot be described as fresh Cycle EJ reference evidence.

| Reference area | Evidence | EJ use |
| --- | --- | --- |
| Official live game page, chart, Book, selector, and ticket context | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` | Stale/reference-only Polymarket behavior baseline. |
| EH visible status regression | `docs/mobile/audits/cycle-eh-c-provider-status-gate.md`; `docs/mobile/harness/cycle-EH-integrated-provider-status/cycle-EH-integrated-provider-status-proof.json`; `docs/mobile/screenshots/cycle-EH-integrated-provider-status/`; `docs/mobile/harness/cycle-EH-integrated-provider-status/` | Shows Android-visible ready, refresh-due, refreshing, and not-ready states, but from deterministic contract fixture UI. Not route-backed EJ proof. |
| EI selected route-backed status pass | `docs/mobile/audits/cycle-ei-c-route-backed-status-gate.md`; `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json`; `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json`; `docs/mobile/screenshots/cycle-EI-integrated-route-backed-status/`; `docs/mobile/harness/cycle-EI-integrated-route-backed-status/` | Regression baseline for route-backed ready, Book refreshing/loading, route-backed depth, ticket identity, and server mode. Does not prove EJ breadth. |

## P0 Criteria

EJ is a breadth gate over the remaining post-EI proof. All P0 rows must pass before the breadth gate can be called complete.

| ID | Priority | Criterion | Required proof | Current EJ status |
| --- | --- | --- | --- | --- |
| EJ-BREADTH-P0-01 | P0 | EJ proof must be same-build and integrated across Agent A backend proof, Agent B Android proof, and Lead proof summary. | One committed EJ proof bundle pairing backend route state with Android-visible markers for the same selected event/market identities. | Fail until integrated proof |
| EJ-BREADTH-P0-02 | P0 | Real provider-backed family breadth must be proven beyond the single EI disposable ready path. | Route-backed proof for at least two real provider-backed families when available, including Spread and one of Totals, Moneyline, halves, team totals, corners, or props; each must include selected market id or selector key, family/type, line/period where applicable, side/outcome, provider/source, condition/token where available, and route status. | Fail until integrated proof |
| EJ-BREADTH-P0-03 | P0 | Stale or refresh-due state must be route-backed and visible, not fixture-derived. | Backend route fields showing stale/refresh-due for the selected market must match Android-visible stale/refresh-due markers, with no silent conversion to ready and no fallback rows counted as ready. | Fail until integrated proof |
| EJ-BREADTH-P0-04 | P0 | Unavailable, empty, or not-ready state must be route-backed and visible. | Backend route fields showing unavailable/empty/not-ready must match Android-visible state and messaging for the selected market, with Book/ticket disabled or explicit rather than defaulting to moneyline, first row, or event-only labels. | Fail until integrated proof |
| EJ-BREADTH-P0-05 | P0 | Full transition stale -> refreshing/loading -> ready must be proven route-backed. | One selected market must begin stale or refresh-due, show Android-visible refreshing/loading during the triggered route-backed refresh, and resolve to backend/Android ready with the same selected identity. | Fail until integrated proof |
| EJ-BREADTH-P0-06 | P0 | Selected identity must survive the whole breadth matrix. | Proof matrix maps event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, route status, chart status, Book/orderbook status, and ticket state across live page -> chart -> Book/orderbook -> ticket. | Fail until integrated proof |
| EJ-BREADTH-P0-07 | P0 | Book/orderbook state must match the route-backed selected status for ready and non-ready cases. | Ready cases show route-backed Price/Shares/Value rows, side labels, spread where available, source/status markers, and provider identity. Non-ready cases show explicit loading/stale/unavailable state and no fallback depth counted as ready. | Fail until integrated proof |
| EJ-BREADTH-P0-08 | P0 | Ticket handoff must preserve route-backed selected status or block honestly when not ready. | Ready tickets show matching event/family/line/period/side/provider/source/market id or selector key and odds/price. Stale/unavailable/not-ready tickets are disabled or explicit while preserving selected identity. | Fail until integrated proof |
| EJ-BREADTH-P0-09 | P0 | Negative assertions must reject fallback and proof-only substitutes. | Proof rejects fixture status source, mock-ready labels, backend-unreachable fallback, stale-as-ready labels, default moneyline reconstruction, first-row fallback, event-only labels, fallback depth rows, backend-only JSON, source inspection, compile checks, and smoke logs without visible route-backed markers. | Fail until integrated proof |
| EJ-BREADTH-P0-10 | P0 | Fresh S23 reference must not be claimed unless newly captured. | Audit notes, proof log, and Lead summary must label DQ-C/S23 evidence as stale/reference-only when reused. | Pass for docs gate |
| EJ-BREADTH-P0-11 | P0 | EI selected pass must stay as regression coverage and must not be used as breadth proof. | Lead summary explicitly separates EI selected route-backed ready path from EJ breadth evidence and includes EI regression markers without treating them as sufficient. | Fail until integrated proof |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EJ status |
| --- | --- | --- | --- | --- |
| EJ-BREADTH-P1-01 | P1 | Expand family breadth to every real provider-backed line family exposed by current Polymarket data. | Additional Spread, Totals, halves, team totals, corners, and props proof when available. | Open |
| EJ-BREADTH-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, selector/status states, and ticket/gated sheet. | Open |
| EJ-BREADTH-P1-03 | P1 | Repeat full transition proof across more than one provider-backed family. | At least two stale -> refreshing/loading -> ready transitions with Android-visible route-backed markers. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EJ status |
| --- | --- | --- | --- | --- |
| EJ-BREADTH-P2-01 | P2 | Polish density, status language, chart touch feel, non-ready affordances, and Book/orderbook state styling. | Side-by-side review against fresh or reused Polymarket reference after P0 breadth proof passes. | Open |

## Required Agent A Proof

Agent A must provide backend route proof for EJ, not generated screenshots or mobile code changes in this docs lane:

- Provider-backed market inventory for the selected proof event(s), naming family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, and route URLs.
- Route-backed stale or refresh-due state for at least one selected market, with freshness timestamps and `shouldRefresh`/equivalent route fields.
- Route-backed unavailable/empty/not-ready state for at least one selected market, with explicit reason and no fallback-ready depth.
- Triggered refresh proof showing stale or refresh-due -> refreshing/loading -> ready for one selected market, preserving the same identity.
- Ready Book/orderbook route proof with provider-backed depth rows, side labels, spread where available, and no fallback rows counted as ready.
- Negative assertions rejecting fixture, mock-ready, stale-as-ready, fallback/default, event-only, and backend-only pass conditions.

## Required Agent B Proof

Agent B must provide Android-visible proof for the same selected identities supplied by Agent A:

- Samsung tablet screenshots/XML/proof JSON showing route-backed stale/refresh-due, refreshing/loading, ready, and unavailable/not-ready markers.
- Live page -> chart -> Book/orderbook -> ticket proof where the selected identity matches Agent A backend fields.
- Book/orderbook ready proof with route-backed source/status/depth markers and non-ready proof with explicit disabled/loading/unavailable behavior.
- Ticket proof that preserves ready selection identity or honestly blocks stale/unavailable/not-ready selection without falling back to a generic ticket.
- Negative proof assertions rejecting fixture status UI, mock-ready labels, backend-unreachable fallback, default moneyline, first visible row, event-only labels, fallback depth, and stale-as-ready labels.

## Required Lead Integration

Lead must provide the final EJ integration summary:

- Pair Agent A backend records to Agent B Android markers by selected event slug, market id or selector key, family/type, line, period, side/outcome, provider/source, and status.
- State whether proof used fresh official S23 reference evidence. If not, label DQ-C/S23 evidence stale/reference-only.
- State that EI remains verified for the selected route-backed ready/Book/ticket path, but EJ breadth remains open until all P0 rows above pass.
- List exact committed proof paths for backend JSON, Android proof JSON, screenshots, XML, and any same-build regression markers.

## Blocking Rules

Block EJ breadth pass if any of these occur:

- Fresh S23 reference is implied without new same-cycle S23 capture.
- The proof uses only the EI selected ready path, EH fixture-visible status states, backend JSON, source inspection, compile checks, or smoke logs.
- Real provider-backed family breadth is absent or only one disposable selected ready path is covered.
- Stale/refresh-due or unavailable/not-ready status is fixture-derived, hidden, or silently converted to ready.
- The stale -> refreshing/loading -> ready transition is missing, backend-only, or loses selected market identity.
- Book/orderbook ready depth comes from fallback rows, default moneyline reconstruction, first visible row, event-only labels, or route proof not tied to Android markers.
- Ticket proof drops selected identity, opens a generic/default ticket, or hides non-ready state rather than preserving/explicitly blocking it.

## Audit Gate Decision

Current result: fail until integrated breadth proof.

What is already accepted:

- EI remains verified for the selected route-backed tablet status path.
- EI proves backend health/reachability, route-backed ready live page, Book refreshing/loading, route-backed ready depth, ticket provider identity, server mode, and fallback/mock/default rejection for the selected disposable path.

What EJ still requires:

- Real provider-backed family breadth beyond EI.
- Route-backed stale/refresh-due state.
- Route-backed unavailable/not-ready state.
- Full stale -> refreshing/loading -> ready transition.
- Lead-integrated pairing of Agent A backend proof and Agent B Android-visible proof.
- Honest reference labeling: no fresh S23 reference claim unless fresh S23 evidence is captured.

Tracked status: PM-GAP-084 stays verified for the selected EI route-backed gate, while the new post-EI breadth debt is tracked as open P1/P2 work under EJ until integrated proof exists.
