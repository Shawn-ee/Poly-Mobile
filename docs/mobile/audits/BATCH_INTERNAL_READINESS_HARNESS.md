# Batch Internal Readiness Harness

Date: 2026-07-11

## Scope

This harness consolidates the Local MVP readiness checks that were previously scattered across separate scripts and audit files.

It does not change mobile UI, backend schema, order logic, order book UI, chat, live stats, social features, deposit, or withdraw behavior.

## Command

```powershell
npm run mobile:internal-readiness-batch
```

By default, the batch runs with cached provider-discovery evidence. It still checks backend, DB, Local MVP route shape, S23 proof freshness, startup contract, root typecheck, Jest, and mobile typecheck every time, but it does not repeatedly refresh Polymarket provider scans when the last committed provider evidence already says the current books are closed/unusable.

Use the explicit provider refresh mode only after provider imports, provider refresh work, or a real new candidate signal:

```powershell
npm run mobile:internal-readiness-batch:provider-refresh
```

Default output:

```text
docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json
docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md
```

The gap list is generated from the latest summary by `scripts/write_mobile_internal_readiness_gap_list.ts`. Treat the summary as the authoritative machine-readable result and the gap list as the tester-friendly audit view.

## What It Checks

- Local backend/Docker/Postgres readiness.
- Mobile credential readiness.
- Google auth runtime preflight without printing Google credentials.
- Google physical-device callback preflight without printing Google credentials.
- Google LAN callback preflight for S23/manual consent setup without printing Google credentials.
- S23 internal MVP startup contract in no-start mode, proving the one-command startup emits matching LAN mobile/auth callback origins without launching backend, Expo, bots, or snapshot watch.
- Local MVP match breadth seeding for multiple Home/Live match cards while provider books are unavailable.
- Current MVP route shape for `mobileMvpMatches=1`.
- Provider-backed Regulation Winner plus contract-shaped line-market state.
- Provider snapshot, internal exchange, tradable-flow, World Cup match breadth, and provider line-market breadth from cached evidence by default, or freshly regenerated evidence when `-ProviderDiscoveryMode refresh` is used.
- Committed Samsung S23 Local MVP device proof summaries for Spread filled buy/history, Spread open-order cancel, Spread position cashout/sell, Totals filled buy/history, and Team Totals filled buy/history.
- Freshness of committed Samsung S23 Local MVP device proofs, so old passing screenshots cannot satisfy readiness forever.
- Root TypeScript typecheck, Jest CI smoke suite, and mobile TypeScript typecheck.
- Local environment health snapshot: git cleanliness, S23 reachability, Docker/Postgres status, backend/Expo/proof ports, and continuous bot process status.

## Gate Behavior

P0 blockers fail the command:

- backend or local database unavailable
- S23 Local MVP startup command contract unavailable or mismatched
- current Local MVP route unavailable or not MVP-ready
- latest committed S23 Local MVP device proof summaries are missing, failed, stale, from the wrong device, or reference missing artifacts
- root typecheck, Jest CI suite, or mobile typecheck fails

Known provider availability gaps are tracked as P1, not P0:

- no usable accepting-order Polymarket World Cup team-match books
- no attach-ready Polymarket World Cup line markets
- provider/internal exchange not local-MM-ready
- provider-visible match market has an unsafe/missing/non-accepting provider snapshot for local-MM fake-token fill proof
- provider-visible match market has no bot SELL quote for a fake-token fill proof
- manual server mode missing an ambient `EXPO_PUBLIC_API_KEY`
- Google auth runtime warnings such as a callback/redirect URI mismatch
- Google physical callback warnings such as a local `127.0.0.1` callback that the S23 browser cannot reach
- Google LAN callback warnings such as backend `redirect_uri` still pointing to localhost instead of the LAN callback
- Local MVP fixture breadth failure, if the batch cannot create route-visible match fixtures for internal testing

This is intentional. The Local MVP fake-token user flow remains testable with contract-shaped line markets while provider-backed breadth and line parity remain open.

