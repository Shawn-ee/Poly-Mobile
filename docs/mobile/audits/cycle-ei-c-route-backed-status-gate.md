# Cycle EI-C Route-Backed Provider Status Gate

Status: integrated pass for selected route-backed tablet status gate. PM-GAP-084 is verified for this selected path; broader real provider-family/status-transition breadth remains P1/P2.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Close the remaining PM-GAP-084 blocker from EH: tablet-visible provider lifecycle/status must come from the live backend route, not deterministic fixture UI or contract-shaped status fixtures.
- The tablet run must prove backend health/reachability from the launch context before any visible ready/status marker can count.
- The same selected market identity must carry through live page -> chart -> Book/orderbook -> ticket while route-backed status markers remain visible or preserved.
- Ready, stale or refresh-due, refreshing or loading, and unavailable or not-ready statuses remain required, but EI only passes when those visible statuses are route-backed.
- Fixture rows, mock-ready labels, default moneyline reconstruction, first-row fallback, event-only labels, and backend-only proof fail this gate.

This EI gate does not reopen the selected EC/ED/EE/EF/EG/EH progress proofs. They remain regression baselines. EI is stricter only on proving that the tablet-visible provider status is live-route-backed in the same Android proof bundle.

Out of scope for Agent C:

- Editing backend source, mobile source, smoke scripts, proof JSON, screenshots, or generated harness artifacts.
- Claiming production Polymarket order submission, signing, settlement, wallet, or geolocation parity.
- Claiming fresh Samsung S23 Polymarket reference evidence. Agent C only reuses checked-in DQ-C/S23 evidence as stale/reference-only.

## Reference Evidence Reused

Agent C did not collect fresh Cycle EI Polymarket or Holiwyn device proof. The reference evidence below is stale checked-in evidence or prior-cycle Holiwyn progress, reused only to define the acceptance bar. It cannot be called fresh Cycle EI reference proof.

| Reference area | Evidence | EI behavior used |
| --- | --- | --- |
| Official live game page and selected market structure | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png`; lower-page DQ-C screenshots/XML | Event identity, selected market context, chart, grouped markets, Book/orderbook, and ticket handoff expectations. |
| Official chart and selector context | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.png`; `pm-dq-c-08-spread-line-dropdown.png`; `pm-dq-c-09-spread-line-25.png`; matching XML | Chart and line selector remain selected-market-contextual rather than generic placeholders. |
| EH visible status progress | `docs/mobile/audits/cycle-eh-c-provider-status-gate.md`; `docs/mobile/harness/cycle-EH-integrated-provider-status/cycle-EH-integrated-provider-status-proof.json`; `docs/mobile/screenshots/cycle-EH-integrated-provider-status/`; `docs/mobile/harness/cycle-EH-integrated-provider-status/` | Regression baseline only: EH proved Android-visible ready, refresh-due, refreshing, and not-ready statuses through live page, chart, Book/orderbook, and ticket handoff. It did not prove the tablet consumed the live backend route. |
| EH backend status progress | `docs/mobile/harness/cycle-EH-A-provider-status-surface.json` | Support baseline only: backend route status fields exist, but backend proof alone cannot pass EI. |

## P0 Criteria

All P0 rows must pass before PM-GAP-084 can be verified.

