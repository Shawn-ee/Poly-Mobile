# Cycle EK-C Provider Transition Breadth Gate

Status: fail until Agent A/B/Lead integrated proof. EJ integrated proof is accepted as selected mixed route-backed progress, but EK is the audit gate for the remaining provider-status breadth: visible route-backed unavailable/not-ready state, selected identity preservation across state changes, full stale -> refreshing/loading -> ready transition, no fallback/default/generic market behavior, and real-provider family breadth when available.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Preserve the EJ selected mixed route-backed Android proof as regression coverage: backend health, route-backed live data ready/source labels, chart ready, visible ticket refresh-due handoff, Book refreshing/loading, route-backed Book depth ready, selected Book availability refresh-due/stale, ticket server/provider identity, Book setting persistence, and fallback/mock/default rejection.
- Promote the remaining EK bar from "status breadth exists in backend rows" to "status breadth is visible, route-backed, identity-preserving, and transition-safe on Android."
- Required EK breadth: visible route-backed unavailable/not-ready state; same selected identity through stale/refreshing/loading/ready; no fallback/default/generic market or ticket behavior; real-provider family breadth if current provider data exposes it.
- Backend-only proof, stale prior proof, fixture status UI, deterministic contract-shaped status fixtures, fallback rows, default moneyline reconstruction, first-row fallback, event-only labels, generic Team to Advance labels, and fresh-reference claims without fresh S23 evidence fail this gate.

Out of scope for Agent C:

- Editing backend source, mobile source, smoke scripts, screenshots, generated XML, generated proof JSON, or proof artifacts.
- Claiming fresh Samsung S23 Polymarket reference evidence. Agent C did not capture fresh EK reference proof.
- Claiming production Polymarket order submission, signing, settlement, wallet, or geolocation parity.

## Evidence Reused

Agent C did not collect fresh Cycle EK Polymarket or Holiwyn device proof. The evidence below is checked-in prior evidence and may define the acceptance bar only. It cannot be described as fresh Cycle EK reference evidence.

