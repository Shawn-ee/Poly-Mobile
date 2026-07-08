# MVP Local Runtime Readiness - 2026-07-06

## Runtime Scope

Goal: run the local Poly backend plus Expo mobile app in server mode and verify a connected Samsung S23 can display backend event, market, account, and order data.

This is an internal fake-token runtime check. It is not a public deployment signoff.

## Services

| Service | Status | URL / Port |
| --- | --- | --- |
| Postgres Docker compose database | Running, healthy | `localhost:5432` |
| Next/backend dev server | Running | `http://127.0.0.1:3002`, LAN `http://172.16.200.14:3002` |
| Expo mobile dev server | Running | `exp://172.16.200.14:8081` |
| Samsung S23 ADB | Connected | `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` |

Mobile Expo environment used:

| Variable | Runtime value |
| --- | --- |
| `EXPO_PUBLIC_ORDER_MODE` | `server` |
| `EXPO_PUBLIC_MARKET_DATA_MODE` | `server` |
| `EXPO_PUBLIC_API_BASE_URL` | `http://172.16.200.14:3002` |
| `EXPO_PUBLIC_API_KEY` | Set with generated mobile dev credential, value intentionally not recorded |

## Backend Data Prepared

- Imported six internal World Cup fixture events with 222 markets and 456 outcomes using the existing upsert-only World Cup import script.
- Imported/refreshed the real Polymarket-backed World Cup Winner event using the existing FJ provider import/proof script with output written outside the repo.
- Created a mobile dev fake-token credential for `holiwyn-mobile-dev`.
- Prepared local maker liquidity for one fixture market to validate quote availability.
- Submitted one provider-backed fake-token server order for Argentina World Cup Winner. The resulting open order is visible in Portfolio Orders.

## Route Checks

| Route | Result |
| --- | --- |
| `GET /api/health` | Pass, database connected |
| `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=3` | Pass, returns backend events and pagination |
| `GET /api/events?...search=World Cup Winner...` | Pass, returns real provider-backed event |
| `GET /api/mobile/events/world-cup-2026-curacao-vs-cote-divoire-2026-06-25/live-detail` | Pass, regulation 90 profile, draw-capable market, grouped game lines |
| `GET /api/mobile/events/mobile-fj-real-world-cup-winner/live-detail` | Pass, no-draw/full-match style provider-backed event with provider metadata |
| `GET /api/markets/:id/quote` | Pass, fixture liquidity and provider-backed quote routes return prices |
| `GET /api/portfolio` | Pass with mobile credential, returns server balance, open orders, and empty positions |
| `GET /api/profile/summary` | Pass with mobile credential, returns profile/preferences/account summary |
| `POST /api/orders` | Pass for provider-backed fake-token limit order; created an open order |
| `GET /api/orders?limit=5` | Pass, returned the created open order |

## Samsung S23 Runtime Proof

ADB opened `exp://172.16.200.14:8081` on the Samsung S23. UI hierarchy checks showed:

- Home rendered 7 backend events, including `mobile-fj-real-world-cup-winner`.
- Home rendered a regulation match card with three outcomes: home, Draw, away.
- Event Detail for the provider-backed World Cup Winner rendered primary outcomes, Game Lines, Player Props placeholder, and provider market/condition metadata.
- Search rendered 7 backend route results.
- Portfolio rendered backend account balance, value-history chart status `ready`, and the server open order in Orders.

## Remaining Runtime Notes

- Fixture-only markets can display and quote after local maker liquidity, but provider-backed trading guards reject fixture orders because they lack accepted provider quote snapshots. This is expected guard behavior.
- The real provider-backed World Cup Winner path accepted a fake-token server order and exposed it in Portfolio Orders.
- Public deployment is still not approved by this runtime check. This is ready for internal local testing only.