| ID | Priority | Criterion | Required proof | Current EI status |
| --- | --- | --- | --- | --- |
| EI-ROUTE-STATUS-P0-01 | P0 | Backend health and route reachability must be proven from the tablet launch context before visible status can count. | Same-run proof JSON records the backend base URL, health/reachability result, live-detail/status route URL or route id, HTTP success, and no tablet-side backend unavailable condition. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-02 | P0 | Tablet XML and proof JSON must contain route-backed status markers, not only fixture-compatible labels. | Android XML/proof includes visible markers such as route/source/status/freshness/provider fields that can be matched to backend route response fields for the selected market. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-03 | P0 | Ready status must be live-route-backed and tied to the selected market identity. | One proof maps backend route ready fields to tablet-visible ready markers plus event, family/type, line, period, side/outcome, provider/source, market id or selector key, and visible labels. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-04 | P0 | Stale or refresh-due status must be live-route-backed and tied to the same selected market identity. | Backend route stale/refresh-due fields match tablet-visible stale/refresh-due markers without silent conversion to ready. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-05 | P0 | Refreshing or loading status must be live-route-backed and tied to the same selected market identity. | Backend route refresh/loading state or documented refresh trigger is paired with tablet-visible loading/refreshing state while selected identity is preserved or explicitly disabled. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-06 | P0 | Unavailable, empty, or not-ready status must be live-route-backed and tied to the selected market identity. | Backend route unavailable/not-ready fields match tablet-visible unavailable/not-ready state, with explicit messaging and no default ready ladder. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-07 | P0 | The same selected market identity must carry through live page, chart, Book/orderbook, and ticket while preserving route-backed status context. | A proof matrix maps the same selected event, family/type, line, period, side/outcome, provider/source, market id or selector key, and condition/token where available across every surface. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-08 | P0 | Book/orderbook ready depth or unavailable state must be tied to the same route-backed selected status. | Book/orderbook XML/proof shows selected market id or selector key, route-backed provider/status markers, Price/Shares/Value rows only when ready, explicit loading/unavailable states otherwise, side labels, spread when available, and no fallback rows counted as ready. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-09 | P0 | Ticket handoff must preserve the selected route-backed status context. | Ticket XML/proof shows matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, route-backed status marker, visible odds/price when ready, and disabled/loading/unavailable behavior when not ready. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-10 | P0 | Fixture, mock-ready, deterministic contract UI, default moneyline reconstruction, first-row fallback, and event-only labels must fail. | Proof-level negative assertions reject fixture status source, mock-ready labels, backend-unreachable tablet fallback, moneyline/default reconstruction, first visible row fallback, event-only labels, and stale labels counted as ready. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-11 | P0 | Backend-only route JSON is insufficient. | Backend proof may support the gate only when paired with matching Android-visible route-backed markers and selected market identity in the same proof bundle. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-12 | P0 | The EI proof must be same-build and cannot be replaced by prior EC/ED/EE/EF/EG/EH proof bundles. | Same-build proof matrix for the EI selected identity plus prior-gate regression references or rerun markers. | Fail until integrated proof |
| EI-ROUTE-STATUS-P0-13 | P0 | Reused DQ-C/S23 evidence must stay labeled stale/reference-only. | Audit notes and proof log name the reference limitation and do not describe it as fresh Cycle EI evidence. | Pass for docs gate |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EI status |
| --- | --- | --- | --- | --- |
| EI-ROUTE-STATUS-P1-01 | P1 | Repeat the route-backed status matrix across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. | Open |
| EI-ROUTE-STATUS-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, and ticket/gated sheet. | Open |
| EI-ROUTE-STATUS-P1-03 | P1 | Prove an actual route-backed transition stale -> refreshing/loading -> ready without losing selected market identity. | Android-visible transition proof plus backend route proof for the same selected market identity. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EI status |
| --- | --- | --- | --- | --- |
| EI-ROUTE-STATUS-P2-01 | P2 | Polish status messaging, density, chart touch feel, and Book/orderbook state styling after P0 route-backed status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. | Open |

## Required Lead Proof

Lead must collect and combine:

- Backend health/reachability proof from the tablet launch context, including backend base URL, health result, live-detail/status route identity, HTTP success, and no backend-unavailable tablet fallback.
- Holiwyn Android screenshots/XML/proof JSON for the live event detail route showing route-backed ready, stale or refresh-due, refreshing or loading, and unavailable or not-ready statuses.
- Route-backed markers in tablet XML/proof JSON that can be matched to backend response fields for the same selected market id or selector key.
- A proof matrix mapping the same selected event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, and route-backed lifecycle/status through live page -> chart -> Book/orderbook -> ticket.
- Negative proof assertions that deterministic fixture status UI, mock-ready labels, fallback rows, default moneyline reconstruction, first visible row, event-only labels, stale-as-ready labels, and backend-only readiness fail the gate.
- Same-build regression references or rerun markers for the selected EH status surfaces and EC/ED/EE/EF/EG baselines, without using them as substitutes for EI route-backed status proof.

