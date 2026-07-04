# Live Event Detail Audit

Status: Cycle CS passed Samsung tablet proof for the scoped provider quote top-of-book depth bridge after refreshed provider snapshots moved the disposable event from stale/refresh-due to ready. Cycle CR proved real provider-owned stale/refresh-due to ready refresh plus cache invalidation on a disposable mapped provider event and passed Samsung tablet proof. Cycle CQ added manual provider slug preview and passed Samsung tablet regression proof. Cycle CP added protected provider candidate discovery and passed Samsung tablet regression proof. Cycle CO added protected provider identity attach dry-run/apply behavior and passed Samsung tablet regression proof. Cycle CN added protected provider mapping readiness for compact live detail and passed Samsung tablet regression proof. Cycle CM added protected provider refresh execution/invalidation for compact live detail and passed Samsung tablet proof after refresh. Cycle CL passed provider refresh policy contract proof for compact live detail and selected second-half orderbook. Cycle CK passed provider quote snapshot ready-state proof for compact live detail and selected second-half orderbook. Cycle CJ passed provider quote snapshot metadata contract and tablet regression proof. Cycle CI passed compact depth batching policy metadata and preserved tablet route-depth proof. Cycle CH passed batched compact-market route-backed depth proof. Cycle CG passed selected second-half orderbook depth proof. Cycle CF passed selected first-half orderbook depth proof. Cycle CE passed compact per-visible-market availability contract proof. Cycle CD passed selected orderbook availability contract proof. Cycle BC passed the live provider freshness contract and tablet proof. Cycle BB passed selected Team Totals seeded ready-depth proof. Cycle BA passed compact line-group coverage and selected Totals seeded ready-depth proof. Cycle AZ passed selected Spread line-market seeded ready-depth proof. Cycle AY passed selected line-market depth identity proof. Cycle AX passed the compact mobile live-detail route and route-backed primary orderbook-depth tablet proof. Cycle AN passed structural live event detail UI with backend-shaped fixture data and tablet proof; Cycle AO added the real `/api/events/:slug` contract for market identity, line identity, compact depth, and optional chart/live-stat arrays. Cycle AQ sources embedded chart history from `MarketOutcomeSnapshot` rows when available and preserves depth outcome identity in mobile. Cycle AR adds the dedicated `/api/markets/:marketId/chart?range=...` route/client contract. Cycle AS wires EventDetail to consume that chart route in server mode. Cycle AT adds deterministic `MarketOutcomeSnapshot` seeding for local/server proof. Cycle AU exposes chart loading/empty/error route states in the game chart. Cycle AW seeded route-readable orderbook depth. This is still not full backend parity because the local compact World Cup event is not mapped to real Polymarket markets, provider-owned full CLOB depth for all live markets remains open, and provider-owned live stats if product keeps that tab remain open.

## Scope

- Feature: World Cup live football game detail.
- Reference device: Samsung S23 running Polymarket Android experience.
- Holiwyn proof device: Samsung tablet running Holiwyn through Expo Go.
- Cycle branch name: `mobile/cycle-AN-saved-watchlist-parity`, re-scoped honestly to live event detail after product steering changed.
- Out of scope: deposit, location verification, notifications, non-football live markets, World Cup informational ad/detail pages.

## Cycle CS Provider Quote Top-Of-Book Depth Bridge Audit

Result: Pass for the scoped provider quote top-of-book depth bridge. Backend/API route proof and Samsung tablet proof both pass; this remains partial only for full provider CLOB ladder parity and real World Cup provider mapping.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app with visible Book/depth behavior on live prediction markets.
- Cycle CS targeted the data behavior behind the Book surface rather than a new visual section.

What became materially closer to Polymarket:

- Holiwyn no longer has to show an empty Book route when provider quote snapshots contain top bid/ask and liquidity.
- The backend now distinguishes local orderbook depth from provider quote snapshot depth and labels provider sizes as estimated.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CS-P0-01 | P0 | Orderbook route returns `depthSource=provider-quote-snapshot` when local depth is empty but refreshed provider quotes have bid/ask plus liquidity. | Route proof | Pass |
| LED-CS-P0-02 | P0 | Route keeps `emptyState=no-depth` when provider snapshots lack liquidity/volume basis, preventing fabricated depth. | Unit test | Pass |
| LED-CS-P0-03 | P0 | Server-hydrated EventDetail preserves backend depth as route-backed depth for the selected Book state. | Mobile typecheck/unit coverage | Pass |
| LED-CS-P0-04 | P0 | Holiwyn Android device proof shows selected Book route depth after provider refresh. | Samsung tablet proof | Pass |
| LED-CS-P1-01 | P1 | Full provider CLOB/orderbook ladder is available, not only top bid/ask quote depth. | Future provider depth proof | Open |
| LED-CS-P1-02 | P1 | Real World Cup compact soccer markets are mapped to provider identities and use this bridge. | Future provider import proof | Open |

Holiwyn evidence:

- Route proof: `docs/mobile/harness/cycle-current-mobile-provider-quote-depth-route-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-provider-quote-depth-proof-prep.json`
- Device proof summary: `docs/mobile/harness/cycle-current-holiwyn-provider-quote-depth-proof-summary.json`
- Device XML proof: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Device screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`
- Unit/build proof: `cmd /c npm.cmd run test:ci -- src/__tests__/orderbook-snapshot.provider-depth.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts`, `cmd /c npm.cmd run build`, mobile `cmd /c npm.cmd run typecheck`

Unresolved P0 gaps: 0 for Cycle CS scoped provider quote top-of-book bridge.

Remaining P1/P2 gaps:

- Full provider depth ladder instead of top-of-book quote bridge.
- Real World Cup compact soccer provider mapping.

## Cycle CR Provider-Owned Refresh And Cache Invalidation Audit

Result: Pass for provider-owned stale/refresh-due to ready route transition and Android tablet proof on a disposable mapped provider event. Partial for full World Cup provider parity because real World Cup compact soccer mappings and provider-owned depth remain open.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, expandable market rows, and live/provider-backed prices.
- Cycle CR did not open a new visual UI surface. It targeted the backend/provider freshness behavior required before Holiwyn can honestly match the live event detail page.

What became materially closer to Polymarket:

- Holiwyn can now refresh provider-owned compact market snapshots from a real Gamma market without the local proof fallback.
- The refresh route now owns invalidation for live-detail, public event, and selected orderbook routes.
- Android proof shows the refreshed provider source and best bid/ask on the game page and Book surface.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CR-P0-01 | P0 | A provider-mapped compact market can start stale/refresh-due through backend-shaped `ReferenceQuoteSnapshot` rows. | Route proof | Pass |
| LED-CR-P0-02 | P0 | Protected provider refresh runs with `allowContractProofFallback=false` and attempts the real provider. | Route proof | Pass |
| LED-CR-P0-03 | P0 | Refresh updates provider snapshots and moves live-detail from stale/refresh-due to ready. | Before/after route proof | Pass |
| LED-CR-P0-04 | P0 | Refresh response returns explicit cache invalidation for live-detail, public event, and affected orderbook routes with zero errors. | Route proof and route test | Pass |
| LED-CR-P0-05 | P0 | Holiwyn Android device shows refreshed provider status/source and selected Book provider best bid/ask. | Samsung tablet screenshot/XML | Pass |
| LED-CR-P1-01 | P1 | Real World Cup compact soccer markets are mapped to provider identities and refreshed without fallback. | Future provider import proof | Open |
| LED-CR-P1-02 | P1 | Provider-owned quote/depth data supplies full orderbook ladders where Polymarket exposes depth. | Future orderbook/provider proof | Open |

Holiwyn evidence:

- Proof prep: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-proof-prep.json`
- Route proof: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-real-provider-proof.json`
- Tablet summary: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-summary.json`
- Tablet screenshots/XML: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-event-detail.png`, `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`, `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Route test/build proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts`, `cmd /c npm.cmd run build`, mobile `cmd /c npm.cmd run typecheck`

Unresolved P0 gaps: 0 for Cycle CR provider-owned refresh/invalidation scope.

Remaining P1/P2 gaps:

- Map real World Cup compact soccer markets to provider identities.
- Add or document the provider-depth bridge needed for full orderbook parity.
- Expand provider error taxonomy for production operations.

## Cycle CQ Manual Provider Slug Preview Audit

Result: Partial pass for manual provider slug preview contract and Samsung tablet regression proof. Not full provider parity because the provider fetch still failed.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn now has a controlled exact-slug provider preview path for mapping compact live markets to real provider identity.
- The route still refuses to invent provider IDs and keeps `fetch failed` as an explicit backend state.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CQ-P0-01 | P0 | Protected manual slug preview route exists and requires internal/admin auth. | Route test | Pass |
| LED-CQ-P0-02 | P0 | Manual slug preview fetches exact provider slugs and can normalize complete provider payloads. | Unit test | Pass |
| LED-CQ-P0-03 | P0 | Route proof records provider fetch failure without fake candidates or DB mutation. | Route proof | Pass |
| LED-CQ-P0-04 | P0 | Samsung tablet live-detail second-half Book flow still passes after backend contract change. | Samsung tablet XML/screenshot | Pass |
| LED-CQ-P1-01 | P1 | Manual preview succeeds with a real Polymarket slug in proof environment. | Future provider proof | Open |
| LED-CQ-P1-02 | P1 | Real attach-ready preview is applied through provider mapping route. | Future provider proof | Open |
| LED-CQ-P1-03 | P1 | No-fallback provider refresh moves stale/refresh-due to ready after real identity apply. | Future provider refresh proof | Open |

Holiwyn evidence:

- Manual slug preview proof: `docs/mobile/harness/cycle-current-mobile-live-provider-candidates-manual-slug-preview.json`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Unit/route proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-identity-attach.service.test.ts`
- Build proof: `cmd /c npm.cmd run build`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for manual provider slug preview route and Android regression proof scope.

