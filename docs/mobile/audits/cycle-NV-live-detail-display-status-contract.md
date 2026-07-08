# Cycle NV - Live Detail Display Status Contract

Date: 2026-07-08

Scope:

- Backend-owned display status for the Local MVP Event Detail page.
- No orderbook UI, chat, live stats, schema migration, or order/portfolio behavior changes.

Problem:

- Cycle NU fixed the visible Event Detail stale status in mobile, but mobile still inferred the display state from `liveStatus`, `clock`, and `liveDataStatus`.
- `/api/mobile/events/argentina-vs-egypt/live-detail` can truthfully return raw `status=active`, `liveStatus=LIVE`, and stale provider lifecycle at the same time.

Acceptance criteria:

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NV-P0-01 | P0 | Live-detail route emits backend-owned `event.displayStatus` when raw live state has stale/unavailable provider data and no clock. | Pass |
| NV-P0-02 | P0 | Mobile adapter prefers `event.displayStatus.mobileStatus` and `startsAt` over local inference. | Pass |
| NV-P0-03 | P0 | S23 Home -> Event Detail proof still shows `Active` / `Time TBD`, with no fake live minute. | Pass |
| NV-P0-04 | P0 | No orderbook/chat surfaces are exposed. | Pass |

Implementation:

- `serializeMobileLiveEventDetail()` now emits `event.displayStatus` for stale/unavailable no-clock live-detail data.
- `normalizeEventSummary()` now consumes `displayStatus.mobileStatus`, `displayStatus.startsAt`, and `displayStatus.label`.
- Tests cover both the backend route contract and mobile adapter consumption.

Android proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-NV-live-detail-display-status-contract/cycle-NV-current-mvp-s23-visible-flow.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-NV-live-detail-display-status-contract/cycle-NV-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-NV-live-detail-display-status-contract/cycle-NV-current-mvp-detail-stale-top.png`

Audit gate:

- Pass for the focused display-status data contract.
- Remaining P1: real current World Cup live match/provider breadth is still missing.
- Remaining P1: Spread/Totals/Team Total remain backend `contract-fixture` markets until attach-ready provider lines exist.
