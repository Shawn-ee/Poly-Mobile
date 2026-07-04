# Cycle EH-C Provider Status Gate

Status: fail until integrated Android-visible proof. PM-GAP-084 remains open for visible provider lifecycle/status parity.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- Close the remaining PM-GAP-084 blocker from EG: provider lifecycle/status must be visible on Android, not only present in backend proof JSON.
- The same selected market identity must carry through live page -> chart -> Book/orderbook -> ticket while each surface shows or preserves the provider lifecycle/status context.
- Required visible states are ready, stale or refresh-due, refreshing or loading, and unavailable or not-ready.
- Backend-only proof, hidden proof JSON, compile checks, smoke logs without Android UI capture, generic fixture readiness, mock-ready labels, or fallback market rows cannot pass this gate.

This EH gate does not reopen the selected EC/ED/EE/EF/EG passes for chart, line selector, Book ladder, ticket carry-through, order lifecycle, or snapshot durability. Those remain regression baselines. EH is stricter only on the remaining visible provider lifecycle/status proof.

Out of scope for Agent C:

- Editing backend source, mobile source, smoke scripts, proof JSON, screenshots, or generated harness artifacts.
- Claiming production Polymarket order submission, signing, settlement, or wallet parity.
- Claiming fresh Samsung S23 Polymarket reference evidence. Agent C only reuses checked-in DQ-C/S23 evidence as stale/reference-only.

## Reference Evidence Reused

Agent C did not collect fresh Cycle EH Polymarket or Holiwyn device proof. The reference evidence below is stale checked-in Samsung S23 official Polymarket evidence, reused only to define the acceptance bar. It cannot be called fresh Cycle EH reference proof.