Remaining P1/P2 gaps:

- Successful provider fetch from route environment.
- Real attach-ready slug preview.
- Confirmed real ID attach and no-fallback provider refresh.

## Cycle CP Provider Candidate Discovery Audit

Result: Partial pass for provider candidate discovery contract and Samsung tablet regression proof. Not full provider parity because provider fetch failed and no real attach-ready candidates were found.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn now has a protected backend discovery route that can derive provider search queries for every compact live market and shape provider candidates into attach-ready proposals.
- The route exposes provider-fetch failures directly, keeping the loop from claiming provider parity when external candidate discovery is not working.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CP-P0-01 | P0 | Protected provider candidate discovery route exists and requires internal/admin auth. | Route test | Pass |
| LED-CP-P0-02 | P0 | Route can return query-only discovery contracts without calling provider fetch. | Route proof | Pass |
| LED-CP-P0-03 | P0 | Candidate normalizer/ranker can produce attach-ready proposals when provider payload has required IDs/tokens. | Unit test | Pass |
| LED-CP-P0-04 | P0 | Provider-fetch failures are explicit in route proof and do not create fake candidates. | Route proof | Pass |
| LED-CP-P0-05 | P0 | Samsung tablet live-detail second-half Book flow still passes after backend contract change. | Samsung tablet XML/screenshot | Pass |
| LED-CP-P1-01 | P1 | Provider fetch succeeds in proof environment and returns real candidates. | Future provider proof | Open |
| LED-CP-P1-02 | P1 | Real attach-ready candidates are reviewed/applied for compact World Cup markets. | Future provider proof | Open |
| LED-CP-P1-03 | P1 | No-fallback provider refresh moves stale/refresh-due to ready after real identity apply. | Future provider refresh proof | Open |

Holiwyn evidence:

- Query-contract proof: `docs/mobile/harness/cycle-current-mobile-live-provider-candidates-query-contract.json`
- Provider-fetch attempt proof: `docs/mobile/harness/cycle-current-mobile-live-provider-candidates-fetch-attempt.json`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Unit/route proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-identity-attach.service.test.ts`
- Build proof: `cmd /c npm.cmd run build`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for provider candidate discovery route and Android regression proof scope.

Remaining P1/P2 gaps:

- Successful provider fetch or manual real-slug preview path.
- Real candidate review/apply with complete provider IDs.
- Real provider refresh without contract-proof fallback.

## Cycle CO Provider Identity Attach Audit

Result: Partial pass for provider identity attach dry-run contract and Samsung tablet regression proof. Not full provider parity because real provider IDs have not been discovered/applied yet.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn now has a protected backend path for attaching provider-owned market and outcome identity to compact live markets, which is required before provider refresh can update live market rows from a real feed.
- The attach route projects readiness in dry-run mode, so an import/mapping cycle can be audited before mutating local market identity.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CO-P0-01 | P0 | Protected provider mapping POST exists and requires internal/admin auth. | Route test | Pass |
| LED-CO-P0-02 | P0 | Attach validation rejects non-compact markets, unsupported sources, missing condition IDs, and incomplete outcome mappings. | Unit test | Pass |
| LED-CO-P0-03 | P0 | Dry-run attach projects provider readiness without writing fake IDs. | Route proof | Pass |
| LED-CO-P0-04 | P0 | Samsung tablet live-detail second-half Book flow still passes after backend contract change. | Samsung tablet XML/screenshot | Pass |
| LED-CO-P1-01 | P1 | Real provider candidate discovery/import supplies IDs for compact World Cup match markets. | Future provider proof | Open |
| LED-CO-P1-02 | P1 | Confirmed apply with real IDs moves all compact markets to provider-refreshable. | Future provider proof | Open |
| LED-CO-P1-03 | P1 | No-fallback provider refresh moves stale/refresh-due to ready after real identity apply. | Future provider refresh proof | Open |

Holiwyn evidence:

- Dry-run attach proof: `docs/mobile/harness/cycle-current-mobile-live-provider-identity-attach-dry-run.json`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Unit/route proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-mapping.service.test.ts src/__tests__/mobile-live-provider-identity-attach.service.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts`
- Build proof: `cmd /c npm.cmd run build`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for provider identity attach route and Android regression proof scope.

Remaining P1/P2 gaps:

- Real provider candidate discovery/import.
- Confirmed apply with real provider IDs for all compact World Cup live markets.
- Real provider refresh without contract-proof fallback.

## Cycle CN Provider Mapping Readiness Audit

Result: Partial pass for provider mapping readiness gate and Samsung tablet regression proof. Not full provider parity because no compact market in the current local event is provider-refreshable yet.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn now has a backend gate that checks whether compact live markets have provider-owned market/outcome identity before refresh is attempted.
- No-fallback provider refresh now explains missing provider mapping instead of silently succeeding or relying on contract-proof rows.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CN-P0-01 | P0 | Protected provider mapping readiness route exists and requires internal/admin auth. | Route test | Pass |
| LED-CN-P0-02 | P0 | Readiness route reports per-market provider identity fields and per-outcome token readiness. | Route proof | Pass |
| LED-CN-P0-03 | P0 | Current compact event is truthfully reported as not provider-refreshable without mapping. | Route proof | Pass |
| LED-CN-P0-04 | P0 | No-fallback refresh response includes mapping readiness and does not apply local contract-proof fallback. | Route proof | Pass |
| LED-CN-P0-05 | P0 | Samsung tablet live-detail second-half Book flow still passes after backend contract change. | Samsung tablet XML/screenshot | Pass |
| LED-CN-P1-01 | P1 | Compact World Cup match markets are imported/mapped to real provider market/outcome IDs. | Future provider mapping proof | Open |
| LED-CN-P1-02 | P1 | Provider refresh moves stale/refresh-due to ready without `allowContractProofFallback`. | Future provider refresh proof | Open |

