# Cycle DX-C Line Lifecycle Audit Gate

Status: pending Agent A/B evidence for PM-GAP-074. This is a focused audit/reference gate for selected line market lifecycle parity from row/selector through ticket, order, portfolio/open order/position, and history/activity.

Audit Gate Agent: Agent C.

This document is criteria and evidence routing only. It does not edit central trackers, reports, proof logs, app code, or backend code.

## Scope

Feature target:

- Selected line market lifecycle: selector/row -> ticket -> order -> portfolio/open order/position -> history/activity.
- Identity preservation across market selection, ticket target, order payload/result, open order or filled position, and activity/history rows.
- Joint backend contract and Android visible UI evidence for the same selected line market.

Out of scope:

- Passing PM-GAP-074 before Agent A backend proof and Agent B Android proof are both available.
- Treating DR-C ticket-target proof as full lifecycle proof.
- Treating DW Book selector/state breadth as order, portfolio, or history proof.
- Editing app/backend implementation.

## Reference Evidence

DX-C reuses the Cycle DQ-C Samsung S23 Polymarket reference. Do not treat this as a fresh reference capture.

- Reference audit: `docs/mobile/audits/live-football-world-cup-dq-c.md`
- Reference screenshots: `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`
- Reference XML: `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

DQ-C reference paths required for this gate:

| Area | Screenshot | XML | Reference behavior |
| --- | --- | --- | --- |
| Spread line dropdown | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.xml` | Spread line selector opens inline around selected `1.5`. |
| Changed line | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.xml` | Selecting `2.5` updates display label, subject/team, and Yes/No prices. |
| Ticket gated sheet | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.xml`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.xml` | Tapping the selected spread opens a bottom sheet, then production location gating blocks order entry. |
| Markets scroll breadth | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.xml` | Lower markets include Totals and period-specific groups, proving line-family breadth beyond the first Spread row. |

Holiwyn baseline evidence already available:

- DR-C ticket-target gate: `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md`
- DR-C proof summary: `docs/mobile/harness/cycle-DR-C-integrated-line-market-ticket-proof.json`
- DR-C Android artifacts: `docs/mobile/screenshots/cycle-DR-C-integrated-line-adjustment-spread-ticket.png`, `docs/mobile/screenshots/cycle-DR-C-integrated-line-adjustment-totals-ticket.png`, and matching XML in `docs/mobile/harness/`
- DW Book selector gate: `docs/mobile/audits/cycle-dw-c-book-selector-ticket-gate.md`
- DW backend state matrix: `docs/mobile/harness/cycle-DW-integrated-provider-orderbook-state-matrix.json`
- DW Android selector proof: `docs/mobile/harness/cycle-DW-B-orderbook-selector/cycle-DW-B-holiwyn-orderbook-selector-proof.json`
- DW Android selector screenshots/XML: `docs/mobile/screenshots/cycle-DW-B-orderbook-selector/` and `docs/mobile/harness/cycle-DW-B-orderbook-selector/`

## Required Agent A Backend Proof

Agent A must provide backend contract proof for the exact selected line market(s) Agent B uses in Android evidence:

- A selected market identity record including `marketId`, `outcomeId`, family/group, line, period, side/outcome, display label, and provider fields where available.
- Provider-backed line-family proof for at least one real provider-backed Spread or Totals line, not only deterministic fixture data.
- Order lifecycle proof showing the selected line identity in ticket/order request, order response, open order and/or filled position state, and activity/history state.
- Portfolio contract proof for both open order and position surfaces where applicable, including selected line and outcome identity.
- History/activity proof that preserves the same market/order/fill identity and does not collapse to event-only, moneyline-only, or default-market labels.
- Explicit mapping between provider fields and mobile-visible fields for the selected market identity.

Preferred Agent A paths:

- `docs/mobile/harness/cycle-DX-A-line-lifecycle-backend-proof.json`
- Any supporting setup/cleanup proof under `docs/mobile/harness/cycle-DX-A-line-lifecycle-*`

Backend-only proof cannot pass visible UI parity. It can satisfy backend contract parity only when paired with Agent B Android evidence for the same selected market/order/portfolio/history identity.

## Required Agent B Android Proof

Agent B must provide Android screenshots/XML and proof JSON from the integrated DX build/run:

- Selector/row before and after line/family/period selection.
- Ticket opened from the selected line row, including amount entry and submit/confirmation state if available in Holiwyn.
- Order result/open order state showing the same selected line identity.
- Portfolio tab or account position/open order surface showing the same selected line identity.
- History/activity surface showing the same selected line identity after the order or fill path.
- Proof JSON tying visible labels/test IDs to backend identity fields for every step.

Preferred Agent B paths:

- `docs/mobile/screenshots/cycle-DX-B-line-lifecycle/`
- `docs/mobile/harness/cycle-DX-B-line-lifecycle/`
- `docs/mobile/harness/cycle-DX-B-line-lifecycle-proof.json`

UI fixture-only proof cannot pass backend contract parity. Fixture-only Android evidence may prove visible layout/state wiring, but it cannot pass PM-GAP-074 lifecycle parity unless Agent A proves the same identity against backend/provider/order/portfolio/history contracts.

## P0 Criteria

