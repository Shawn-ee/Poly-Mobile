# Cycle FG - Home Route Server Order

## Scope

Local MVP visible retail flow:

- Home route-backed event card
- Event Detail hydration
- Game Lines spread outcome
- Simple ticket amount entry
- Server fake-token order submit
- Server-synced Portfolio open order/history identity

Explicitly out of scope:

- Order book UI
- Chat
- Live stats
- Social/notification behavior
- Deposit/location checks
- Filled/cancel lifecycle breadth

## Reference Baseline

The active product direction prioritizes a simple Polymarket-like retail flow: choose a football event, pick an outcome, enter an amount, submit a fake-token buy/sell action, and see the result in Portfolio/history. FG repeats the FF Home-starting flow in server order mode, so the ticket submit uses the Holiwyn backend instead of local mock Portfolio state.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FG-ORDER-P0-01 | P0 | Home shows the freshly seeded route-backed World Cup event card with compact outcomes. | Pass |
| FG-ORDER-P0-02 | P0 | Tapping the Home card opens the same route-backed Event Detail. | Pass |
| FG-ORDER-P0-03 | P0 | Event Detail exposes a route-backed Spread row with backend line-market identity. | Pass |
| FG-ORDER-P0-04 | P0 | Spread ticket opens with selected market type, line, period, side, provider source, and provider token. | Pass |
| FG-ORDER-P0-05 | P0 | Amount presets produce a `$25` ready state with `Swipe up to buy`. | Pass |
| FG-ORDER-P0-06 | P0 | Submitting the ticket posts a server fake-token order through `/api/orders`. | Pass |
| FG-ORDER-P0-07 | P0 | Server Portfolio sync shows the new open order and preserves selected identity. | Pass |
| FG-ORDER-P0-08 | P0 | Default orderbook UI remains hidden throughout the proof. | Pass |
| FG-ORDER-P1-01 | P1 | Filled/cancel lifecycle from the Home-opened path. | Open |
| FG-ORDER-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Open |

## Implementation Notes

- Added `LocalMvpHomeRouteServerOrderFlow` to `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`.
- Added `mobile/scripts/local-mvp-home-route-server-order-proof.ps1` to seed a disposable route-backed event, create a temporary mobile dev credential, launch server market-data/server order mode, and run the tablet proof.
- No backend route, schema, or service code was changed.

## Android Proof

Device:

- Samsung tablet, Expo Go, port `8276`

Command:

```powershell
powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-home-route-server-order-proof.ps1 -Port 8276 -BackendBaseUrl http://172.16.200.14:3002
```

Evidence:

- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-event.json`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-wrapper.json`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-proof.json`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-home.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-detail-top.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-line-markets.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-portfolio.xml`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-home.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-detail-top.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-line-markets.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-portfolio.png`

## Audit Gate

Pass for selected Local MVP Home -> Event Detail -> Spread ticket -> server fake-token order -> Portfolio open order flow.

Unresolved P0 gaps: 0.

Remaining P1/P2 gaps:

- Filled/cancel lifecycle from the exact Home-opened path.
- Replace disposable provider-shaped proof events with production active Polymarket event breadth.