Holiwyn evidence:

- Mapping proof: `docs/mobile/harness/cycle-current-mobile-live-provider-mapping-readiness.json`
- No-fallback blocked proof: `docs/mobile/harness/cycle-current-mobile-live-provider-no-fallback-refresh-blocked-proof.json`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Unit/route proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-mapping.service.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts`
- Build proof: `cmd /c npm.cmd run build`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for provider mapping readiness route and Android regression proof scope.

Remaining P1/P2 gaps:

- Real provider mapping/import for compact World Cup match markets.
- Real provider refresh without contract-proof fallback.
- Provider-owned full liquidity/depth across all live World Cup line markets.

## Cycle CM Provider Refresh Execution Audit

Result: Partial pass for refresh execution/invalidation route and Samsung tablet proof. Not full provider parity because the current local compact event has no real Polymarket market mapping.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn no longer only exposes refresh policy fields; it now has a protected backend route that can expire provider snapshots, attempt provider refresh, and make live-detail routes move between stale/refresh-due and ready states.
- The route reports unsupported compact markets instead of silently claiming provider success when the local event lacks real provider mapping.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CM-P0-01 | P0 | Protected provider refresh route exists for compact live event detail and requires internal/admin auth. | Route test | Pass |
| LED-CM-P0-02 | P0 | Route can expire compact snapshots and live-detail reports stale/refresh-due. | Route proof | Pass |
| LED-CM-P0-03 | P0 | Route can refresh back to ready state using backend-shaped provider snapshot rows. | Route proof | Pass with local contract-proof fallback |
| LED-CM-P0-04 | P0 | Samsung tablet live-detail second-half Book flow passes after refresh. | Samsung tablet XML/screenshot | Pass |
| LED-CM-P1-01 | P1 | Real Polymarket Gamma refresh updates compact World Cup match markets without fallback. | Future provider mapping proof | Open |
| LED-CM-P1-02 | P1 | Provider-owned full depth/liquidity refreshes all compact line-market books. | Future backend proof | Open |

Holiwyn evidence:

- Route proof: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-execution-proof.json`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Unit/route proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- Build proof: `cmd /c npm.cmd run build`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for refresh execution route and Android proof scope.

Remaining P1/P2 gaps:

- Real provider mapping for compact World Cup match markets.
- Real provider refresh without contract-proof fallback.
- Provider-owned full liquidity/depth across all live World Cup line markets.

## Cycle CL Provider Refresh Policy Contract Audit

