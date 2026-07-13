# Event Lifecycle Runbook

## Local MVP Lifecycle

| State | Meaning | Current support |
| --- | --- | --- |
| Open / LIVE | Users can quote, buy, sell, and see Portfolio/history. | Supported by `Market.status=LIVE` and existing order routes. |
| Refresh due | Provider quote snapshot is still usable but should refresh. | Surfaced by event detail provider lifecycle fields. |
| Stale | Provider quote snapshot is older than route stale threshold. | Surfaced by event detail provider lifecycle fields. The local stale guard can pause a `LIVE` market with `settlementStatus=paused_provider_stale`, causing orders to reject with `MARKET_UNAVAILABLE`. |
| Suspended / PAUSED | Trading disabled near event start or manually. | `runOneEventLifecycleScheduler` can set `Market.status=PAUSED` inside the pre-start suspend window; admin pause route also exists. |
| Closed | Trading disabled at/after event start or manually. | `runOneEventLifecycleScheduler` can set `Market.status=CLOSED` and cancels open orders; admin close route also exists. |
| Settled / resolved | Winning outcome selected and collateral settled. | Admin/manual orderbook resolve route exists. Automatic soccer settlement is not implemented. |

## Operator Steps For One Local Live Event

1. Start Postgres and backend.
2. For a quota-free one-command onboarding pass, run `npm run mobile:one-event-onboarding`. It blocks stale replay by default and restores the cached live-runtime event if the redacted replay fixture is older than the selected upcoming event.
3. For the same onboarding pass with a live provider refresh, set `THE_ODDS_API_KEY` in the local process environment and run `npm run mobile:one-event-onboarding -- -RunProviderRefresh`.
4. For only a quota-free consolidated readiness pass, run `npm run mobile:one-event-live-readiness`.
5. For only a quota-free restart check, run `npm run mobile:one-event-live-runtime`.
6. To leave local fake-token liquidity available for testers, run `npm run mobile:one-event-live-runtime -- -SeedMaker`.
7. To keep the one-event local runtime warm for repeated internal checks, run `npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 1`. This foreground loop runs data hygiene, runtime/maker refresh, and the safe real-time lifecycle scheduler each cycle.
8. To run the same supervisor as a local hidden background process, run `npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0`.
9. To check that local background supervisor process, run `npm run mobile:one-event-live-supervisor:status`.
10. To stop that local background supervisor process, run `npm run mobile:one-event-live-supervisor:stop`.
11. For a live provider refresh proof only, set `THE_ODDS_API_KEY` in the local process environment and run `npm run mobile:one-event-live-runtime:provider`.
12. For a repeated live-provider supervisor, run `npm run mobile:one-event-live-supervisor -- -RunProviderProof -Continuous -MaxIterations 0` only during intentional manual testing; provider refresh is capped by cadence and max proof runs.
13. Confirm the proof reports provider refresh `ready`.
14. Confirm local shifted maker quotes exist.
15. Open mobile and trade the selected event with fake tokens.
16. To prove local lifecycle controls only, run `npm run mobile:one-event-lifecycle-proof`.
17. To run the safe real-time lifecycle scheduler once, run `npm run mobile:one-event-lifecycle-scheduler-run`.
18. To prove local start-time lifecycle automation with temporary event-time mutations and restore, run `npm run mobile:one-event-lifecycle-scheduler-proof`.
18a. To inspect open, paused, closed, and settled/resolved lifecycle evidence in one read-only report, run `npm run mobile:one-event-lifecycle-matrix`.
18b. To inspect the same lifecycle truth through the local backend, call `GET /api/internal/live-runtime/lifecycle`. This route is dev-only, read-only, spends no provider quota, does not mutate markets, and reports that active tester settlement has not executed.
19. To prove non-mutating settlement readiness, run `npm run mobile:one-event-settlement-readiness`.
20. To prove settlement execution safely without mutating the active tester event, run `npm run mobile:one-event-settlement-execution-proof`.
21. To prove trusted-result scheduler execution safely without mutating the active tester event, run `npm run mobile:one-event-result-settlement-execution-proof`. It creates a disposable sportsbook-shaped event, dry-runs trusted-result settlement to get the exact confirmation phrase, executes through the scheduler with that phrase, and verifies the active tester event was not mutated.
22. To dry-run the manual settlement command after a trusted result is known, run `npm run mobile:one-event-settlement -- --winningOutcome=over` or pass the winning outcome id.
23. To execute settlement, pass `--execute` plus the exact `--confirm=SETTLE:<marketId>:<outcomeId>` phrase printed by the dry run. Do not execute without trusted result review.
24. To convert provider-shaped score evidence into trusted result JSON without provider quota, run `npm run mobile:one-event-result-ingest`.
25. To prove that result ingestion writes durable canonical backend audit evidence, run `npm run mobile:one-event-result-ingestion-audit-event-proof`.
26. To run the same ingestion against live Odds API scores, run `npm run mobile:one-event-result-ingest -- --live` with `THE_ODDS_API_KEY` in the local environment. This should be explicit/manual because it spends provider quota.
27. To run a repeated local result poller without provider quota, run `npm run mobile:one-event-result-poller-proof`. It regenerates trusted result JSON and dry-runs trusted-result settlement scheduling on each cycle.
27. To run that poller as a local hidden background process, run `npm run mobile:one-event-result-poller:process -- -Action start -Continuous -MaxIterations 0`.
28. To check or stop the local background result poller, run `npm run mobile:one-event-result-poller:status` or `npm run mobile:one-event-result-poller:stop`.
29. To prove background result-poller start/status/stop without provider quota, run `npm run mobile:one-event-result-poller:continuous-proof`.
30. To use that poller against live Odds API scores, run `npm run mobile:one-event-result-poller -- -RunLiveResultIngestion -MaxLiveResultIngestionRuns 1 -ResultIngestionEveryIterations 1 -MaxCreditsPerResultIngestion 2` with `THE_ODDS_API_KEY` in the local environment. This is explicit and quota-capped.
31. To dry-run settlement from trusted result JSON, run `npm run mobile:one-event-result-settlement`.
32. To execute trusted-result settlement, first close the market, then pass `--execute` plus the exact `--confirm=SETTLE_FROM_RESULT:<marketId>:<outcomeId>:<digest>` phrase printed by the dry run. The command blocks execution while the selected market is still `LIVE`. Do not execute without trusted result review.
33. To run the local trusted-result scheduler path, run `npm run mobile:one-event-result-settlement-run`. It reads the trusted result JSON and invokes the guarded trusted-result settlement command in dry-run mode by default.
34. To check whether the active one-event market is currently eligible for trusted-result execution, run `npm run mobile:one-event-settlement-preflight`. It spends no provider quota, dry-runs settlement, and reports blockers such as `market_not_closed_for_execution:LIVE`.
35. To check the current runtime and trusted-result settlement guard without provider quota, run `npm run mobile:one-event-runtime-status`. It reports backend health, maker quote status, lifecycle scheduler state, and whether trusted-result execution is blocked while a market is still `LIVE`.
36. To prove that a reviewed trusted-result settlement dry-run can write durable backend audit evidence, run `npm run mobile:one-event-settlement-audit-event-proof`. It spends no provider quota, does not settle the active market, and writes a `settlement.trusted_result.preflight` canonical market event.
36a. To inspect the active event's provider-result, settlement-preflight, and settlement-approval evidence in one read-only operator report, run `npm run mobile:one-event-result-review-trail`. It spends no provider quota, does not execute settlement, checks that the approval digest matches the preflight digest, and reports whether the operator should wait for `CLOSED` market status before execution.
36aa. To inspect the same canonical result/settlement review trail through the local backend, call `GET /api/internal/live-runtime/result-review`. This route is dev-only, read-only, spends no provider quota, and redacts exact settlement confirmation strings.
36b. To prove the reviewed approval decision itself can be recorded as backend-readable audit evidence, run `npm run mobile:one-event-settlement-approval-audit-event-proof`. It spends no provider quota, writes a `settlement.trusted_result.approved` canonical market event, exports the matching local approval file, and does not settle the active market.
36c. To report the exact active-event settlement execution decision, run `npm run mobile:one-event-active-settlement-readiness`. It spends no provider quota, reads the active market plus preflight/review/approval/supervisor evidence, and reports whether execution is eligible now or blocked by market status.
37. To prove approval-file driven trusted-result auto-execution safely, run `npm run mobile:one-event-approved-auto-settlement-proof`. It uses a disposable market, waits while the market is `LIVE`, executes only after `CLOSED` when the approval file exactly matches the result digest/market/outcome/confirmation phrase, and writes a canonical executed audit event.
38. To prove approved trusted-result execution against the active event's current selected market semantics without touching the active tester market, run `npm run mobile:one-event-active-settlement-clone-proof`. It clones the active selected market into a disposable event, closes the clone, executes approved settlement, and confirms the active market remains `LIVE` and unresolved.
38a. To prove the active selected market would become eligible after close without leaving it closed or resolved, run `npm run mobile:one-event-active-settlement-closed-eligibility-proof`. It temporarily closes the active market, dry-runs trusted-result execution eligibility, writes redacted proof summaries, restores the original market state, and does not execute settlement.
39. To prove the local supervisor can carry an approval file into settlement scheduling while still waiting for the active `LIVE` market to close, run `npm run mobile:one-event-supervisor-approved-settlement-proof`. It spends no provider quota, writes a local approval file from the active-event dry run, runs one supervisor cycle, and verifies the action is `approved_waiting_for_closed_market`.
40. To include trusted-result ingestion and settlement checks in the local supervisor, run `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunResultSettlement`.
41. To opt into live score/result ingestion while the supervisor runs, add `-RunLiveResultIngestion -MaxLiveResultIngestionRuns 1 -ResultIngestionEveryIterations 1 -MaxCreditsPerResultIngestion 2`. This requires `THE_ODDS_API_KEY`, spends provider quota, and still keeps settlement dry-run unless explicit execution controls are provided.
41. To prove stale provider handling, run `npm run mobile:one-event-stale-guard-proof`. It forces stored snapshots stale, pauses the selected market, proves order rejection, and restores state after proof.
42. To monitor stale provider handling inside the supervisor without mutating local tester state, run `npm run mobile:one-event-live-supervisor -- -RunStaleGuard -MaxIterations 1 -IntervalSeconds 0 -SkipSleep`.
43. To enforce stale provider handling inside the supervisor, add `-EnforceStaleGuard`. Use enforcement only when you intend stale markets to pause.
44. To audit the whole one-event live-runtime phase, run `npm run mobile:one-event-phase-audit`.
42. To check the whole local internal tester runtime without spending provider quota, run `npm run mobile:internal-tester-runtime -- -Action status`. This reports backend health, Postgres/Docker status, Expo port status, S23 reachability, one-event supervisor process status, and dedicated result-poller process status.
43. To start backend and Expo through the local internal tester runtime manager when their ports are free, run `npm run mobile:internal-tester-runtime -- -Action start`. Add `-StartSupervisor` only when you intentionally want the one-event supervisor running in the background, and add `-StartResultPoller` when you intentionally want the dedicated result poller running in the background.
44. To stop only processes that the local internal tester runtime manager owns, run `npm run mobile:internal-tester-runtime -- -Action stop`. Existing external backend or Expo listeners are reused and are not stopped by this manager; supervisor and result-poller process managers are stopped.
45. To intentionally replace a stale external Expo/Metro listener with a verified manager-owned server-mode Expo process for S23 testing, run `npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -WaitForReady`. This replacement path is explicit, limited to the Expo port, and refuses to stop a listener that does not look like Expo/Metro.
45a. To prepare a local-only S23 manual testing credential and server-mode Expo environment file, run `npm run mobile:manual-testing-env`. The helper tolerates optional local config warnings, fails on real credential command errors, writes secrets only under `.runtime`, and redacts the token in its printed summary.
45. To prove the internal tester runtime manager can start/status/stop the dedicated result poller without provider quota, run `npm run mobile:internal-tester-result-poller-control`.
46. To preview a Windows scheduled-task setup for the local tester runtime without changing the OS, run `npm run mobile:local-runtime-task -- -Action plan -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement`. This spends no provider quota, carries the active approval-file wait profile, and does not install anything by default.
46. To intentionally install that scheduled task, rerun the same command with `-Action install -Apply`. Only use `-RunProviderProof` or `-RunLiveResultIngestion` when `THE_ODDS_API_KEY` is present in the process environment and you intend to spend quota.
47. To remove the scheduled task, run `npm run mobile:local-runtime-task -- -Action uninstall -Apply`.
48. To audit whether this Windows process can install and remove the local scheduled task while leaving no task behind, run `npm run mobile:local-runtime-task:install-proof`. Current proof shows Windows denies registration in this process context, so use an elevated shell or grant task-registration rights before applying the task.
49. To preview a user-level Windows Startup launcher fallback without changing the OS, run `npm run mobile:local-runtime-startup -- -Action plan -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement`. This spends no provider quota and does not install anything by default.
50. To preview the same user-logon launcher with approved trusted-result settlement wait mode, add `-RunApprovedResultSettlement`. The launcher still spends no provider quota unless provider/live-result flags are also requested, and settlement execution still waits for `CLOSED` market plus exact approval match.
51. To intentionally install that user-logon launcher, rerun the same command with `-Action install -Apply`. It writes a `.cmd` file to the current user's Startup folder and starts the internal tester runtime when that Windows user logs in.
52. To remove the user Startup launcher, run `npm run mobile:local-runtime-startup -- -Action uninstall -Apply`.
53. To audit that the user Startup launcher can install and uninstall while leaving no launcher behind, run `npm run mobile:local-runtime-startup:install-proof`. The proof uses `HoliwynInternalTesterRuntimeProof.cmd`, includes the approved-settlement supervisor profile plus the dedicated result poller, and spends no provider quota.
54. To see the recommended local internal tester launch profile, run `npm run mobile:local-runtime-launch-profile`. It is read-only, spends no provider quota, recommends the user Startup fallback in the current Windows context, records the scheduled-task permission blocker, and lists the manual foreground plus live-provider opt-in commands.
55. Do not settle the active tester event automatically unless official result input and admin review are added.

