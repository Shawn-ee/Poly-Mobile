# Cycle FH - Home Route Server Cancel

## Scope

Local MVP visible retail lifecycle flow:

- Home route-backed event card
- Event Detail hydration
- Game Lines spread outcome
- Simple ticket amount entry
- Server fake-token order submit
- Portfolio open order
- Cancel open order
- Server-synced canceled activity/history

Explicitly out of scope:

- Order book UI
- Chat
- Live stats
- Social/notification behavior
- Deposit/location checks
- Filled lifecycle breadth

## Reference Baseline

The active product direction prioritizes a simple Polymarket-like retail flow: choose a football event, pick an outcome, enter an amount, submit a fake-token buy/sell action, and see the result in Portfolio/history. FH extends FG by proving the user can cancel the server open order from the same Home-started path and see canceled activity through server Portfolio/history sync.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FH-CANCEL-P0-01 | P0 | Home shows the freshly seeded route-backed World Cup event card with compact outcomes. | Pass |
| FH-CANCEL-P0-02 | P0 | Tapping the Home card opens the same route-backed Event Detail. | Pass |
| FH-CANCEL-P0-03 | P0 | Event Detail exposes a route-backed Spread row with backend line-market identity. | Pass |
| FH-CANCEL-P0-04 | P0 | Spread ticket opens with selected market type, line, period, side, provider source, and provider token. | Pass |
| FH-CANCEL-P0-05 | P0 | Amount presets produce a `$25` ready state with `Swipe up to buy`. | Pass |
| FH-CANCEL-P0-06 | P0 | Submitting the ticket posts a server fake-token order through `/api/orders`. | Pass |
| FH-CANCEL-P0-07 | P0 | Server Portfolio sync shows the new open order and visible Cancel action. | Pass |
| FH-CANCEL-P0-08 | P0 | Tapping Cancel calls the server cancel path and refreshes Portfolio/history to canceled activity. | Pass |
| FH-CANCEL-P0-09 | P0 | Canceled activity preserves selected line, period, provider source, and provider token. | Pass |
| FH-CANCEL-P0-10 | P0 | Default orderbook UI remains hidden throughout the proof. | Pass |
| FH-CANCEL-P1-01 | P1 | Filled lifecycle from the exact Home-opened path. | Open |
| FH-CANCEL-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Open |

## Implementation Notes

- Added `LocalMvpHomeRouteServerCancelFlow` to `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`.
- Shared the FG Home route server proof block and parameterized artifact names for FG/FH.
- Added `mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1` to seed a disposable route-backed event, create a temporary mobile dev credential, launch server market-data/server order mode, and run the tablet proof.
- No backend route, schema, or service code was changed.

## Android Proof

Device:

- Samsung tablet, Expo Go, port `8277`

Command:

```powershell
powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1 -Port 8277 -BackendBaseUrl http://172.16.200.14:3002
```

Evidence:

- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-event.json`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-wrapper.json`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-proof.json`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-home.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-detail-top.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-line-markets.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio-canceled.xml`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-home.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-detail-top.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-line-markets.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio-canceled.png`

## Audit Gate

Pass for selected Local MVP Home -> Event Detail -> Spread ticket -> server fake-token order -> Cancel -> server Portfolio canceled activity flow.

Unresolved P0 gaps: 0.

Remaining P1/P2 gaps:

- Filled lifecycle from the exact Home-opened path.
- Replace disposable provider-shaped proof events with production active Polymarket event breadth.