Result: Pass for provider refresh policy route proof and Samsung tablet regression proof.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn can now expose when provider quote snapshots should refresh rather than only saying whether rows are ready.
- The selected orderbook and compact live-detail route both carry backend-shaped refresh policy fields, so future mobile loading/stale behavior can be tied to the same market/outcome identity as ticket/order/portfolio flows.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CL-P0-01 | P0 | Selected orderbook provider snapshot exposes `refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, and `refreshKey`. | Backend route probe and no-leak test | Pass |
| LED-CL-P0-02 | P0 | Compact live-detail contract exposes aggregate ready, stale, refresh-due, and earliest next-refresh fields. | Backend route probe and unit test | Pass |
| LED-CL-P0-03 | P0 | Route proof demonstrates non-null refresh policy fields for the selected second-half market/book. | Direct route probe | Pass |
| LED-CL-P0-04 | P0 | Existing Samsung tablet live-detail second-half Book flow still passes. | Samsung tablet XML/screenshot | Pass |
| LED-CL-P1-01 | P1 | Real external provider refresh worker updates snapshots and invalidates stale data. | Future provider proof | Open |
| LED-CL-P1-02 | P1 | Provider-owned full depth/liquidity uses the same refresh policy or a richer provider depth policy. | Future backend proof | Open |

Holiwyn evidence:

- Seed proof: `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-seed.json`
- Route proof: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-policy-probe.json`
- Unit proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-provider-quote-snapshot-seeding.test.ts`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for provider refresh policy contract scope.

Remaining P1/P2 gaps:

- Real provider refresh execution and cache invalidation.
- Provider error classification and feed sequence/id if available.
- Provider-owned full liquidity/depth across all live World Cup line markets.

## Cycle CK Live Provider Quote Snapshot Ready Proof Audit

Result: Pass for provider-shaped ready-state route proof and Samsung tablet regression proof.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn no longer only documents provider snapshot status; it can now prove the compact live-detail route and selected second-half Book respond as provider-ready when `ReferenceQuoteSnapshot` rows exist.
- The proof keeps selected `marketId`/`outcomeId` identity stable across compact live detail and selected orderbook.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CK-P0-01 | P0 | Provider-shaped seed creates `ReferenceQuoteSnapshot` rows for every compact live-detail market/outcome. | Seed summary artifact and unit test | Pass |
| LED-CK-P0-02 | P0 | Compact live-detail route reports provider snapshot source `reference-quote-snapshot` and all 14 compact markets with snapshot status. | Direct route probe | Pass |
| LED-CK-P0-03 | P0 | Selected second-half orderbook reports `providerQuoteSnapshot.status=ready` while preserving route-backed orderbook depth. | Direct route probe and Samsung tablet smoke | Pass |
| LED-CK-P0-04 | P0 | Existing Samsung tablet live-detail second-half Book flow still passes. | Samsung tablet XML/screenshot | Pass |
| LED-CK-P1-01 | P1 | Real external provider ingestion writes these rows continuously. | Future provider proof | Open |
| LED-CK-P1-02 | P1 | Provider cache invalidation/update sequence and stale/error states come from the external feed. | Future backend proof | Open |

Holiwyn evidence:

- Seed proof: `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-seed.json`
- Route proof: `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-ready-probe.json`
- Unit proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-quote-snapshot-seeding.test.ts src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for provider-shaped snapshot ready proof scope.

Remaining P1/P2 gaps:

- Real provider ingestion and refresh cadence.
- Provider cache invalidation/update sequence.
- Provider-owned full liquidity/depth across all live World Cup line markets.

## Cycle CJ Provider Quote Snapshot Contract Audit

Result: Pass for provider quote snapshot metadata contract and tablet regression proof.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: logged-in official Android app, predicting-focused game page with tradable rows, chart, chat preview, outcome buttons, Game Lines, and expandable market rows.

What became materially closer to Polymarket:

- Holiwyn can now distinguish local route depth from provider quote snapshot freshness. That is needed for a Polymarket-like live trading page where prices/depth can exist but provider data may be stale or unavailable.
- The contract is backend-shaped and sourced from `ReferenceQuoteSnapshot`, not arbitrary mobile fixture data.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CJ-P0-01 | P0 | Public selected orderbook route exposes safe `providerQuoteSnapshot` metadata without leaking sensitive/provider-internal fields. | Backend route no-leak test | Pass |
| LED-CJ-P0-02 | P0 | Compact live-detail route exposes per-market provider snapshot status plus batched provider snapshot source/count. | Backend unit test and direct route probe | Pass |
| LED-CJ-P0-03 | P0 | If local World Cup proof data has no provider snapshots, route reports `unavailable`/`empty` rather than fake readiness. | Direct route probe | Pass |
| LED-CJ-P0-04 | P0 | Existing Samsung tablet server-backed second-half depth proof still passes. | Samsung tablet XML/screenshot | Pass |
| LED-CJ-P1-01 | P1 | Provider ingestion writes fresh `ReferenceQuoteSnapshot` rows for every visible World Cup live market/outcome. | Future provider proof | Open |
| LED-CJ-P1-02 | P1 | Provider cache invalidation/update sequence is available if needed for production freshness. | Future backend proof | Open |

Holiwyn evidence:

- Backend route probe: `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-probe.json`
- Unit/no-leak proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- Build proof: `cmd /c npm.cmd run build`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for provider snapshot metadata contract scope.

Remaining P1/P2 gaps:

- Provider ingestion for all visible live World Cup markets.
- Provider-owned liquidity/depth for all line markets.
- Provider cache invalidation/update sequence.

## Cycle CI Depth Batching Policy Contract Audit

Result: Pass for compact live-detail depth batching policy metadata and regression tablet proof.

Reference audit:

- Cycle CI continues Cycle CH's same S23 Polymarket reference: logged-in official Android app on a Colombia vs Ghana game page.
- Reference behavior remains predicting-focused: game/chart area, chat preview, outcome buttons, Game Lines, expandable market rows, and tradable market depth available from the same page context.

What became materially closer to Polymarket:

- Holiwyn's compact live-detail backend no longer just returns some depth; it now declares the batching policy that controls visible market hydration. This is needed before replacing proof orders with provider-scale live depth.
- The route records exactly which compact market IDs were requested for depth, how many markets were capped, max depth levels, generation time, and TTL.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CI-P0-01 | P0 | `/api/mobile/events/:slug/live-detail` exposes `generatedAt`, `maxMarkets`, requested market count, requested market IDs, max depth levels, and cache TTL. | Backend unit test and direct route probe | Pass |
| LED-CI-P0-02 | P0 | Requested market IDs are stable backend market IDs and match the compact market selection order. | Backend unit test | Pass |
| LED-CI-P0-03 | P0 | Existing Samsung tablet live-detail depth proof still passes after adding policy metadata. | Samsung tablet XML/screenshot | Pass |
| LED-CI-P1-01 | P1 | Real provider cache/invalidation and provider snapshot status drive the depth batch. | Future provider proof | Open |
| LED-CI-P1-02 | P1 | Provider liquidity exists for every visible live soccer line market. | Future provider proof | Open |

Holiwyn evidence:

- Backend route probe: `docs/mobile/harness/cycle-current-mobile-live-depth-batching-policy-probe.json`
- Unit proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for depth batching policy metadata scope.

Remaining P1/P2 gaps:

- Provider-owned liquidity for all live markets.
- Provider cache/invalidation and snapshot status.
- Provider-owned live stats only if product keeps the Live stats tab.

## Cycle CH Batched Live Market Depth Contract Audit

Result: Pass for batched compact-market route-backed depth contract and tablet proof.

Reference audit:

- S23 Polymarket reference was the logged-in official Android app on a Colombia vs Ghana game page.
- Visible behavior: top game/chart area, chat preview, outcome buttons, Game Lines, and expandable Regulation Time Winner. No separate soccer Live stats tab was visible in this state.
- Cycle scope was therefore re-scoped from live-stats UI to predicting-related batched market depth/liquidity, matching the visible Polymarket game behavior more closely.

What became materially closer to Polymarket:

- Polymarket game pages expose many tradable rows with market depth/prices available from the same page context. Holiwyn now batches route-backed orderbook depth for compact visible markets instead of only hydrating the primary market.
- The user can see `Route depth` on a backend-backed row before opening Book, then open the selected market's full route-backed orderbook.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CH-P0-01 | P0 | `/api/mobile/events/:slug/live-detail` batches orderbook snapshots for compact visible markets, not only the primary market. | Backend unit test | Pass |
| LED-CH-P0-02 | P0 | Compact route reports `batchedOrderbookDepthSource` and `batchedOrderbookDepthMarketCount`. | Direct route probe | Pass |
| LED-CH-P0-03 | P0 | Market rows with batched depth expose an auditable `Route depth` marker before Book opens. | Samsung tablet XML | Pass |
| LED-CH-P0-04 | P0 | Opening the same selected market Book still preserves selected market identity and route-backed depth. | Samsung tablet XML/screenshot | Pass |
| LED-CH-P1-01 | P1 | Provider ingestion supplies live liquidity for every visible live soccer market, not only seeded proof markets. | Future provider proof | Open |
| LED-CH-P1-02 | P1 | Production batching/prefetch has cache policy, pagination/limits, and provider invalidation metadata. | Future backend proof | Open |

Holiwyn evidence:

- Reference: `docs/mobile/reference/screenshots/cycle-CH-polymarket-reference.png`, `docs/mobile/reference/screenshots/cycle-CH-polymarket-reference.xml`
- Backend route probe: `docs/mobile/harness/cycle-current-mobile-live-batched-orderbook-depth-probe.json`
- Unit proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- Device proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`, `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for batched compact-market depth scope.

Remaining P1/P2 gaps:

- Provider-owned liquidity for all live markets.
- Production batching/prefetch policy.
- Provider-owned live stats only if product keeps the Live stats tab.

## Cycle CG Second-Half Orderbook Depth Proof Audit

Result: Pass for selected second-half route-backed orderbook depth and tablet proof.

What became materially closer to Polymarket:

- Polymarket-style soccer pages treat half-period winner markets as separate tradable contracts. Holiwyn now proves both half-period rows, including `2nd Half Winner`, can open their own backend-selected route-backed orderbook.
- The second-half row no longer remains a deferred local-only/fallback risk after first-half parity passed.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CG-P0-01 | P0 | Seed harness creates deterministic second-half route depth for `period=second-half` without changing the future backend contract shape. | Seed summary artifact | Pass |
| LED-CG-P0-02 | P0 | EventDetail visible `2nd Half Winner` row exposes a backend Book action and stale market availability. | Samsung tablet XML | Pass |
| LED-CG-P0-03 | P0 | Tapping second-half Book opens the selected second-half market orderbook with route-backed depth and selected-market availability. | Samsung tablet XML/screenshot | Pass |
| LED-CG-P1-01 | P1 | Provider ingestion owns half-period market discovery/liquidity/freshness. | Future provider proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-halves-markets-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-second-half-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-line-groups.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

Unresolved P0 gaps: 0 for selected second-half orderbook depth scope.

Remaining P1/P2 gaps:

- Real provider ingestion/heartbeat.
- Provider-owned live stats.
- Production batching/prefetch and provider-wide all-line liquidity.

## Cycle CF Halves Orderbook Depth Contract Audit

Result: Pass for selected first-half route-backed orderbook depth and tablet proof.

What became materially closer to Polymarket:

- Polymarket-style soccer pages expose half-period markets as distinct tradable contracts. Holiwyn now has backend-shaped first-half and second-half winner markets in the compact route, and the first-half row opens its own route-backed order book.
- The Halves row no longer silently trades/opens the full-game primary winner when backend half markets exist.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CF-P0-01 | P0 | Compact live-detail route reserves first-half and second-half winner markets with `period` identity. | Backend unit test and route probe | Pass |
| LED-CF-P0-02 | P0 | Seed harness creates deterministic backend-shaped first/second-half markets and first-half route depth. | Seed summary artifacts | Pass |
| LED-CF-P0-03 | P0 | EventDetail visible `1st Half Winner` row exposes a backend Book action and stale market availability. | Samsung tablet XML | Pass |
| LED-CF-P0-04 | P0 | Tapping first-half Book opens the selected first-half market orderbook with route-backed depth and selected-market availability. | Samsung tablet XML/screenshot | Pass |
| LED-CF-P1-01 | P1 | Provider ingestion owns half-period market discovery/liquidity/freshness. | Future provider proof | Open |
| LED-CF-P1-02 | P1 | Second-half selected route-depth proof is separately captured. | Cycle CG tablet proof | Pass |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-halves-markets-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-first-half-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-first-half-line-groups.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-first-half-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-first-half-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-first-half-order-book`

