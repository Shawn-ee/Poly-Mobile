# Cycle RF - Event Detail Trade Smoke Current Ticket Gate

Date: 2026-07-09

## Scope

Repair the S23 Event Detail trade proof so it validates the current Local MVP Trade Ticket instead of the old advanced settings ticket.

This cycle does not change app UI or backend behavior. It keeps the proof gate aligned with the user-approved Polymarket-style ticket screen: dark amount/keypad body, source badge, `$25/$50/Max` presets, separated bottom swipe area, and gesture-only submit.

Out of scope: order book UI, chat, live stats, social features, backend schemas, order routes, Portfolio behavior, and Google OAuth callback/session work.

## Reference/Acceptance

- Event Detail can open the main Mexico ticket on Samsung S23.
- The ticket proof checks the current ticket layout markers, not removed `ticket-settings` or advanced detail panel markers.
- Tapping `$25` updates the amount and keeps swipe submit as a gesture-only action.
- Closing the ticket and opening the Ecuador ticket also validates the current no-clip ticket header and current `$25/$50` presets.
- Rolling `cycle-current-*` artifacts must not be committed; scoped RF proof artifacts must be preserved.

## Implementation

- Updated `mobile/scripts/smoke.ps1` `EventDetailTrade` assertions:
  - Removed stale `ticket-settings`, `ticket-advanced-details`, `$5`, and `$10` expectations from this path.
  - Added current ticket markers: `ticket-retail-reference-layout`, `ticket-header-retail-readable`, `ticket-market-source-badge-inline-safe`, `ticket-header-source-pill-no-clip`, `$25/$50`, `ticket-swipe-area-fixed-bottom`, and `swipe-submit-gesture-required`.
  - Updated current match title expectation from `Mexico vs. Ecuador` to `Mexico vs Ecuador` for this ticket path.
- Added a focused source contract test to keep the Event Detail trade smoke aligned with the current ticket.

## Audit Gate

Result: Pass for RF scope.

S23 device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model `SM-S911U1`

Evidence:

- `docs/mobile/screenshots/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-ticket.png`
- `docs/mobile/screenshots/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-ticket-amount.png`
- `docs/mobile/screenshots/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-away-ticket.png`
- `docs/mobile/harness/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-ticket.xml`
- `docs/mobile/harness/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-ticket-amount.xml`
- `docs/mobile/harness/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-away-ticket.xml`
- `docs/mobile/harness/cycle-RF-event-detail-trade-smoke-current-ticket/cycle-RF-event-detail-trade-smoke-current-ticket-proof.json`

## Validation

- Mobile typecheck passed.
- Focused smoke contract, ticket header density, and ticket swipe motion tests passed.
- S23 `smoke-samsung.ps1 -EventDetailTrade` passed on port `8332`.

## Limitations

- This cycle is a proof-gate repair, not a new visual feature.
- The wrapper reported backend health unavailable and used app mock fallback, which is acceptable for this UI smoke path.
- Native Google OAuth callback/session/logout remains separate auth work.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
