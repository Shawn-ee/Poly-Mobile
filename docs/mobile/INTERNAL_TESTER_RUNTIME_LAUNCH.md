# Holiwyn Internal Tester Runtime Launch

Last verified: 2026-07-14, Cycle ZAK

## Verdict

The local internal tester runtime is ready for cached fake-token testing of the current backend-owned event.

This is not production readiness. The runtime uses local foreground/background processes, cached or explicitly refreshed Odds API evidence, local maker liquidity, and fake-token trading. It does not install an unattended production service and it does not execute active-event settlement while the selected market is still live.

## Current Event

- Event: Spain vs. France
- Local slug: `odds-api-single-soccer-test`
- Provider source: The Odds API
- Selected proof market: Spain vs. France: Total Goals 2.5
- Selected proof outcome: `Over 2.5`
- Market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Outcome id: `30fbc915-74ca-4809-a0c4-cd54c3236aa4`

## Start Or Verify Runtime

Preferred no-quota cached tester path:

```text
npm run mobile:one-event-onboarding
```

Full local runtime manager path:

```text
npm run mobile:internal-tester-runtime:cached-start
```

Live odds refresh path, only when fresh mobile-visible odds are needed and provider quota spend is approved:

```text
npm run mobile:one-event-live-runtime:provider-secret
```

The live odds command reads the key from the process environment or ignored `.runtime/secrets/the-odds-api-key.txt`. Do not put the key in committed files.

## Tester Flow

| Step | Expected behavior | Dependency |
| --- | --- | --- |
| Home | Spain vs. France appears and opens Event Detail. | `GET /api/events` |
| Event Detail | Backend-owned markets load for `odds-api-single-soccer-test`; Total Goals 2.5 is available. | `GET /api/mobile/events/:slug/live-detail` |
| Quote and Buy | Opening `Over 2.5` shows a tradable fake-token ticket; swipe buy places an order. | `GET /api/markets/:id/quote`, `POST /api/orders` |
| Portfolio | The position appears after buy. | `GET /api/portfolio` |
| Cashout/Sell | Cashout opens close-position mode, Max uses owned shares only, no Yes/No selector appears, and History updates after sell. | `POST /api/orders`, `GET /api/portfolio/history` |
| Stale/closed trading | Stale or closed markets reject orders with `MARKET_UNAVAILABLE`. | `POST /api/orders` |
| Settlement | Active event waits for closed market plus exact approval before settlement. | `GET /api/internal/live-runtime/settlement-queue` |

## Current Runtime Truth

- Cached tester mode: ready.
- Live odds freshness under the short mobile display window: not fresh.
- Live odds freshness under the local proof window: valid.
- Supervisor loop: running locally without provider quota.
- Result poller loop: running locally without provider quota.
- Quota-spending loop: not running.
- Backend health: checked by the readiness gate.
- Recommended first action: `npm run mobile:one-event-onboarding`.

## Readiness Evidence

- Readiness gate: `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json`
- Ordered audit gate: `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json`
- Operator snapshot: `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Latest S23 proof: `docs/mobile/harness/cycle-ZAI-warm-runtime-s23/cycle-ZAI-warm-runtime-s23-odds-api-s23-visible-flow.json`

## Known Gaps

- P0: none for cached local internal testing.
- P1: installed unattended provider/maker/lifecycle service ownership.
- P1: production official-result auto-settlement. Active-event execution remains guarded by `CLOSED` market status and exact confirmation.
- P2: multi-event provider polling and production operator dashboard.

