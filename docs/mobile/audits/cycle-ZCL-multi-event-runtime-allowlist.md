# Cycle ZCL - Multi-Event Runtime Allowlist

Date: 2026-07-17

## Scope

Close the dangerous fixed-event assumption between the provider catalog and the local runtime without spending Odds API quota. This cycle does not change mobile UI, HTTP routes, Prisma schema, provider discovery, market normalization, order behavior, portfolio behavior, or settlement execution.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | The runtime report sees at least two provider-owned events with complete, unique `source + externalEventId` and slug identity. | Pass |
| P0 | At least one active event has listed markets and accepting provider snapshots and is selected as a runtime owner. | Pass |
| P0 | Archived events have zero listed markets, accepting snapshots, open orders, and worker ownership. | Pass |
| P0 | Cached launcher evidence must match the explicitly selected event slug. | Pass |
| P0 | Supervisor children receive the selected event slug for hygiene, maker, stale guard, result ingestion, guarded settlement, and lifecycle checks. | Pass |
| P0 | The cycle spends no provider quota and exposes no provider key. | Pass |
| P1 | At least three provider-shaped events coexist for RC1. | Open: two exist |
| P1 | One bounded command fans out across multiple active allowlisted events with isolated evidence. | Open |

## Database Proof

- Active runtime owner: `Chapecoense vs. Bahia`, slug `odds-api-single-soccer-test`.
- Active readiness: 26 provider markets, 20 listed markets, 72 accepting snapshots, 4 open orders.
- Archived catalog record: `Switzerland vs. Argentina`, slug `odds-api-event-80f5351f8fe881cc6e09`.
- Archived safety: 0 listed markets, 0 accepting snapshots, 0 open orders, all worker roles disabled.
- Provider calls: 0.
- Evidence: `docs/mobile/harness/the-odds-api-event-catalog/runtime-allowlist-summary.redacted.json`.

## Runtime Proof

`npm run mobile:one-event-live-runtime -- -EventSlug odds-api-single-soccer-test -SummaryPath .runtime\\zcl-selected-event-runtime-summary.redacted.json` passed.

- Backend health: pass on `3002`; DB connected.
- Docker Postgres: healthy.
- Cached proof event: `odds-api-single-soccer-test`.
- Selected event: `odds-api-single-soccer-test`.
- `eventMatchesSelected`: true.
- Provider quota used: false.
- S23: ADB timed out during this backend-only proof. No mobile-visible code changed, so this is not claimed as fresh Android proof; Cycle ZCJ remains the latest physical full-flow evidence.

## Audit Gate

Pass for the ZCL structural scope with 0 unresolved P0 gaps. This is not RC1 completion: three-event breadth and bounded multi-event supervisor fan-out remain active P0 work in the launch report.
