# Mobile Backend Route Dependency Map

Purpose: document what the mobile app needs from backend routes, auth, request/response contracts, database models, and mock fallbacks for each feature cycle.

## Cycle AO - Live Event Detail Backend Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live World Cup event detail | `/api/events/:slug` | GET | Optional for viewing; authenticated order routes later | None | `event.liveStats`, `event.chartHistory`, `market.id`, `marketGroupId`, `marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, `liquidity`, `orderbookDepth[]`, `outcome.id`, `outcome.side`, `price`, `bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize` | `Event.metadata` for optional provider-shaped `liveStats` and `chartHistory`; `Market.marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`; `Outcome.side`; `Order` depth through orderbook snapshot aggregation | Mobile local fixture remains fallback, but the mobile adapter now consumes the same route-shaped fields when server mode hydrates event detail | Real external live-football provider ingestion is still missing; event metadata must be populated before chart/live-stat panels show real values. |
| Live orderbook/depth | Embedded in `/api/events/:slug` market objects for top-level depth; existing dedicated book routes can still be used later for full depth | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total`, plus outcome-level best bid/ask sizes | `Order` grouped open/partial orders through `buildPublicOrderbookSnapshot()` and `getOutcomeQuotes()` | Fixture `orderbookDepth` shape matches the embedded contract | Full depth by price ladder/range, depth timestamps, and no-liquidity/suspended states still need a dedicated route or richer embedded object. |
| Live ticket identity source | Event detail payload feeding existing ticket state | Client state, then existing order routes when submitting | Mock mode no auth; server submit requires API key | Future submit must preserve `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `period`, `line`, `side`, amount, order side | selected event/market/outcome/line identity now survives backend route -> mobile adapter -> `EventDetail` model | Orders, positions, fills, open orders, activity/history | Existing fake-token ticket can open from backend-shaped live markets | Order submission/portfolio/history proof for live line markets is still PM-GAP-068 and not completed by this contract cycle. |

Cycle AO implementation notes:

- This cycle closes the repeated unknown-contract part of PM-GAP-067 for market groups, line identity, outcome side, top depth, and optional chart/live-stat payload shape.
- Backend parity is still not complete because real live-football provider ingestion, full chart history, and full depth routes are not implemented.
- The mobile adapter no longer drops backend market line identity, so future Samsung proof can test real route hydration instead of relying only on local fixture state.