## Completion Boundary

This runbook supports internal fake-token testing. It does not approve real-money deployment, automatic settlement, public liquidity, or unattended production bots.

## Latest Lifecycle Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Restart/runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Lifecycle scheduler summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json`
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`
- Lifecycle matrix summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json`
- Settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`
- Settlement execution proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json`
- Trusted-result scheduler execution proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json`
- Trusted-result scheduler live-market blocked execution proof: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-live-blocked.redacted.json`
- Manual settlement dry-run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`
- Provider-shaped result ingestion summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json`
- Provider-shaped result ingestion audit event summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-audit-event-summary.redacted.json`
- Result poller summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-summary.redacted.json`
- Result poller heartbeat: `docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-heartbeat.redacted.json`
- Result poller process summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-process-summary.redacted.json`
- Continuous result poller proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-continuous-result-poller-proof-summary.redacted.json`
- Provider-ingested trusted result output: `docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json`
- Provider-shaped score fixture: `docs/mobile/harness/odds-api-live-runtime/odds-api-score-fixture.redacted.json`
- Trusted result settlement summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json`
- Trusted result settlement scheduler summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json`
- Trusted result settlement preflight summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json`
- Trusted result settlement audit event proof: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-summary.redacted.json`
- Trusted result approval audit event proof: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-approval-audit-event-summary.redacted.json`
- Result review trail summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-review-trail-summary.redacted.json`
- Active event settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json`
- Approved auto-settlement proof: `docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-summary.redacted.json`
- Active event settlement clone proof: `docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-summary.redacted.json`
- Active event closed-state eligibility proof: `docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-summary.redacted.json`
- Active event closed-state eligibility dry run: `docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-dry-run.redacted.json`
- Supervisor approved-settlement wait proof: `docs/mobile/harness/odds-api-live-runtime/one-event-supervisor-approved-settlement-wait-summary.redacted.json`
- Trusted result fixture: `docs/mobile/harness/odds-api-live-runtime/trusted-result-fixture.redacted.json`
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- Phase audit summary: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- Internal tester runtime manager summary: `docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json`
- Internal tester result-poller control summary: `docs/mobile/harness/odds-api-live-runtime/internal-tester-result-poller-control-summary.redacted.json`
- Local runtime scheduled-task summary: `docs/mobile/harness/odds-api-live-runtime/local-runtime-task-summary.redacted.json`
- Local runtime scheduled-task install/uninstall proof: `docs/mobile/harness/odds-api-live-runtime/local-runtime-task-install-uninstall-summary.redacted.json`
- Local runtime user Startup launcher summary: `docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-summary.redacted.json`
- Local runtime user Startup launcher install/uninstall proof: `docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-install-uninstall-summary.redacted.json`
- Cached live restore summary: `docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json`
- Stale guard summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`
- Stale guard run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Supervisor process summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json`
- S23 visible proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`
- Open state: selected market was `LIVE`, visible on Home, visible on Event Detail, and accepted fake-token orders.
- Stale state: proof forced selected quote snapshots stale, Event Detail reported stale provider quote lifecycle, and the stale guard paused trading so order placement failed with `MARKET_UNAVAILABLE`.
- Refreshed state: live Odds API refresh restored selected quote lifecycle to ready.
- Closed state: temporarily setting the selected market to `CLOSED` caused order placement to fail with `MARKET_UNAVAILABLE`.
- Lifecycle controls proof: selected market accepted an order in `LIVE`, rejected orders in `PAUSED` and `CLOSED`, produced a non-mutating settlement preview, and restored the market to its original state.
- Lifecycle scheduler proof: selected event had no action outside the suspend window, paused markets inside the suspend window, closed markets after event start, rejected orders in paused/closed states, restored event/market status, and reseeded local maker quotes.
- Supervisor stale monitor: latest supervisor proof ran the stale guard in dry-run mode and reported 19 cached markets that would pause under the 90-second provider-stale threshold. It did not mutate markets because enforcement was not requested.
- Settlement readiness: `previewOrderbookSettlement` and `resolveOrderbookMarket` exist. The latest non-mutating readiness proof previews both selected outcomes with payout conservation passing and confirms the market is not resolved by the proof. Provider-shaped score ingestion now produces the trusted result contract; unattended live result polling and automatic execution remain P1.
- Settlement execution proof: `npm run mobile:one-event-settlement-execution-proof` creates a fresh disposable local market, runs real orderbook settlement, and verifies payout conservation, collateral zero after settlement, finalized positions, no negative balances, and no stuck locks. It does not mutate the active tester event.
- Trusted-result scheduler execution proof: `npm run mobile:one-event-result-settlement-execution-proof` creates a fresh disposable sportsbook-shaped event, writes trusted final-result JSON, dry-runs the trusted-result scheduler to obtain the exact confirmation phrase, proves execution is blocked while the disposable market is still `LIVE`, closes the disposable market, executes settlement through the scheduler with that phrase, verifies the disposable market resolves, and confirms the active Spain vs. France tester event was not mutated.
- Manual settlement command: `npm run mobile:one-event-settlement -- --winningOutcome=over` dry-runs the selected event settlement, prints the exact confirmation phrase required for execution, and confirms the market remains unresolved in dry-run mode.
- Trusted result settlement: `npm run mobile:one-event-result-settlement` reads trusted result JSON, maps final score France 1 - Spain 2 to `Over +2.5` for the selected Spain vs. France Total Goals 2.5 market, previews settlement without mutation, and prints an exact result-digest confirmation phrase for execution.
- Provider-shaped result ingestion: `npm run mobile:one-event-result-ingest` reads the redacted Odds API scores fixture and writes trusted result JSON for the selected one-event proof without spending quota. `npm run mobile:one-event-result-ingestion-audit-event-proof` proves the same ingestion path can write a canonical `provider.result.ingested` audit event containing the trusted-result digest, without settlement execution. Live provider score ingestion is available only with explicit `--live` and `THE_ODDS_API_KEY`.
- Result poller: `npm run mobile:one-event-result-poller-proof` runs two no-quota local polling cycles. Each cycle regenerates trusted result JSON from provider-shaped score evidence and runs trusted-result settlement scheduling in dry-run mode. `npm run mobile:one-event-result-poller:continuous-proof` additionally proves the poller can run as a hidden local background process, write heartbeat progress, and stop cleanly.
- Trusted result scheduler: `npm run mobile:one-event-result-settlement-run` runs the same trusted-result mapping through a scheduler-style local command in dry-run mode by default. Unattended live result polling remains P1.
- Settlement preflight: `npm run mobile:one-event-settlement-preflight` runs the trusted-result scheduler dry-run and reports whether execution is currently eligible. Latest proof reports final trusted result evidence and passing payout preview, but `market_not_closed_for_execution:LIVE` blocks execution until lifecycle close.
- Durable settlement audit event proof: `npm run mobile:one-event-settlement-audit-event-proof` runs trusted-result settlement dry-run with explicit audit logging, verifies a `settlement.trusted_result.preflight` canonical market event exists for the selected market/outcome/result digest, and confirms the proof does not settle or mutate the active market.
- Durable settlement approval audit event proof: `npm run mobile:one-event-settlement-approval-audit-event-proof` derives the active-event approval from trusted-result dry-run evidence, writes a canonical `settlement.trusted_result.approved` event, exports the matching local scheduler approval file, and confirms the active market stays `LIVE` and unresolved.
- Result review trail: `npm run mobile:one-event-result-review-trail` reads the canonical provider-result, settlement-preflight, and settlement-approval events for the active market/outcome. The report verifies the approval digest matches the preflight digest, confirms no active-event settlement execution occurred, and keeps the operator decision at `wait_for_closed_market_before_execution` while the market is `LIVE`.
- Active event settlement readiness: `npm run mobile:one-event-active-settlement-readiness` reads the active market and all trusted-result approval evidence, then reports the exact execution decision. Latest proof reports approval/preflight evidence exists, clone settlement is proven, supervisor approved-settlement wait is wired, and active execution is blocked only because the selected market is still `LIVE`.
- Approved auto-settlement proof: `npm run mobile:one-event-approved-auto-settlement-proof` writes a local approval file for a disposable trusted result, proves approved execution waits while the market is `LIVE`, closes the disposable market, auto-executes after the exact approval matches, and writes a canonical `settlement.trusted_result.executed` event.
- Active event settlement clone proof: `npm run mobile:one-event-active-settlement-clone-proof` copies the active Spain vs. France selected Total Goals 2.5 market shape into a disposable event, uses the provider-shaped trusted result, executes approved trusted-result settlement after closing the clone, and confirms the active tester market remains `LIVE`, unresolved, and unchanged.
- Active event closed-state eligibility proof: `npm run mobile:one-event-active-settlement-closed-eligibility-proof` temporarily sets the selected active market to `CLOSED`, proves the trusted-result dry run becomes eligible with exact confirmation evidence, confirms no execution occurs, restores the market to `LIVE` and unresolved, and spends no provider quota.
- Supervisor approved-settlement wait proof: `npm run mobile:one-event-supervisor-approved-settlement-proof` writes an exact local approval file from the active-event trusted-result dry run, runs one local supervisor cycle with approved settlement mode, verifies approval matching, and confirms the active tester market remains unexecuted while `LIVE`.
- Live result supervisor controls: `-RunLiveResultIngestion` is available for the local supervisor. It is explicit, quota-capped, cadence-controlled, and separate from odds refresh; replay/no-quota ingestion remains the default committed proof mode.
- One-command onboarding: `npm run mobile:one-event-onboarding` blocked the old replay fixture, restored the cached Spain vs. France live-runtime event without provider quota, ran the readiness gate, runtime status, settlement readiness, provider-shaped result ingestion, trusted-result settlement dry run, and manual settlement dry run, with S23 connected and no unresolved P0 gaps.
- Phase audit: `npm run mobile:one-event-phase-audit` passed. It verifies 0 unresolved P0 gaps for local one-event internal runtime and leaves unattended service install plus official-result auto-settlement as explicit P1 gaps.
- Internal tester runtime manager: `npm run mobile:internal-tester-runtime -- -Action status` passed. It confirmed local backend health, Docker/Postgres health, Expo port ownership, S23 reachability, supervisor status, and result-poller status without provider quota. `npm run mobile:internal-tester-result-poller-control` proves the same manager can start, report, and stop the dedicated result poller while heartbeat progress advances. It is a local process control plane, not an installed OS service.
- Local runtime scheduled-task plan: `npm run mobile:local-runtime-task -- -Action plan -StartSupervisor -RunResultIngestion -RunResultSettlement` passed. It produced an AtLogon Windows scheduled-task plan for the internal tester runtime, confirmed no task is installed by default, and spends no provider quota.
- Local runtime scheduled-task install/uninstall audit: `npm run mobile:local-runtime-task:install-proof` passed as a safe permission audit. Windows denied scheduled-task registration in the current process context, cleanup confirmed no task remains installed, and no provider quota was spent.
- Local runtime user Startup launcher plan: `npm run mobile:local-runtime-startup -- -Action plan -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement` previews a current-user Startup folder launcher for the internal tester runtime, confirms no launcher is installed by default, and spends no provider quota.
- Local runtime user Startup launcher install/uninstall audit: `npm run mobile:local-runtime-startup:install-proof` installs and removes a proof-only `.cmd` launcher in the current user's Startup folder, confirms no launcher remains afterward, includes result ingestion, trusted-result settlement scheduling, approved-settlement wait mode, and the dedicated result poller, and spends no provider quota.
- Local runtime launch profile: `npm run mobile:local-runtime-launch-profile` passed. It consolidates the manual foreground profile, user Startup fallback, scheduled-task permission blocker, and explicit live-provider supervisor profile into one read-only no-quota operator report.
