# Cycle ZO - Live Provider Warm Runtime Refresh

## Scope

Refresh the current one-event live runtime evidence for the internal tester path:

Spain vs. France -> backend-owned Odds API event -> live provider odds refresh -> local shifted maker quote -> mobile tradeable market.

This cycle did not add mobile UI, schemas, order-book UI, chat, social features, or multi-event scans. It used the existing runtime manager, one-event provider wrapper, and audit scripts.

## Runtime State

- Backend: `http://127.0.0.1:3002`, healthy.
- Postgres: `poly_postgres`, healthy.
- Expo: existing listener on `8081`, reused.
- S23: connected as `SM_S911U1`.
- Supervisor: running as local no-quota background loop.
- Result poller: running as local no-quota background loop.
- Quota-spending loop: not running.
- Installed OS service: not installed.

## Provider Refresh

- Command path: `npm run mobile:one-event-live-runtime:provider-secret`.
- Secret source: ignored `.runtime/secrets/the-odds-api-key.txt`.
- Secret printed: no.
- Provider source: The Odds API.
- Event: `Spain vs. France`.
- Provider event id: `f9aa13a662d1658e5a02cfc06d6a2d73`.
- Refresh iterations: `2`.
- Max credits: `16`.
- Credits used by this proof: `13`.
- Requests remaining after proof: `353`.
- Provider status after refresh: fresh/live proof passed.

## Market Maker

- Selected market: `Total Goals 2.5`.
- Reference source: `sportsbook-odds`.
- Local maker mode: shifted local quote, fake-token only.
- Quote after supervisor reseed: bid `0.46`, ask `0.54`.
- Continuous truth: maker reseeds while the local supervisor runs; this is not an installed unattended daemon.

## Evidence

- Provider secret preflight: `docs/mobile/harness/odds-api-live-runtime/live-provider-key-preflight.redacted.json`
- Live provider proof: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Runtime manager status: `docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
- Phase audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- Maker seed: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`

## Result

Pass for the local internal tester runtime.

The current runtime can answer:

- market maker continuity: local/foreground continuous while supervisor runs
- live odds refresh: explicit, key-gated, one-event, quota-capped
- quota policy: max credits and min remaining enforced by proof wrapper
- stale handling: stale before refresh, fresh after refresh
- lifecycle: open/suspend/close/settlement controls are documented and locally proven
- mobile trading: S23 end-to-end proof exists for the same event family

## Remaining Gaps

- P0: none for local internal tester trading on the current one-event runtime.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open; active-event execution is still guarded by CLOSED market status and exact confirmation.
- P2: multi-event provider polling remains future work to protect quota.