## Cycle AN - Live Event Detail Structural Parity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live World Cup event detail | Intended `/api/events/:slug` live-detail payload or `/api/mobile/events/:slug/live-detail`; current cycle uses local fallback only | GET | Optional for viewing; authenticated order routes later | None | `event.id`, `title`, `status`, `startsAt`, `teams[]`, `markets[]`, `marketGroupId`, `marketId`, `marketType`, `period`, `line`, `outcomeId`, `side`, `probability`, `bestBid`, `bestAsk`, `liquidity`, `chartHistory`, `orderbookDepth`, `liveStats` | Events, teams, markets, market groups, line markets, outcomes, live score/state, quote snapshots, orderbook depth, market history, live stats | `worldCupEvents` live fixture now uses backend-shaped fields for Australia vs Egypt | Real backend route/schema does not yet provide grouped live game detail, live score, line markets, chart history, orderbook depth, or live stats. |
| Live ticket open | Client state from selected live market/outcome; existing order submit routes only after amount/order | Client state, then POST order when submitting | Mock mode no auth; server order mode requires API key | Future submit must include `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `period`, `line`, `side`, amount, order side | selected event/market/outcome identity, live clock, quote/probability, line metadata | Orders, positions, fills, open orders, activity/history with live line identity | Tablet proof opens a live Australia ticket and preserves event/market/outcome in the ticket | Live order-to-portfolio/history identity is not yet re-proven with backend-shaped line fields. |
| Live chart/history | Intended `/api/markets/:marketId/history?range=live` or embedded event detail `chartHistory` | GET | Optional for viewing | None | timestamped `outcomeId`, probability/price points, range, lastUpdated | Market history, outcome price snapshots | Event `chartHistory` fixture feeds the chart series | No real chart-history route/schema currently backs mobile event detail. |
| Live orderbook/depth | Intended `/api/markets/:marketId/book` or embedded `orderbookDepth` | GET | Optional for viewing; authenticated for user-specific order actions | None | bid/ask levels with price, shares, total, spread, liquidity, lastUpdated | Order book, orders, liquidity/depth snapshots | Primary live market includes `orderbookDepth` fixture fields | Existing UI still partly uses local display rows; backend depth contract is not wired end to end. |
| Live stats | Intended `/api/events/:slug/live-stats` or embedded event detail `liveStats` | GET | Optional | None | stat id, label, home value, away value, timeline events, lastUpdated | Live match stats provider/cache | Event `liveStats` fixture feeds the Live stats panel | No real route/provider/schema for live football stats yet. |

Cycle AN implementation notes:

- This cycle intentionally does not mark backend parity complete.
- Frontend dummy data is now shaped like the intended backend contract, so future route integration can replace the fixture without changing the UI model.
- The next structural milestone should inspect Prisma/API support and implement or stub the real route/schema before more visual-only live-detail passes.

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

## Cycle AK - Futures Catalog Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Collapsed World Cup Winner futures catalog | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` when server discovery is active | GET | Optional; bearer token sent if runtime API key exists | None | future market id/title/type, ordered outcomes, probability/price, outcome display label, volume/liquidity when available | Events, markets, outcomes, sports/league taxonomy | `worldCupFutures` now provides 21 local World Cup Winner outcomes and collapses to the first three plus `18 more` | Backend should own full futures catalogs, ordering, and the collapsed row count. |
| Expanded futures catalog | Same discovery/detail payload when available | GET | Optional | None | all outcomes for a futures market, stable outcome ids, yes/no price, outcome volume, visual metadata | Futures markets, outcomes, quote snapshots, market stats | Expanded local fallback list renders all 21 outcomes | Backend should return full outcome catalogs and pagination/expansion hints for large markets. |
| Expanded-row ticket open | Existing ticket/order state after local selection | Client state; existing order routes when submitting | Auth required for server submit; fake-token mock can run without auth | Ticket submit uses selected market/outcome/side/amount through existing order services | market id, outcome id, contract side, probability/price | Orders, positions, fills, wallets | England expanded-row Buy Yes opens fake-token ticket locally | Backend order/quote routes should accept canonical outcome ids from expanded futures catalogs. |

Cycle AK implementation notes:

- No backend route was created or changed.
- The mobile fallback catalog now mirrors the logged-in Polymarket collapse/expand structure, but backend discovery should eventually replace the static catalog and provide live ranking, prices, volume, and availability states.

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

## Cycle Z - Trade Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket open from event outcome | Loaded event data from `/api/events/:slug` when server mode is active | GET | Optional for viewing | None | event title, market id/title, outcome id/label/probability, selection metadata | Events, markets, outcomes | Local `worldCupEvents` fallback data | Backend should provide canonical market/outcome ids and line selection metadata for every ticket entry point. |
| Ticket amount and estimate | No dedicated route in this cycle; computed client-side | N/A | N/A | N/A | outcome probability, balance, side, amount | Quotes, order book, wallet balance | Local fake-token balance and deterministic estimates | Backend quote route should return live price, fees, estimated shares, payout/proceeds, and slippage impact. |
| Ticket submit readiness | Existing fake-token order path; server order routes when enabled | POST on existing order route when server mode submits | Required for real server order | market id, outcome id, side, amount, selection metadata | order id/status, filled shares, execution price, portfolio updates | Orders, fills, wallets, positions, open orders | Mock order state in fake-token mode | Server orders must preserve selected line/period/outcome and return enough data for portfolio/open-order/activity parity. |

Cycle Z implementation notes:

- No backend route was created or changed.
- Mobile now expects the same quick amount presets observed in Polymarket, but estimates still need backend quote support for production parity.

