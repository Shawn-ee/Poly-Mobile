# Cycle ZBT - Internal Tester Readiness Gate

Scope: no-quota internal tester readiness gate for the current Spain vs. France one-event live runtime.

## Commands Run

- `npm run mobile:live-runtime-audit-gate`
- `npm run mobile:internal-tester-readiness-gate`

## Result

| Gate | Result | Evidence |
| --- | --- | --- |
| Ordered live-runtime audit gate | Pass | `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json` |
| Internal tester readiness gate | Pass | `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json` |
| Operator snapshot/checklist | Pass | `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json` |

## Current Tester Truth

- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Spain vs. France: Total Goals 2.5`
- Selected outcome: `Over 2.5`
- Local tester readiness: ready now
- Warm no-quota runtime: true
- Supervisor loop: running
- Result poller loop: running
- Quota-spending loop: false
- Recommended first action: `cached_internal_testing`
- Recommended command: `npm run mobile:one-event-onboarding`
- Live odds action: `npm run mobile:one-event-live-runtime:provider-secret` only when fresh mobile-visible odds are required

## Manual Flow Covered By The Snapshot

- Home shows Spain vs. France through `GET /api/events`.
- Event Detail loads backend markets through `GET /api/mobile/events/odds-api-single-soccer-test/live-detail`.
- Quote and buy use `GET /api/markets/:id/quote` and `POST /api/orders`.
- Portfolio and History use `GET /api/portfolio` and `GET /api/portfolio/history`.
- Cashout/sell must use close-position mode, owned shares, and backend sell order submission.
- Lifecycle status stays pre-start open until the suspend/close window.
- Settlement remains guarded while the selected active market is `LIVE`.

## Gap Status

- P0: none for the local one-event internal tester runtime.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open.
- P2: multi-event provider polling and production dashboard/operator UI remain future work.

This cycle did not call providers, read provider keys, start new loops, execute settlement, or mutate mobile/backend source code.
