# Cycle ZW5 - Lifecycle Matrix Proof Refresh

## Scope

Tighten lifecycle evidence for the one-event live runtime without spending provider quota. No mobile UI, provider import, order route, schema, or settlement execution changed.

## Issue Found

- `npm run mobile:one-event-lifecycle-matrix` failed on a clean shell when `DATABASE_URL` was not already in the process environment.
- The live-provider proof generator still used broad P1 wording that implied event close/suspend scheduling was not implemented, even though current evidence proves it runs under the local foreground supervisor. The true remaining gap is installed unattended service ownership.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZW5-P0-01 | P0 | Lifecycle matrix loads local `DATABASE_URL` using the established local env helper. | Pass |
| ZW5-P0-02 | P0 | Lifecycle matrix proves open, paused, closed, and settled/resolved lifecycle evidence without provider quota. | Pass |
| ZW5-P0-03 | P0 | Live-runtime audit gate passes with no open P0 gaps after the lifecycle matrix refresh. | Pass |
| ZW5-P1-01 | P1 | Future live-provider proof summaries distinguish foreground supervisor support from missing installed unattended service ownership. | Pass |

## Proof

- `npx jest --runInBand src/__tests__/mobile.the-odds-api-single-event.contract.test.ts src/__tests__/liveRuntimeStatus.service.test.ts src/__tests__/liveRuntimeLifecycle.service.test.ts src/__tests__/internal.live-runtime.lifecycle.route.test.ts`: pass.
- `npm run mobile:one-event-lifecycle-matrix`: pass.
- `npm run mobile:live-runtime-audit-gate`: pass.

## Evidence

- Lifecycle matrix summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json`.
- Ordered audit gate: `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json`.
- Completion audit reports `lifecycleOpenPausedClosedSettledKnown=true`.

## Remaining Gaps

- P1: installed unattended provider/maker/lifecycle service ownership.
- P1: production official-result auto-settlement.
- P2: multi-event provider polling and production dashboard/operator UI.