## Cycle AA - Portfolio

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fake-token Portfolio after mock order | Local mock state; `/api/portfolio` when server mode is active | GET in server mode | Required for server user data; not required for fake-token mock mode | None | balance, positions, open orders, recent activity, closed trades | Users, wallets, positions, orders, fills, activities | Local fake balance, local positions/activity after mock order | Server Portfolio must preserve selected line market ids and fill economics. |
| Open-order cancel | Local mock cancel path; `DELETE /api/orders/:id` in server mode | DELETE in server mode | Required for server cancel | order id | canceled order id/status, remaining/fill state, canceled activity metadata | Orders, order status, activity/history | Local open-order fixture and local canceled receipt | Server same-cycle Portfolio cancel proof should be rerun when backend parity is next prioritized. |
| Position re-trade/close entry points | Existing ticket open and close handlers | Client state; server order routes when submitting | Required for server trading | selected position, side, amount when ticket submits | position market/outcome/selection metadata | Positions, orders, fills | Local fake-token position actions | Backend should return canonical close/retrade quote and order status for each position. |

Cycle AA implementation notes:

- No backend route was created or changed.
- Portfolio docs now explicitly require server contracts to preserve selected line-market identity across positions, open orders, and activity.

## Cycle AB - Search/Explore

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search/Explore default list | `/api/events` through existing event hydration path when server mode is active | GET | Optional for public discovery | Query params currently handled by existing event list behavior | event id/title/status/tag/teams/markets/outcomes/probabilities | Events, markets, outcomes, market stats | Local `worldCupEvents` sorted by market/outcome depth | Backend should expose Search/Explore-ranked rows, not only raw event lists. |
| Typed World Cup query | `/api/events?search=<query>` when server mode is active | GET | Optional | Search query in URL params | matching events, teams, markets, outcomes | Event search index, team aliases, market text index | Client filters local events/teams/markets/outcomes | Backend should support ranked search across event, team, market, outcome, and localized names. |
| Search filter/sort | No dedicated route in this cycle; state is client-side over loaded events | N/A | N/A | status filter and sort mode | filtered/sorted rows | Search facets, status aggregates, market category counts | Local status filter and popular/live-first sort | Backend should provide category/facet counts, server-side rank, and cursor pagination. |
| Search result navigation | Existing event detail path after selecting an event | GET `/api/events/:slug` when server detail is active | Optional for viewing | event slug/id | full event detail markets and outcomes | Events, market groups, outcomes, order books | Local selected event opens detail | Backend route should preserve selected search result id/slug and hydrate detail consistently. |

Cycle AB implementation notes:

- No backend route was created or changed.
- Mobile now presents Search as an Explore-style page, so future backend work should treat Search as a ranked discovery endpoint with facets and row metrics.

## Cycle AC - Account/settings

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account/settings shell | `/api/profile/preferences` when profile sync is enabled | GET | Required when server profile sync is active | None | locale, saved event ids, ticket defaults, profile sync status | Users, profile preferences | Local AsyncStorage and app state | Backend should provide full account/settings menu state and auth/session state. |
| Mock login/logout | Local AsyncStorage only in this cycle | N/A | N/A | N/A | signed-in boolean | User session | Local mock session flag | Production auth route is intentionally deferred. |
| Fake-token balance safety | Portfolio/account state; `/api/portfolio` when server mode is active | GET | Required for server mode | None | wallet balance, open positions/orders, total exposure | Wallets, positions, orders | Local 10,000 USDT fake balance | Real deposit/withdraw/EBPay routes are intentionally not implemented. |

Cycle AC implementation notes:

- No backend route was created or changed.
- Account documentation now requires a future session/profile contract before production auth or real-money wallet actions.

## Cycle AD - Chart Behavior

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail chart display | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional for public viewing | None | event id/slug/title/status, primary market/outcome probability, selected outcome label, current event status | Events, markets, outcomes | Local `worldCupEvents` event detail data and deterministic chart point math | Event detail does not provide timestamped chart/history series, target/reference line metadata, or per-outcome historical probabilities. |
| Chart press/tooltip state | No dedicated route in this cycle; computed client-side from selected point | N/A | N/A | N/A | selected chart point label/value/time derived locally | Market history, outcome history, time buckets | Local `latest`/`mid`/`target` point states | Backend should expose nearest-point chart data so tooltip values reflect real historical ticks. |
| Chart filter state | No dedicated route in this cycle | N/A | N/A | N/A | local chart filter labels such as All/Game/Live | Market history ranges, period filters, live tick history | Local filter state and event status | Backend should support range/filter query params for market chart series. |

