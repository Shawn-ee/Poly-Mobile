# Cycle ZU - Current Warm Runtime Proof

## Scope

Refresh the backend live-runtime proof for the current one-event Spain vs. France internal tester pipeline without starting new UI work or spending provider quota.

This cycle focused on the runtime truth required by the active goal:

- whether local market-maker/runtime loops can run continuously while started
- whether the current run spends provider quota
- whether the loops clean up after proof
- whether the phase/completion audit still answers the live-runtime questions with current evidence

## Code Change

- `scripts/prove_holiwyn_current_runtime_state.js`
  - Removed the misleading generic `stopSummary` field.
  - The proof now states that cleanup is proven by `supervisorStopSummary` and `resultPollerStopSummary`.

No mobile UI, order logic, schema, settlement logic, provider API, or market normalization behavior changed.

## Runtime Proof

- Command: `npm run mobile:current-runtime-state-proof`
- Result: pass.
- Event: `Spain vs. France`
- Backend event slug: `odds-api-single-soccer-test`
- Selected market: `Total Goals 2.5`
- Provider source: The Odds API cached/live-proofed sportsbook bridge.
- Provider quota spent by this proof: no.

Key proof facts:

- Supervisor loop was started as a local background process.
- Result poller loop was started as a local background process.
- `GET /api/internal/live-runtime/status` reported `warm_no_quota_runtime` while both loops were running.
- `quotaSpendingLoopRunning=false`.
- Both proof-owned loops were stopped after proof.
- Cleanup is proven by:
  - `supervisorStopSummary.running=false`
  - `resultPollerStopSummary.running=false`

Summary:

- `docs/mobile/harness/odds-api-live-runtime/current-runtime-state-proof-summary.redacted.json`

## Audit Proof

Commands:

- `npm run mobile:one-event-runtime-status`
- `npm run mobile:live-runtime-completion-audit`
- `npm run mobile:one-event-phase-audit`

Results:

- Runtime status: pass.
- Completion audit: pass.
- Phase audit: pass.
- Open P0 gaps: none.
- Remaining P1:
  - installed unattended service is still not present
  - official-result auto-settlement is still guarded/future work
  - mobile-visible provider snapshots can be stale in no-quota mode until explicit live refresh

Fresh S23 trading proof used by completion gate:

- `docs/mobile/harness/cycle-ZQ-spain-france-cashout-s23/cycle-ZQ-odds-api-s23-visible-flow.json`

## Route And Data Dependencies

- `GET /api/health`
- `GET /api/internal/live-runtime/status`
- `GET /api/markets/:marketId/quote`
- Local process-state files under `.runtime/one-event-live-supervisor/` and `.runtime/one-event-result-poller/`
- Runtime proof summaries under `docs/mobile/harness/odds-api-live-runtime/`

## Interpretation

The local one-event runtime is proven usable for internal testing when started through the local commands. Market-maker reseeding and result polling are continuous only while the local supervisor/result-poller processes are running. This is not an installed production daemon.

Live provider odds refresh remains explicit and quota-capped. Cached no-quota mode is allowed for internal tester trading, but fresh mobile-visible odds require the explicit live provider refresh path.
