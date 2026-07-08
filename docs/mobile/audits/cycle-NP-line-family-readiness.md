# Cycle NP - Line Family Readiness Audit

Status: Pass for Local MVP readiness disclosure. Not a final provider-backed line-market parity pass.

## Scope

Cycle NP answers the current service-readiness question for the Local MVP Event Detail path:

- Regulation Winner is provider-backed for `argentina-vs-egypt`.
- Spread, total, and team-total line families are route-visible but fixture-backed.
- The mobile UI and proof gate must not imply fixture-backed lines are real Polymarket line markets.

No orderbook, chat, live stats, social features, schema migration, or order lifecycle changes were included.

## Acceptance Criteria

| Criterion ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| NP-P0-01 | P0 | Pass | `/api/events` and `/api/mobile/events/:slug/live-detail` expose `lineMarkets.familyReadiness`. |
| NP-P0-02 | P0 | Pass | Route proof shows `regulationWinner.status=provider-backed`, line family statuses `contract-fixture`, and provider-backed line count `0`. |
| NP-P0-03 | P0 | Pass | Event Detail source banner can name local line families from the backend summary. |
| NP-P0-04 | P0 | Pass | S23 Event Detail summary proof passes with Local MVP simplified event-info expectations. |
| NP-P1-01 | P1 | Partial | Real provider-backed Spread/Totals/Team Total markets remain unavailable for the inspected event. |

## Evidence

- Route proof: `docs/mobile/harness/cycle-NP-line-family-readiness/cycle-NP-current-state-inspection.json`
- S23 screenshot: `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- S23 hierarchy: `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`

## Audit Decision

Cycle NP passes as a readiness-disclosure cycle. It makes the current service state more explicit and prevents false provider-backed claims for line markets.

Remaining gap: provider-backed line-market ingestion is still open and must not be marked complete until real attach-ready provider line markets exist or another approved provider source is implemented.
