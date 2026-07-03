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

## Cycle U - Event Page Top Shell/Action Controls

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail top shell | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional; bearer token sent if runtime API key exists | None | event id/slug/title/status/startsAt, markets, outcomes, probabilities, prices, volume/liquidity/depth-like fields when present | Events, markets, outcomes | `worldCupEvents` local event detail data | Backend should expose enough metadata to identify primary market and top-shell context consistently. |
| Event Order Book overlay | No dedicated route in this cycle; derived from loaded market/outcome data | N/A | N/A | N/A | primary market title/outcomes, bestBid, bestAsk, bidSize/askSize or equivalent fallback values | Markets, outcomes, order book/depth snapshots, liquidity | Local deterministic depth rows from primary market outcomes | A dedicated live order-book/depth route is needed, for example `/api/markets/:id/book`, or included market depth snapshots in `/api/events/:slug`. |
| Event share sheet | No backend route | N/A | N/A | N/A | event title/slug and app-generated share copy/link | Events/shareable routes | Local share panel only | Production share links need canonical deep-link/web-link generation and localized copy. |

Cycle U implementation notes:

- This cycle does not create or modify backend routes.
- The top book action now maps to Order Book behavior, matching the Polymarket reference better than the previous watchlist notice.
- The future backend/schema milestone should treat order-book depth as a first-class data contract for mobile.

## Cycle V - Futures Market Rows

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures market rows | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` when server discovery is active | GET | Optional; bearer token sent if runtime API key exists | None | future market id/title/type, outcome id/label/probability/color, volume/liquidity when available | Events, markets, outcomes, sports/league taxonomy | `worldCupFutures` local fallback data | Backend should expose complete futures outcome catalogs, outcome-level volume, and ordering. |
| Futures Buy Yes ticket | Existing ticket/order flow after local selection | Client state, then existing order routes when submitting | Auth required for server order submit; mock mode local | Ticket submit uses selected market/outcome/side/amount through existing order services | market id, outcome id, side, probability/price, liquidity/depth | Orders, positions, fills, wallets | Fake-token mock ticket and portfolio state | Route contracts need explicit binary YES/NO side semantics beyond generic buy/sell. |
| Futures Buy No button | No dedicated backend route in this cycle | N/A until submit | N/A | N/A | Uses selected outcome and `side: sell` approximation locally | Binary outcome order book, NO shares, order side model | Opens sell/no-side approximation | Backend/mobile contract needs true NO share or complementary-outcome order semantics. |

Cycle V implementation notes:

- This cycle does not create or modify backend routes.
- The mobile UI now expects outcome-level futures data that the backend should eventually own.

## Cycle W - Futures Chart Range

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures chart/ranges | No dedicated route in this cycle; rendered from local future market/outcome data | N/A | N/A | N/A | outcome label, probability, color, market-level volume | Market history, outcome price history, time buckets | Local deterministic chart lines and local `selectedRange` state | Backend should expose market/outcome history series by range, for example `/api/markets/:id/history?range=1D`. |

Cycle W implementation notes:

- No backend route was created or changed.
- The future API should return timestamped probability/price points per outcome, volume per range, and unavailable/empty states.

## Cycle X - Match Market Tabs And Cards

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail market tabs/cards | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional; bearer token sent if runtime API key exists | None | event id/slug/title/status/startsAt, market groups, outcomes, probabilities, prices, volume/liquidity when available | Events, markets, market groups, outcomes, line markets | Local `worldCupEvents` detail data and local tab/card renderers | Backend should expose explicit market tabs/groups such as Game Lines, Exact Score, Halves, and Player Props. |
| Team to Advance card | No dedicated route in this cycle; derived from loaded event/primary outcome data | N/A | N/A | N/A | outcome label/probability/color, card volume, depth-like rows | Markets, outcomes, order book/depth snapshots | Local card volume `$60.9K Vol.` and deterministic depth rows | Backend should identify card type, card volume, outcome prices, and market depth for `Team to Advance`. |
| Inline card graph | No dedicated route in this cycle | N/A | N/A | N/A | selected card/outcome identity and local graph state | Market history, outcome history | Local inline graph text/visual state | Backend should provide chart/history data for card-level market detail. |
| Exact Score tab | `/api/events/:slug` if server event detail eventually includes exact-score group | GET | Optional | None | exact score outcomes, prices/probabilities, volume/depth | Exact score markets, outcomes, order books | Local sample score rows | Backend should provide exact-score market groups and prices. |
| Halves tab | `/api/events/:slug` if server event detail includes halves groups | GET | Optional | None | first-half and second-half markets/outcomes | Half markets, outcomes, line groups | Existing local first-half/second-half groups | Backend should expose grouped first-half/second-half markets with ordering and prices. |

Cycle X implementation notes:

- This cycle does not create or modify backend routes.
- The mobile UI now expects event detail payloads to support explicit market tabs, card-level depth, card-level history, and grouped exact-score/halves markets.

## Cycle Y - Line Adjustment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spread line selector | `/api/events/:slug` when server event detail is active | GET | Optional; bearer token sent if runtime API key exists | None | spread market group, line options, selected line, outcomes, prices/probabilities, period | Events, markets, line markets, outcomes, line quotes | Local line options and deterministic probability math | Backend should expose all spread lines by period with outcome ids, labels, prices, and market ids. |
| Totals line selector | `/api/events/:slug` when server event detail is active | GET | Optional | None | totals market group, line options, selected line, over/under outcomes, prices/probabilities, period | Events, markets, line markets, outcomes, line quotes | Local line options and deterministic probability math | Backend should expose all totals lines by period with stable market ids and prices. |
| Line ticket carry-through | Existing ticket/order flow after local selection | Client state, then existing order routes when submitting | Auth required for server order submit; mock mode local | Ticket submit uses selected market/outcome/side/amount plus line selection metadata | selected market type, line, period, display label, price/probability | Orders, positions, fills, wallets, line-market orders | Fake-token mock ticket and portfolio state | Backend order routes need explicit line market ids and line metadata to preserve identity in positions/history/open orders. |

Cycle Y implementation notes:

- No backend route was created or changed.
- Future backend work should treat line markets as first-class markets, not display-only modifiers.