Unresolved P0 gaps: 0 for selected first-half orderbook depth scope.

Remaining P1/P2 gaps:

- Real provider ingestion/heartbeat.
- Provider-owned live stats.
- Provider-wide all-line liquidity.

## Cycle CE Compact Market Availability Contract Audit

Result: Pass for compact per-visible-market availability contract and tablet proof.

What became materially closer to Polymarket:

- Polymarket-like live markets communicate market availability before the user reaches the book. Holiwyn now carries backend-shaped availability on the visible Team Totals row, not only inside the selected orderbook overlay.
- The visible row and opened book preserve the same backend market identity and stale availability state.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CE-P0-01 | P0 | `/api/mobile/events/:slug/live-detail` returns `markets[].availability` with source, raw market status, timestamp, staleness, flags, and reason. | Backend unit test | Pass |
| LED-CE-P0-02 | P0 | Mobile adapter preserves market availability into normalized `Market` rows. | Mobile adapter unit test | Pass |
| LED-CE-P0-03 | P0 | Visible Team Totals row exposes `event-detail-market-availability-team-total-goals market-availability-stale market-status-LIVE` before opening the book. | Samsung tablet XML | Pass |
| LED-CE-P0-04 | P0 | Opening the same Team Totals book still shows route-backed depth and selected-market stale availability. | Samsung tablet XML/screenshot | Pass |
| LED-CE-P1-01 | P1 | Provider ingestion refreshes per-market timestamps/status without deterministic proof seeding. | Future provider proof | Open |
| LED-CE-P1-02 | P1 | Availability is proven across every line family, including Halves and any discovered live groups. | Future all-line proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-team-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-line-groups.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-team-totals-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

Unresolved P0 gaps: 0 for compact market availability contract scope.

Remaining P1/P2 gaps:

- Real provider ingestion/heartbeat.
- Provider-owned live stats.
- Selected Halves proof and provider-wide all-line liquidity.

## Cycle CD Selected Orderbook Availability Contract Audit

Result: Pass for selected-market orderbook availability contract and tablet proof.

What became materially closer to Polymarket:

- Polymarket-style live trading needs to distinguish fresh, stale, suspended, delayed, and unavailable markets. Holiwyn now exposes selected-market availability directly on the orderbook route instead of only event-level freshness.
- The Team Totals orderbook can show ready depth while truthfully marking stale source data.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CD-P0-01 | P0 | `/api/orderbook/:marketId/book` returns `availability` with status, raw market status, timestamps, staleness, flags, and reason. | Backend route unit test and direct route probe | Pass |
| LED-CD-P0-02 | P0 | Mobile depth service preserves selected-market `availability` from the orderbook route into event state. | Mobile unit test | Pass |
| LED-CD-P0-03 | P0 | EventDetail orderbook overlay exposes `event-detail-order-book-availability` and `orderbook-availability-*` for the selected market. | Samsung tablet XML | Pass |
| LED-CD-P0-04 | P0 | Selected Team Totals orderbook still shows route-backed ready depth while availability marks the selected LIVE market as stale. | Samsung tablet XML/screenshot | Pass |
| LED-CD-P1-01 | P1 | Provider ingestion refreshes source timestamps and status for each line market. | Future provider proof | Open |
| LED-CD-P1-02 | P1 | `/api/mobile/events/:slug/live-detail` includes per-visible-market availability before the user opens each book. | Future route/schema proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-team-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-line-groups.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-team-totals-order-book.png`
- Direct route probe: `/api/orderbook/408ffb79-3492-4fd0-b31b-87a26f8b9dd5/book?maxLevels=2`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

Unresolved P0 gaps: 0 for selected orderbook availability contract scope.

Remaining P1/P2 gaps:

- Real provider ingestion/heartbeat.
- Per-visible-market availability in compact live-detail payload.
- Provider-owned live stats and all-line liquidity.

## Cycle BC Live Provider Freshness Contract Audit

Result: Pass for event-level live provider freshness contract and visible tablet proof.

What became materially closer to Polymarket:

- Polymarket live markets communicate when prices and market availability are live/current versus blocked, delayed, or unavailable. Holiwyn now has a backend-shaped freshness status instead of silently assuming all server data is fresh.
- The game page exposes route-derived freshness state in the market header while preserving selected Team Totals orderbook interaction.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-BC-P0-01 | P0 | `/api/mobile/events/:slug/live-detail` returns `event.liveDataStatus` with source, status, timestamps, stale threshold, booleans, and reason. | Backend unit test and route probe | Pass |
| LED-BC-P0-02 | P0 | Mobile adapter preserves `liveDataStatus` into the normalized Event consumed by EventDetail. | Mobile adapter unit test | Pass |
| LED-BC-P0-03 | P0 | EventDetail renders an auditable visible label `event-detail-live-data-inline live-data-status-* live-data-source-*` on server-backed event detail. | Samsung tablet XML | Pass |
| LED-BC-P0-04 | P0 | Existing selected Team Totals route-backed order book still opens after freshness contract rendering. | Samsung tablet XML/screenshot | Pass |
| LED-BC-P1-01 | P1 | Real provider heartbeat/ingestion sets the freshness state without deterministic seed scripts. | Future provider proof | Open |
| LED-BC-P1-02 | P1 | Freshness/availability is per market or per line, not only event-level. | Future route/schema proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-team-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-team-totals-order-book.png`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

Unresolved P0 gaps: 0 for event-level freshness contract scope.

Remaining P1/P2 gaps:

- Real provider ingestion/heartbeat.
- Per-market/per-line freshness, delayed, suspended, and unavailable states.
- Provider-owned live stats and all-line liquidity.

## Cycle BB Selected Team Totals Ready Depth Audit

Result: Pass for selected Team Totals seeded route-backed ready depth.

What became materially closer to Polymarket:

- Polymarket line-market families include team-specific totals. Holiwyn now attaches the backend Team Totals market to the visible game-page section and opens a selected route-backed order book.
- The Team Totals row is no longer local-only in server mode; it preserves backend market identity and route depth.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-BB-P0-01 | P0 | Backend `team_total_goals` normalizes to mobile `team-total` and keeps line/outcome identity. | Mobile adapter unit test | Pass |
| LED-BB-P0-02 | P0 | Team Totals group exposes `event-detail-open-order-book-team-total-goals` when server route provides the market. | Samsung tablet XML | Pass |
| LED-BB-P0-03 | P0 | Selected Team Totals order book opens market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5` with `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none`. | Samsung tablet XML/screenshot | Pass |
| LED-BB-P0-04 | P0 | Visible Team Totals order book shows seeded bid/ask depth including `0.59 USDT`, `0.65 USDT`, `1.06k shares`, and `940 shares`. | Samsung tablet XML/screenshot | Pass |
| LED-BB-P1-01 | P1 | Halves selected books and provider freshness/stale/suspended states are supported. | Future provider/route proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-team-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-line-groups.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-team-totals-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

Unresolved P0 gaps: 0 for this selected Team Totals depth scope.

Remaining P1/P2 gaps:

- Provider/liquidity ingestion for all line-market groups.
- Selected Halves route-backed ready-depth proof if supported by reference/backend market catalog.
- Provider freshness, stale, suspended, and delayed states per selected line market.

## Cycle BA Compact Line Group Coverage And Totals Ready Depth Audit

Result: Pass for compact route representative line groups and selected Totals seeded route-backed ready depth.

What became materially closer to Polymarket:

- Polymarket live game pages expose multiple line-market families, not only Spread. Holiwyn's compact mobile route now keeps representative markets for the line groups the game page renders.
- The Totals row now opens a selected backend Totals order book with route-backed bid/ask depth instead of being a local-only UI row.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-BA-P0-01 | P0 | Compact live-detail payload includes representative primary, Spread 1.5, Totals 2.5, and Team Total 1.5 markets when present. | Route probe and unit test | Pass |
| LED-BA-P0-02 | P0 | Mobile Totals UI maps to backend `total_goals` market identity. | Mobile typecheck and tablet XML | Pass |
| LED-BA-P0-03 | P0 | Totals line group exposes `event-detail-open-order-book-totals` on the live game page. | Samsung tablet XML | Pass |
| LED-BA-P0-04 | P0 | Selected Totals order book opens market `a552efe6-3147-4573-be95-8fe15c068c08` with `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none`. | Samsung tablet XML/screenshot | Pass |
| LED-BA-P0-05 | P0 | Visible Totals order book shows seeded bid/ask depth including `0.59 USDT`, `0.65 USDT`, `1.06k shares`, and `940 shares`. | Samsung tablet XML/screenshot | Pass |
| LED-BA-P1-01 | P1 | Team Totals and Halves selected books have provider-backed or continuously seeded ready depth. | Team Totals passed in Cycle BB; Halves/provider proof remains future work | Partial |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-totals-line-groups.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-totals-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-totals-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-totals-order-book`

Unresolved P0 gaps: 0 for this compact route and selected Totals depth scope.

Remaining P1/P2 gaps:

- Provider/liquidity ingestion for all line-market groups.
- Selected Team Totals/Halves route-backed ready-depth proof.
- Provider freshness, stale, suspended, and delayed states per selected line market.

## Cycle AZ Selected Spread Line Ready Depth Audit

Result: Pass for selected Spread line-market seeded route-backed ready depth.

What became materially closer to Polymarket:

- Polymarket line-market order books show concrete bid/ask depth for the selected market. Holiwyn now proves that behavior for a selected Spread line using backend-shaped `Order` rows and the public orderbook route.
- The selected Spread book no longer stops at a truthful empty state from Cycle AY; it now reaches `ready` with concrete price and share rows while preserving the selected market id.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-AZ-P0-01 | P0 | Seed harness can target the selected Spread market by backend-shaped `marketType=spread` and `line=1.5`. | Seed summary artifact | Pass |
| LED-AZ-P0-02 | P0 | `/api/orderbook/:marketId/book?maxLevels=24` returns ready depth for Spread market `ac527022-07f3-4abb-90f0-b291466e8459`. | Tablet smoke XML plus backend route tests | Pass |
| LED-AZ-P0-03 | P0 | EventDetail order-book overlay labels the selected Spread market id and route-backed ready state. | Tablet smoke XML | Pass |
| LED-AZ-P0-04 | P0 | The visible order book shows bid/ask prices and share sizes from the route, including `0.59 USDT`, `0.65 USDT`, `1.06k shares`, and `940 shares`. | Tablet smoke XML/screenshot | Pass |
| LED-AZ-P1-01 | P1 | All Spread/Totals/Team Totals/Halves line markets have provider-backed or continuously seeded live depth. | Future provider/route proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-spread-orderbook-depth-seed.json`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-spread-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-spread-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-line-order-book`

Unresolved P0 gaps: 0 for this selected Spread line seeded-depth scope.

Remaining P1/P2 gaps:

- Real provider/liquidity ingestion for every line market group.
- Provider freshness, stale, suspended, and delayed states per selected line market.
- A production batching/prefetch strategy if selected-market depth route fan-out becomes too slow.

## Cycle AY Selected Line Market Depth Audit

Result: Pass for selected line-market orderbook identity and backend empty-state proof.

What became materially closer to Polymarket:

- Polymarket order books belong to the market/line the user is viewing. Holiwyn now tracks and proves the selected market id for non-primary line-market order books.
- Opening the Spread book no longer reuses the primary winner market's route-backed depth. It calls the backend book route for the selected Spread market and shows the truthful `No depth` state when that line has no liquidity.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-AY-P0-01 | P0 | Event/orderbook state records the market id whose depth was requested. | Unit test and XML label | Pass |
| LED-AY-P0-02 | P0 | EventDetail can open a backend-backed Spread market order book from the live game page. | Tablet smoke XML/screenshot | Pass |
| LED-AY-P0-03 | P0 | Spread order-book overlay labels the selected spread market id, not the primary market id. | Tablet smoke XML | Pass |
| LED-AY-P0-04 | P0 | Backend empty depth for the selected Spread market is shown as `orderbook-source-orderbook-route orderbook-status-empty orderbook-empty-no-depth`. | Tablet smoke XML | Pass |
| LED-AY-P1-01 | P1 | Spread/totals/team-total line markets have seeded or provider-backed live liquidity and show `ready` depth. | Future route/device proof | Open |

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-spread-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-spread-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-line-order-book`

Unresolved P0 gaps: 0 for this selected-market depth identity scope.

Remaining P1/P2 gaps:

- Seed/provider-backed liquidity for line markets so Spread/Totals order books show real levels rather than empty state.
- Provider freshness/stale/suspended states per selected line market.

## Cycle AX Compact Route Audit

Result: Pass for PM-GAP-067 compact mobile live-detail route and route-backed primary orderbook proof.

What became materially closer to Polymarket:

- The live football game page no longer depends on a heavy full-event payload or fallback-only depth for proof.
- Holiwyn now has a compact mobile route that delivers live game context, market groups, chart snapshots, and route-backed primary orderbook depth in the shape the app consumes.
- Samsung tablet proof opens the backend live game, opens the route-backed order book, taps Buy, and proves the ticket carries the selected backend outcome.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-AX-P0-01 | P0 | `/api/mobile/events/:slug/live-detail` returns a mobile-sized payload with stable event, market, outcome, line, chart, depth, and contract fields. | HTTP route proof and backend unit test | Pass |
| LED-AX-P0-02 | P0 | Mobile `getEvent()` uses the compact route first and preserves legacy fallback. | Mobile API unit test | Pass |
| LED-AX-P0-03 | P0 | Tablet can deep-link into a backend live event without being reset back to Home. | Tablet smoke XML/screenshot | Pass |
| LED-AX-P0-04 | P0 | EventDetail order book displays route-backed depth state and primary best bid/ask/depth rows. | Tablet smoke XML/screenshot | Pass |
| LED-AX-P0-05 | P0 | Tapping Buy from the route-backed order book opens a ticket preserving market and selected outcome identity. | Tablet smoke XML/screenshot | Pass |
| LED-AX-P1-01 | P1 | Real provider live stats, stale/suspended states, and event-wide depth are backed by durable provider routes/schema. | Backend contract audit | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-detail-compact-route.json`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book-ticket.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-order-book`

Unresolved P0 gaps: 0 for this compact route/depth proof scope.

Remaining P1/P2 gaps:

- Real provider ingestion for live football stats and chart snapshots.
- Event-wide or on-demand route-backed depth for every compact market group.
- Richer delayed, suspended, stale, and unavailable market states.

## Reference Audit

Observed Polymarket behavior:

- Live tab shows a World Cup rail/list of football games with time, league, team flags, team names, odds multipliers, and large probability buttons.
- Opening/tapping around the Australia vs Egypt row reached or exposed a game-detail-style surface when location gating appeared earlier: top Game/Chat control, book/share controls, teams, probabilities, a large probability chart, chat preview, primary outcome buttons, and Game Lines/Player Props tabs.
- Location verification may appear as a production gate. Per product direction, Holiwyn must not implement or match this gate in fake-token development mode.
- The useful product behavior is the live prediction surface: live context, live odds/probabilities, chart movement, market groups, ticket carry-through, and grouped line markets.

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-list.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-top.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-markets.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-open-attempt.png`