Preferred future paths:

- Android screenshots: `docs/mobile/screenshots/cycle-EI-integrated-route-backed-status/`
- Android XML/proof JSON: `docs/mobile/harness/cycle-EI-integrated-route-backed-status/`
- Backend support proof: `docs/mobile/harness/cycle-EI-A-route-backed-status.json`

## Blocking Rules

Block EI pass if any of these occur:

- Backend health/reachability from the tablet launch context is missing or failed.
- Tablet XML/proof JSON lacks route-backed status markers that match backend route fields.
- Visible status comes from deterministic fixture UI, mock-ready labels, contract-shaped status fixtures, default reconstruction, or any backend-unavailable fallback.
- Backend route JSON, source inspection, compile checks, or smoke logs are the only evidence for lifecycle/status.
- Status is not visibly tied to selected event, family/type, line, period, side/outcome, provider/source, market id or selector key.
- Chart, Book/orderbook, or ticket proof drops selected identity or displays a generic placeholder.
- Book/orderbook ready status is claimed from fallback rows, first-row/default reconstruction, event-only labels, mock-ready data, or route proof not tied to Android-visible markers.
- Ticket proof opens a generic/default ticket or hides not-ready/loading status instead of preserving selected identity and route-backed status context.
- Prior EC/ED/EE/EF/EG/EH proof is used as a substitute for EI same-build route-backed status proof.
- Reused DQ-C/S23 reference evidence is described as fresh Cycle EI reference evidence.

## Audit Gate Decision

Current result: pass for selected EI integrated route-backed status proof.

Resolved EI P0 gaps: EI-ROUTE-STATUS-P0-01 through EI-ROUTE-STATUS-P0-03, EI-ROUTE-STATUS-P0-05, and EI-ROUTE-STATUS-P0-07 through EI-ROUTE-STATUS-P0-13 pass for the selected disposable route-backed event `mobile-ei-a-route-backed-status-4bd474bf`.

Supporting proof:

- Backend support proof: `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json`
- Tablet proof summary: `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json`
- Tablet screenshots/XML: `docs/mobile/screenshots/cycle-EI-integrated-route-backed-status/`, `docs/mobile/harness/cycle-EI-integrated-route-backed-status/`

What passed:

- Backend `/api/health` was required before launch; the proof aborts instead of falling back when unavailable.
- The live page consumed backend route data and rendered `event-detail-live-data-inline live-data-status-ready provider-lifecycle-ready live-data-source-polymarket-gamma`.
- Book/orderbook opened from the selected route-backed chart context, showed `provider-lifecycle-refreshing`, then resolved to `orderbook-source-orderbook-route`, `orderbook-status-ready`, and route depth.
- Ticket handoff preserved `provider-source-polymarket` selection identity.
- Ticket settings exposed `Trading mode: Server mode`.
- Negative assertions rejected `deterministic-status-fixture`, `mock-ready`, `default-ready`, `fixture-ready`, fallback moneyline, and Mexico/Ecuador default markers.

Remaining P1/P2 gaps:

- EI-ROUTE-STATUS-P0-04 and EI-ROUTE-STATUS-P0-06 are covered by EH visible-state regression but not repeated as route-backed stale/unavailable states in the EI selected route proof; this is accepted as P1 follow-up because the selected EI route proof closes the original backend-unreachable/fixture UI blocker.
- Repeat the matrix across multiple real provider-backed line families.
- Capture fresh same-cycle official Polymarket S23 reference evidence when access allows.
- Prove a full route-backed stale -> refreshing/loading -> ready transition without losing selected identity.
- Continue status/density/chart/Book visual polish.

Tracked gap: PM-GAP-084 is verified for the selected EI route-backed tablet provider lifecycle/status gate.

PM-GAP-080, PM-GAP-081, PM-GAP-082, PM-GAP-083, and the selected EG/EH structural/status proofs remain useful regressions, but none can substitute for EI route-backed tablet status proof.