| Reference area | Evidence | EH behavior used |
| --- | --- | --- |
| Official live game page and selected market structure | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png`; lower-page DQ-C screenshots/XML | Event identity, selected market context, chart, grouped markets, and scroll behavior. |
| Official chart and selector context | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.png`; `pm-dq-c-08-spread-line-dropdown.png`; `pm-dq-c-09-spread-line-25.png`; matching XML | Chart and line selector remain selected-market-contextual rather than generic placeholders. |
| Official Book/orderbook and ticket context | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png`; `pm-dq-c-13-orderbook-market-selector.png`; `pm-dq-c-15-orderbook-depth-scroll.png`; `pm-dq-c-10-spread-ticket.png`; matching XML | Book/orderbook and ticket handoff preserve selected event/market context. |
| Holiwyn EG progress | `docs/mobile/audits/cycle-eg-c-live-event-visible-provider-gate.md`; `docs/mobile/harness/cycle-EG-A-provider-refresh-lifecycle.json`; `docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-visible-live-parity-proof.json` | Regression baseline only: EG proved selected Spread identity through chart, Book, and ticket, while backend separately proved refresh lifecycle. It did not prove visible lifecycle/status parity in one Android run. |

## P0 Criteria

All P0 rows must pass before PM-GAP-084 can be verified.

| ID | Priority | Criterion | Required proof | Current EH status |
| --- | --- | --- | --- | --- |
| EH-STATUS-P0-01 | P0 | Same-cycle Holiwyn Android visible proof must exist for provider lifecycle/status on the exact live event detail feature. | Committed EH screenshots, XML, and proof JSON from one integrated Android run. | Fail until proof |
| EH-STATUS-P0-02 | P0 | Ready state must be Android-visible and tied to the selected market identity. | Live page, chart, Book/orderbook, and ticket proof showing ready provider/source/status plus the same event, family/type, line, period, side/outcome, market id or selector key, and visible labels. | Fail until proof |
| EH-STATUS-P0-03 | P0 | Stale or refresh-due state must be Android-visible and tied to the same selected market identity. | Android proof showing stale or refresh-due status on the selected market path, with no silent conversion to ready and no loss of chart, Book/orderbook, or ticket identity. | Fail until proof |
| EH-STATUS-P0-04 | P0 | Refreshing or loading state must be Android-visible and tied to the same selected market identity. | Android proof showing refresh in progress or loading status for the selected market path while chart, Book/orderbook, and ticket either preserve identity or show an explicit disabled/loading state. | Fail until proof |
| EH-STATUS-P0-05 | P0 | Unavailable, empty, or not-ready state must be Android-visible and tied to the selected market identity. | Android proof showing unavailable/not-ready status for the selected market path, with explicit messaging and without defaulting to a moneyline, first row, event-only label, or mock-ready ladder. | Fail until proof |
| EH-STATUS-P0-06 | P0 | Backend-only lifecycle proof is insufficient. | Backend route/provider fields may support the gate only when paired with matching Android-visible status markers and selected market identity in the same proof bundle. | Fail until proof |
| EH-STATUS-P0-07 | P0 | Generic fallback, fixture rows, mock-ready data, or default reconstructed status must fail. | Proof-level assertions and visible UI labels reject fallback/default reconstruction, including moneyline fallback, first-row fallback, event-only labels, stale labels counted as ready, and mock-ready provider rows. | Fail until proof |
| EH-STATUS-P0-08 | P0 | Chart status must be tied to the selected market/outcome, not a generic chart placeholder. | Chart touch/context proof showing selected outcome or market context, provider/source/status, and no unintended navigation or ticket/Book side effect. | Fail until proof |
| EH-STATUS-P0-09 | P0 | Book/orderbook status must be tied to the selected market identity when ready, stale, refreshing/loading, or unavailable/not-ready. | Book/orderbook proof showing selected market id or selector key, provider/status markers, Price/Shares/Value rows only when ready, explicit loading/unavailable states otherwise, side labels, spread when available, and no fallback rows counted as ready. | Fail until proof |
| EH-STATUS-P0-10 | P0 | Ticket status handoff must preserve selected identity and status context from the selected row/line/orderbook action. | Ticket proof showing matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, visible odds/price when ready, disabled/loading/unavailable behavior when not ready, and fake-token/test labeling if applicable. | Fail until proof |
| EH-STATUS-P0-11 | P0 | The EH proof must be integrated, same-build, and cannot be replaced by prior EC/ED/EE/EF/EG proof bundles. | Same-build proof matrix for the selected EH identity plus prior-gate regression references or rerun markers. | Fail until proof |
| EH-STATUS-P0-12 | P0 | Reused DQ-C/S23 evidence must stay labeled stale/reference-only. | Audit notes and proof log name the reference limitation and do not describe it as fresh Cycle EH evidence. | Pass for docs gate |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EH status |
| --- | --- | --- | --- | --- |
| EH-STATUS-P1-01 | P1 | Repeat the visible provider lifecycle/status matrix across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. | Open |
| EH-STATUS-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, and ticket/gated sheet. | Open |
| EH-STATUS-P1-03 | P1 | Prove an actual provider refresh transition stale -> refreshing/loading -> ready without losing selected market identity. | Android-visible transition proof plus backend proof for the same selected market identity. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EH status |
| --- | --- | --- | --- | --- |
| EH-STATUS-P2-01 | P2 | Polish status messaging, density, chart touch feel, and Book/orderbook state styling after P0 status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. | Open |

## Required Lead Proof

Lead must collect and combine:

- EH Holiwyn Android screenshots/XML/proof JSON for the live event detail route showing ready, stale or refresh-due, refreshing or loading, and unavailable or not-ready states.
- A proof matrix mapping the same selected event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, and lifecycle/status through live page -> chart -> Book/orderbook -> ticket.
- Backend/provider route proof only as support, paired to the same visible Android market id or selector key and status markers in the same selected flow.
- Negative proof assertions that fallback rows, default moneyline reconstruction, first visible row, event-only labels, generic fixture data, mock-ready labels, and backend-only readiness fail the gate.
- Same-build regression references or rerun markers for the selected EG chart/Book/ticket path and EC/ED/EE/EF baselines, without using them as substitutes for EH status proof.

Preferred future paths:

- Android screenshots: `docs/mobile/screenshots/cycle-EH-integrated-provider-status/`
- Android XML/proof JSON: `docs/mobile/harness/cycle-EH-integrated-provider-status/`
- Backend support proof: `docs/mobile/harness/cycle-EH-A-provider-status-lifecycle.json`

## Blocking Rules

Block EH pass if any of these occur:

- Visible Android screenshots/XML/proof JSON are missing.
- Any required state is missing: ready, stale or refresh-due, refreshing or loading, unavailable or not-ready.
- Backend route JSON, source inspection, compile checks, or smoke logs are the only evidence for lifecycle/status.
- Status is not visibly tied to selected event, family/type, line, period, side/outcome, provider/source, market id or selector key.
- Chart, Book/orderbook, or ticket proof drops selected identity or displays a generic placeholder.
- Book/orderbook ready status is claimed from fallback rows, mock-ready data, first-row/default reconstruction, event-only labels, or backend proof not tied to Android-visible markers.
- Ticket proof opens a generic/default ticket or hides not-ready/loading status instead of preserving selected identity and status context.
- Reused DQ-C/S23 reference evidence is described as fresh Cycle EH reference evidence.

## Audit Gate Decision

Current result: fail until integrated proof.

Unresolved EH P0 gaps: EH-STATUS-P0-01 through EH-STATUS-P0-11 remain failed. EH-STATUS-P0-12 passes for docs disclosure only.

Tracked gap: PM-GAP-084 remains open for visible provider lifecycle/status parity tied to selected market identity across chart, Book/orderbook, and ticket.

PM-GAP-080, PM-GAP-081, PM-GAP-082, PM-GAP-083, and the selected EG structural proof remain useful regressions, but none can substitute for EH Android-visible provider lifecycle/status proof.