| ID | Priority | Criterion | Required evidence | Current DX-C status |
| --- | --- | --- | --- | --- |
| LD-DX-C-P0-01 | P0 | Selected row/selector identity must preserve `marketId`, `outcomeId`, family, line, period, side/outcome, display label, and provider fields where available. | Agent A backend identity proof plus Agent B Android row/selector screenshot/XML for the same selected market. | Pending Agent A/B evidence |
| LD-DX-C-P0-02 | P0 | Ticket must open from the selected line market, not the default event or moneyline market. | Android ticket screenshot/XML and proof JSON showing selected `marketId`, `outcomeId`, family, line, period, side/outcome, display label, and provider/source markers. | Pending Agent B evidence |
| LD-DX-C-P0-03 | P0 | Order request and result must preserve the same selected line identity used by the ticket. | Backend order proof and Android visible order/result proof tied to the same market/outcome/order identity. | Pending Agent A/B evidence |
| LD-DX-C-P0-04 | P0 | Portfolio open order must preserve the selected line identity when the order remains open. | Backend open-order proof plus Android portfolio/open-order screenshot/XML showing the same selected line and outcome identity. | Pending Agent A/B evidence |
| LD-DX-C-P0-05 | P0 | Portfolio position must preserve the selected line identity when the order is filled or position is otherwise represented. | Backend position/fill proof plus Android portfolio position screenshot/XML showing the same selected line and outcome identity. | Pending Agent A/B evidence |
| LD-DX-C-P0-06 | P0 | History/activity must preserve selected line lifecycle identity, including market/order/fill linkage. | Backend history/activity proof plus Android activity/history screenshot/XML with matching display label, market, line, period, side/outcome, amount, and status. | Pending Agent A/B evidence |
| LD-DX-C-P0-07 | P0 | Identity must remain consistent across selector/row, ticket, order, portfolio/open order/position, and history/activity. | A single proof bundle mapping each lifecycle step to the same `marketId`, `outcomeId`, family, line, period, side/outcome, display label, provider fields, and order/fill ids where applicable. | Pending Agent A/B evidence |
| LD-DX-C-P0-08 | P0 | Backend-only proof cannot pass visible UI parity. | Any Agent A backend pass must be paired with committed Android screenshots/XML from Agent B for the same lifecycle identity. | Pending Agent A/B evidence |
| LD-DX-C-P0-09 | P0 | UI fixture-only proof cannot pass backend contract parity. | Any Agent B fixture proof must be paired with Agent A backend/provider/order/portfolio/history proof for the same selected market identity before PM-GAP-074 can pass. | Pending Agent A/B evidence |
| LD-DX-C-P0-10 | P0 | DQ-C location-gated reference must be represented honestly. | Gate notes must distinguish Polymarket production location-gated ticket proof from Holiwyn fake-token or test order flows. | Pending Agent A/B evidence |

## P1 / P2 Criteria

| ID | Priority | Criterion | Required evidence | Current DX-C status |
| --- | --- | --- | --- | --- |
| LD-DX-C-P1-01 | P1 | Real provider-backed line families should cover more than one line family, preferably Spread and Totals with at least one non-default period. | Agent A provider proof and Agent B Android proof for each family/period claimed. | Pending |
| LD-DX-C-P1-02 | P1 | Amount entry and swipe/rail confirmation should be recaptured when reference conditions allow, and Holiwyn test-token behavior should be labeled separately. | Android ticket/order screenshots/XML covering amount and confirmation, plus note that DQ-C production reference was location-gated. | Pending |
| LD-DX-C-P1-03 | P1 | Open order cancel or resolved order status should preserve selected line identity through portfolio/history after status changes. | Backend status-transition proof plus Android portfolio/history recapture. | Pending |
| LD-DX-C-P2-01 | P2 | Visual polish should approximate Polymarket density, labels, spacing, and state hierarchy once P0 identity passes. | Side-by-side Android screenshot review against DQ-C reference paths. | Pending |
| LD-DX-C-P2-02 | P2 | Lifecycle transitions should feel stable and not visually reset context between ticket, order, portfolio, and history. | Sequential screenshots/XML or recording showing transitions preserve selected event/market context. | Pending |

## Blocking Rules

Block a DX-C pass if any of these occur:

- A selected line changes visible text but not `marketId`, `outcomeId`, family, line, period, or side/outcome.
- Ticket, order, portfolio, or history collapses to the default market, moneyline, event-only label, or stale selected row.
- Provider/source fields are available in backend proof but omitted from the lifecycle mapping.
- Order proof exists only in backend artifacts without Android visible proof for the same selected line.
- Android proof exists only from fixtures without backend/provider/order/portfolio/history contract proof for the same selected line.
- Portfolio or history shows amount/status but loses line/period/outcome identity.
- DR-C ticket-target proof or DW selector proof is used as a substitute for full lifecycle proof.

## Gate Decision

Current result: pending Agent A/B evidence.

PM-GAP-074 remains P0 Open for DX-C. DQ-C proves the reference line-market coupling and production ticket gate. DR-C proves focused ticket-target carry-through. DW proves Book selector/state breadth baseline. DX still needs matching Agent A backend contract evidence and Agent B Android visible evidence showing the selected line market lifecycle through ticket, order, portfolio/open order/position, and history/activity without losing identity.
