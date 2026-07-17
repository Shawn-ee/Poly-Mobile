# Holiwyn Internal Tester Runtime Launch

Last verified: 2026-07-17, Cycle ZCN bounded event runtime allowlist

## Verdict

The local internal tester runtime is ready for cached fake-token testing of the current backend-owned event.

This is not production readiness. The runtime uses local foreground/background processes, cached or explicitly refreshed Odds API evidence, local maker liquidity, and fake-token trading. It does not install an unattended production service and it does not execute active-event settlement while the selected market is still live.

## Current Event

- Event: Chapecoense vs. Bahia
- Local slug: `odds-api-single-soccer-test`
- Provider source: The Odds API
- Selected proof market: Chapecoense vs. Bahia: Total Goals 2.5
- Selected proof outcome: `Over 2.5`
- Market and outcome IDs are backend-owned and must be read from the current event-detail route rather than copied from an older proof.

## Start Or Verify Runtime

Preferred no-quota cached tester path:

```text
npm run mobile:one-event-onboarding
```

Verify provider-event ownership without spending quota:

```text
npm run mobile:event-runtime-allowlist
```

Run all currently allowlisted owners once, sequentially and without provider quota:

```text
npm run mobile:event-allowlist-supervisor:proof
```

The current report allowlists only `odds-api-single-soccer-test`. The bounded command runs that owner and reports both archived catalog events as skipped. Archived events have no worker commands and cannot be certified by the active event's cached proof.

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
| Home | The current backend-owned soccer event appears and opens Event Detail. | `GET /api/events` |
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
- Supervisor loop: proven locally without provider quota; not intentionally left running after the latest proof.
- Result poller loop: proven locally without provider quota; not intentionally left running after the latest proof.
- Backend at this audit snapshot: running on port 3002.
- Expo at this audit snapshot: stopped after S23 proof.
- Quota-spending loop: not running.
- Backend health: checked by the readiness gate.
- Recommended first action: `npm run mobile:one-event-onboarding`.

## Readiness Evidence

- Readiness gate: `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json`
- Ordered audit gate: `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json`
- Operator snapshot: `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Latest S23 proof: `docs/mobile/harness/cycle-ZCJ-operator-runtime-status/cycle-ZCJ-odds-api-s23-visible-flow.json`

## Known Gaps

- P0: none for cached local internal testing.
- P1: installed unattended provider/maker/lifecycle service ownership.
- P1: production official-result auto-settlement. Active-event execution remains guarded by `CLOSED` market status and exact confirmation.
- P1: installed/concurrent multi-event runtime ownership. Bounded sequential fan-out exists, but only one current event is available and the command is foreground-only.
- P2: production operator dashboard.
