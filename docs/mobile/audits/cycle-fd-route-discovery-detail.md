# Cycle FD - Route Discovery Opens Event Detail

## Scope

Local MVP visible entry flow only:

- Home discovery card
- Route-backed Event Detail
- Chart/probability surface
- Game Lines/outcome identity
- Hidden default orderbook UI

Explicitly out of scope for this cycle:

- Order book UI parity
- Chat
- Live stats
- Social/notification features
- Deposit/location checks

## Reference Baseline

Current product steering keeps the Polymarket-style retail flow as the reference: a user should be able to open a football event from discovery, land on the event page, see probability/chart context, choose a market/outcome, and continue toward a simple Buy/Sell ticket. This cycle did not refresh S23 because the implementation target was a Holiwyn routing correctness gap discovered from tablet proof: Home discovery could show a route-backed event, but opening a card could still land on the older fixture detail.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FD-DISC-P0-01 | P0 | Home discovery shows the route-backed World Cup event with compact tradeable outcomes from `/api/events?includeMobileMarkets=1`. | Pass |
| FD-DISC-P0-02 | P0 | Tapping the route-backed discovery card opens the same event detail instead of the old Mexico/Ecuador fixture. | Pass |
| FD-DISC-P0-03 | P0 | Event detail hydrates from `/api/mobile/events/:slug/live-detail` in server market-data mode. | Pass |
| FD-DISC-P0-04 | P0 | The opened detail page shows event title, chart/probability surface, Game Lines, provider-backed outcomes, and provider source markers. | Pass |
| FD-DISC-P0-05 | P0 | Default orderbook UI remains hidden for the local retail MVP path. | Pass |
| FD-DISC-P1-01 | P1 | Production active Polymarket World Cup event breadth replaces disposable provider-shaped proof events. | Open |
| FD-DISC-P1-02 | P1 | Continue the same visible path into Buy/Sell ticket, fake-token order, and Portfolio/history from Home card entry. | Open |

## Implementation Notes

- `mobile/App.tsx` now routes Home, Live, and Search card taps through `openEventDetail`.
- `openEventDetail` sets the selected event immediately, then hydrates it through `PolyApi.getEvent(event.id)` when `EXPO_PUBLIC_MARKET_DATA_MODE=server`.
- The focused tablet proof taps the route-backed card and verifies the opened detail stays on the same route event.

## Android Proof

Device:

- Samsung tablet, Expo Go, port `8273`

Command:

```powershell
powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpRouteDiscoveryDetail -Port 8273 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-FD-route-discovery-detail -HierarchyOutputDir docs/mobile/harness/cycle-FD-route-discovery-detail
```

Evidence:

- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-proof.json`
- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-home.xml`
- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-open.xml`
- `docs/mobile/screenshots/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-home.png`
- `docs/mobile/screenshots/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-open.png`

## Audit Gate

Pass for selected Local MVP entry flow.

Unresolved P0 gaps: 0.

Remaining P1/P2 gaps:

- Production active Polymarket event breadth.
- Full Home -> Event Detail -> ticket -> fake-token order -> Portfolio/history proof from discovery entry.
