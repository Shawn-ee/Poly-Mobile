# Batch Internal Readiness Harness

Date: 2026-07-11

## Scope

This harness consolidates the Local MVP readiness checks that were previously scattered across separate scripts and audit files.

It does not change mobile UI, backend schema, order logic, order book UI, chat, live stats, social features, deposit, or withdraw behavior.

## Command

```powershell
npm run mobile:internal-readiness-batch
```

Default output:

```text
docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json
```

## What It Checks

- Local backend/Docker/Postgres readiness.
- Mobile credential readiness.
- Google auth runtime preflight without printing Google credentials.
- Google physical-device callback preflight without printing Google credentials.
- Google LAN callback preflight for S23/manual consent setup without printing Google credentials.
- Current MVP route shape for `mobileMvpMatches=1`.
- Provider-backed Regulation Winner plus contract-shaped line-market state.
- Fresh Polymarket reference snapshot refresh for the current MVP match.
- Provider/internal exchange readiness.
- Provider-visible tradable-flow readiness for the match-only MVP path.
- Polymarket World Cup team-match breadth.
- Polymarket provider line-market breadth.
- Local environment health snapshot: git cleanliness, S23 reachability, Docker/Postgres status, backend/Expo/proof ports, and continuous bot process status.

## Gate Behavior

P0 blockers fail the command:

- backend or local database unavailable
- current Local MVP route unavailable or not MVP-ready

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

This is intentional. The Local MVP fake-token user flow remains testable with contract-shaped line markets while provider-backed breadth and line parity remain open.

Do not import futures, awards, player props, or non-World-Cup events to make the match breadth numbers look better. The harness should keep those markets as provider diagnostics unless the product scope explicitly changes.

The provider-visible tradable-flow proof is now match-only by default. It selects the Local MVP match event (`argentina-vs-egypt`) unless an explicit event is passed, and it rejects non-match provider futures unless the caller uses `--allowNonMvpProviderEvent` for a separate non-MVP audit. This prevents old World Cup Winner futures proof from being mistaken for Local MVP match readiness.

Before looking for a local bot quote, the proof checks the latest provider quote snapshot. If the provider book is missing, closed/not accepting orders, invalidly priced, missing a side, or marked not MM eligible, the batch reports `provider_mvp_match_snapshot_not_mm_safe`. This keeps the next action honest: do not seed a local bot quote against an unsafe provider book.

The batch refreshes Polymarket reference snapshots for `argentina-vs-egypt` before running internal exchange readiness and provider tradable-flow checks. This keeps the provider blocker current. If the refreshed book remains closed, missing, or invalidly priced, the batch records that as P1 provider data debt rather than letting stale snapshots masquerade as the reason.

## Local Environment Snapshot

The summary includes `environmentHealth` so the Lead Agent can report the batch handoff from one artifact instead of reassembling it from ad hoc terminal checks. The snapshot is captured before the batch steps rewrite their JSON artifacts, so `worktreeClean` is not polluted by the harness output itself:

- `environmentHealth.git.worktreeClean`
- `environmentHealth.android.s23Connected`
- `environmentHealth.docker.polyPostgresHealthy`
- `environmentHealth.localServices.backendPort3002Listening`
- `environmentHealth.localServices.expoRunning`
- `environmentHealth.bot.runningContinuously`

These fields are diagnostic. They do not turn provider availability P1 debt into a P0 failure, and they do not start or stop any services. They only record what is running when the batch command is executed.

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

## Why This Exists

The loop should not keep reopening small source-label or one-screen proof cycles just to rediscover the same provider-state facts. This batch harness gives the Lead Agent one current-state command before choosing the next meaningful milestone.
