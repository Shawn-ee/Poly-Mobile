# Cycle ZAW - Active Settlement Readiness Env And Evidence

## Scope

- Fix and re-prove the no-quota active-event settlement readiness command for the current Spain vs. France one-event runtime.
- Keep the active tester market unexecuted and `LIVE`.
- Do not call the odds provider, change mobile UI, execute active-event settlement, or alter schema.

## Issue Found

`npm run mobile:one-event-active-settlement-readiness` failed from a normal local shell because `DATABASE_URL` was not loaded before the command used Prisma. After fixing env loading, the command also revealed stale/missing canonical result/preflight/approval evidence for the current selected outcome.

## Fix

- `scripts/report_odds_api_active_event_settlement_readiness.ts` now loads local DB env through `loadLocalEnvForScript(["DATABASE_URL"])`.
- If DB env is still missing, it fails with an explicit operator-facing message instead of a Prisma initialization error.

## Proof Refresh

Commands run in order:

- `npm run mobile:one-event-lifecycle-matrix`
- `npm run mobile:one-event-result-ingestion-audit-event-proof`
- `npm run mobile:one-event-settlement-audit-event-proof`
- `npm run mobile:one-event-settlement-approval-audit-event-proof`
- `npm run mobile:one-event-result-review-trail`
- `npm run mobile:one-event-active-settlement-readiness`
- `npm run mobile:live-runtime-audit-gate`
- `npm run mobile:internal-tester-readiness-gate`
- `npm --prefix mobile run typecheck`

## Result

- Event: `Spain vs. France`
- Market: `Spain vs. France: Total Goals 2.5`
- Market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Outcome: `Over 2.5`
- Outcome id: `5a3f04ff-6efd-42c5-a225-8fae8070b509`
- Provider quota used: false.
- Active market status: `LIVE`.
- Active settlement execution attempted: false.
- Active settlement readiness: pass.
- Live runtime audit gate: pass.
- Internal tester readiness gate: pass.
- Open P0 gaps: none.

## Remaining Gaps

- P1: active tester settlement still waits for `CLOSED` market status plus exact confirmation.
- P1: installed unattended official-result polling and production operator UI remain open.
- P2: multi-event settlement queue/lifecycle dashboard remain future work.