Do not import futures, awards, player props, or non-World-Cup events to make the match breadth numbers look better. The harness should keep those markets as provider diagnostics unless the product scope explicitly changes.

The provider-visible tradable-flow proof is now match-only by default. It selects the Local MVP match event (`argentina-vs-egypt`) unless an explicit event is passed, and it rejects non-match provider futures unless the caller uses `--allowNonMvpProviderEvent` for a separate non-MVP audit. This prevents old World Cup Winner futures proof from being mistaken for Local MVP match readiness.

Before looking for a local bot quote, the proof checks the latest provider quote snapshot. If the provider book is missing, closed/not accepting orders, invalidly priced, missing a side, or marked not MM eligible, the batch reports `provider_mvp_match_snapshot_not_mm_safe`. This keeps the next action honest: do not seed a local bot quote against an unsafe provider book.

Provider discovery has two modes. The normal mode, `cached`, reuses the committed provider snapshot/exchange/tradable-flow/match-scan/line-scan summaries so the loop does not keep rediscovering the same closed or unavailable Polymarket books. The explicit `refresh` mode refreshes Polymarket reference snapshots for `argentina-vs-egypt`, reruns provider exchange readiness, reruns the provider-visible tradable-flow proof, and reruns World Cup match/line scans. Use refresh mode after provider imports, provider refresh work, line-market discovery changes, or a new candidate signal.

Cached provider summaries are still freshness-gated. The batch records `readiness.cachedProviderEvidenceFresh`, `readiness.cachedProviderEvidenceMaxAgeHours`, and `readiness.cachedProviderEvidence[]` for the provider snapshot, exchange, tradable-flow, match-scan, and line-scan artifacts. Each cached provider evidence row includes `staleAt` and `hoursUntilStale`, and the top-level summary records `readiness.cachedProviderEvidenceNextStaleName`, `readiness.cachedProviderEvidenceNextStaleAt`, and `readiness.cachedProviderEvidenceHoursUntilStale`. If cached evidence is stale, the batch reports `provider_cached_evidence_stale` as P1 and prints `recovery.providerRefreshCommand`. This keeps provider decisions current without forcing every Local MVP readiness run to hit public provider APIs.

Use `npm run mobile:provider-evidence-plan` between batch runs when the long-running loop needs a cheap decision about provider refresh timing. It reads `internal-readiness-batch-summary.json`, writes `provider-evidence-refresh-plan.json`, and returns `skip-refresh`, `refresh-soon`, `refresh-due`, or `missing-summary` based on the cached provider evidence freshness window. It does not call Gamma, CLOB, or backend APIs. It also does not mark provider parity complete; it only prevents the loop from opening another provider-refresh cycle until evidence is stale, nearly stale, missing, or backed by a real new candidate signal.

## Local Environment Snapshot

The summary includes `environmentHealth` so the Lead Agent can report the batch handoff from one artifact instead of reassembling it from ad hoc terminal checks. The snapshot is captured before the batch steps rewrite their JSON artifacts, so `worktreeClean` is not polluted by the harness output itself:

- `environmentHealth.git.worktreeClean`
- `environmentHealth.android.s23Connected`
- `environmentHealth.docker.polyPostgresHealthy`
- `environmentHealth.localServices.backendPort3002Listening`
- `environmentHealth.localServices.expoRunning`
- `environmentHealth.bot.runningContinuously`

These fields are diagnostic. They do not turn provider availability P1 debt into a P0 failure, and they do not start or stop any services. They only record what is running when the batch command is executed.

## S23 Device Proof Aggregation

The batch does not rerun full S23 UI proof every time. Instead, it verifies the latest committed proof summaries and all artifact paths referenced by those summaries:

