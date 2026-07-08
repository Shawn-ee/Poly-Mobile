# Cycle NU - Stale Event Detail Status Honesty

Date: 2026-07-08

Scope:

- Local MVP Event Detail status presentation for the current `argentina-vs-egypt` World Cup match.
- No orderbook UI, chat, live stats, schema, or order-route work.

Reference / inspection:

- Current backend route inspection shows `/api/mobile/events/argentina-vs-egypt/live-detail` returns `status=active`, `liveStatus=LIVE`, `startTime=null`, and `liveDataStatus.status=stale`.
- The same service state inspection from Cycle NR showed Regulation Winner is provider-backed, while Spread/Totals/Team Total are explicit `contract-fixture` line markets.
- Polymarket Gamma evidence for `fifwc-arg-egy-2026-07-07` still exposes match-winner markets only, with 0 attach-ready line markets for this event.

Acceptance criteria:

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NU-P0-01 | P0 | Home still shows the MVP match as `Active` / `Time TBD`, not Live. | Pass |
| NU-P0-02 | P0 | Opening Event Detail for the same match shows `Active` / `Time TBD`, not a fake live minute or live clock. | Pass |
| NU-P0-03 | P0 | Event Detail does not render the hidden live-match strip for stale/no-clock provider data. | Pass |
| NU-P0-04 | P0 | Event Detail still exposes Game Lines and Player Props tabs, with orderbook/chat hidden. | Pass |
| NU-P0-05 | P0 | Adapter tests cover stale live-detail normalization. | Pass |

Implementation:

- `normalizeEventDetail()` now inherits the adapter guard that downgrades `liveStatus=LIVE` when `liveDataStatus.status` is stale/unavailable/empty and there is no live clock.
- `EventDetail` removed the non-live fallback fake `15'` clock and shows `Active` / `Time TBD` for stale/no-time matches.
- The S23 proof harness gained `-ExpectDetailStaleOnly`.

Android proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-NU-stale-event-detail-status/cycle-NU-current-mvp-s23-visible-flow.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-NU-stale-event-detail-status/cycle-NU-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-NU-stale-event-detail-status/cycle-NU-current-mvp-detail-stale-top.png`

Audit gate:

- Pass for the focused Local MVP status-honesty cycle.
- Remaining P1: real current World Cup live match discovery/breadth is still missing.
- Remaining P1: Spread/Totals/Team Total are still contract fixtures, not provider-backed Polymarket line markets.
