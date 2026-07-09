# Cycle RG - Samsung Backend Port Health

Date: 2026-07-09

## Scope

Fix Samsung smoke startup so it checks and reports the active Holiwyn backend on port `3002` instead of stale port `3000`.

This cycle supports the Local MVP proof loop. It prevents false "backend unavailable" messages during S23 UI proof when the backend is healthy.

Out of scope: app UI, order routes, backend schema, order book UI, chat, live stats, social features, and Google OAuth callback/session work.

## Implementation

- Changed `mobile/scripts/smoke.ps1` default `BackendBaseUrl` from `http://127.0.0.1:3000` to `http://127.0.0.1:3002`.
- Added `-BackendPort` to `mobile/scripts/smoke-samsung.ps1`, defaulting to `3002`.
- Samsung wrapper now prints and uses `http://<ExpoHost>:3002` for server-mode mobile runtime API base instead of hardcoded `3000`.
- Added a contract test to prevent the stale port from returning.

## Audit Gate

Result: Pass for RG scope.

S23 device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model `SM-S911U1`

Command:

`powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-samsung.ps1 -EventDetailTrade -Port 8333 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -ExpoHost 172.16.200.14`

Observed startup:

- `Backend base: http://172.16.200.14:3002`
- `Backend health: ok`

Evidence:

- `docs/mobile/screenshots/cycle-RG-samsung-backend-port-health/cycle-RG-event-detail-ticket.png`
- `docs/mobile/screenshots/cycle-RG-samsung-backend-port-health/cycle-RG-event-detail-ticket-amount.png`
- `docs/mobile/screenshots/cycle-RG-samsung-backend-port-health/cycle-RG-event-detail-away-ticket.png`
- `docs/mobile/harness/cycle-RG-samsung-backend-port-health/cycle-RG-event-detail-ticket.xml`
- `docs/mobile/harness/cycle-RG-samsung-backend-port-health/cycle-RG-event-detail-ticket-amount.xml`
- `docs/mobile/harness/cycle-RG-samsung-backend-port-health/cycle-RG-event-detail-away-ticket.xml`
- `docs/mobile/harness/cycle-RG-samsung-backend-port-health/cycle-RG-samsung-backend-port-health-proof.json`

## Validation

- Mobile typecheck passed.
- Samsung backend port contract test passed.
- Event Detail Trade smoke current-ticket contract test passed.
- S23 Event Detail Trade proof passed with backend health OK.

## Limitations

- This cycle fixes proof startup/backend reachability reporting. It does not convert the Event Detail Trade UI proof itself into a server order-placement proof.
- Native Google OAuth callback/session/logout remains separate auth work.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