- filled buy/history proof: `docs/mobile/harness/cycle-XG-full-local-mvp-s23-flow/cycle-XG-current-mvp-s23-visible-flow.json`
- open-order cancel proof: `docs/mobile/harness/cycle-XH-open-order-cancel-s23-flow/cycle-XH-current-mvp-s23-visible-flow.json`
- position cashout/sell proof: `docs/mobile/harness/cycle-XI-cashout-sell-s23-flow/cycle-XI-current-mvp-s23-visible-flow.json`
- Totals filled buy/history proof: `docs/mobile/harness/cycle-WF-line-family-s23-proof/cycle-WF-current-mvp-s23-visible-flow.json`
- Team Totals filled buy/history proof: `docs/mobile/harness/cycle-WG-team-total-s23-proof/cycle-WG-current-mvp-s23-visible-flow.json`

Each proof must be from the Samsung S23 device id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`, have `result=pass`, include required Local MVP assertions, and point only to existing evidence files.

Each proof must also be fresh. The batch records `proofAgeHours`, `fresh`, `maxAgeHours`, `staleAt`, and `hoursUntilStale` for each S23 proof and currently treats proofs older than 24 hours as stale. If this fails, rerun the physical S23 proof set instead of weakening the gate.

The batch also reports `readiness.s23ProofNextStaleName`, `readiness.s23ProofNextStaleAt`, and `readiness.s23ProofHoursUntilStale`. Use those fields during long-running or overnight loops to refresh S23 proof before it flips into a P0 blocker.

If any of those checks fail, the batch records `s23_local_mvp_device_proof_not_ready` as a P0 blocker. This keeps the batch honest: Local MVP readiness requires both route/backend readiness and real Android proof evidence, while still avoiding unnecessary repeated screenshot generation when the committed evidence is already current.

The batch summary also includes `recovery.s23ProofRefreshCommands`. The generated gap list prints those exact commands so the loop can refresh the Spread, Totals, and Team Totals proof set on the S23, then rerun `npm run mobile:internal-readiness-batch` without guessing which proof folders need to be regenerated.

## Local Validation Gates

The batch also runs the same local validation gates that protect `main` before pushing:

- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm --prefix mobile run typecheck`

Each command writes a small marker JSON in `docs/mobile/harness/batch-internal-readiness-latest/` when it passes. If any command fails, the batch command fails and reports the corresponding P0 blocker: `root_typecheck_failed`, `jest_ci_failed`, or `mobile_typecheck_failed`.

This keeps the batch from saying the Local MVP is ready when the runtime is healthy but the checked-in code is not.

## Evidence Hygiene

The batch writes machine-readable JSON evidence with a no-BOM UTF-8 writer and normalized line endings. This prevents Windows PowerShell JSON output from creating noisy trailing-whitespace or BOM-only diffs.

The batch only normalizes JSON summaries produced by the current run. Cached provider evidence is intentionally left untouched in default cached mode so a Local MVP readiness check does not reformat large provider scan artifacts or make provider churn look like new discovery work.

The regression guard for this behavior lives in `src/__tests__/mobile.internal-readiness-batch.contract.test.ts`, and that test is included in `npm run test:ci`. If a future edit replaces the clean writer with broad `*.json` output-folder normalization, CI should fail before the change reaches `main`.

## Manual Server-Mode Prep

When the batch reports `manual_server_mode_needs_generated_mobile_api_key`, prepare the local-only Expo/server-mode environment with:

```powershell
npm run mobile:manual-testing-env
```

This creates a mobile dev credential, funds the local fake-token test account, and writes a local-only `.runtime/mobile-manual-testing/server-mode-env.ps1` file. The committed summary redacts the token; the local env file must not be committed.

The batch readiness command can recognize that local runtime env file and report `serverModeApiKeySource=local-runtime-env` without copying the token into committed JSON. If the file is absent and `EXPO_PUBLIC_API_KEY` is not exported, the batch keeps `manual_server_mode_needs_generated_mobile_api_key` as a P1 manual-testing gap.

Then use the generated summary commands:

```powershell
. .runtime/mobile-manual-testing/server-mode-env.ps1
npm run mobile:internal-beta-backend:start -- -Port 3002
cd mobile
npm run start -- --host lan --port 8081
```

For the normal one-command S23 path, prefer:

```powershell
npm run mobile:internal-mvp:start
```

