# Cycle FE - Home Route Event Opens Ticket

## Scope

Local MVP visible retail flow:

- Home route-backed event card
- Event Detail hydration
- Game Lines scroll
- Spread outcome tap
- Simple Buy/Sell ticket identity

Explicitly out of scope:

- Order book UI
- Chat
- Live stats
- Social/notification behavior
- Deposit/location checks
- Portfolio/order submission, which remains the next flow step

## Reference Baseline

The active product direction prioritizes Polymarket-like retail trading: users should open a football event, view probability/chart context, select a market/outcome, and open a simple Buy/Sell ticket. FE focuses on the Home-entry version of that path and does not claim full Polymarket parity.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FE-TICKET-P0-01 | P0 | Home shows a route-backed World Cup event card with compact outcomes. | Pass |
| FE-TICKET-P0-02 | P0 | Tapping the Home card opens the same route-backed Event Detail with chart/probability and Game Lines. | Pass |
| FE-TICKET-P0-03 | P0 | Event Detail exposes a route-backed Spread row with backend line-market identity. | Pass |
| FE-TICKET-P0-04 | P0 | Tapping the Spread outcome opens the simple ticket. | Pass |
| FE-TICKET-P0-05 | P0 | Ticket preserves selected market type, line, period, side, provider source, and provider token. | Pass |
| FE-TICKET-P0-06 | P0 | Default orderbook UI remains hidden throughout the Home -> Detail -> Ticket proof. | Pass |
| FE-TICKET-P1-01 | P1 | Submit the Home-opened ticket as a fake-token order and prove Portfolio/history. | Open |
| FE-TICKET-P1-02 | P1 | Repeat the Home-opened ticket proof against production active Polymarket-backed events. | Open |

## Implementation Notes

- Added `LocalMvpHomeRouteTicketFlow` to `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`.
- The harness starts on Home, taps the route-backed event card, scrolls to Game Lines, taps `event-detail-outcome-spread-spread-yes`, and verifies the ticket markers.
- No backend route or schema changes were needed.

## Android Proof

Device:

- Samsung tablet, Expo Go, port `8274`

Command:

```powershell
powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8274 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-FE-home-route-ticket -HierarchyOutputDir docs/mobile/harness/cycle-FE-home-route-ticket
```

Evidence:

- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-event.json`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-proof.json`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-home.xml`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-detail-top.xml`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-line-markets.xml`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-spread-ticket.xml`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-home.png`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-detail-top.png`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-line-markets.png`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-spread-ticket.png`

## Audit Gate

Pass for selected Local MVP Home -> Event Detail -> Spread ticket flow.

Unresolved P0 gaps: 0.

Remaining P1/P2 gaps:

- Continue this same Home-opened path into fake-token order submission.
- Continue from order submission into Portfolio/history.
- Replace disposable provider-shaped proof events with production active Polymarket event breadth.
