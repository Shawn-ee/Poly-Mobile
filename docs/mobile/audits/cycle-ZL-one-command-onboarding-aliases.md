# Cycle ZL - One-Command Onboarding Aliases

Generated: 2026-07-13

## Scope

Narrow the one-event live pipeline operator gap by making the existing onboarding/runtime-loop modes first-class package scripts.

## Changes

- Added `npm run mobile:one-event-onboarding:cached-runtime` for cached/no-quota onboarding plus supervisor/result-poller startup/status/cleanup proof.
- Added `npm run mobile:one-event-onboarding:live-provider-runtime` for intentional live-provider refresh plus the same runtime-loop proof.
- Updated live-runtime survey, provider refresh policy, and lifecycle runbook docs.
- Added contract coverage so the aliases remain explicit and the cached shortcut does not accidentally call the live provider refresh path.

## API / Data / Runtime Dependencies

- Frontend: none.
- Backend routes: unchanged. Existing child proofs still use `/api/health`, `/api/internal/live-runtime/status`, event/detail/quote routes, and settlement readiness commands.
- Provider: cached alias spends no provider quota. Live-provider alias requires local `THE_ODDS_API_KEY` and uses the existing quota-capped `-RunProviderRefresh` path.
- Bot/runtime: aliases reuse `scripts/onboard_holiwyn_one_event_live_runtime.ps1`, `scripts/manage_holiwyn_internal_tester_runtime.ps1`, the one-event supervisor, and the result poller. Loops are stopped after proof.
- Schema: none.

## Gaps

P0: none.

P1:
- These aliases are local operator commands, not installed unattended service ownership.
- Production official-result auto-settlement remains guarded/future work.

P2:
- Multi-event onboarding still needs per-provider-event slugs before becoming default.