That command restarts the backend and Expo so both use the same LAN origin for the mobile API and Google callback. Its rehearsal summary records `backendAuthBaseUrl` and `expectedGoogleCallback`; register that exact callback in Google Cloud before manual S23 consent proof.

## Account / Google Runtime Preflight

The Portfolio account entry and Google sign-in runtime check can be run from the repo root:

```powershell
npm run mobile:google-auth-runtime-preflight
```

For strict S23/manual testing, use:

```powershell
npm run mobile:google-auth-runtime-preflight:strict
```

The root commands delegate to the existing mobile preflight under `mobile/`, so testers do not need to remember a separate working directory. The check does not print Google secrets.

The batch command runs the non-strict preflight and writes `google-auth-runtime-preflight.json`. If it finds a redirect mismatch or other runtime warning, the summary records a P1 blocker such as `google_redirect_uri_mismatch`; this does not block the Local MVP fake-token trade path, but it must be fixed before claiming real Google consent readiness.

The Google summary includes URL-only diagnostics, not Google credentials: `expectedCallback`, `observedGoogleRedirectUri`, `redirectUriOriginMatches`, `redirectUriPathMatches`, and `redirectUriMatchesExpected`. Use those fields to set `NEXTAUTH_URL` and the Google Cloud Authorized redirect URI to the same callback.

For the consolidated batch, the Google preflight is pinned to the same `BackendBaseUrl` the batch is testing. This prevents a stale local `.env` `NEXTAUTH_URL` from causing a false mismatch while a correctly configured internal-beta backend is already running on another port.

The batch also runs a physical-device callback preflight. A local runtime callback such as `http://127.0.0.1:3002/api/auth/google/callback` can be valid for backend route testing while still being unsuitable for real S23 browser consent. In that case the batch keeps Local MVP trading ready, but records `google_physical_callback_not_phone_reachable` as P1 until the callback uses a hosted origin or LAN IP that the phone can reach.

For local S23 Google consent setup, the repo root also exposes:

```powershell
npm run mobile:google-auth-lan-preflight
```

This detects the PC LAN IP, runs the same no-secret preflight with `NEXTAUTH_URL=http://<lan-ip>:3002`, and writes `google-auth-lan-callback-preflight.json`. If this reports a redirect mismatch, restart the backend with that LAN auth origin and register the exact callback URL in Google Cloud before attempting real S23 consent.

When the LAN callback preflight passes, it becomes the authoritative Google callback readiness signal for S23 manual consent testing. The batch may still keep the localhost and localhost-physical probe results in raw JSON, but it should not report their expected localhost redirect mismatch as a P1 blocker while the LAN proof is passing.

The machine-readable summary exposes this as `readiness.googleS23ConsentReady`, `readiness.googleS23ConsentSource`, and `readiness.googleS23ConsentExpectedCallback`. For local Android testing, use those fields instead of the raw localhost physical probe when deciding whether the Portfolio account entry can attempt real Google consent on the S23.

## Local Match Breadth

```powershell
npm run mobile:mvp-local-match-breadth
```

This idempotently seeds a small set of `contract-fixture` World Cup match rows with Regulation Winner, Spread, Totals, and Team Totals. It exists only for Local MVP internal testing when real Polymarket World Cup match books are closed or unavailable. The batch records `localMatchBreadthReady` and the Home route event count after seeding; provider-backed market debt remains tracked separately.

## Provider FIFA/Soccer Scope

Provider match breadth is FIFA/soccer World Cup only. The match scanner may see generic World Cup markets from other sports or off-scope provider categories, but those cannot close Holiwyn's soccer MVP provider gap. The batch summary records `readiness.excludedGenericWorldCupMatchEventCount` and the gap list prints the same diagnostic so future cycles do not mistake generic World Cup liquidity for attach-ready soccer match breadth.

## Why This Exists

The loop should not keep reopening small source-label or one-screen proof cycles just to rediscover the same provider-state facts. This batch harness gives the Lead Agent one current-state command before choosing the next meaningful milestone.
