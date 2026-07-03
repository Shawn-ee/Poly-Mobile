# Mobile Backend Route Dependency Map

Purpose: document what the mobile app needs from backend routes, auth, request/response contracts, database models, and mock fallbacks for each feature cycle.

## Cycle T - Whole-App Navigation And Page Map

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / World Cup discovery | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&search=World+Cup` | GET | Optional; bearer token sent if runtime API key exists | None | `events[]`, event id/slug/title/status/startsAt/markets/outcomes/volume/liquidity/traders | Events, markets, outcomes, sports/league taxonomy | `worldCupEvents` local mock data if server hydration is unavailable | Backend should eventually expose Polymarket-style sports/category rail metadata and page-map ordering. |
| Event detail entry from navigation | `/api/events/:slug` | GET | Optional; bearer token sent if runtime API key exists | None | event detail, markets, outcomes, line/selection metadata when available | Events, markets, outcomes, market groups, lines | Local event detail mock data from `worldCupEvents` | Full page-map route metadata is not provided by backend. |
| Live tab | Same event list route with local live filtering today | GET | Optional | None | event status and live clock-like fields when available | Events, market status, live state | Local filtering of mock events where `status === "live"` | Backend should provide a dedicated live sports feed or `status=live` filter. |
| Portfolio tab | `/api/portfolio` and `/api/portfolio/history` when server mode is active | GET | Required for real user data; demo can run without auth in mock mode | None | wallet balance, positions, open orders, history/recent trades/canceled orders | Users, wallets, positions, orders, fills/trades, activities | Local fake 10000 USDT balance, local positions/open orders/activity | Auth/session model and production wallet are intentionally not complete. |
| Search tab | Same event list route with `search=<query>` | GET | Optional | None | filtered `events[]` | Events/search index, markets/outcomes | Local filtering over mock events/futures | Backend search ranking/categories are still thinner than Polymarket. |
| Account header entry | `/api/profile/preferences` when server mode and API key are available | GET/PUT | Required for server preferences; mock mode local only | PUT sends `ProfilePreferences` | language, ticket defaults, saved/profile preferences when supported | Users, profiles, preferences | Local AsyncStorage/preferences and mock signed-in state | Full auth, profile, KYC, wallet settings, notification settings are incomplete. |

Navigation-only implementation notes:

- This cycle does not add new backend calls.
- The main frontend state transition is `setMainTab()`.
- Account moved from bottom nav to header, but backend dependencies for account/profile remain unchanged.
- Polymarket reference shows Settings/profile outside the four bottom tabs, so future backend/profile work should treat account/settings as a top-level utility route rather than a primary market-browsing tab.