Cycle AD implementation notes:

- No backend route was created or changed.
- A future route such as `/api/markets/:id/history?range=1D&outcomeId=<id>` or `/api/mobile/events/:slug/chart` should return timestamped probability/price points, selected outcome metadata, target/reference lines when applicable, loading/empty states, and range/filter support.

## Cycle AE - Market Page

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Market/Live stats body switch | No dedicated route in this cycle; event context comes from `/api/events/:slug` when server mode is active | GET for event context | Optional for public viewing | None | event id/slug/title/status, teams, volume, current market probabilities | Events, teams, match state | Local `activeBodyTab` state | Backend should identify whether live stats are available and expose a stats route/state. |
| Live Stats panel | No backend route in this cycle | N/A | N/A | N/A | possession, shots, shots on target, corners, expected goals, match-flow events | Match stats, live feeds, timeline events | Local deterministic stats rows | Add route such as `/api/events/:slug/live-stats` with home/away stats, timestamps, availability, and empty/error states. |
| Grouped market tabs/cards | `/api/events/:slug` when server detail is active | GET | Optional for viewing | None | market groups/tabs, outcomes, probabilities, line metadata | Events, markets, market groups, line markets | Existing local/fallback event groups | Backend still needs richer group metadata for exact Polymarket-style ordering and Player Props scoping. |

Cycle AE implementation notes:

- No backend route was created or changed.
- Mobile now expects a future live-stats data contract in addition to grouped market metadata, line-market identity, market depth, and chart history.

## Cycle AF - Reference Device Preflight Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reference device preflight | None | N/A | N/A | N/A | N/A | N/A | N/A | None; this is an ADB/device harness. |

Cycle AF implementation notes:

- No backend route was created or changed.
- The harness only inspects ADB device state and writes `docs/mobile/harness/cycle-current-polymarket-reference-device-preflight.json`.

## Cycle AG - Trade Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket open from event outcome | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event id/slug/title/status, market id/title/type, outcome id/label/probability/color, quote/depth fields when present | Events, markets, outcomes, order books | Local `worldCupEvents` event/outcome objects | Backend should provide ticket-ready market title, display period, selected outcome, opposite outcome, binary side semantics, and price/quote metadata. |
| Ticket amount and payout calculation | No dedicated route in this cycle; computed client-side from selected outcome probability | N/A | N/A | N/A | selected outcome probability, balance | Quotes, market depth, wallet balance | Local probability math and fake balance | Backend quote route should return executable price, payout, fees, min/max order size, and slippage bounds. |
| Advanced ticket details | Existing quote/orderbook fields when available through event/outcome hydration | GET for source event/quote context | Optional for viewing | None | best bid/ask, sizes, spread, trading mode | Order books, quote snapshots | Local fallback depth sizes and fake-token mode | Add a dedicated ticket quote/depth endpoint if event hydration is too coarse. |
| Submit fake-token order | Existing ticket order flow through `submitTicketOrder()`; server mode uses order API when enabled | POST in server mode | Required for server mode | market id, outcome id, side, amount, price/selection metadata | order id/status/fill/open-order/position metadata | Orders, fills, positions, activity | Mock order placement in fake-token mode | Binary NO/share side and production trading eligibility gates are not fully modeled. |

Cycle AG implementation notes:

- No backend route was created or changed.
- Mobile first-view ticket now expects market/outcome identity, quote/price, payout, and advanced depth/estimate data to be available in a ticket-ready shape.

