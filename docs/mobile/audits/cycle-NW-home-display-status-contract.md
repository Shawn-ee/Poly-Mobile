# Cycle NW - Home Display Status Contract

Date: 2026-07-08

Scope:

- Backend-owned display status for Home/event-list summaries.
- No orderbook UI, chat, live stats, schema migration, provider ingestion, or order/portfolio changes.

Problem:

- Cycle NV added `event.displayStatus` to `/api/mobile/events/:slug/live-detail`.
- Home still relied on mobile-side inference from raw `status`, `liveStatus`, date, and clock fields.
- The current MVP match can truthfully return raw `status=active`, `liveStatus=LIVE`, `clock=null`, and stale provider/date state; Home needs the same backend-owned display contract as Event Detail.

Acceptance criteria:

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NW-P0-01 | P0 | `/api/events` summaries emit `displayStatus` for stale/no-clock raw live or active events. | Pass |
| NW-P0-02 | P0 | Existing public API no-leak tests allow only the intended new public key. | Pass |
| NW-P0-03 | P0 | Mobile adapter continues to consume `displayStatus` for Home. | Pass |
| NW-P0-04 | P0 | S23 proof shows Home and Event Detail as `Active` / `Time TBD` with no fake live minute. | Pass |

Implementation:

- `serializeEventSummary()` now emits `displayStatus` for stale/no-clock raw live/active summaries.
- Public event/sports no-leak tests include `displayStatus`.
- `mobile-event-market-rules-contract` tests the stale provider-dated summary contract.

Android proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-NW-home-display-status-contract/cycle-NW-current-mvp-s23-visible-flow.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-NW-home-display-status-contract/cycle-NW-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-NW-home-display-status-contract/cycle-NW-current-mvp-detail-stale-top.png`

Audit gate:

- Pass for Home/event-list display-status contract.
- Remaining P1: real current World Cup live match/provider breadth is still missing.
- Remaining P1: Spread/Totals/Team Total remain backend `contract-fixture` markets until attach-ready provider lines exist.
