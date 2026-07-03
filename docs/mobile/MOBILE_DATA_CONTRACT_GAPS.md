# Mobile Data Contract Gaps

Purpose: track fields, route mismatches, schema mismatches, ignored backend fields, temporary mock/static data, and future migration concerns discovered during mobile parity cycles.

## Cycle T - Whole-App Navigation And Page Map

Fields Holiwyn needs but backend does not provide yet:

- Sports/category rail metadata matching the Polymarket-style top rail: category id, label, icon/emoji/image, ordering, active state, and destination route.
- Page-map/navigation metadata for World Cup sub-tabs such as Games and Futures.
- Dedicated live sports feed metadata, including category counts and live/final grouping.
- Account/settings route metadata for profile, login, preferences, notifications, and wallet controls.

Fields backend provides but mobile ignores:

- Unknown for navigation because this cycle did not inspect live backend payloads.
- Existing mobile adapter consumes only the event/market/portfolio/profile fields declared in `mobile/src/types.ts`.

Schema mismatch:

- Mobile currently treats primary navigation as local UI state rather than backend-provided route configuration.
- Polymarket exposes top-level sports/category rail behavior that is not represented in the Holiwyn backend contract.

Route mismatch:

- Mobile uses `/api/events` with query params for Home/Search/Live-style discovery.
- A future backend route may need dedicated discovery endpoints such as `/api/mobile/navigation`, `/api/mobile/sports`, `/api/mobile/live`, or `/api/events?status=live`.

Temporary mock/static data:

- `worldCupEvents` and `worldCupFutures` remain local fallback data for discovery/navigation proof.
- Header promo, notifications feedback, and account shell are local-only prototype states.

Future migration concern:

- If the backend later owns app navigation categories, the mobile `SportNav`, `WorldCupSegmented`, and `BottomTabs` contracts should be split into static app shell navigation and backend-driven sports/category discovery.

## Cycle U - Event Page Top Shell/Action Controls

Fields Holiwyn needs but backend does not provide yet:

- Canonical `primaryMarketId` for each event detail payload.
- Order-book/depth fields per market/outcome: bid levels, ask levels, sizes, spread, last updated timestamp, and suspended/no-liquidity state.
- Canonical share URL/deep link per event/market.
- Localized share copy fields for English and Chinese.

Fields backend provides but mobile ignores:

- Unknown for this cycle; the proof used the existing event adapter and did not inspect a fresh live backend payload.

Schema mismatch:

- Mobile can render an Order Book overlay from event/outcome fields, but the backend contract does not yet define a Polymarket-style order-book/depth object.
- Share behavior currently derives from local event title/slug rather than a backend-owned canonical route.

Route mismatch:

- Event details use `/api/events/:slug`; a future depth route likely needs `/api/markets/:id/book` or equivalent included `market.depth` data.
- Share/deep-link generation may need `/api/mobile/share/event/:slug` or app config route metadata if server-generated links are required.

Temporary mock/static data:

- Order Book rows fall back to local market/outcome values.
- Share sheet uses local app copy and does not invoke a native or backend-generated share link in this focused pass.

Future migration concern:

- The mobile UI now expects top-shell Order Book behavior. If backend depth is unavailable in server mode, the app may show stale or synthetic depth unless the backend adds real market-depth support.

## Cycle V - Futures Market Rows

Fields Holiwyn needs but backend does not provide yet:

- Outcome-level futures volume, separate from market-level volume.
- Complete World Cup futures outcome catalog and ranking/order.
- Binary YES price and NO price per outcome.
- Explicit trade contract side: `YES` / `NO` separate from order action `BUY` / `SELL`.
- Outcome visual metadata such as flag/icon/image.

Fields backend provides but mobile ignores:

- Unknown for this cycle; proof used local fallback futures data.

Schema mismatch:

- Mobile can show `Buy No`, but the current ticket/order shape treats this as a sell/no-side approximation. Polymarket futures rows behave like binary YES/NO controls per outcome.
- Mobile derives outcome volume locally rather than consuming backend outcome-level volume.

Route mismatch:

- Futures discovery is folded into `/api/events`; future mobile routes may need dedicated `/api/mobile/world-cup/futures` or richer filters for sports/futures ranking.
- Binary NO pricing may need quote routes to return both yes and no sides per outcome.

Temporary mock/static data:

- `futureOutcomeVolume()` computes deterministic display volume from probability and rank.
- `futureOutcomeFlags` maps known fallback outcome ids to local flag markers.

Future migration concern:

- Once backend provides real futures outcome volume and yes/no prices, the local display helpers should be replaced by adapter-mapped fields to avoid fake liquidity signals.

## Cycle W - Futures Chart Range

Fields Holiwyn needs but backend does not provide yet:

- Market history series by market id and range.
- Per-outcome timestamped probability/price points.
- Range metadata for `1H`, `1D`, `1W`, `1M`, and `MAX`.
- Chart unavailable/loading/empty state metadata.
- Optional chart display settings/defaults.

Fields backend provides but mobile ignores:

- Unknown for this cycle; no backend history payload was inspected.

Schema mismatch:

- Mobile currently represents chart ranges as local UI state only.
- Polymarket reference implies live historical series per range; Holiwyn does not yet have a server contract for those points.

Route mismatch:

- A future route such as `/api/markets/:id/history?range=1D` or `/api/mobile/markets/:id/chart?range=1D` is needed.

Temporary mock/static data:

- Chart lines are deterministic local visual bands.
- Volume uses the futures card display helper instead of range-specific historical volume.

Future migration concern:

- Once real history is available, local chart geometry should be replaced by adapter-driven series rendering and tested with empty/no-history and suspended-market states.

## Cycle X - Match Market Tabs And Cards

Fields Holiwyn needs but backend does not provide yet:

- Explicit event market tab metadata, including tab id, label, order, enabled/empty state, and market group ids.
- Card-level market group type, for example `team_to_advance`, `moneyline_reg_time`, `exact_score`, and `halves`.
- Card-level volume distinct from event-level volume.
- Outcome button display price in cents and, where applicable, separate yes/no sides.
- Market-depth rows with price, shares, and total for each card/outcome.
- Card-level historical graph series for `Order Book`/`Graph` detail views.
- Exact-score outcome catalog and ordering.
- Half-market grouping and display ordering.
- Match-level `Live stats` payload.

Fields backend provides but mobile ignores:

- Unknown for this cycle; the focused proof used local/fallback event data.

Schema mismatch:

- Mobile currently derives Team to Advance from the primary event outcomes rather than a backend-declared market card.
- Mobile renders exact score and halves from local/fallback structures rather than a general market-group schema.
- Inline Order Book and Graph are UI states without a backend depth/history payload.

Route mismatch:

- `/api/events/:slug` is the likely home for grouped market discovery, but it needs richer nested market/card metadata.
- Future depth/history may need dedicated routes such as `/api/markets/:id/book` and `/api/markets/:id/history?range=1D`, or nested depth/history snapshots in the event detail response.

Temporary mock/static data:

- Team to Advance card volume is static display copy.
- Inline order-book rows and inline graph content are deterministic local values.
- Exact-score rows are local examples.

Future migration concern:

- Once backend market groups exist, EventDetail should render tab/card sections from server-provided group metadata instead of hardcoded local sections.

## Cycle Y - Line Adjustment

Fields Holiwyn needs but backend does not provide yet:

- Line market group id and market type, for example `spread` and `totals`.
- Period id/label/order, for example regulation time, first half, and second half.
- Line option list per market group and period.
- Stable market id per line/period/outcome combination.
- Outcome labels and quote prices/probabilities per selected line.
- Line-market depth/book rows.
- Line-market history/chart rows.
- Order/position/history fields that preserve line, period, market type, and selected outcome.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Mobile currently derives spread/totals line prices locally rather than consuming quote rows.
- Ticket line identity is carried as display metadata instead of a backend-owned line market id.

Route mismatch:

- `/api/events/:slug` should include grouped line markets, but a future quote/depth route may also be needed, for example `/api/markets/:id/quote` or `/api/markets/:id/book`.

Temporary mock/static data:

- Spread and totals line options are local arrays.
- Line probabilities and odds are deterministic local calculations.

Future migration concern:

- Once backend line markets exist, ticket/order payloads should submit the backend line-market id instead of relying on display label parsing.

## Cycle Z - Trade Ticket

Fields Holiwyn needs but backend does not provide yet:

- Live quote preview for selected market/outcome/side/amount.
- Fee estimate, slippage impact, estimated shares, average price, and payout/proceeds returned from backend.
- Stable ticket selection payload for line markets, including market type, line, period, and backend market id.
- Auth/restriction state for view-only/download/login gates.
- Submit response fields that support immediate portfolio/open-order/activity updates.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used fake-token mode.

Schema mismatch:

- Mobile computes ticket estimates locally from probability rather than backend quote data.
- Fake-token mode uses local order state rather than server order status/fill state.

Route mismatch:

- A future quote route is needed, for example `/api/mobile/quote` or `/api/markets/:id/quote`, before production-style ticket estimates can be trusted.
- Auth/restriction state should be exposed through profile/session config rather than hardcoded UI state.

Temporary mock/static data:

- 10,000 USDT fake balance.
- Client-side shares/payout/profit math.
- Fake-token mock order submission.

Future migration concern:

- When real-money trading is enabled, ticket submit should depend on server quote/order contracts and not on client-only probability math.

## Cycle AA - Portfolio

Fields Holiwyn needs but backend does not provide consistently yet:

- Canonical selected market identity for every portfolio item, including line market id, line value, period, market type, and outcome id.
- Open-order cancel response that includes canceled activity metadata and remaining/fill economics.
- Position re-trade/close quote fields matching ticket quote requirements.
- Activity rows with execution price, filled shares, implied odds, timestamp, side, and selected line metadata.
- Auth/restriction state to decide whether Portfolio should show fake-token mode, sign-in gate, or production wallet state.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used fake-token mode and local fixtures.

Schema mismatch:

- Fake-token Portfolio stores selected line metadata locally; production backend needs a canonical schema for the same identity.
- Canceled orders can be represented as activity locally, but server history must expose canceled order activity consistently.

Route mismatch:

- Portfolio uses `/api/portfolio` and history routes when server mode is active, but fake-token proof remains local.
- Cancel uses `DELETE /api/orders/:id` in server mode; same-cycle server proof is deferred.

Temporary mock/static data:

- Fake balance and local positions/orders/activity.
- Disposable open-order fixture for cancel proof.

Future migration concern:

- Production Portfolio should be server-authoritative after every order/cancel/close, with local optimistic UI reconciled from backend snapshots.

## Cycle AB - Search/Explore

Fields Holiwyn needs but backend does not provide consistently yet:

- Search/Explore row rank and category/facet metadata.
- Canonical sport/category labels such as `Sports · Soccer`.
- Row-level volume, today volume, liquidity, comment/chat count, and end-time display strings.
- Result probability/outcome summary chosen by backend rank.
- Facet counts for status, category, saved, live, and other discovered Polymarket-style filters.
- Cursor/pagination metadata for long discovery lists.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; mobile currently consumes existing event/market/outcome data and local fallback rows.

Schema mismatch:

- Holiwyn currently computes Search row metrics locally from event/market shape.
- Saved state is local/profile-preference driven, not integrated into a ranked server Search endpoint.
- Polymarket global Search categories exceed Holiwyn's current World Cup-only product scope.

Route mismatch:

- Existing `/api/events` can hydrate event lists, but a production Search/Explore experience should likely use a dedicated route such as `/api/mobile/search` or `/api/discovery`.
- Search filters and sort are client-side over loaded events in this cycle.

Temporary mock/static data:

- Local row volume/today/liquidity/chat metrics.
- Local category chips limited to All, Sports, World Cup, and Live.
- Local status/sort filter panel.

Future migration concern:

- Backend should become authoritative for ranked discovery, search aliases, localized matching, facets, and pagination before production-scale World Cup market catalogs are used.

## Cycle AC - Account/settings

Fields Holiwyn needs but backend does not provide consistently yet:

- Auth/session state for signed-out, signed-in, restricted, and fake-token modes.
- Account/settings menu availability and destination metadata.
- Profile identity fields for display name, account id, tier, notification state, and language.
- Safe wallet capability flags for deposit, withdraw, and future EBPay availability.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; the proof used local mock account state.

Schema mismatch:

- Account sign-in is currently a local AsyncStorage mock flag.
- Language/ticket defaults can sync through profile preferences, but the account/settings shell is not yet server-authoritative.

Route mismatch:

- Production auth/session routes are not wired.
- Wallet capability/config route is missing by design until the wallet milestone.

Temporary mock/static data:

- Local mock sign-in and sign-out.
- Static More/settings menu rows.
- 10,000 USDT fake-token balance display.

Future migration concern:

- Real-money wallet, EBPay, deposit, and withdrawal controls must remain disabled until a dedicated auth/wallet/compliance milestone defines backend contracts.

## Cycle AD - Chart Behavior

Fields Holiwyn needs but backend does not provide consistently yet:

- Timestamped market/outcome chart series by selected market id, outcome id, and range.
- Current point metadata: timestamp, probability, price, volume, and whether the point is live/delayed.
- Target/reference line metadata when the chart needs a beat/threshold/reference value.
- Range/filter metadata matching Polymarket-style chart controls.
- Empty/loading/suspended/no-history chart states.
- Optional nearest-point payload for press/tooltip behavior.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; mobile used local event probability and local chart point math.

Schema mismatch:

- Mobile currently derives chart points from current event/outcome probability instead of consuming backend series rows.
- Tooltip state is local UI state, not a backend-provided nearest historical point.
- The event detail payload does not identify chart-specific range availability or empty/no-history state.

Route mismatch:

- Existing `/api/events/:slug` can hydrate event context but is not enough for historical chart parity.
- A future route is needed, for example `/api/markets/:id/history?range=1D&outcomeId=<id>` or `/api/mobile/events/:slug/chart`.

Temporary mock/static data:

- `selectedChartPoint` cycles through local `latest`, `mid`, and `target` states.
- Tooltip values are deterministic calculations from current probability.
- Chart target/reference line is a local visual baseline.

Future migration concern:

- Once backend history exists, EventDetail should render the chart from server series and use a loading/empty/suspended chart state rather than synthetic local points.
