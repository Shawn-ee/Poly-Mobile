# Cycle FI - Home Route Server Filled

## Scope

Local MVP visible retail filled lifecycle flow:

- Home route-backed event card
- Event Detail hydration
- Game Lines spread outcome
- Simple ticket amount entry
- Server fake-token order submit
- Seeded counterparty fill
- Server-synced filled Portfolio position and activity/history

Explicitly out of scope:

- Order book UI
- Chat
- Live stats
- Social/notification behavior
- Deposit/location checks
- Production active provider breadth

## Reference Baseline

The active product direction prioritizes a simple Polymarket-like retail flow: choose a football event, pick an outcome, enter an amount, submit a fake-token buy/sell action, and see the result in Portfolio/history. FI closes the remaining Home-started server lifecycle gap by proving a filled order from the same Home entry path using backend-shaped counterparty liquidity.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FI-FILLED-P0-01 | P0 | Home shows the freshly seeded route-backed World Cup event card with compact outcomes. | Pass |
| FI-FILLED-P0-02 | P0 | Tapping the Home card opens the same route-backed Event Detail. | Pass |
| FI-FILLED-P0-03 | P0 | Event Detail exposes a route-backed Spread row with backend line-market identity. | Pass |
| FI-FILLED-P0-04 | P0 | Counterparty proof seeds a resting SELL order for the same spread market/outcome. | Pass |
| FI-FILLED-P0-05 | P0 | Spread ticket opens with selected market type, line, period, side, provider source, and provider token. | Pass |
| FI-FILLED-P0-06 | P0 | Amount presets produce a `$25` ready state with `Swipe up to buy`. | Pass |
| FI-FILLED-P0-07 | P0 | Submitting the ticket posts a server fake-token order through `/api/orders` and fills against seeded liquidity. | Pass |
| FI-FILLED-P0-08 | P0 | Server Portfolio sync shows filled order, position, and latest activity. | Pass |
| FI-FILLED-P0-09 | P0 | Filled position/activity preserves selected line, period, provider source, and provider token. | Pass |
| FI-FILLED-P0-10 | P0 | Default orderbook UI remains hidden throughout the proof. | Pass |
| FI-FILLED-P1-01 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Open |

## Implementation Notes

- Added `LocalMvpHomeRouteServerFilledFlow` to `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`.
- Shared the FG/FH Home route server proof block and parameterized artifact names for FI.
- Added `mobile/scripts/local-mvp-home-route-server-filled-proof.ps1` to seed a disposable route-backed event, seed matching spread counterparty liquidity, create a temporary mobile dev credential, launch server market-data/server order mode, and run the tablet proof.
- No backend route, schema, or service code was changed.

## Android Proof

Device:

- Samsung tablet, Expo Go, port `8278`

Command:

```powershell
powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-home-route-server-filled-proof.ps1 -Port 8278 -BackendBaseUrl http://172.16.200.14:3002
```

Evidence:

- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-event.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-counterparty.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-wrapper.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-proof.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-home.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-detail-top.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-line-markets.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-portfolio.xml`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-home.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-detail-top.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-line-markets.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-portfolio.png`

## Audit Gate

Pass for selected Local MVP Home -> Event Detail -> Spread ticket -> server fake-token order -> filled Portfolio position/activity flow.

Unresolved P0 gaps: 0.

Remaining P1/P2 gaps:

- Replace disposable provider-shaped proof events with production active Polymarket event breadth.