## Holiwyn Acceptance Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-P0-01 | P0 | Live detail opens directly from a live football event route and shows live match context, not a generic stats dashboard. | Tablet screenshot/XML | Pass |
| LED-P0-02 | P0 | Top live game page keeps Game/Chat controls, book/share controls, team codes/probabilities, score/clock, chart, chat card, primary outcome buttons, and Game Lines/Player Props tabs. | Tablet screenshot/XML | Pass |
| LED-P0-03 | P0 | Live market groups include more than one bare winner market and expose live winner, spreads, totals, halves, and team-total structure. | Tablet scrolled screenshot/XML | Pass |
| LED-P0-04 | P0 | Tapping a live outcome opens a ticket that preserves event, market, and outcome identity. | Tablet ticket screenshot/XML | Pass |
| LED-P0-05 | P0 | Fixture data used for frontend parity is backend-shaped with stable ids and contract fields, not display-only random data. | Code review | Pass |
| LED-P1-01 | P1 | Backend routes should provide live market groups, line options, chart history, orderbook depth, live stats, and selected identity. | Route/schema audit | Partial: `/api/events/:slug` now provides market/line/outcome identity, compact depth, snapshot-backed chart history when `MarketOutcomeSnapshot` rows exist, and optional live-stat arrays; `/api/markets/:marketId/chart?range=...` now provides a dedicated range-aware chart contract; EventDetail consumes that route in server mode; deterministic local snapshot seeding exists; chart route loading/empty/error states are visible; real provider ingestion, server-hydrated device proof, richer delayed/suspended states, and full depth routes remain open. |
| LED-P1-02 | P1 | Portfolio/open-order/activity should preserve live selected market/line/outcome identity after live orders. | API/mobile service tests | Pass for structural backend/mobile contract in Cycle AP; repeat live-device server proof after provider data is wired. |
| LED-P2-01 | P2 | Visual density and animation should be tightened against a cleaner unblocked Polymarket game-detail reference. | Future side-by-side audit | Open |

## Holiwyn Evidence

- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-top.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-markets.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-top.xml`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-markets.xml`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-ticket.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:live-detail`

## Audit Gate

Result: Pass for Cycle AN focused structural live-event-detail UI and contract-shaped fixture scope.

Unresolved P0 gaps: 0 for this focused scope.

Remaining P1/P2 gaps:

- Real backend/schema support is missing for live market groups, chart history, live stats, and orderbook depth.
- Portfolio/order/activity preservation for live line identity still needs a dedicated backend-shaped proof.
- Full visual parity still needs a cleaner unblocked Polymarket detail reference, but location verification is not a Holiwyn product requirement.

## Cycle AO Contract Audit

Result: Partial pass for the backend/mobile contract portion of LED-P1-01.

What became materially closer to Polymarket:

- Live event-detail markets now have stable backend route fields for market group identity, market type, period, line, selected outcome side, quote sizes, compact orderbook depth, and optional chart/live-stat arrays.
- The mobile adapter now consumes those fields instead of dropping them, so future server-hydrated live game pages can preserve line/outcome identity into ticket state.

Evidence:

- `src/server/services/marketReadModel.ts`
- `src/server/services/eventReadModel.ts`
- `mobile/src/types.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`

Unresolved P0 gaps: 0 for the backend contract increment.

Remaining P1 gaps:

- Real provider ingestion for live stats/chart history is not implemented.
- Full market history and depth ladder routes are still missing.
- PM-GAP-068 live order-to-portfolio/history identity is structurally verified by Cycle AP route/service tests; live-device server proof should be repeated after real live data is wired.

## Cycle AP Order Identity Audit

Result: Pass for the PM-GAP-068 backend/mobile identity contract.

What became materially closer to Polymarket:

- Ticket submission now preserves selected market, line, period, side, outcome, and contract side through the server order request.
- Portfolio open orders, positions, canceled orders, and recent-trade activity now expose the same selection identity to mobile instead of collapsing to plain market/outcome text.

Evidence:

- `src/server/services/ticketSelectionMetadata.ts`
- `src/server/services/canonicalOrderSubmission.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/portfolio/history/route.ts`
- `mobile/src/services/orderService.ts`
- `mobile/src/services/portfolioSnapshotService.ts`
- `mobile/src/services/portfolioHistoryService.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:event-detail-line-portfolio`

Unresolved P0 gaps: 0 for the PM-GAP-068 structural contract.

Remaining P1/P2 gaps:

- Device proof should be repeated with server-hydrated live line markets after PM-GAP-067 real provider/depth work.
- First-class `Order.selection` and `Trade.selection` columns may be needed before production if request-body reconstruction is not durable enough.

## Cycle AQ Chart/Depth Contract Audit

Result: Partial pass for the PM-GAP-067 chart-history/depth-identity backend contract.

What became materially closer to Polymarket:

- Polymarket live charts are historical probability surfaces, not static local drawings. Holiwyn can now hydrate `event.chartHistory` from first-class `MarketOutcomeSnapshot` rows on `/api/events/:slug`.
- Embedded orderbook depth remains tied to `outcomeId` after mobile normalization, so later depth UI can point each bid/ask level at the selected outcome instead of using anonymous display rows.

Evidence:

- `src/server/services/marketReadModel.ts`
- `src/server/services/eventReadModel.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

Unresolved P0 gaps: 0 for this backend contract increment.

Remaining P1 gaps:

- Real live-football provider ingestion must write snapshot rows and live stats.
- Dedicated range-aware history and full orderbook ladder routes are still missing.
- Samsung/tablet proof should be repeated with server-hydrated live event data once provider/fixture seeding creates snapshot rows for a live game.

## Cycle AR Market Chart Route Audit

Result: Partial pass for the PM-GAP-067 dedicated chart-history route/client contract.

What became materially closer to Polymarket:

- Polymarket live chart behavior is range-aware and history-backed. Holiwyn now has a dedicated `/api/markets/:marketId/chart?range=1D|1W|1M|MAX` contract with generated time, last-updated, empty state, outcome ids, and mobile-ready probability history points.
- Mobile now has `PolyApi.getMarketChart()` and typed `MarketChart` models, so the visible EventDetail chart can move from embedded/mock history to server route hydration in the next UI integration cycle.

Evidence:

- `src/app/api/markets/[id]/chart/route.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`
- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/public.market-chart.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`

Unresolved P0 gaps: 0 for this backend/client contract increment.

Remaining P1 gaps:

- EventDetail does not yet call the dedicated chart route.
- Real provider ingestion must populate `MarketOutcomeSnapshot` rows for live World Cup markets.
- Device proof still needs a server-hydrated chart-data run once backend health/live snapshot seeding is available.

## Cycle AS EventDetail Chart Hydration Audit

Result: Partial pass for the PM-GAP-067 visible EventDetail chart-route hydration path.

What became materially closer to Polymarket:

- Polymarket live game charts behave like data-backed probability history surfaces. Holiwyn EventDetail now calls the dedicated market chart route in server mode and can replace local/embedded chart points with route-provided history for the selected primary market.
- The visible chart now carries a `chart-source-market-chart-route` audit label when route data is applied, so future Samsung/tablet proof can distinguish true backend hydration from fixture fallback.

Evidence:

- `mobile/src/services/marketChartService.ts`
- `mobile/src/__tests__/marketChartService.test.ts`
- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

Unresolved P0 gaps: 0 for this route-hydration integration increment.

Remaining P1 gaps:

- Backend health was unavailable during tablet proof, so this cycle could not capture server-hydrated chart-source device XML.
- Real live-football provider ingestion must write snapshot rows and live stats.
- Loading, empty, delayed, suspended, and route-error states remain open.
- Full orderbook/depth ladder support remains open.

## Cycle AT Live Chart Snapshot Seeding Audit

Result: Partial pass for PM-GAP-067 provider-shaped chart data harness.

What became materially closer to Polymarket:

- Polymarket live charts require backend probability history, not frontend-only local arrays. Holiwyn now has a deterministic local/proof harness that writes real `MarketOutcomeSnapshot` rows for live World Cup outcomes, which are the same rows consumed by `/api/events/:slug` and `/api/markets/:marketId/chart`.
- This moves the repeated provider/snapshot gap from "unknown future data" to a concrete backend data path that can be run when local services are available.

Evidence:

- `src/server/services/mobileLiveChartSnapshotSeeding.ts`
- `scripts/seed_mobile_live_chart_snapshots.ts`
- `src/__tests__/mobile-live-chart-snapshot-seeding.test.ts`
- `package.json` script `mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-chart-snapshot-seeding.test.ts src/__tests__/public.market-chart.no-leak.test.ts src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

Unresolved P0 gaps: 0 for the seeding-harness increment.

Remaining P1 gaps:

- Local API and Docker were unavailable, so this cycle did not apply the seed script to the database and did not capture server-hydrated chart-source device XML.
- Real external provider ingestion is still missing.
- Chart loading/empty/error states and full orderbook depth remain open.

## Cycle AU Live Chart Route State Audit

Result: Partial pass for PM-GAP-067 chart lifecycle state handling.

What became materially closer to Polymarket:

- Polymarket does not hide market data availability. Holiwyn now exposes whether the live chart is loading, route-backed, empty, or unavailable instead of silently masking backend state with a generic fallback chart.
- The chart route contract fields `range`, `lastUpdated`, and `emptyState` are now preserved into EventDetail state and XML-auditable labels.

Evidence:

- `mobile/src/services/marketChartService.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/App.tsx`
- `mobile/src/__tests__/marketChartService.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-top.xml`

Unresolved P0 gaps: 0 for the chart lifecycle-state increment.

Remaining P1 gaps:

- Backend health was unavailable, so server-hydrated `ready` proof remains open.
- Real external provider ingestion is still missing.
- Richer delayed/suspended/stale route states and full orderbook depth remain open.

## Cycle AV Live Orderbook Depth Contract Audit

Result: Partial pass for PM-GAP-067 orderbook/depth route contract and mobile EventDetail integration.

What became materially closer to Polymarket:

- Polymarket live game pages treat market depth as data-backed market infrastructure, not arbitrary local display rows. Holiwyn now has a public `/api/orderbook/:marketId/book` mobile contract with `levels[]`, `generatedAt`, `emptyState`, and compatibility `bids[]`/`asks[]`.
- EventDetail now attempts route-backed depth hydration in server mode and labels the orderbook overlay with `orderbook-source-*`, `orderbook-status-*`, and `orderbook-empty-*`, making future Audit Gate proof capable of distinguishing true backend depth from fixture fallback.
- The orderbook overlay still preserves selected outcome identity into the ticket from the Buy action.

Acceptance criteria:

| Criterion ID | Priority | Status | Verification |
| --- | --- | --- | --- |
| LD-AV-P1-01 | P1 | Pass | Public route test proves mobile `levels[]`, `generatedAt`, `emptyState`, `maxLevels` clamping, and no protected-field leak. |
| LD-AV-P1-02 | P1 | Pass | Mobile API/service tests prove `getOrderbook()` and `marketDepthService` apply ready, empty, loading, and error states. |
| LD-AV-P1-03 | P1 | Pass | Tablet orderbook smoke proves overlay source/status labels and Buy-ticket carry-through. |
| LD-AV-P1-04 | P1 | Partial | Backend health unavailable, so tablet XML captured fallback depth rather than route-backed `ready` data. |

Evidence:

- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`
- `mobile/src/services/marketDepthService.ts`
- `mobile/src/__tests__/marketDepthService.test.ts`
- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `cmd /c npm.cmd run test:ci -- src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`
- `cmd /c npm.cmd run smoke:tablet:event-detail-order-book`
- `docs/mobile/harness/cycle-current-holiwyn-order-book.xml`
- `docs/mobile/harness/cycle-current-holiwyn-order-book-ticket.xml`

Unresolved P0 gaps: 0 for this backend/mobile contract increment.

Remaining P1 gaps:

- Capture server-hydrated device proof showing `orderbook-source-orderbook-route` and `orderbook-status-ready`.
- Populate real or seeded orderbook depth for live soccer markets.
- Add richer delayed/stale/suspended depth states if the provider route cannot supply fresh data.
- Ensure route-backed depth identity flows through ticket, order, portfolio, and history in a full server proof.

## Cycle AW Route-Backed Live Depth Seed Harness Audit

Result: Partial pass for PM-GAP-067 seeded live orderbook depth readiness.

What became materially closer to Polymarket:

- Polymarket live event depth is backed by real market liquidity. Holiwyn now has deterministic backend proof liquidity in the same `Order` table read by the public orderbook route, instead of relying only on mobile fixture rows.
- The seeded World Cup match orderbook route now returns bid/ask `levels[]` with stable market/outcome IDs, so the UI has a backend-shaped source it can hydrate from once the mobile event-detail payload path is optimized.

Acceptance criteria:

| Criterion ID | Priority | Status | Verification |
| --- | --- | --- | --- |
| LD-AW-P1-01 | P1 | Pass | `mobile:live-orderbook-depth-seed` created 12 open proof orders for `aca976d2-2bad-416c-b010-c874c0ee493f`. |
| LD-AW-P1-02 | P1 | Pass | Direct public orderbook route probe returned `emptyState: null` and 12 route-shaped `levels[]` rows. |
| LD-AW-P1-03 | P1 | Pass | Tablet orderbook regression proof passed with backend health OK. |
| LD-AW-P1-04 | P1 | Partial | Tablet proof still shows fallback depth; chart route timed out during direct probe. |

Evidence:

- `src/server/services/mobileLiveOrderbookDepthSeeding.ts`
- `scripts/seed_mobile_live_orderbook_depth.ts`
- `src/__tests__/mobile-live-orderbook-depth-seeding.test.ts`
- `docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-order-book.xml`
- `docs/mobile/harness/cycle-current-holiwyn-order-book-ticket.xml`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-orderbook-depth-seeding.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-chart-snapshot-seeding.test.ts`
- `cmd /c npm.cmd run mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run mobile:live-orderbook-depth-seed`
- `cmd /c npm.cmd run smoke:tablet:event-detail-order-book`

Unresolved P0 gaps: 0 for this seed harness cycle.

Remaining P1 gaps:

- Mobile server-mode proof must show `orderbook-source-orderbook-route` and `orderbook-status-ready`.
- Add or use a compact mobile live detail endpoint so the tablet does not rely on a huge 37-market event payload.
- Fix or replace the chart route proof path that timed out during this cycle.
- Replace deterministic seeded orders with real provider/liquidity ingestion before production parity.

## Next Structural Work

The next cycle should continue PM-GAP-067 by adding a compact mobile live detail/depth/chart endpoint or proof harness that lets the Samsung tablet capture route-backed chart/depth status without waiting on the full 37-market event payload.