| Reference area | Evidence | EK use |
| --- | --- | --- |
| Official live game page, chart, Book, selector, and ticket context | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` | Stale/reference-only Polymarket behavior baseline. |
| EI selected route-backed pass | `docs/mobile/audits/cycle-ei-c-route-backed-status-gate.md`; `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json`; `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json`; `docs/mobile/screenshots/cycle-EI-integrated-route-backed-status/`; `docs/mobile/harness/cycle-EI-integrated-route-backed-status/` | Regression baseline for route-backed ready, Book refreshing/loading, route-backed ready depth, ticket identity, server mode, and no fallback. Does not prove EK transition breadth. |
| EJ backend status breadth | `docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json` | Backend route shape already covers disposable ready moneyline, stale/refresh-due spread, and unavailable/not-ready totals rows. EK requires visible Android proof and transition proof before pass. |
| EJ selected mixed visible path | `docs/mobile/audits/cycle-ej-c-provider-status-breadth-gate.md`; `docs/mobile/harness/cycle-EJ-integrated-status-breadth/cycle-EJ-B-visible-status-breadth-proof.json`; `docs/mobile/screenshots/cycle-EJ-integrated-status-breadth/`; `docs/mobile/harness/cycle-EJ-integrated-status-breadth/` | Shows one selected mixed route-backed Android path with visible refresh-due/stale and Book refreshing/loading -> ready. Still missing visible unavailable/not-ready and full same-selected-market stale -> refreshing/loading -> ready transition. |

## P0 Criteria

All P0 rows must pass before EK can be called complete.

| ID | Priority | Criterion | Required proof | Current EK status |
| --- | --- | --- | --- | --- |
| EK-TRANSITION-P0-01 | P0 | EK proof must be same-build and integrated across Agent A backend proof, Agent B Android proof, and Lead proof summary. | One committed EK bundle pairing backend route state with Android-visible markers for the same event and selected market identities. | Fail until proof |
| EK-TRANSITION-P0-02 | P0 | Visible unavailable/not-ready state must be route-backed. | Backend route fields for unavailable/empty/not-ready match Android-visible unavailable/not-ready labels, disabled or explicit Book/ticket behavior, and reason text for the same selected market. | Fail until proof |
| EK-TRANSITION-P0-03 | P0 | A full stale or refresh-due -> refreshing/loading -> ready transition must be proven route-backed. | One selected market begins stale or refresh-due, triggers route-backed refresh, shows Android-visible refreshing/loading, and resolves ready with matching backend route fields. | Fail until proof |
| EK-TRANSITION-P0-04 | P0 | Selected identity must be preserved across the whole transition. | The proof matrix maps event slug, market id or selector key, family/type, line, period, side/outcome, provider/source, condition/token when available, chart status, Book/orderbook status, and ticket state before, during, and after refresh. | Fail until proof |
| EK-TRANSITION-P0-05 | P0 | Stale/refreshing/loading/ready states must not silently change the selected market. | Before/during/after Android XML and proof JSON show the same selected market identity, not a default moneyline, first row, generic market, event-only label, or generic Team to Advance target. | Fail until proof |
| EK-TRANSITION-P0-06 | P0 | Book/orderbook must reflect selected route status honestly. | Ready cases show route-backed Price/Shares/Value depth, side labels, spread where available, source/status markers, and provider identity. Non-ready cases show explicit loading/stale/unavailable state and no fallback depth counted as ready. | Fail until proof |
| EK-TRANSITION-P0-07 | P0 | Ticket handoff must preserve selected identity or block honestly when not ready. | Ready tickets preserve selected event/family/line/period/side/provider/source/market id or selector key and odds/price. Stale/unavailable/not-ready tickets are disabled or explicit while retaining selected identity. | Fail until proof |
| EK-TRANSITION-P0-08 | P0 | No fallback/default/generic market behavior may satisfy the gate. | Proof rejects fixture status source, mock-ready labels, backend-unreachable fallback, stale-as-ready labels, default moneyline reconstruction, first-row fallback, event-only labels, generic market labels, generic Team to Advance labels, fallback depth rows, source inspection, compile checks, and backend-only JSON. | Fail until proof |
| EK-TRANSITION-P0-09 | P0 | Real-provider family breadth must be attempted and proven when available. | Lead must include an inventory of real provider-backed families available in the proof event. If two or more families are available, Android-visible proof must cover Spread plus at least one of Totals, Moneyline, halves, team totals, corners, or props. If unavailable, Lead must document the provider inventory and why disposable route rows are the only current path. | Fail until proof |
| EK-TRANSITION-P0-10 | P0 | EJ selected proof remains regression evidence and cannot be used as the EK pass by substitution. | Lead summary separates EJ progress from EK pass evidence and names which EK P0 rows are newly proven. | Fail until proof |
| EK-TRANSITION-P0-11 | P0 | Fresh S23 reference must not be claimed unless newly captured. | Audit notes, proof log, and Lead summary label DQ-C/S23 evidence stale/reference-only when reused. | Pass for docs gate |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EK status |
| --- | --- | --- | --- | --- |
| EK-TRANSITION-P1-01 | P1 | Expand transition proof to every real provider-backed family exposed by current Polymarket data. | Additional transition/non-ready proof for Spread, Totals, Moneyline, halves, team totals, corners, and props when available. | Open |
| EK-TRANSITION-P1-02 | P1 | Repeat the full transition for more than one provider-backed family. | At least two stale -> refreshing/loading -> ready transitions with Android-visible route-backed markers. | Open |
| EK-TRANSITION-P1-03 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, selector/status states, and ticket/gated sheet. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EK status |
| --- | --- | --- | --- | --- |
| EK-TRANSITION-P2-01 | P2 | Polish density, status language, chart touch feel, non-ready affordances, and Book/orderbook state styling. | Side-by-side review against fresh or reused Polymarket reference after P0 transition proof passes. | Open |

## Required Agent A Proof

Agent A must provide backend route proof for EK:

- Provider-backed market inventory for selected proof event(s), naming family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, route URLs, and whether each family is real-provider-backed or disposable.
- Route-backed unavailable/empty/not-ready state with explicit reason, no fallback-ready depth, and selected identity fields.
- Route-backed stale or refresh-due starting state, triggered refresh/loading marker if represented by route/service fields, and ready resolved state for the same selected market identity.
- Ready Book/orderbook route proof with provider-backed depth rows, side labels, spread where available, and no fallback rows counted as ready.
- Negative assertions rejecting fixture, mock-ready, stale-as-ready, fallback/default, first-row, event-only, generic market, Team to Advance, and backend-only pass conditions.

## Required Agent B Proof

Agent B must provide Android-visible proof for the same selected identities supplied by Agent A:

- Samsung tablet screenshots/XML/proof JSON showing route-backed unavailable/not-ready state on the live page and in Book/ticket behavior.
- A full stale/refresh-due -> refreshing/loading -> ready transition for the same selected market identity.
- Live page -> chart -> Book/orderbook -> ticket proof where selected identity matches Agent A backend fields before, during, and after transition.
- Book/orderbook proof with route-backed source/status/depth markers when ready and explicit disabled/loading/stale/unavailable behavior when not ready.
- Ticket proof that preserves ready selection identity or honestly blocks stale/unavailable/not-ready selection without falling back to a generic ticket.
- Negative proof assertions rejecting fixture status UI, mock-ready labels, backend-unreachable fallback, default moneyline, first visible row, event-only labels, generic market labels, generic Team to Advance labels, fallback depth, and stale-as-ready labels.

## Required Lead Integration

Lead must provide the final EK integration summary:

- Pair Agent A backend records to Agent B Android markers by event slug, market id or selector key, family/type, line, period, side/outcome, provider/source, condition/token when available, and status phase.
- Include a transition matrix with `before`, `during`, and `after` rows for the same selected identity.
- Include a provider-family inventory and state whether real-provider family breadth was available. If unavailable, document why and keep breadth open rather than counting generic/disposable rows as real-provider breadth.
- State whether proof used fresh official S23 reference evidence. If not, label DQ-C/S23 evidence stale/reference-only.
- List exact committed proof paths for backend JSON, Android proof JSON, screenshots, XML, and same-build regression markers.

## Blocking Rules

Block EK pass if any of these occur:

- Fresh S23 reference is implied without new same-cycle S23 capture.
- The proof uses only EJ selected mixed path, EI selected ready path, EH fixture-visible status states, backend JSON, source inspection, compile checks, or smoke logs.
- Visible unavailable/not-ready state is missing, fixture-derived, hidden, or silently converted to ready.
- The stale -> refreshing/loading -> ready transition is missing, backend-only, or loses selected market identity.
- Book/orderbook ready depth comes from fallback rows, default moneyline reconstruction, first visible row, event-only labels, generic market labels, or route proof not tied to Android markers.
- Ticket proof drops selected identity, opens a generic/default ticket, or hides non-ready state rather than preserving or explicitly blocking it.
- Real-provider family breadth is available but not attempted; or unavailable breadth is claimed as passed without a provider inventory and explicit reason.

## Audit Gate Decision

Current result: fail until integrated EK transition breadth proof.

What is already accepted:

- EI remains verified for the selected route-backed ready/Book/ticket path under PM-GAP-084.
- EJ backend proof shows disposable route-backed ready, stale/refresh-due, and unavailable/not-ready shapes.
- EJ integrated proof shows one selected mixed Android path with route-backed live data ready/source labels, chart ready, visible ticket refresh-due handoff, Book refreshing/loading then route-backed ready depth, selected Book availability refresh-due/stale, ticket server/provider identity, and fallback/mock/default rejection.

What EK still requires:

- Visible route-backed unavailable/not-ready state.
- Full same-selected-market stale or refresh-due -> refreshing/loading -> ready transition.
- Selected identity preserved across live page, chart, Book/orderbook, and ticket before/during/after the transition.
- Explicit no fallback/default/generic market behavior, including no default moneyline, first-row, event-only, or generic Team to Advance substitution.
- Real-provider family breadth if available, or a documented provider inventory explaining why it remains unavailable.
- Honest reference labeling: no fresh S23 reference claim unless fresh S23 evidence is captured.

Tracked status: PM-GAP-085 remains open for post-EI route-backed provider status breadth and transition proof.
