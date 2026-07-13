# Cycle ZI - One-Event Onboarding Restart Proof

Generated: 2026-07-13

## Scope

Refresh the one-command internal tester onboarding proof for the current backend-owned Spain vs. France Odds API event. This cycle did not add mobile UI, order book UI, chat, social, or new provider breadth work.

## Fixes

- `scripts/report_odds_api_one_event_settlement_readiness.ts` now loads local `DATABASE_URL` before Prisma access.
- `scripts/settle_odds_api_one_event_market.ts` now loads local `DATABASE_URL` before Prisma access.
- Both settlement scripts now default to the selected market from `one-event-live-runtime-summary.redacted.json` so proof uses the active Spain vs. France market instead of a stale replay market.
- `scripts/onboard_holiwyn_one_event_live_runtime.ps1` now runs child commands with a timeout and captures Windows exit codes through an explicit exit-code file.
- `scripts/manage_holiwyn_internal_tester_runtime.ps1` now writes a compact scalar manager summary so status/start/stop proofs do not stall while serializing large nested runtime objects.
- Runtime start now accepts direct process proof when the supervisor and result poller are both running, while recording the backend live-runtime status route mismatch as P1 if the route is not warm at the exact start check.

## Proof

- `npm run mobile:one-event-onboarding -- -StartRuntimeLoops -StopRuntimeLoopsAfterProof`
- Result: pass.
- S23: connected as `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.
- Backend: `http://127.0.0.1:3002`, health ok, DB connected.
- Postgres: `poly_postgres` healthy.
- Runtime loops: supervisor and result poller started, proved running during proof, then stopped.
- Provider quota: no live provider quota spent; stale replay was skipped and cached live-runtime event was restored.
- Active event: Spain vs. France, `soccer_fifa_world_cup`, commence time `2026-07-14T19:00:00Z`.
- Selected proof market: `Spain vs. France: Total Goals 2.5`, market id `78ea76f1-fc8f-419b-ac21-2554d79093f6`.

## Evidence

- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-start-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-stop-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`

## Gaps

P0: none.

P1:
- Backend live-runtime status route can report not warm during the immediate start window even while direct process proof shows both loops running.
- Provider-shaped result ingestion and dry-run settlement are available, but unattended official-result polling and execution remain future work.
- Installed always-on provider refresh and market-maker daemons remain future work.

P2:
- Multi-event onboarding remains future work.
