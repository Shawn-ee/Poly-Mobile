# Cycle ZBV - Cached Runtime Warm Restart

Scope: restart the local internal tester runtime after watchdog cleanup and replace the stale/unverified Expo listener with a manager-owned server-mode Expo listener.

## Commands Run

- `npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -WaitForReady -RuntimeOnlyArtifacts`
- `npm run mobile:live-runtime-audit-gate`
- `npm run mobile:internal-tester-readiness-gate`

## Result

| Check | Result | Evidence |
| --- | --- | --- |
| Backend health | Pass | `GET /api/health` returned `ok` with DB connected |
| Postgres health | Pass | Runtime manager reported `poly_postgres` healthy |
| Expo server mode | Pass | Runtime manager stopped the old external Expo listener and started manager-owned Expo in server mode |
| Supervisor loop | Pass | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` reports supervisor running |
| Result-poller loop | Pass | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` reports result-poller running |
| Ordered runtime audit gate | Pass | `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json` |
| Internal tester readiness gate | Pass | `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json` |

## Current Runtime Truth

- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected proof market: `Spain vs. France: Total Goals 2.5`
- Selected proof outcome: `Over 2.5`
- Cached internal trading readiness: ready
- Warm no-quota runtime loops: running
- Provider quota spending loop: not running
- Provider quota used by this cycle: no
- Live mobile-display odds: stale under the 90-second display window, but fresh enough for the 24-hour local proof window
- Live odds refresh action: run the explicit provider-secret command only when fresh display odds are required
- S23 ADB control: disconnected during this restart, so this cycle does not claim new phone-side UI proof
- S23 manual launch URL: `exp://172.16.200.14:8081`

## Gap Status

- P0: none for cached local internal tester trading.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open; active-event execution remains guarded by `CLOSED` market status and exact confirmation.
- P2: multi-event provider polling and production dashboard/operator UI remain future work.

## Notes

This cycle intentionally avoided provider refresh and did not read or print provider secrets. It refreshed no-quota runtime evidence after replacing stale Expo so manual testers open the current server-backed bundle instead of an old cached mobile process.