## Cycle AH - Binary Side Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures Buy No ticket | Existing futures data from local/server event hydration | GET for market context | Optional for viewing | None | market id/title/type, outcome id/label/probability/color | Markets, outcomes, binary contracts | Local `worldCupFutures` rows | Backend should expose YES and NO contract ids/prices separately for each binary outcome. |
| Submit Buy No order | `/api/orders` through `PolyApi.placeLimitOrder()` in server mode | POST | Required in server mode | `marketId`, `outcomeId`, transaction `side`, `contractSide`, `price`, `size`, optional `selection`, `type`, `clientOrderId` | order id/status/size/remaining/fills | Fake-token mock order in local mode | Backend must accept and persist `contractSide` as separate from transaction side. |
| Portfolio display for No contracts | `/api/portfolio` and `/api/portfolio/history` in server mode | GET | Required in server mode | None | positions/orders/history need selected outcome plus `contractSide` | Positions, orders, fills, activity/history | Local Portfolio state stores `contractSide` | Backend snapshot/history routes should return `contractSide` for positions, orders, canceled orders, and recent trades. |

Cycle AH implementation notes:

- Mobile now sends `contractSide: "YES" | "NO"` with server-mode order payloads.
- No backend route was changed in this cycle; this is a forward-compatible mobile contract update.

## Cycle AI - Trade Ticket Surface

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tall ticket open from game outcome | `/api/events/:slug` when server detail is active | GET | Optional for viewing | None | event title/status, market title/type, outcome label/probability/color, selection metadata | Events, markets, outcomes | Local event/outcome data | Backend should return ticket-ready display metadata and eligibility state with event detail or a ticket quote route. |
| Swipe-ready amount state | No dedicated route in this cycle; calculated client-side | N/A | N/A | N/A | amount, selected side, selected contract side, probability | Quotes, wallet, eligibility | Local fake-token balance and probability math | A future ticket quote route should return executable price, payout/proceeds, fee, max/min, and whether swipe confirmation is allowed. |
| Production eligibility/location state | Not implemented in Holiwyn fake-token mode | N/A | Required for real-money mode later | N/A | eligibility status, block reason, support action, login/location state | Users, sessions, geo/eligibility checks | Fake-token mode always allows mock submit when amount is valid | Add server-authoritative `tradingEligibility` before real-money trading. |

Cycle AI implementation notes:

- No backend route was created or changed.
- This cycle changes the mobile ticket surface only; server-mode order submission continues to use the existing order path.

## Cycle AJ - Game Page Compact Scrolled Header

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact scrolled match header | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event title/status/start time, teams, primary outcome probabilities/colors | Events, teams, markets, outcomes | Local event/team/outcome data | Backend should provide stable team codes, localized short names, and current probabilities for compact game headers. |
| Scrolled market rows proof | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | market groups, line values, periods, outcome probabilities | Market groups, line markets, outcomes | Local deterministic game-line groups and probabilities | Backend should provide Polymarket-style ordered market groups, line selectors, and per-period prices. |

Cycle AJ implementation notes:

- No backend route was created or changed.
- This is a presentation-layer parity cycle; future backend work should make compact header and market rows server-authoritative.

## Cycle AL - Game Page Sticky Market Tabs

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sticky market tab rail | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event title/status/start time, teams, primary outcome probabilities, market tab/group availability | Events, teams, markets, market groups | Local event/team/outcome data and local tab list | Backend should expose ordered market tabs/groups and whether Player Props is available or empty for a given match. |
| Sticky Player Props switch | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | player props group rows, player names, stat type, prices, probabilities | Markets, player props, players, outcomes | Local Player Props rows | Backend should provide soccer player-prop availability and empty/loading states rather than relying on local fallback props. |

Cycle AL implementation notes:

- No backend route was created or changed.
- This is a presentation-layer parity cycle; future backend work should return market-tab metadata and grouped rows in the same order the mobile page displays them.

## Cycle AM - Player Props Unavailable State

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Player Props unavailable state | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event id/slug/title and eventual Player Props availability flag | Events, markets, players, player props | Local unavailable state | Backend should eventually provide `playerPropsAvailability` and prop rows only when supported. |

Cycle AM implementation notes:

- No backend route was created or changed.
- Mobile intentionally avoids local fake player-prop rows until backend-supported Player Props data exists.
