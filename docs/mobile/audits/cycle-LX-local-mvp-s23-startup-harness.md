# Cycle LX - Local MVP S23 Startup Harness

Date: 2026-07-08

## Scope

Local MVP harness reliability for Android proof.

This cycle fixes the startup gap discovered in Cycle LW: S23 ticket submit worked only after manually restarting Expo with a generated mobile dev API key. The goal is to make that repeatable before more UI proof cycles.

No order book, chat, live stats, social, backend schema, or mobile UI work was started.

## Implementation

Changed files:

- `scripts/start_poly_mobile_rehearsal.ps1`
- `package.json`

Behavior added:

- `start_poly_mobile_rehearsal.ps1` now accepts `-RestartExpo`.
- When `-RestartExpo` is set and the Expo port is already listening, the harness stops the existing listener and starts a fresh Expo process with server-mode environment.
- The summary records prior stopped listener PIDs and the new Expo process PID.
- The summary continues to redact the generated mobile credential token.
- Added `npm run mobile:mvp-s23:start` as the Local MVP starter:
  - creates a mobile dev credential
  - restarts Expo
  - skips snapshot watch
  - skips bots
  - reuses or starts backend through the underlying rehearsal script

## Validation

Command run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start_poly_mobile_rehearsal.ps1 -CreateMobileDevCredential -RestartExpo -SkipSnapshotWatch -SkipBots -SkipBackend -DurationSeconds 60
```

Result:

- Existing Expo listener on port `8081` was stopped.
- New Expo listener started.
- `http://127.0.0.1:8081/status` returned `packager-status:running`.
- `.runtime/rehearsal/latest-summary.json` reported:
  - `mobileApiKey=configured`
  - `createdMobileCredential.token=[redacted]`
  - `restartExpo=true`

Safety checks:

- `package.json` parsed successfully through Node.
- Secret scan found no `pk_live_...` token in committed files.

## Acceptance Result

Pass for harness scope.

The next S23 UI proof cycle should start with:

```powershell
npm run mobile:mvp-s23:start
```

This prevents the stale no-key Expo bundle that caused the Cycle LW `Authentication required` failure.

## Remaining Gaps

P0 for broader MVP:

- Continue S23 UI proof cycles using this startup harness.

P1 harness polish:

- Add an optional one-command S23 deep-link/reload proof step after startup.
