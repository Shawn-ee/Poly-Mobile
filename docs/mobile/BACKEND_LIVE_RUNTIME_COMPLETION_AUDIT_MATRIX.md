# Backend Live Runtime Completion Audit Matrix

This matrix records the current authoritative evidence for the Backend Live Runtime Survey + One Event Live Pipeline phase. It is intentionally scoped to local internal fake-token testing, not production real-money operation.

Last refreshed from `main` evidence after `npm run mobile:internal-tester-readiness-gate` at `2026-07-14T09:11:53.405Z`, with survey reconciliation in `docs/mobile/audits/cycle-ZAV-live-runtime-survey-reconciliation.md`.

## Phase Verdict

| Scope | Verdict | Evidence |
| --- | --- | --- |
| Local one-event internal runtime | Pass | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json` |
| Local internal tester handoff | Pass | `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json` |
| Production unattended service | Not complete, P1 | No installed provider/maker/lifecycle service is claimed. |
| Production official-result auto-settlement | Not complete, P1 | Active-event execution remains guarded by `CLOSED` status and exact confirmation. |
| Multi-event provider polling/dashboard | Future, P2 | Current milestone intentionally proves one event. |

## Requirement Matrix

| Requirement | Current Answer | Proof Status | Authoritative Evidence |
| --- | --- | --- | --- |
| Survey existing backend/bot/runtime services | Provider import, cached restore, live provider refresh, market-maker seed, supervisor, result poller, lifecycle scheduler, stale guard, settlement preview/execution, operator status, and mobile routes are documented. | P0 pass | `docs/mobile/BACKEND_LIVE_RUNTIME_SURVEY.md`; `docs/mobile/FUNCTION_IMPLEMENTATION_LOG.md`; `docs/mobile/MOBILE_BACKEND_ROUTE_DEPENDENCY_MAP.md` |
| Prove whether market maker runs continuously | Market making is continuous while the local supervisor is running. It is not an installed OS daemon. Durable maker quote runs, provider-to-maker handoff, and current two-sided selected-market liquidity are recorded. | P0 pass for local runtime; P1 remains for installed service ownership | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/provider-maker-handoff-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`; `docs/mobile/audits/cycle-ZAS-two-sided-maker-liquidity-refresh.md` |
| Prove whether live provider odds refresh works | Live Odds API refresh works through explicit key-gated commands. Cached/replay mode is the no-quota default for normal internal readiness checks. | P0 pass | `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`; `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md` |
| Know how often odds update | One-event live proof used two bounded refresh iterations. Supervisor provider refresh is opt-in and paced by `ProviderProofEveryIterations` and `MaxProviderProofRuns`. | P0 pass | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`; `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md` |
| Protect provider quota | Status/readiness gates do not call the provider. Live provider commands are explicit, one-event scoped, max-credit capped, and minimum-remaining guarded. | P0 pass | `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`; `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md` |
| Handle stale odds | Mobile routes classify `ready`, `refresh_due`, `stale`, and `unavailable`. Stale guard can pause stale markets and order placement rejects stale/paused markets with `MARKET_UNAVAILABLE`. | P0 pass | `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |
| Build/document one-command live event onboarding | Cached one-command onboarding restores/verifies the one-event runtime without quota. Live-provider onboarding is explicit and key-gated. Runtime-loop proof mode can start, observe, and stop supervisor/result-poller loops. | P0 pass | `docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md`; `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json` |
| Support one real upcoming soccer event locally | Spain vs. France is the selected one-event runtime target with backend-owned market/outcome identity. | P0 pass | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |
| Prove mobile can trade that event end-to-end | S23 proof covers Home -> Event Detail -> line market -> ticket -> buy -> Portfolio -> close-position cashout/sell -> History. Cashout Max uses owned shares and does not show Yes/No selector. | P0 pass | `docs/mobile/harness/cycle-ZAN-spain-france-cashout-proof/cycle-ZAN-odds-api-s23-visible-flow.json`; `docs/mobile/audits/cycle-ZAN-spain-france-cashout-proof.md` |
| Document lifecycle open/suspended/closed/settled | Open/paused/closed lifecycle controls are proven. Settlement mechanics and trusted-result execution are proven on safe disposable/clone markets. Active tester settlement waits for market close plus exact confirmation. | P0 pass for local lifecycle controls; P1 remains for production official-result automation | `docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md`; `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json` |
| Give internal testers a current handoff | Readiness gate runs the ordered live-runtime audit first, then emits an operator snapshot/checklist from backend status. It reports cached trading ready, live-display odds stale under the mobile 90-second window, warm no-quota loops running, two-sided selected-market liquidity, and zero P0 gaps. | P0 pass | `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`; `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |
| Reconcile stale survey wording | Earlier survey text still described source-aware refresh and continuous maker loops as missing P0s. Current survey now records them as complete for local one-event runtime, with P1 remaining only for installed production service ownership. | P0 pass | `docs/mobile/BACKEND_LIVE_RUNTIME_SURVEY.md`; `docs/mobile/audits/cycle-ZAV-live-runtime-survey-reconciliation.md` |

## Current Operator Truth

- Current selected event: Spain vs. France.
- Current selected proof market: Spain vs. France: Total Goals 2.5.
- Current selected outcome: Over 2.5.
- Current selected outcome id: `5a3f04ff-6efd-42c5-a225-8fae8070b509`.
- Cached internal trading readiness: ready.
- Warm no-quota runtime loops: supervisor and result poller observed running.
- Provider quota spending loop: none.
- Selected outcome quote: bid `0.58`, ask `0.60`.
- Mobile-route live-display odds freshness: stale under the 90-second display window.
- Live-display odds refresh action: run the explicit provider-secret command only when fresh display odds are required.
- Active settlement action: wait for/apply market close before exact-confirmed settlement execution.

## Commands

| Purpose | Command | Quota |
| --- | --- | --- |
| Current go/no-go handoff | `npm run mobile:internal-tester-readiness-gate` | No provider quota |
| Cached one-event onboarding | `npm run mobile:one-event-onboarding` | No provider quota |
| Warm local tester runtime | `npm run mobile:internal-tester-runtime:cached-start` | No provider quota |
| Fresh live-display odds pulse | `npm run mobile:one-event-live-runtime:provider-secret` | Uses provider quota, key-gated |
| Stop manager-owned runtime | `npm run mobile:internal-tester-runtime:stop` | No provider quota |

## Remaining Gaps

| Gap | Priority | Boundary |
| --- | --- | --- |
| Installed unattended provider/maker/lifecycle service ownership | P1 | Local foreground/background loops are proven; production service installation is not claimed. |
| Production official-result auto-settlement | P1 | Review, approval, queue, disposable execution, and closed-state eligibility are proven; active-event execution remains guarded. |
| Multi-event provider polling and dashboard/operator UI | P2 | One-event runtime is intentionally the current local MVP proof. |
