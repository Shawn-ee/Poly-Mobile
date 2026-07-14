# Internal Tester Operator Handoff

This handoff is the short, current operating guide for the one-event Holiwyn local tester runtime.

## Current Event

- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected proof market: `Spain vs. France: Total Goals 2.5`
- Selected proof outcome: `Over 2.5`
- Runtime route of truth: `GET /api/internal/live-runtime/status`
- Tester gate of truth: `npm run mobile:internal-tester-readiness-gate`

## Readiness Modes

| Mode | Meaning | Provider quota | Expected use |
| --- | --- | --- | --- |
| Cached internal testing | Backend, Expo, supervisor/result-poller, maker liquidity, fake-token trading, portfolio/cashout/history are locally usable from stored provider evidence. | No | Default internal tester mode |
| Fresh live-display odds | Mobile-visible provider quote snapshots are fresh under the 60/90-second live display thresholds. | Yes, only when explicitly refreshed | Use immediately before a live-odds visual test |
| Production unattended runtime | Installed, always-on provider/maker/lifecycle service ownership. | N/A | Not claimed; tracked as P1 |

## Why Live Odds Become Stale Quickly

The mobile event detail route uses short live-display thresholds:

- Refresh-due after 60 seconds.
- Stale after 90 seconds.

That means a successful live provider refresh can prove `ready` and still age back to `stale` a minute or two later. This is expected. Do not treat `mobile_provider_snapshot_not_fresh` as a P0 blocker for cached internal trading.

When a tester needs visually fresh live odds, run:

```powershell
npm run mobile:one-event-live-runtime:provider-secret
```

Use this only intentionally. It reads the provider key from the local environment or ignored `.runtime/secrets/the-odds-api-key.txt`, is one-event scoped, and is quota-capped.

## Normal Tester Startup

Use the no-quota cached runtime path:

```powershell
npm run mobile:internal-tester-runtime:cached-start
npm run mobile:internal-tester-readiness-gate
```

If the phone shows stale app code or fixture behavior, replace the Expo listener:

```powershell
npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -WaitForReady -RuntimeOnlyArtifacts
```

Open Expo Go on the S23:

```text
exp://172.16.200.14:8081
```

## Manual S23 Flow

1. Home: confirm `Spain vs. France` is visible.
2. Event Detail: open the event and confirm backend markets load.
3. Market line: select the `Total Goals 2.5` proof market or another backend-owned line.
4. Ticket: enter a fake-token amount and swipe to buy.
5. Portfolio: confirm the position appears.
6. Cashout: open `Cash out`; Max must use owned shares, hide the Yes/No selector, and submit a SELL for the owned outcome.
7. History: confirm buy/sell activity is present.

## Current Boundaries

- P0: none for cached local one-event internal tester trading.
- P1: installed unattended provider/maker/lifecycle service ownership is not claimed.
- P1: production official-result auto-settlement is not claimed; active event execution remains guarded by `CLOSED` market status and exact confirmation.
- P2: multi-event provider polling/dashboard remains future work.

## Process Hygiene

- Keep backend `3002` and Expo `8081` running during manual testing.
- Keep supervisor/result-poller loops running only when a tester session needs warm runtime behavior.
- Do not leave quota-spending provider refresh loops running by default.
- Do not commit `.runtime` files or provider secrets.
