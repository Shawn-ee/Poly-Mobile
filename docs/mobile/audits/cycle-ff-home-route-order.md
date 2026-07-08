# Cycle FF - Home Route Ticket Submit

## Scope

Local MVP visible retail flow:

- Home route-backed event card
- Event Detail hydration
- Game Lines spread outcome
- Simple ticket amount entry
- Fake-token order submit
- Portfolio latest order, activity, and position/history identity

Explicitly out of scope:

- Order book UI
- Chat
- Live stats
- Social/notification behavior
- Deposit/location checks
- Server order mode

## Reference Baseline

The active product direction prioritizes a simple Polymarket-like retail flow: choose a football event, pick an outcome, enter an amount, submit a fake-token buy/sell action, and see the result in Portfolio/history. FF proves this flow from the Home entry point. It does not claim full production Polymarket parity.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FF-ORDER-P0-01 | P0 | Home shows a route-backed World Cup event card with compact outcomes. | Pass |
| FF-ORDER-P0-02 | P0 | Tapping the Home card opens the same route-backed Event Detail. | Pass |
| FF-ORDER-P0-03 | P0 | Event Detail exposes a route-backed Spread row with backend line-market identity. | Pass |
| FF-ORDER-P0-04 | P0 | Spread ticket opens with selected market type, line, period, side, provider source, and provider token. | Pass |
| FF-ORDER-P0-05 | P0 | Amount presets produce a `$25` ready state with `Swipe up to buy`. | Pass |
| FF-ORDER-P0-06 | P0 | Submitting the ticket creates a fake-token order and transitions to Portfolio. | Pass |
| FF-ORDER-P0-07 | P0 | Portfolio latest order, latest activity, and position preserve order-time selected identity. | Pass |
| FF-ORDER-P0-08 | P0 | Default orderbook UI remains hidden throughout the proof. | Pass |
| FF-ORDER-P1-01 | P1 | Repeat the Home-opened flow in server order mode. | Open |
| FF-ORDER-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Open |

## Implementation Notes

- Added `LocalMvpHomeRouteOrderFlow` to `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`.
- The harness reuses the FE route-card and ticket path, then enters `$25`, submits through the mock fake-token ticket, and asserts Portfolio markers.
- No backend route or schema changes were needed.

## Android Proof

Device:

- Samsung tablet, Expo Go, port `8275`

Command:

```powershell
powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpHomeRouteOrderFlow -Port 8275 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-FF-home-route-order -HierarchyOutputDir docs/mobile/harness/cycle-FF-home-route-order
```

Evidence:

- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-event.json`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-proof.json`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-home.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-detail-top.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-line-markets.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-portfolio.xml`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-home.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-detail-top.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-line-markets.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-portfolio.png`

## Audit Gate

Pass for selected Local MVP Home -> Event Detail -> Spread ticket -> fake-token order -> Portfolio/history flow.

Unresolved P0 gaps: 0.

Remaining P1/P2 gaps:

- Repeat this exact Home-opened flow in server order mode.
- Replace disposable provider-shaped proof events with production active Polymarket event breadth.
