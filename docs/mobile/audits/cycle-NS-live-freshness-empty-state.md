# Cycle NS - Live Freshness Empty State

## Scope

Visible Local MVP improvement for Home and Live route honesty.

Problem:

- The current MVP match `argentina-vs-egypt` is provider-dated `2026-07-07`.
- On July 8, 2026 it should not appear as a live game just because the local row still has `liveStatus=LIVE`.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NS-P0-01 | P0 | Home all-match route still returns the MVP match for ticket-flow testing. | Pass |
| NS-P0-02 | P0 | Live route hides stale provider-dated matches. | Pass |
| NS-P0-03 | P0 | Mobile Live feed does not fall back to all-match data when live route is empty. | Pass |
| NS-P0-04 | P0 | Samsung S23 proof shows Home match, Live empty state, and Home return. | Pass |

## Evidence

- `docs/mobile/harness/cycle-NS-live-freshness-empty-state/cycle-NS-current-mvp-s23-visible-flow.json`
- `docs/mobile/harness/cycle-NS-live-freshness-empty-state/cycle-NS-live-route-freshness.json`
- `docs/mobile/screenshots/cycle-NS-live-freshness-empty-state/cycle-NS-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NS-live-freshness-empty-state/cycle-NS-current-mvp-live.png`

## Result

Pass.

Live is now honest for the current local service state. It shows no live markets rather than showing the stale Argentina vs. Egypt match.

## Remaining Gap

Holiwyn still needs a real current live match/provider feed. Home keeps the MVP match available so the retail ticket/order/Portfolio flow can keep moving.
