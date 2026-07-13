# Backend Live Runtime Phase Closeout

Generated from current `main` evidence for the Backend Live Runtime Survey + One Event Live Pipeline phase.

## Status

This phase is complete for local internal testing.

- Phase audit: passed.
- Completion audit: passed.
- Open P0 gaps: none.
- Provider quota used by the latest audits: none.
- Real upcoming test event: Spain vs. France.
- Mobile proof device: Samsung S23.
- Runtime type: local fake-token internal runtime, not production real-money infrastructure.

## Requirement Evidence

| Requirement | Current answer | Evidence |
| --- | --- | --- |
| Survey backend/bot/runtime services | Existing provider import, local supervisor, result poller, maker seed, lifecycle, settlement, and mobile routes are documented. | `docs/mobile/BACKEND_LIVE_RUNTIME_SURVEY.md` |
| Prove whether market maker is continuous | Continuous only while the local supervisor is running. No installed OS service is claimed. | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/provider-maker-handoff-summary.redacted.json` |
| Prove whether live provider odds refresh works | Live refresh is proven as an explicit, key-gated, quota-capped path. Cached/replay mode is the default for normal readiness checks. | `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`; `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md` |
| Document odds update cadence | Live proof used one bounded refresh. Supervisor live refresh is opt-in and paced by `ProviderProofEveryIterations` and `MaxProviderProofRuns`. | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json` |
| Prove quota protection | Latest audits spend no provider quota. Live provider paths require explicit key/flags and enforce max credits/min remaining. | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`; `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md` |
| Prove stale odds handling | Routes classify `ready`, `refresh_due`, `stale`, and `unavailable`; stale guard can pause markets and order placement rejects stale/paused markets. | `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |
| Build/document one-command onboarding | Quota-free cached onboarding and explicit live-provider onboarding are documented. Runtime-loop proof mode starts and stops local loops. | `docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md`; `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md` |
| Support one real upcoming soccer event locally | Spain vs. France is imported/restored as the reusable one-event runtime target. | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json` |
| Prove mobile can trade the event end-to-end | S23 proof covers Home -> Event Detail -> line market -> ticket -> buy -> Portfolio -> cashout/sell -> History. | `docs/mobile/harness/cycle-ZK-spain-france-cashout-fresh/cycle-ZK-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json` |
| Document lifecycle open/suspended/closed/settled | Open, paused, closed, and settlement readiness are documented and proven locally. Active event settlement remains guarded. | `docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md`; `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json` |

## Current Runtime Truth

- Backend health is proven locally on port `3002`.
- Expo can be started in server-backed S23 mode on port `8081`.
- Supervisor/result-poller loops are local foreground/background processes, not installed services.
- Local maker quote proof and provider-to-maker handoff are durable.
- Official result review and settlement queue APIs are read-only, dev-only, and quota-free.
- Active event settlement execution is blocked until market close plus exact confirmation.

## Remaining Gaps

| Gap | Priority | Why it remains |
| --- | --- | --- |
| Installed unattended provider/maker/lifecycle service ownership | P1 | Local supervisor/result-poller behavior is proven, but no production OS service is installed or claimed. |
| Production official-result auto-settlement | P1 | Result ingestion, approval, queue, and disposable/closed-state settlement proofs exist, but active-event execution remains guarded by CLOSED market status and exact confirmation. |
| Multi-event provider polling and operator dashboard/UI | P2 | Current milestone intentionally proves one event. |

## Next Recommended Direction

Do not continue repeating backend live-runtime proof unless one of these becomes stale or fails:

- S23 mobile trade proof exceeds the freshness window.
- Provider proof exceeds the freshness window.
- Runtime status reports a P0 gap.
- Backend/mobile CI fails.

The next product cycle should return to visible internal tester quality or a specifically approved P1 runtime hardening item.
