# Function Implementation Log

Purpose: document the app functions, services, API calls, state transitions, and limitations involved in each mobile feature cycle.

## Cycle DF - Provider Mapping Operator UI

Feature/page worked on:

- PM-GAP-067B operator-reviewed provider mapping workflow.
- Admin UI for entering captured Polymarket market slugs, dry-running review-first mapping, and applying only all-pass review sets.

Frontend/harness components touched:

- `src/components/admin/MobileProviderMappingTool.tsx`
- `src/app/admin/mobile-provider-mapping/page.tsx`
- `src/app/admin/page.tsx`
- `src/lib/mobileProviderReviewInput.ts`
- Samsung tablet regression proof refreshed the server-backed Colombia vs Ghana live-detail Book path.

Backend/components touched:

- No provider API route behavior changed.
- The admin page calls existing protected `GET` and `POST /api/mobile/events/:slug/provider-mapping`.
- Parser tests added in `src/__tests__/mobile-provider-review-input.test.ts`.

Important functions/services touched:

- `parseProviderSlugReviewInput()` accepts JSON review arrays or line-based `marketId=slug1,slug2` input before the route is called.
- `MobileProviderMappingTool` loads mapping readiness, displays missing market/outcome fields, runs dry-run reviews, and blocks confirmed apply until the operator checks `Confirm apply`.
- Existing `reviewMobileLiveProviderBulkSlugMappings()` remains the backend authority for all-pass review/apply behavior.

User interactions supported:

- Operator can open `/admin/mobile-provider-mapping`.
- Operator can paste exact provider slug reviews collected from the Polymarket reference app.
- Operator can refresh readiness, dry-run review, inspect failed review reasons, and apply all-pass mappings with explicit confirmation.

State transitions:

- UI parse error prevents route calls.
- Dry-run sends `dryRun=true` and `confirmApply=false`.
- Apply sends `dryRun=false` and `confirmApply=true` only after the local confirmation checkbox is set.
- Readiness reloads after workflow completion.
- Samsung tablet proof confirms the existing provider-backed live-detail Book path still works.

Known limitations:

- This cycle does not discover new line-market slugs.
- The admin UI is a tooling surface, not a mobile user feature.
- A durable audit table for review attempts remains future work.

## Cycle DE - Bulk Review Apply Workflow

Feature/page worked on:

- PM-GAP-067B operator-reviewed provider mapping workflow.
- Review-first bulk exact-slug apply path for real Polymarket soccer market identities.

Frontend/harness components touched:

- No visual UI code changed.
- Samsung tablet regression proof refreshed the server-backed Colombia vs Ghana live-detail Book path.

Backend/components touched:

- `src/server/services/mobileLiveProviderBulkSlugReview.ts`
- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/app/api/mobile/events/[slug]/provider-mapping/route.ts`
- `src/__tests__/mobile-live-provider-bulk-slug-review.service.test.ts`
- `src/__tests__/mobile-live-provider-mapping.route.test.ts`
- `scripts/prove_mobile_provider_bulk_review_apply_workflow.ts`

Important functions/services touched:

- `reviewMobileLiveProviderBulkSlugMappings()` first runs the bulk exact-slug review contract, then blocks apply if any review fails.
- `POST /api/mobile/events/:slug/provider-mapping` now accepts `reviews[]` in addition to the existing direct `mappings[]` attach body.
- `previewMobileLiveProviderCandidatesBulkBySlug()` now returns a non-null mapping list suitable for attach only after individual reviews pass.
- Existing provider family, relevance, token completeness, outcome-shape, dry-run, and `confirmApply` gates remain required.

User interactions supported:

- No direct end-user UI yet.
- Future operator/admin workflow can submit reviewed exact provider slugs, inspect failed reviews, dry-run all-pass mappings, and only then apply them with explicit confirmation.

State transitions:

- Mixed review proof submits 4 entries: 3 real match-winner markets and 1 totals guard market using a wrong-family Colombia winner slug.
- The wrong-family totals review fails with `provider_family_mismatch` and `insufficient_market_relevance`.
- Because one review fails, the route returns `blocked=true`, does not call attach, and provider refreshable readiness remains unchanged at 0 markets.
- All-valid reviews dry-run successfully with 3 attach-ready mappings.
- All-valid reviews with `confirmApply=true` apply 3 real provider markets and 6 outcome token mappings.
- Samsung tablet proof confirms the existing provider-backed live-detail Book path still works after the workflow change.

Known limitations:

- This cycle does not create the operator UI for collecting slugs from the Polymarket reference app.
- Real provider line-market slugs/source remain missing.
- The local proof event still has 2 unmapped compact/guard markets after applying the 3 match-winner mappings.

## Cycle DC - Bulk Manual Slug Review Contract

Feature/page worked on:

- PM-GAP-067B operator-reviewed provider mapping workflow.
- Bulk exact-slug review for real Polymarket soccer market identities before any provider attach is applied.

Frontend/harness components touched:

- No visual UI code changed.
- Samsung tablet regression proof refreshed the server-backed Colombia vs Ghana live-detail Book path.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/app/api/mobile/events/[slug]/provider-candidates/route.ts`
- `src/__tests__/mobile-live-provider-candidates.route.test.ts`
- `scripts/prove_mobile_provider_bulk_slug_review.ts`

Important functions/services touched:

- `previewMobileLiveProviderCandidatesBulkBySlug()` reviews multiple `{ marketId, slugs[] }` requests and returns aggregate preview results plus attach-ready mappings.
- `POST /api/mobile/events/:slug/provider-candidates` now accepts either the existing single preview body or a new `reviews[]` bulk body.
- Existing single-market preview, family matching, relevance checks, token checks, and protected attach route remain unchanged.

User interactions supported:

- No direct end-user UI yet.
- Future operator/admin workflow can review several exact provider slugs before applying mappings.

State transitions:

- Bulk proof reviews 4 entries: 3 match-winner markets and 1 totals market.
- The 3 real match-winner slugs become attach-ready mappings.
- The totals market rejects the Colombia winner slug with `provider_family_mismatch` and `insufficient_market_relevance`.
- Samsung tablet proof confirms the existing provider-backed live-detail Book still works.

Known limitations:

- This cycle does not create the operator UI for capturing slugs from the reference app.
- Real provider line-market slugs/source remain missing.

## Cycle DB - Provider Line Source Probe

Feature/page worked on:

- PM-GAP-067B provider source discovery for World Cup live-event line markets.
- Focused on whether current public Polymarket/Gamma surfaces expose attach-ready spreads, totals, team totals, halves, corners, or correct-score provider markets.

Frontend/harness components touched:

- No visual UI code changed.
- Samsung tablet regression proof refreshed the server-backed Colombia vs Ghana live-detail Book path.

Backend/components touched:

- `scripts/prove_mobile_provider_line_source_probe.ts`

Important functions/services touched:

- The harness uses existing provider candidate functions only: `fetchProviderCandidatesFromSportsEvents()`, `fetchProviderCandidatesForSlugs()`, `fetchProviderCandidatesForQueries()`, `rankProviderCandidates()`, and `summarizeProviderCandidateFamilies()`.
- No production attach logic was weakened or changed.

User interactions supported:

- No new end-user interaction.
- The live game page remains backed by the already mapped match-winner provider data.

State transitions:

- Exact event surface remains 3 match-winner candidates and 0 line-family candidates.
- Exact line-slug guesses checked 23 provider slug patterns and returned 0 candidates.
- Broad line-oriented searches checked 8 backend-shaped line targets and 96 provider candidates, producing 0 attach-ready line targets.
- Samsung tablet proof confirms the existing server-backed live-detail Book still works.

Known limitations:

- This cycle proves the current checked provider surfaces do not expose attach-ready line markets for Colombia vs Ghana.
- Next line-market work needs operator-reviewed real slugs from the Polymarket app, a different provider source, or a new ingestion path; repeating broad Gamma search is unlikely to help.

## Cycle DA - Provider Discovery Expansion

Feature/page worked on:

- PM-GAP-067B provider discovery expansion for the World Cup live event.
- Focused on real attach-ready Polymarket soccer markets for Colombia vs Ghana, not new visual UI parity.

Frontend/harness components touched:

- No intended visual UI code changed.
- Samsung tablet regression proof refreshed the server-backed Colombia vs Ghana live-detail Book path.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_provider_discovery_expansion.ts`

Important functions/services touched:

- `buildProviderCandidateManualSlugFallbacks()` derives exact Polymarket match-winner fallback slugs from provider event slug plus normalized team/draw identity.
- `buildProviderCandidateSearchQueries()` now includes more normalized soccer/event search phrases while keeping the relevance gate unchanged.
- `discoverMobileLiveProviderCandidates()` now reports `manualSlugFallbacks` and `manualSlugFallbackCandidateCount`, merges exact fallback candidates into ranking, and still requires family, token, and relevance checks.

User interactions supported:

- No new end-user interaction.
- The live game page remains backed by real provider quote/depth for the three mapped match-winner markets.

State transitions:

- Local proof event starts with 3 compact markets missing provider identity.
- Discovery finds 3 real attach-ready provider candidates from exact event plus manual fallback slugs.
- Attach moves readiness to 3 provider-refreshable markets and 6 provider-refreshable outcomes.
- No-fallback provider refresh writes 6 quote snapshots and 246 CLOB depth rows.
- Samsung tablet proof confirms the live-detail Book route remains usable after the provider mapping refresh.

Known limitations:

- Cycle DA improves match-winner discovery and fallback robustness; it does not find provider line markets.
- Exact provider data for spreads, totals, team totals, halves, corners, props, and correct score remains open.

## Cycle CZ - Line Slug Family Gate

Feature/page worked on:

- PM-GAP-067B exact-slug review safety for future provider line-market mappings.
- Manual provider slug preview now distinguishes winner slugs from spreads/totals/team-total/corners/halves family targets.

Frontend/harness components touched:

- No visual UI code changed. Samsung tablet regression proof refreshed the server-backed Colombia vs. Ghana live-detail Book path.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_provider_line_slug_family_gate.ts`

Important functions/services touched:

- `expectedProviderMarketFamily()` derives the expected provider family from Holiwyn market type/title/period/group.
- `evaluateCandidateAttachReadiness()` now adds `provider_family_mismatch` when an exact slug belongs to the wrong market family.
- Line-family relevance can pass for generic Over/Under outcomes only when provider family matches and important team/title tokens match.

User interactions supported:

- No new end-user interaction. Future operator exact-slug review is safer before any line-market provider identity can be attached.

State transitions:

- A synthetic total-goals target accepts a same-family total-goals provider candidate with complete tokens.
- The same target rejects a match-winner slug with `provider_family_mismatch` and `insufficient_market_relevance`.
- Tablet proof confirms the existing provider-backed live-detail Book remains usable.

Known limitations:

- This cycle does not find real Polymarket line slugs.
- Real line-market parity still requires a stronger provider source or operator-reviewed exact line slugs.

## Cycle CY - Provider Line Market Availability Diagnostic

Feature/page worked on:

- PM-GAP-067B provider identity mapping for line-market families on the World Cup live event detail.
- Provider availability diagnostic for spreads, totals, team totals, first-half markets, and corners against the Colombia vs. Ghana Polymarket event.

Frontend/harness components touched:

- No visual UI code changed. Samsung tablet regression proof refreshed the existing server-backed Colombia vs. Ghana live-detail Book path.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_provider_line_market_availability.ts`

Important functions/services touched:

- `classifyProviderMarketFamily()` classifies Gamma candidates into match winner, spread, total goals, team totals, corners, halves, correct score, or other.
- `summarizeProviderCandidateFamilies()` exposes explicit zero-filled family counts, so missing provider line markets are auditable.
- `discoverMobileLiveProviderCandidates()` now includes `providerCandidateFamilySummary` for sports-event candidates.

User interactions supported:

- No new end-user interaction. The tablet proof confirms the existing provider-backed live detail Book remains usable after the backend diagnostic changes.

State transitions:

- Exact Gamma event `fifwc-col-gha-2026-07-03` returns 3 provider candidates, all classified as `match_winner`.
- Exact event line-family candidate count is 0 for spread, totals, team totals, corners, first half, second half, and correct score.
- Broad line-search diagnostics checked 6 Holiwyn-shaped line targets and 60 provider candidates; 0 became attach-ready and 48 were rejected for insufficient relevance.

Known limitations:

- This cycle does not attach line markets because no safe attach-ready provider line markets were found.
- The next implementation path should use another provider source, a richer Polymarket sports endpoint if one exists, or operator-reviewed exact slugs when Polymarket exposes line markets.
- Line-market parity remains open for provider-backed spreads, totals, team totals, halves, corners, props, and ticket/order/portfolio/history proof.

## Cycle CX - Provider Event Slug Hint Discovery

Feature/page worked on:

- PM-GAP-067 provider discovery for the World Cup live event detail.
- Backend-owned Polymarket sports-event slug discovery from Holiwyn `Event` provider fields and metadata.
- Samsung tablet server-mode live detail and orderbook regression proof for the provider-mapped Colombia vs. Ghana event.

Frontend/harness components touched:

- `mobile/scripts/smoke.ps1` evidence was refreshed through the existing server live-detail orderbook proof path.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_provider_sports_event_discovery.ts`

Important functions/services touched:

- `discoverMobileLiveProviderCandidates()` now derives exact provider event slug hints from the local event when no request override is supplied.
- `deriveProviderEventSlugHints()` extracts request-provided slugs first, then event `externalSlug`, `externalEventId`, and provider-related metadata values.
- `fetchProviderCandidatesFromSportsEvents()` remains the exact Gamma event fetcher; this cycle changes how the exact slug is sourced.

User interactions supported:

- Samsung tablet proof opens the Holiwyn server-backed Colombia vs. Ghana live detail page and opens the route-backed Book.
- The Book proof still renders provider-backed `Best bid`, `Best ask`, `Spread`, `Route depth`, `Buy`, and `Sell` controls.

State transitions:

- Local proof event carries `source=polymarket`, `externalSlug=fifwc-col-gha-2026-07-03`, and provider metadata.
- Discovery runs with `providerSearchMode=sports-events` and no manual `providerEventSlugs` request parameter.
- Discovery reports `providerEventSlugSource=event`, finds 3 attach-ready compact markets, attach moves readiness from 0 to 3, and no-fallback provider refresh writes 6 quote snapshots plus 232 CLOB depth rows.
- Mobile live detail reports 3 ready provider quote snapshots and 3 ready provider orderbook-depth markets.

Known limitations:

- This closes the exact provider event slug handoff for compact match markets; it does not discover unavailable Polymarket line markets.
- Remaining P1 debt is still provider identity for spreads, totals, team totals, halves, corners, and props when Polymarket exposes those markets.
- Event-derived hints require Holiwyn event rows to retain trustworthy provider slug metadata.

## Cycle CV - Provider Candidate Relevance Gate

Feature/page worked on:

- PM-GAP-067B provider identity mapping safety for compact World Cup live event markets.
- This cycle prevents unrelated Polymarket markets from becoming attach-ready just because they have condition IDs and CLOB token IDs.

Frontend components touched:

- No visual UI code changed. Samsung tablet regression proof confirms the World Cup live-detail second-half Book flow still works.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_provider_candidate_relevance_gate.ts`

Important functions/services touched:

- `rankProviderCandidates()` now computes a relevance-aware `attachReadiness` report.
- `evaluateCandidateAttachReadiness()` now rejects candidates with `insufficient_market_relevance`.
- `assessCandidateRelevance()` checks important market tokens and outcome-name matches before a candidate can be attached.

User interactions supported:

- Samsung tablet proof still opens the World Cup live-detail page, scrolls to second-half market groups, opens the selected Book, and renders route-backed depth after the backend candidate guard.

State transitions:

- Real provider search for the local World Cup compact event now returns candidates with `providerErrorCount=0`.
- The proof saw 42 provider candidates across 14 compact markets, but 0 attach-ready candidates because all top candidates failed relevance.
- No database mapping mutation occurs in this cycle.

Known limitations:

- The local World Cup compact event still needs real matching provider slugs/token IDs. This cycle makes the mapping gate safer; it does not invent or attach mappings.
- Provider search quality is still noisy for future soccer fixture terms, so the next useful mapping cycle should improve provider discovery or use reviewed exact slugs.

Verification:

- Provider proof: `docs/mobile/harness/cycle-current-mobile-provider-candidate-relevance-gate.json`
- Tablet XML proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`
- Tablet screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/polymarket-orderbook-depth-snapshots.test.ts`
- `cmd /c npm.cmd run build`
- mobile `cmd /c npm.cmd run typecheck`
- Samsung tablet proof via `mobile/scripts/smoke.ps1 -Deep -ServerLiveDetailSecondHalfOrderBook`

## Cycle CU - Provider CLOB Depth Fetcher

Feature/page worked on:

- PM-GAP-067 provider-owned refresh execution for compact live event detail and selected Book.
- This cycle adds real Polymarket CLOB orderbook fetch execution for provider-mapped compact markets, then proves the route moves from quote-derived depth to provider ladder depth after refresh.

Frontend components touched:

- No visual UI code changed. Existing EventDetail/Book rendering consumes the refreshed route-backed orderbook payload.

Backend/components touched:

- `src/server/services/polymarketOrderbookDepthSnapshots.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `src/__tests__/polymarket-orderbook-depth-snapshots.test.ts`
- `src/__tests__/mobile-live-provider-refresh.route.test.ts`
- `scripts/prove_mobile_provider_clob_depth_refresh.ts`

Important functions/services touched:

- `refreshPolymarketOrderbookDepthSnapshots()` fetches official Polymarket CLOB `/book?token_id=...` data for each active outcome with `referenceTokenId` and writes normalized bid/ask ladder rows.
- `refreshMobileLiveProviderQuoteSnapshots()` now reports `providerDepth` and runs CLOB depth refresh after mapped provider quote refresh.
- `buildPublicOrderbookSnapshot()` was already ready for provider ladder rows from Cycle CT; Cycle CU proves the real fetcher populates that path.

User interactions supported:

- Samsung tablet proof opens the provider refresh proof event and selected Book after refresh. The Book surface renders route-backed provider depth, best bid/ask, share sizes, and preserved selected market identity.

State transitions:

- Proof starts with no `ReferenceOrderbookDepthSnapshot` rows for the disposable provider market, so `/api/orderbook/:marketId/book` returns `depthSource=provider-quote-snapshot`.
- Provider refresh fetches real CLOB depth and writes 96 `polymarket-clob` ladder rows.
- The same Book route then returns `depthSource=provider-orderbook-depth`, `providerOrderbookDepth.status=ready`, and 48 provider levels.

Known limitations:

- Cycle CU proves real provider CLOB refresh for a mapped disposable provider market. The production World Cup compact soccer markets still need real provider identity mapping before every live game can use this path.
- Provider depth retention/cleanup policy remains a later operational concern.

Verification:

- Official provider contract checked against Polymarket CLOB docs for `GET /book?token_id=...`.
- Route proof: `docs/mobile/harness/cycle-current-mobile-provider-clob-depth-refresh-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-provider-clob-depth-prep.json`
- Tablet XML proof: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Tablet screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`
- `cmd /c npm.cmd run test:ci -- src/__tests__/polymarket-orderbook-depth-snapshots.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/orderbook-snapshot.provider-depth.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run build`
- mobile `cmd /c npm.cmd run typecheck`
- Samsung tablet provider proof via `mobile/scripts/smoke.ps1 -Deep -ServerLiveProviderRefreshProof -ServerEventSlug mobile-provider-refresh-proof-live`

## Cycle CT - Provider Orderbook Depth Snapshot Contract

Feature/page worked on:

- PM-GAP-067 provider-owned depth ladder contract for compact live event detail and selected Book.
- This cycle adds a durable backend shape for provider CLOB/orderbook ladder rows so Holiwyn does not have to treat top-quote estimates as the final depth model.

Frontend components touched:

- No visual UI code changed. Existing EventDetail/Book rendering consumes the richer route-backed depth payload.

Backend/components touched:

- `prisma/schema.prisma`
- `prisma/migrations/20260704062000_add_reference_orderbook_depth_snapshot/migration.sql`
- `src/server/services/orderbookSnapshot.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `src/server/services/referenceOrderbookDepthSnapshots.ts`
- `scripts/prove_mobile_provider_depth_snapshot_route.ts`
- `src/__tests__/orderbook-snapshot.provider-depth.test.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `buildPublicOrderbookSnapshot()` now prefers local orders, then provider orderbook depth snapshots, then provider top-quote snapshot estimates.
- `buildProviderOrderbookDepth()` normalizes latest provider ladder rows into bid/ask levels and freshness metadata.
- `upsertReferenceOrderbookDepthSnapshots()` writes future provider-owned ladder rows using stable market/outcome/source/side/price identity.
- `serializeMobileLiveEventDetail()` exposes provider ladder counts and per-market `providerOrderbookDepth` metadata.

User interactions supported:

- Samsung tablet Book proof still opens the selected proof market and renders route-backed depth, best bid/ask, provider prices, and share sizes.

State transitions:

- Route proof starts with no provider ladder rows, so `/api/orderbook/:marketId/book` returns `depthSource=provider-quote-snapshot`.
- After seeding eight provider ladder rows, the same Book route returns `depthSource=provider-orderbook-depth`, `providerOrderbookDepth.status=ready`, and eight route levels.

Known limitations:

- Cycle CT defines and proves the durable provider ladder contract with proof rows. It does not yet fetch real CLOB ladder levels from Polymarket or map real World Cup compact markets to provider identities.
- Local database proof applied the new table SQL directly because this workstation database has older migration records that are not present in this checkout.

Verification:

- Route proof: `docs/mobile/harness/cycle-current-mobile-provider-depth-snapshot-route-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-provider-depth-snapshot-prep.json`
- Tablet XML proof: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Tablet screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`
- `cmd /c npx.cmd prisma generate`
- `cmd /c npm.cmd run test:ci -- src/__tests__/orderbook-snapshot.provider-depth.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run build`
- mobile `cmd /c npm.cmd run typecheck`
- Samsung tablet provider proof via `mobile/scripts/smoke.ps1 -ServerLiveProviderRefreshProof -ServerEventSlug mobile-provider-refresh-proof-live`

## Cycle CS - Provider Quote Top-Of-Book Depth Bridge

Feature/page worked on:

- PM-GAP-067 provider-owned depth bridge for compact live event detail and selected Book.
- This cycle converts refreshed provider quote snapshots into explicit top-of-book depth levels when no local orderbook ladder exists.

Frontend components touched:

- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/scripts/smoke.ps1`

Backend/components touched:

- `src/server/services/orderbookSnapshot.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/orderbook-snapshot.provider-depth.test.ts`

Important functions/services touched:

- `buildPublicOrderbookSnapshot()` now reports `depthSource`, `depthReason`, and `providerQuoteDepth`.
- `buildProviderQuoteDepth()` builds provider-derived bid/ask top levels from `ReferenceQuoteSnapshot.bestBid`, `bestAsk`, and provider liquidity/volume fields.
- `normalizeEventSummary()` preserves server-hydrated backend depth as `orderbook-route` so EventDetail can open the Book overlay in a ready route-depth state.

User interactions supported:

- Backend route proof shows the selected Book route no longer returns `emptyState=no-depth` for the provider proof event after refresh.
- Samsung tablet proof shows the selected Book screen after provider refresh with route-backed ready depth, best bid/ask prices, and provider-derived share sizes.

State transitions:

- Proof event starts stale/refresh-due, then `POST /api/mobile/events/mobile-provider-refresh-proof-live/provider-refresh` refreshes provider snapshots.
- `/api/orderbook/:marketId/book?maxLevels=2` returns `depthSource=provider-quote-snapshot`, `emptyState=null`, `providerQuoteDepth.levelCount=4`, and four levels derived from refreshed provider quote snapshots.

Known limitations:

- This is top-of-book provider quote depth, not a full provider CLOB ladder. Sizes are explicitly marked estimated from provider liquidity fields.
- Cycle CS is merge-ready for the scoped provider quote bridge. Full provider CLOB depth and real World Cup provider mapping remain P1 structural debt.

Verification:

- Route proof: `docs/mobile/harness/cycle-current-mobile-provider-quote-depth-route-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-provider-quote-depth-proof-prep.json`
- Device proof summary: `docs/mobile/harness/cycle-current-holiwyn-provider-quote-depth-proof-summary.json`
- Device XML proof: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Device screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`
- Samsung tablet provider refresh proof via `mobile/scripts/smoke.ps1 -ServerLiveProviderRefreshProof -ServerEventSlug mobile-provider-refresh-proof-live`
- `cmd /c npm.cmd run test:ci -- src/__tests__/orderbook-snapshot.provider-depth.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run typecheck` from `mobile/`

## Cycle CR - Provider-Owned Refresh And Cache Invalidation

Feature/page worked on:

- PM-GAP-067 provider-owned refresh execution for compact live event detail.
- This cycle proves a real provider-mapped disposable event can move from stale/refresh-due to ready through the protected refresh route without using the local contract-proof fallback.

Frontend components touched:

- `mobile/scripts/smoke.ps1`
- No visual UI parity work was started. The harness was extended only to prove the refreshed backend event on the Holiwyn Android tablet.

Backend/components touched:

- `src/app/api/mobile/events/[slug]/provider-refresh/route.ts`
- `src/__tests__/mobile-live-provider-refresh.route.test.ts`
- `scripts/prepare_mobile_provider_refresh_proof_event.ts`

Important functions/services touched:

- `POST /api/mobile/events/:slug/provider-refresh` now returns explicit `cacheInvalidation` metadata and sets `Cache-Control: no-store, max-age=0`.
- `invalidateMobileLiveProviderRefreshCache()` revalidates the compact live-detail route, public event route, and each affected orderbook route.
- `prepare_mobile_provider_refresh_proof_event.ts` imports one real Gamma market by slug, writes provider-owned market/outcome identity, and seeds intentionally stale `ReferenceQuoteSnapshot` rows for proof.
- The existing `refreshMobileLiveProviderQuoteSnapshots()` path executes the real Polymarket Gamma refresh and updates provider snapshot rows.

User interactions supported:

- Holiwyn tablet opens the refreshed disposable backend event through `forceBackendEventSlug`.
- Event detail renders `event-detail-live-data-inline`, `live-data-status-ready`, and `live-data-source-polymarket-gamma`.
- The Book action opens the selected orderbook and renders provider best bid/ask from refreshed snapshots while truthfully showing that no local order depth exists.

State transitions:

- Proof event `mobile-provider-refresh-proof-live` starts with one provider-refreshable market, stale snapshots, `status=stale`, and `shouldRefresh=true`.
- `POST /api/mobile/events/mobile-provider-refresh-proof-live/provider-refresh` with `allowContractProofFallback=false` executes a real provider refresh, updates two snapshots, and invalidates three cache paths.
- Follow-up live-detail route reports `readyCount=1`, `staleCount=0`, `refreshDueCount=0`, selected `status=ready`, and `shouldRefresh=false`.

Known limitations:

- The disposable proof market has no local orderbook ladder; the orderbook overlay therefore shows `orderbook-source-fallback`, `orderbook-status-empty`, and provider best bid/ask only.
- The real World Cup compact event still needs provider identity mapping for every compact soccer market before this can be marked full World Cup provider parity.

Verification:

- Route proof: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-real-provider-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-proof-prep.json`
- Tablet proof summary: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-summary.json`
- Tablet screenshots/XML: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-event-detail.png`, `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`, `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run typecheck` from `mobile/`

## Cycle CQ - Manual Provider Slug Preview Contract

Feature/page worked on:

- PM-GAP-067 manual provider slug preview for compact live event detail.
- This cycle extends provider candidate discovery so a known Polymarket slug can be tested against a specific compact Holiwyn market without broad search or DB mutation.

Frontend components touched:

- None. Samsung tablet proof was rerun against the existing live event detail and selected second-half Book flow after backend route changes.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/app/api/mobile/events/[slug]/provider-candidates/route.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `src/__tests__/mobile-live-provider-candidates.route.test.ts`

Important functions/services touched:

- `previewMobileLiveProviderCandidatesBySlug()` validates the compact market, fetches exact provider markets by supplied slugs, ranks them, and returns attach proposals when complete.
- `fetchProviderCandidatesForSlugs()` calls Polymarket Gamma `/markets?slug=...` and normalizes exact slug matches.
- `POST /api/mobile/events/:slug/provider-candidates` exposes the manual slug preview path behind internal/admin auth.

User interactions supported:

- No new visual interaction. This is a backend review path for the future real provider identity import step.
- Existing Samsung tablet live detail and selected second-half Book flow still work after the backend contract change.

State transitions:

- Manual preview proof targeted the first compact market and slug `curacao-cote-divoire-match-winner`.
- The route returned `mode=manual-slug-preview`, `candidateCount=0`, `attachReadyCandidateCount=0`, `providerError=fetch failed`, and `nextRequiredAction=fix_provider_fetch_or_retry_manual_slug_preview`.

Known limitations:

- Manual preview contract exists, but provider fetch still failed in this local proof run.
- No real provider IDs were discovered, attached, or refreshed.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-identity-attach.service.test.ts`
- `cmd /c npm.cmd run build`
- Manual slug preview proof: `docs/mobile/harness/cycle-current-mobile-live-provider-candidates-manual-slug-preview.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CP - Provider Candidate Discovery Contract

Feature/page worked on:

- PM-GAP-067 provider candidate discovery for compact live event detail.
- This cycle adds the protected provider-search route needed before real provider identity can be reviewed and attached.

Frontend components touched:

- None. Samsung tablet proof was rerun against the existing live event detail and selected second-half Book flow after backend route changes.

Backend/components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/app/api/mobile/events/[slug]/provider-candidates/route.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `src/__tests__/mobile-live-provider-candidates.route.test.ts`

Important functions/services touched:

- `discoverMobileLiveProviderCandidates()` loads compact live markets, derives provider search queries, optionally fetches Polymarket Gamma candidates, ranks them, and returns attach-ready proposals only when provider identity is complete.
- `buildProviderCandidateSearchQueries()` turns compact market title/type/period/line metadata into auditable search terms.
- `fetchProviderCandidatesForQueries()` normalizes Gamma-style market payloads into provider candidate rows with `externalMarketId`, `conditionId`, outcomes, token IDs, prices, quality fields, and tags.
- `rankProviderCandidates()` scores candidates against the compact market and marks attach readiness.

User interactions supported:

- No new visual interaction. This is a backend discovery contract for the future import/review step.
- Existing Samsung tablet live detail and selected second-half Book flow still work after the backend contract change.

State transitions:

- Contract-only proof (`fetchProvider=false`) returns 14 compact targets with generated search queries and next action `run_provider_candidate_discovery_with_fetch_enabled`.
- Provider-fetch proof attempted discovery for all 14 targets and returned `providerErrorCount=14` with `providerError="fetch failed"`, so real candidate import remains blocked by provider fetch/network state in this run.

Known limitations:

- No provider identities were applied.
- No attach-ready candidates were found because provider fetch failed during route proof.
- The next provider cycle should rerun discovery in an environment where Gamma fetch works, or accept manually supplied real Polymarket slugs through a controlled candidate/attach workflow.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-identity-attach.service.test.ts`
- `cmd /c npm.cmd run build`
- Query-contract proof: `docs/mobile/harness/cycle-current-mobile-live-provider-candidates-query-contract.json`
- Provider-fetch attempt proof: `docs/mobile/harness/cycle-current-mobile-live-provider-candidates-fetch-attempt.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CO - Provider Identity Attach Contract

Feature/page worked on:

- PM-GAP-067 provider identity attach bridge for compact live event detail.
- This cycle creates the protected dry-run/apply path needed to connect a compact Holiwyn market/outcome to provider-owned market and token identity before no-fallback refresh can pass.

Frontend components touched:

- None. Samsung tablet proof was rerun against the existing live event detail and selected second-half Book flow after backend route changes.

Backend/components touched:

- `src/server/services/mobileLiveProviderIdentityAttach.ts`
- `src/app/api/mobile/events/[slug]/provider-mapping/route.ts`
- `src/__tests__/mobile-live-provider-identity-attach.service.test.ts`
- `src/__tests__/mobile-live-provider-mapping.route.test.ts`

Important functions/services touched:

- `attachMobileLiveProviderIdentities()` validates compact market/provider mappings, dry-runs projected readiness by default, and only writes to `Market`/`Outcome` provider fields when `dryRun=false` and `confirmApply=true`.
- `validateMobileLiveProviderIdentityMappings()` rejects non-compact markets, unsupported provider sources, duplicate provider IDs, incomplete market fields, and partial outcome mappings.
- `POST /api/mobile/events/:slug/provider-mapping` now supports protected identity attach requests.

User interactions supported:

- No new visual interaction. This is a backend contract that makes the future provider-import workflow able to move a market from unmapped to provider-refreshable without UI-only mock data.
- Existing Samsung tablet live detail and selected second-half Book flow still work after the backend contract change.

State transitions:

- Current event readiness before dry-run: `providerRefreshableMarketCount=0`, `isProviderRefreshReady=false`.
- Dry-run attaching one complete compact market mapping validates successfully, does not write to the database, and projects `providerRefreshableMarketCount=1`.
- Whole-event readiness remains false because the other compact markets still need real provider identity.

Known limitations:

- The proof uses future-shaped dry-run IDs and does not apply fake provider identity to the database.
- Real Polymarket/provider candidate discovery and actual identity apply for all compact markets remain open before no-fallback provider refresh can pass.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-mapping.service.test.ts src/__tests__/mobile-live-provider-identity-attach.service.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts`
- `cmd /c npm.cmd run build`
- Dry-run attach proof: `docs/mobile/harness/cycle-current-mobile-live-provider-identity-attach-dry-run.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CN - Provider Mapping Readiness Contract

Feature/page worked on:

- PM-GAP-067 provider ingestion readiness for compact live event detail.
- This cycle blocks visual UI parity work and makes the missing real-provider mapping auditable before another refresh cycle claims provider parity.

Frontend components touched:

- None. Samsung tablet proof was rerun against the existing live event detail and selected second-half Book flow after backend route changes.

Backend/components touched:

- `src/server/services/mobileLiveProviderMapping.ts`
- `src/app/api/mobile/events/[slug]/provider-mapping/route.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `src/__tests__/mobile-live-provider-mapping.route.test.ts`
- `src/__tests__/mobile-live-provider-mapping.service.test.ts`
- `src/__tests__/mobile-live-provider-refresh.route.test.ts`

Important functions/services touched:

- `getMobileLiveProviderMappingReadiness()` loads compact live markets and reports whether each market/outcome has provider-owned identity.
- `assessMobileLiveProviderMappingReadiness()` returns per-market `missingFields`, per-outcome token/label readiness, aggregate provider-refreshable counts, and the next required action.
- `refreshMobileLiveProviderQuoteSnapshots()` now includes `mappingReadiness` in its response and only attempts provider refresh for markets with complete provider mapping.

User interactions supported:

- No new visual interaction. The user-visible effect is that future refresh/loading states can be driven by a truthful backend readiness gate instead of frontend guesses.
- The existing Samsung tablet live detail and selected second-half Book flow still work after the backend contract change.

State transitions:

- Current compact event mapping probe reports `providerRefreshableMarketCount=0`, `unsupportedSourceMarketCount=14`, `missingOutcomeTokenMarketCount=14`, and `isProviderRefreshReady=false`.
- No-fallback provider refresh reports `providerMappedMarketCount=0`, `unsupportedMarketCount=14`, `provider.attempted=false`, and no contract-proof fallback.

Known limitations:

- This cycle does not solve real provider ingestion. It proves the current blocker: compact World Cup match markets are `fifa_schedule` sourced and lack Polymarket market/outcome identity.
- Next structural cycle must import/map real provider identities or add a production sports provider adapter before no-fallback refresh can pass.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-mapping.service.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts`
- `cmd /c npm.cmd run build`
- Mapping proof: `docs/mobile/harness/cycle-current-mobile-live-provider-mapping-readiness.json`
- No-fallback blocked proof: `docs/mobile/harness/cycle-current-mobile-live-provider-no-fallback-refresh-blocked-proof.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CM - Provider Refresh Execution Contract

Feature/page worked on:

- PM-GAP-067 provider-owned refresh execution path for compact live event detail.
- This cycle adds a protected mobile live-detail refresh route, stale/refresh-due invalidation proof, and Android proof after refreshing back to ready state.

Frontend components touched:

- None. Samsung tablet proof was rerun against the existing live event detail and selected second-half Book flow after provider refresh.

Backend/components touched:

- `src/server/services/polymarketReferenceSnapshots.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `src/app/api/mobile/events/[slug]/provider-refresh/route.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-provider-refresh.route.test.ts`

Important functions/services touched:

- `refreshPolymarketReferenceSnapshots()` now supports explicit `marketIds` and reports `snapshotWritesApplied` / `snapshotsUpdated`.
- `refreshMobileLiveProviderQuoteSnapshots()` selects compact live markets, attempts real Polymarket Gamma refresh for mapped markets, reports unsupported markets, and summarizes post-refresh snapshot state.
- `expireMobileLiveProviderQuoteSnapshots()` deliberately ages compact-market snapshots for stale/refresh-due proof.

User interactions supported:

- A user reopening the live game page after refresh sees the same route-backed second-half orderbook path with provider-ready state.
- The app can now distinguish stale/refresh-due state from ready state through backend route changes rather than local UI guesses.

State transitions:

- Fresh rows -> protected route expires snapshots -> live-detail reports `ready=0`, `stale=14`, `refreshDue=14`, selected second-half `status=stale`, `shouldRefresh=true`.
- Explicit refresh proof -> live-detail reports `ready=14`, `stale=0`, `refreshDue=0`, selected second-half and selected Book `status=ready`, `shouldRefresh=false`.

Known limitations:

- The current local World Cup compact event is sourced from `fifa_schedule`, not imported Polymarket markets. Real Gamma refresh is therefore not attempted for those compact markets and the route truthfully reports 14 unsupported markets.
- The ready proof uses an explicit local contract-proof fallback after the real provider mapping is reported missing. Backend parity remains incomplete until compact World Cup markets have real Polymarket market/outcome mappings or a production sports odds provider.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run build`
- Route proof: `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-execution-proof.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CL - Provider Refresh Policy Contract

Feature/page worked on:

- PM-GAP-067 provider refresh/cache policy fields for compact live detail and selected orderbook routes.
- This cycle closes the repeated "provider cache/invalidation unknown" debt far enough for mobile to reason about when quote snapshots are ready, stale, or due for refresh.

Frontend components touched:

- None. Samsung tablet proof was rerun to confirm the existing live event detail and selected second-half Book flow still work with the expanded provider snapshot contract.

Backend/components touched:

- `src/server/services/orderbookSnapshot.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`

Important functions/services touched:

- `buildPublicOrderbookSnapshot()` now exposes `providerQuoteSnapshot.refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, and `refreshKey`.
- `buildMobileLiveEventDetail()` now aggregates provider snapshot readiness, stale, refresh-due, and earliest next-refresh state across compact live markets.
- Existing `mobile:live-provider-quote-snapshot-seed` proof rows were reused so the new policy fields come from backend-shaped `ReferenceQuoteSnapshot` rows.

User interactions supported:

- A user opening the live game page and then the second-half Book still sees the same route-backed market/orderbook path.
- The mobile app can now make future refresh/loading/stale decisions from route fields instead of inventing local refresh state.

State transitions:

- Fresh provider snapshot rows -> route reports `status=ready`, `shouldRefresh=false`, `nextRefreshAt=<fetchedAt+60s>`, and stable `refreshKey`.
- Compact live detail aggregates those market-level states into `batchedProviderQuoteSnapshotReadyCount`, `StaleCount`, `RefreshDueCount`, and `NextRefreshAt`.

Known limitations:

- This is still not a real external provider refresh worker.
- Provider-owned invalidation/update execution, provider error classification, and full provider depth ladders remain active PM-GAP-067 work.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-provider-quote-snapshot-seeding.test.ts`
- `cmd /c npm.cmd run mobile:live-provider-quote-snapshot-seed`
- Direct route probe saved to `docs/mobile/harness/cycle-current-mobile-live-provider-refresh-policy-probe.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`
- `cmd /c npm.cmd run build`

## Cycle CK - Live Provider Quote Snapshot Ready Proof

Feature/page worked on:

- PM-GAP-067 provider-shaped quote snapshot readiness for compact live event detail.
- This cycle converts the Cycle CJ provider metadata contract from truthful `unavailable` local proof state to a repeatable ready-state proof using real `ReferenceQuoteSnapshot` rows.

Frontend components touched:

- None. Samsung tablet proof was rerun to confirm the existing live event detail and selected second-half Book flow still work after provider-shaped snapshot rows are present.

Backend/components touched:

- `src/server/services/mobileLiveProviderQuoteSnapshotSeeding.ts`
- `scripts/seed_mobile_live_provider_quote_snapshots.ts`
- `src/__tests__/mobile-live-provider-quote-snapshot-seeding.test.ts`
- `package.json`

Important functions/services touched:

- `buildMobileLiveProviderQuoteSnapshotRows()` creates backend-shaped `ReferenceQuoteSnapshot` input rows for every outcome in the compact live-detail market set.
- `mobile:live-provider-quote-snapshot-seed` applies those rows for the World Cup live event and writes `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-seed.json`.
- Existing `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` routes now prove `providerQuoteSnapshot.status: ready` when snapshot rows exist.

User interactions supported:

- No new button or UI surface was added. The user-visible flow remains: open live football game detail, scroll to `2nd Half Winner`, tap Book, and see the selected route-backed orderbook on Samsung tablet.

State transitions:

- Compact live markets selected -> provider-shaped snapshot rows upserted by `marketId`/`outcomeId`/`source` -> live-detail route reports `batchedProviderQuoteSnapshotSource: reference-quote-snapshot` and count `14` -> selected second-half orderbook reports `providerQuoteSnapshot.status: ready`.

Known limitations:

- This is a deterministic local provider-shaped proof, not live external Polymarket ingestion.
- Real provider refresh, invalidation/update sequence, and provider-owned depth/liquidity across every live World Cup market remain open.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-quote-snapshot-seeding.test.ts src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run mobile:live-provider-quote-snapshot-seed`
- Direct route probe saved to `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-ready-probe.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`
- `cmd /c npm.cmd run build`

## Cycle CJ - Provider Quote Snapshot Contract

Feature/page worked on:

- PM-GAP-067 provider quote snapshot status for live event detail and selected orderbook routes.
- This cycle addresses deferred provider-cache debt from Cycle CI using the existing backend `ReferenceQuoteSnapshot` model.

Frontend components touched:

- None. Samsung tablet proof was rerun to confirm the existing live event detail and selected Book flow still work with the expanded backend contract.

Backend/components touched:

- `src/server/services/orderbookSnapshot.ts`
- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `buildPublicOrderbookSnapshot()` now reads safe provider snapshot metadata from `ReferenceQuoteSnapshot` and returns `providerQuoteSnapshot` with source, status, count, latest fetch/update times, staleness, accepting-orders flag, outcome IDs, and provider sources.
- `/api/orderbook/:marketId/book` now exposes this provider snapshot status without leaking token IDs, external market IDs, credentials, or owner/user fields.
- `/api/mobile/events/:slug/live-detail` now forwards `markets[].providerQuoteSnapshot` and contract-level `batchedProviderQuoteSnapshotSource` / `batchedProviderQuoteSnapshotMarketCount`.

User interactions supported:

- No new UI control was added. The user-visible proof remains the live football game detail row and selected second-half orderbook flow on Samsung tablet.

State transitions:

- Selected market/orderbook request -> local orderbook depth snapshot -> `ReferenceQuoteSnapshot` status summary -> public orderbook route response -> compact live-detail route -> mobile-visible market identity/depth flow.

Known limitations:

- The local World Cup match currently has no `ReferenceQuoteSnapshot` rows, so route proof correctly reports `status: unavailable` and `batchedProviderQuoteSnapshotSource: empty`.
- This does not complete provider ingestion or provider-owned liquidity. It creates the backend contract the mobile app can consume once ingestion is wired.

Verification:

- Direct route probe saved to `docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-probe.json`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CI - Depth Batching Policy Contract

Feature/page worked on:

- PM-GAP-067 production-style compact live-detail depth batching policy metadata.
- This cycle continues the structural live event detail work from Cycle CH instead of opening a new visual feature area.

Frontend components touched:

- None. The existing EventDetail tablet proof was rerun to confirm the visible route-backed depth behavior still works after the route contract change.

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now exposes backend policy metadata for compact-market depth batching: `generatedAt`, `maxMarkets`, `batchedOrderbookDepthRequestedMarketCount`, `batchedOrderbookDepthRequestedMarketIds`, `batchedOrderbookDepthMaxLevels`, and `batchedOrderbookDepthCacheTtlSeconds`.
- The compact live-detail route continues to batch route-backed depth for visible markets while making its batching limits auditable by mobile and future backend/provider work.

User interactions supported:

- No new UI control was added. The material user-visible behavior preserved in this cycle is the existing server-backed live game detail: user scrolls to `2nd Half Winner`, sees `Route depth`, taps Book, and opens the selected second-half route-backed orderbook.

State transitions:

- Compact live-detail route selects visible markets -> records which market IDs were requested for batched depth -> serializes per-market depth/quote fields when available -> exposes route policy metadata -> mobile renders the same selected market rows and selected Book flow.

Known limitations:

- This is not provider parity. There is still no real provider cache, invalidation layer, provider snapshot status per depth response, or provider-owned liquidity for every line market.
- The frontend does not yet surface the policy metadata; it is documented and tested so future provider-scale mobile work can depend on it.

Verification:

- Direct route probe saved to `docs/mobile/harness/cycle-current-mobile-live-depth-batching-policy-probe.json`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CH - Batched Live Market Depth Contract

Feature/page worked on:

- PM-GAP-067 provider-wide/batched live market depth for the live event detail page.
- Re-scoped from live stats after the S23 Polymarket reference showed the current game detail focuses on chart, chat, outcome buttons, and Game Lines rather than a separate soccer stats tab.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now builds public orderbook snapshots for every compact visible market, not only the primary market.
- Compact markets now carry backend-shaped `liquidity`, `orderbookDepth[]`, `outcomes[].bestBid`, `bestAsk`, `bestBidSize`, and `bestAskSize` when route depth exists.
- The route contract now reports `batchedOrderbookDepthSource` and `batchedOrderbookDepthMarketCount`.
- EventDetail shows an auditable `Route depth` chip on backend-backed market groups with batched depth.

User interactions supported:

- User can scroll the live game detail and see that `2nd Half Winner` has server-batched route depth before opening its Book; tapping Book still opens the selected second-half orderbook with route-backed depth.

State transitions:

- Compact live-detail route selects visible markets -> batches `/api/orderbook` snapshot generation per market -> serializes each market's depth/quote fields -> mobile adapter normalizes the market -> EventDetail marks the row as `market-depth-batched` -> selected Book opens the same market's full route-backed orderbook.

Known limitations:

- Batched depth currently comes from deterministic local proof orders in real backend tables; provider-owned liquidity ingestion is still required for production parity.
- Only markets with seeded/open orders return non-empty batched depth; production batching/prefetch policy still needs provider-scale performance tuning.

Verification:

- S23 Polymarket reference capture: `docs/mobile/reference/screenshots/cycle-CH-polymarket-reference.png`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run mobile:live-halves-markets-seed`
- `cmd /c npm.cmd run mobile:live-second-half-orderbook-depth-seed`
- Direct route probe saved to `docs/mobile/harness/cycle-current-mobile-live-batched-orderbook-depth-probe.json`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CG - Second-Half Orderbook Depth Proof

Feature/page worked on:

- PM-GAP-067 selected second-half route-backed orderbook depth for the live event detail page.
- This cycle closes the specific deferred parity debt left by Cycle CF: the backend-shaped `2nd Half Winner` market now has the same route-backed Book proof as first half.

Frontend components touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend/components touched:

- `scripts/seed_mobile_live_orderbook_depth.ts` through the existing `--period=second-half` contract.
- `package.json`

Important functions/services touched:

- The shared server-live smoke path now treats first-half and second-half orderbook proofs as the same Halves proof family.
- `smoke:tablet:server-live-second-half-order-book` launches the server-backed live detail route, scrolls to `2nd Half Winner`, taps its Book action, and verifies the selected route-backed orderbook state.
- `mobile:live-second-half-orderbook-depth-seed` seeds deterministic orderbook depth against the backend second-half market, preserving `marketId`, `outcomeId`, `period`, side, price, and size identity.

User interactions supported:

- User scrolls to `2nd Half Winner`, sees backend availability, taps Book, and opens the selected second-half orderbook with route-backed bid/ask depth.

State transitions:

- Halves seed confirms `Market(period=second-half, marketType=match_winner_1x2)` -> second-half depth seed writes open `Order` rows for that market's outcomes -> compact live-detail route returns the second-half market -> EventDetail attaches it to `event-detail-open-order-book-second-half-winner` -> orderbook route returns depth and selected-market availability.

Known limitations:

- Second-half depth is deterministic local proof data in real backend tables, not provider-ingested live liquidity.
- Provider ingestion, provider-owned live stats, production batching/prefetch, and provider-wide all-line liquidity remain open under PM-GAP-067.

Verification:

- `cmd /c npm.cmd run mobile:live-halves-markets-seed`
- `cmd /c npm.cmd run mobile:live-second-half-orderbook-depth-seed`
- `cmd /c npm.cmd run smoke:tablet:server-live-second-half-order-book`

## Cycle CF - Halves Orderbook Depth Contract

Feature/page worked on:

- PM-GAP-067 selected Halves route-backed orderbook depth for the live event detail page.
- First-half and second-half winner rows are no longer local-only when backend markets exist.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `scripts/seed_mobile_live_halves_markets.ts`
- `scripts/seed_mobile_live_orderbook_depth.ts`
- `package.json`

Important functions/services touched:

- `selectCompactLiveMarkets()` now reserves first-half and second-half winner markets in the compact live-detail payload.
- `seed_mobile_live_halves_markets.ts` creates deterministic backend-shaped half-period winner markets with stable slugs, period fields, outcomes, availability timestamps, and orderbook visibility.
- `seed_mobile_live_orderbook_depth.ts` can target `--period=first-half` so seeded depth attaches to the selected half market.
- EventDetail matches backend `period: first-half/second-half` markets and opens their selected order books/tickets instead of falling back to the primary winner market.

User interactions supported:

- User scrolls to `1st Half Winner`, sees backend availability, taps Book, and opens the selected first-half orderbook with route-backed bid/ask depth.

State transitions:

- Halves seed creates `Market(period=first-half, marketType=match_winner_1x2)` -> compact live-detail route reserves it -> mobile adapter normalizes it to `marketType=moneyline, period=first-half` -> EventDetail attaches it to `event-detail-open-order-book-first-half-winner` -> orderbook route returns depth and stale selected-market availability.

Known limitations:

- Halves markets/depth are deterministic local proof data, not provider-ingested live liquidity.
- First-half selected depth is proven in this cycle; second-half selected depth is proven separately in Cycle CG.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run mobile:live-halves-markets-seed`
- `cmd /c npm.cmd run mobile:live-first-half-orderbook-depth-seed`
- `cmd /c npm.cmd run smoke:tablet:server-live-first-half-order-book`

## Cycle CE - Compact Market Availability Contract

Feature/page worked on:

- PM-GAP-067 compact per-visible-market availability for the live event detail page.
- `/api/mobile/events/:slug/live-detail` now emits backend-shaped market availability for each compact market row before the user opens an order book.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/scripts/smoke.ps1`

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now emits `markets[].availability` with source, status, raw market status, timestamps, staleness, booleans, and reason.
- `normalizeMarket()` preserves `availability` into the mobile market contract.
- EventDetail renders `event-detail-market-availability-*` labels on visible line groups and keeps the same availability identity on each Book button.

User interactions supported:

- User scrolls to Team Totals and can see the selected market is stale before opening its order book; opening the book still shows route-backed depth and matching stale availability.

State transitions:

- Compact route reads `Market.status`, `Market.sourceUpdatedAt`, and `Market.updatedAt` -> returns `markets[].availability` -> mobile adapter stores it on each `Market` -> EventDetail exposes `market-availability-stale market-status-LIVE` on the visible Team Totals row -> Book opens the selected market orderbook and preserves the availability state.

Known limitations:

- Availability is derived from existing market timestamps, not an external provider heartbeat.
- Backend parity remains incomplete until provider ingestion refreshes market timestamps/status for every live line market.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run mobile:live-team-totals-orderbook-depth-seed`
- `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

## Cycle CD - Selected Orderbook Availability Contract

Feature/page worked on:

- PM-GAP-067 selected-market orderbook availability for the live event detail page.
- Public orderbook route now exposes market-level availability/freshness state beside depth rows.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/marketDepthService.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/marketDepthService.test.ts`
- `mobile/scripts/smoke.ps1`

Backend/components touched:

- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`

Important functions/services touched:

- `/api/orderbook/:marketId/book` now returns `availability` with source, status, raw market status, last update, staleness, booleans, and reason.
- `loadMarketDepthState()` and `applyDepthStateToEvent()` preserve selected-market availability into the mobile event state.
- EventDetail orderbook overlay displays `event-detail-order-book-availability` and accessibility labels such as `orderbook-availability-stale`.

User interactions supported:

- User opens a selected Team Totals order book and sees both route-backed depth and selected-market availability instead of only price rows.

State transitions:

- Public orderbook route reads `Market.status`, `Market.sourceUpdatedAt`, and `Market.updatedAt` -> returns `availability.status` -> mobile depth service stores it on the selected event -> orderbook overlay renders `orderbook-availability-stale orderbook-market-status-LIVE`.

Known limitations:

- Availability is still derived from local market timestamps, not an external provider heartbeat.
- The selected Team Totals proof is truthfully `stale`; provider ingestion must refresh `sourceUpdatedAt` before the same market can be considered fresh.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run mobile:live-team-totals-orderbook-depth-seed`
- Direct route probe for `/api/orderbook/408ffb79-3492-4fd0-b31b-87a26f8b9dd5/book?maxLevels=2`
- `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

## Cycle BC - Live Provider Freshness Contract

Feature/page worked on:

- PM-GAP-067 provider freshness/stale/suspended availability state for the live event detail page.
- Backend-shaped `liveDataStatus` contract carried through route, mobile adapter, and visible UI proof labels.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/scripts/smoke.ps1`

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now emits `event.liveDataStatus` and `contract.liveDataStatus`.
- `normalizeEventSummary()` preserves `liveDataStatus` into the mobile `Event`.
- `EventDetail` renders auditable live-data status labels in the always-visible market header and live match strip.

User interactions supported:

- User can see whether the server-backed live game page is using fresh, stale, delayed, suspended, or unavailable live data before interacting with markets.

State transitions:

- `MarketOutcomeSnapshot` seed rows -> `/api/mobile/events/:slug/live-detail` derives `liveDataStatus` -> mobile adapter preserves the status -> EventDetail displays `event-detail-live-data-inline live-data-status-ready live-data-source-market-outcome-snapshot` -> order book interaction still opens selected Team Totals route-backed depth.

Known limitations:

- Freshness is derived from proof `MarketOutcomeSnapshot` timestamps or metadata overrides; real provider ingestion and provider-owned per-market availability state remain future backend work.
- The status is event-level in this cycle. Per-market/per-line freshness is still open PM-GAP-067 work.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run mobile:live-team-totals-orderbook-depth-seed`
- `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

## Cycle BB - Selected Team Totals Ready Depth

Feature/page worked on:

- PM-GAP-067 selected Team Totals orderbook depth for the live game page.
- Backend/mobile market-type alias for `team_total_goals`.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend/components touched:

- `package.json`

Important functions/services touched:

- `asMarketContractType()` now maps backend `team_total_goals` to the mobile `team-total` contract.
- `matchingBackendLineMarket()` supports Team Totals aliases and attaches the reserved compact backend market to the Team Totals game-line group.
- `mobile:live-team-totals-orderbook-depth-seed` seeds deterministic backend `Order` rows for Team Totals market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5`.
- `smoke:tablet:server-live-team-totals-order-book` proves the Team Totals Book control and route-backed ready depth on the Samsung tablet.

User interactions supported:

- User scrolls to Full Game Team Total Goals, taps Book, and sees the selected backend Team Totals order book with bid/ask depth.

State transitions:

- Compact live-detail route includes Team Totals market -> mobile adapter normalizes `team_total_goals` to `team-total` -> EventDetail renders `event-detail-open-order-book-team-total-goals` -> Team Totals Book tap calls `/api/orderbook/:marketId/book?maxLevels=24` -> overlay shows `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none`.

Known limitations:

- Team Totals ready depth uses deterministic seeded proof rows, not provider-owned live liquidity.
- Halves selected orderbook proof and provider freshness/stale/suspended states remain open PM-GAP-067 work.

Verification:

- `cmd /c npm.cmd run mobile:live-team-totals-orderbook-depth-seed`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/mobile-live-orderbook-depth-seeding.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

## Cycle BA - Compact Line Group Coverage And Totals Ready Depth

Feature/page worked on:

- PM-GAP-067 compact live-detail route coverage for line-market groups rendered by the live game page.
- Selected Totals orderbook proof for backend market `a552efe6-3147-4573-be95-8fe15c068c08`.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `package.json`

Important functions/services touched:

- `selectCompactLiveMarkets()` now reserves compact route slots for representative rendered groups: primary winner, Spread 1.5, Totals 2.5, and Team Total 1.5 before filling the rest of the mobile payload.
- `matchingBackendLineMarket()` now maps the mobile Totals UI contract onto backend `total_goals` markets.
- `mobile:live-totals-orderbook-depth-seed` seeds backend-shaped orderbook rows for the selected Totals market.
- `smoke:tablet:server-live-totals-order-book` proves the Totals line group exposes a Book control and opens route-backed ready depth.

User interactions supported:

- User scrolls to Totals on the live game page, taps Book, and sees the selected Totals market order book with route-backed bid/ask depth.
- The compact route no longer drops Totals because Spread lines consume the mobile market cap.

State transitions:

- Compact live-detail route selects representative line markets -> mobile adapter maps `total_goals` to Totals -> EventDetail renders `event-detail-open-order-book-totals` -> Totals Book tap calls `/api/orderbook/:marketId/book?maxLevels=24` -> overlay shows `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none`.

Known limitations:

- Totals proof uses deterministic seeded `Order` rows, not provider-owned live liquidity.
- Team Totals are now reserved in the compact route, but selected Team Total ready-depth tablet proof remains a later PM-GAP-067 cycle.
- Provider freshness/stale/suspended states remain open.

Verification:

- `cmd /c npm.cmd run mobile:live-totals-orderbook-depth-seed`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/mobile-live-orderbook-depth-seeding.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:server-live-totals-order-book`

## Cycle AZ - Selected Line Market Seeded Ready Depth

Feature/page worked on:

- PM-GAP-067 selected live line-market orderbook depth for the live game page.
- This cycle closes the repeated deferred item from Cycle AY: a selected Spread line market can now prove route-backed `ready` depth instead of only a truthful empty state.

Frontend components touched:

- `mobile/scripts/smoke.ps1`

Backend/components touched:

- `scripts/seed_mobile_live_orderbook_depth.ts`
- `package.json`

Important functions/services touched:

- `seed_mobile_live_orderbook_depth.ts` now accepts `--marketId`, `--marketType`, and `--line`, so proof liquidity can target a selected backend-shaped line market instead of the first available primary market.
- `mobile:live-spread-orderbook-depth-seed` seeds deterministic open `Order` rows for the selected Spread market `ac527022-07f3-4abb-90f0-b291466e8459`.
- `smoke.ps1 -ServerLiveDetailLineOrderBook` now asserts route-backed `ready` depth for the selected Spread market id, bid/ask prices, and depth sizes.

User interactions supported:

- User opens the live game page, taps the Spread order-book control, and sees backend route depth for the selected Spread line rather than borrowed primary-market depth or a no-liquidity placeholder.
- Buy/Sell controls remain attached to the selected line-market outcomes.

State transitions:

- Seed script writes backend `Order` rows for the selected Spread market -> compact live game page opens on tablet -> Spread Book tap calls `/api/orderbook/:marketId/book?maxLevels=24` -> EventDetail records `orderbookDepthMarketId` for the selected market -> overlay shows `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none` and route depth rows.

Known limitations:

- Seeded liquidity is deterministic proof data, not real provider ingestion.
- Only one selected Spread market is proven with ready depth in this cycle. Provider-backed liquidity/freshness for all Spread, Totals, Team Totals, Halves, and other line markets remains PM-GAP-067 P1 work.

Verification:

- `cmd /c npm.cmd run mobile:live-spread-orderbook-depth-seed`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-orderbook-depth-seeding.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run smoke:tablet:server-live-line-order-book`

## Cycle AY - Selected Line Market Depth Identity

Feature/page worked on:

- PM-GAP-067 on-demand orderbook/depth identity for selected live line markets.
- Live game page order book now tracks the exact selected market id, not only the primary winner market.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/marketDepthService.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/marketDepthService.test.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend components touched:

- No route/schema code changed. This cycle consumes the existing `/api/orderbook/:marketId/book` route for a selected non-primary live market.

Important functions/services touched:

- `loadMarketDepthState(api, event, marketId)` can now request depth for an explicit market id.
- `applyMarketDepthLoadingToEvent()` and `applyMarketDepthErrorToEvent()` preserve the selected market id while loading/error states are visible.
- `applyDepthStateToEvent()` records `orderbookDepthMarketId` for ready/empty states.
- `EventDetail` keeps `orderBookMarketId`, opens order books for backend-backed line groups, and labels overlays with `event-detail-order-book-market-<marketId>`.

User interactions supported:

- User can open the live Spread market order book from the game page.
- Holiwyn requests `/api/orderbook/:marketId/book` for that selected spread market, then shows a truthful `No depth` state when the backend has no seeded liquidity for that line.
- Buy/Sell controls remain attached to the selected line market outcomes.

State transitions:

- Spread Book tap -> `requestMarketDepth(spreadMarketId)` -> selected event depth state becomes `loading` for that market id -> orderbook route returns empty -> overlay shows `orderbook-source-orderbook-route orderbook-status-empty orderbook-empty-no-depth` for the spread market id.

Known limitations:

- This cycle proves selected-market depth identity and empty-state behavior, not seeded liquidity for every line market.
- Real provider/liquidity ingestion remains required before line-market order books can show full live depth like Polymarket.

Verification:

- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:server-live-line-order-book`

## Cycle AX - Compact Live Detail Route And Route-Backed Depth Proof

Feature/page worked on:

- PM-GAP-067 compact mobile live event detail contract for the live game page.
- Route-backed Samsung tablet proof for the live game order book and selected-outcome ticket carry-through.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/api.ts`
- `mobile/src/__tests__/api.test.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/app/api/mobile/events/[slug]/live-detail/route.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `selectCompactLiveMarkets()` chooses a compact, mobile-ready market set instead of returning the full event payload.
- `serializeMobileLiveEventDetail()` emits event summary, live stats, snapshot-backed chart history, compact market groups, primary-market orderbook depth, and a `contract` proof block.
- `PolyApi.getEvent()` now tries `/api/mobile/events/:slug/live-detail` first and falls back to `/api/events/:slug`.
- `handleLaunchUrl()` now supports `forceBackendEventSlug` without being cleared by the generic reset timer.

User interactions supported:

- Tablet proof opens a backend live World Cup game page directly from a launch URL.
- The game page shows route-backed depth badges (`orderbook-source-orderbook-route`, `orderbook-status-ready`).
- Tapping the order book Buy action opens a ticket that preserves the backend market and selected outcome.

State transitions:

- Launch URL -> `api.getEvent(slug)` -> compact mobile route -> `normalizeEventDetail()` -> selected live event -> order book overlay -> ticket state.
- Backend route -> primary orderbook snapshot -> embedded market `orderbookDepth[]` -> EventDetail depth summary and order book rows.

Known limitations:

- Real external football provider ingestion remains missing.
- Live stats are still optional event metadata, not a provider-owned route/schema.
- The compact route currently embeds route-backed orderbook depth only for the selected primary market to keep the mobile payload fast.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:server-live-order-book`

## Cycle AU - Live Chart Route States

Feature/page worked on:

- PM-GAP-067 chart loading/empty/error state handling for live event detail.
- Visible game-page chart now preserves backend chart route status instead of silently falling back.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/marketChartService.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/__tests__/marketChartService.test.ts`

Backend components touched:

- No backend route code changed. This cycle consumes the existing `/api/markets/:marketId/chart` `emptyState`, `range`, and `lastUpdated` contract.

Important functions/services touched:

- `loadMarketChartState(api, event)` returns `ready` or `empty` status plus `range`, `lastUpdated`, `emptyState`, and route history.
- `applyChartLoadingToEvent()`, `applyChartStateToEvent()`, and `applyChartErrorToEvent()` preserve chart route lifecycle state on the selected event.
- `EventDetail` exposes `event-detail-chart-route-state` and chart accessibility labels for `chart-status-*`, `chart-range-*`, and `chart-empty-*`.

User interactions supported:

- When the live game page chart route is loading, empty, or unavailable, the chart surface shows an auditable market-data badge instead of silently masking the route state.
- Tapping the chart tooltip and chart filters remains unchanged.

State transitions:

- Selected event -> `loading` route state -> `/api/markets/:marketId/chart` -> `ready` with route history, `empty` with `no-history`, or `error` if the route fails.

Known limitations:

- Backend/Docker was unavailable during Cycle AU tablet proof, so the visible proof captures fallback/embedded chart state rather than server-hydrated `ready` state.
- Real provider ingestion and server-hydrated chart-source proof remain open.
- Full depth ladder remains open.

Verification:

- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

## Cycle AT - Live Chart Snapshot Seeding Harness

Feature/page worked on:

- PM-GAP-067 provider-shaped live chart snapshot data for live event detail.
- Deterministic local/proof seeding for `MarketOutcomeSnapshot` rows that can drive `/api/events/:slug` and `/api/markets/:marketId/chart`.

Frontend components touched:

- No visible frontend component changed in this cycle.

Backend components touched:

- `src/server/services/mobileLiveChartSnapshotSeeding.ts`
- `scripts/seed_mobile_live_chart_snapshots.ts`
- `src/__tests__/mobile-live-chart-snapshot-seeding.test.ts`
- `package.json`

Important functions/services touched:

- `buildMobileLiveChartSnapshotRows(outcomes, baseTime)` creates backend-shaped timestamped probability rows for every active outcome in a live market.
- `scripts/seed_mobile_live_chart_snapshots.ts` selects a live public World Cup orderbook market, deletes the same generated time window, writes deterministic `MarketOutcomeSnapshot` rows, and records a proof summary.
- `npm run mobile:live-chart-snapshot-seed` runs the seeding proof with output at `docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json`.

User interactions supported:

- Once local backend/Docker is available, opening the live game page in server mode can receive real route-backed chart movement instead of relying only on fixture chart arrays.

State transitions:

- Live World Cup event/market -> active outcomes -> deterministic probability path -> `MarketOutcomeSnapshot` rows -> `/api/markets/:marketId/chart` history -> EventDetail chart hydration from Cycle AS.

Known limitations:

- Local API and Docker were unavailable during Cycle AT proof, so the seed script could not be applied to the database and no server-hydrated tablet chart proof was captured.
- This is a deterministic proof harness, not a real external football provider ingestion worker.
- Loading/empty/error chart states and full orderbook depth remain open PM-GAP-067 items.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-chart-snapshot-seeding.test.ts src/__tests__/public.market-chart.no-leak.test.ts src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

## Cycle AS - Event Detail Chart Route Hydration

Feature/page worked on:

- PM-GAP-067 visible live event detail chart hydration path.
- Live game page chart history now consumes the dedicated market chart route when server mode is active.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/marketChartService.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/__tests__/marketChartService.test.ts`

Backend components touched:

- No backend route code changed in this cycle. It consumes the Cycle AR `/api/markets/:marketId/chart?range=...` contract.

Important functions/services touched:

- `loadMarketChartHistory(api, event)` chooses the primary non-prop/non-future market, requests `1D` for live events and `1W` for non-live events, and converts the route payload into EventDetail chart points.
- `applyChartHistoryToEvent(event, chartHistory)` replaces the visible event chart history and marks `chartHistorySource: "market-chart-route"`.
- `App.tsx` now hydrates the selected event chart from `PolyApi.getMarketChart()` in server order mode.
- `EventDetail` exposes chart source in its chart accessibility label so device XML can distinguish route hydration from fallback data.

User interactions supported:

- Opening a server-mode live game page can now replace embedded/local chart points with backend chart-route history for the selected primary market.
- The visible game chart remains usable with fixture or embedded fallback data when the backend is unavailable.

State transitions:

- Selected event -> primary market -> `GET /api/markets/:marketId/chart?range=1D|1W` -> `MarketChart.history[]` -> `event.chartHistory[]` -> EventDetail chart rendering.

Known limitations:

- Backend health was unavailable during Cycle AS tablet proof, so the device proof is a regression proof using fallback/embedded chart data, not a server-hydrated chart-source proof.
- Real provider ingestion still must populate `MarketOutcomeSnapshot` for live football markets before this produces real Polymarket-like chart movement.
- Loading, empty, delayed, suspended, and chart route error states are still P1 work.

Verification:

- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

## Cycle AR - Range-Aware Market Chart Contract

Feature/page worked on:

- PM-GAP-067 dedicated market chart/history route contract for live event detail.
- Mobile API access to real market chart history.

Frontend components touched:

- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/src/__tests__/api.test.ts`

Backend components touched:

- `src/app/api/markets/[id]/chart/route.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`

Important functions/services touched:

- `GET /api/markets/:id/chart` now returns a range-aware mobile contract with `range`, `ranges`, `generatedAt`, `lastUpdated`, `emptyState`, `history[]`, and the existing compatibility `series`.
- `PolyApi.getMarketChart()` gives the mobile app a typed backend call for market chart history.

User interactions supported:

- Future live-detail chart UI can fetch backend history for the selected market/range instead of relying only on embedded event detail or local fallback chart arrays.

State transitions:

- Selected event market -> `PolyApi.getMarketChart(marketId, range)` -> backend market visibility guard -> `MarketOutcomeSnapshot` rows -> mobile-ready `history[]` points.

Known limitations:

- The visible EventDetail chart does not yet call `getMarketChart()`; this cycle closes the route/client contract first.
- Provider ingestion still must populate `MarketOutcomeSnapshot` for real live football markets.
- Full chart tooltip/range UI replacement and no-history/loading/suspended states remain future UI work.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/public.market-chart.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`

## Cycle AQ - Live Chart History And Depth Identity Contract

Feature/page worked on:

- World Cup live event detail backend data contract.
- PM-GAP-067 chart-history and orderbook-depth identity sub-gap.

Frontend components touched:

- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`

Backend components touched:

- `src/server/services/marketReadModel.ts`
- `src/server/services/eventReadModel.ts`
- `src/__tests__/sports.event-market-model.test.ts`

Important functions/services touched:

- `marketReadInclude` now includes recent `MarketOutcomeSnapshot` rows so `/api/events/:slug` can hydrate event chart history from first-class backend history records.
- `serializeEventSummary()` now prefers snapshot-derived `event.chartHistory` over static metadata and falls back to metadata only when snapshots are absent.
- `normalizeMarket()` now preserves `orderbookDepth[].outcomeId` instead of dropping the depth-to-outcome identity.

User interactions supported:

- Live event charts can now be backed by server outcome-history rows when the backend has snapshots, rather than only local or metadata-shaped chart arrays.
- Future orderbook/depth UI work can address bid/ask levels by outcome id after mobile normalization.

State transitions:

- Server detail request -> event markets with snapshots -> `event.chartHistory[]` -> mobile event detail chart series.
- Server market depth -> adapter-preserved `orderbookDepth[].outcomeId` -> future per-outcome depth displays and ticket/depth cross-checks.

Known limitations:

- This does not implement provider ingestion for live football stats or chart ticks.
- This does not add a dedicated `/api/markets/:marketId/history` route or full depth-ladder route.
- Device proof remains page-level because the visible UI already consumed `chartHistory`; the material change is the backend source and contract preservation.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

## Cycle AP - Live Line Order Identity

Feature/page worked on:

- Live/event line-market ticket identity through order payload, portfolio snapshot, and portfolio history/activity.
- PM-GAP-068 backend/mobile data contract.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/services/orderService.ts`
- `mobile/src/services/portfolioSnapshotService.ts`
- `mobile/src/services/portfolioHistoryService.ts`
- `mobile/src/types.ts`
- `mobile/src/__tests__/orderService.test.ts`
- `mobile/src/__tests__/portfolioSnapshotService.test.ts`
- `mobile/src/__tests__/portfolioHistoryService.test.ts`

Backend components touched:

- `src/server/services/canonicalOrderSubmission.ts`
- `src/server/services/ticketSelectionMetadata.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/portfolio/history/route.ts`
- `src/__tests__/portfolio.open-orders.route.test.ts`
- `src/__tests__/portfolio.history.route.test.ts`

Important functions/services touched:

- `submitTicketOrder()` now sends canonical `selection` metadata on every server ticket order, including `marketId`, `outcomeId`, optional `marketGroupId`, `marketType`, `line`, `period`, `side`, `displayLabel`, and `contractSide`.
- `normalizeOrderRequest()` now preserves sanitized `selection` and `contractSide` inside `ApiOrderRequest.requestBody` for later portfolio reconstruction.
- `buildTicketSelectionMetadata()` reconstructs safe ticket selection identity from request body plus market/outcome schema fields.
- `/api/portfolio` now includes `selection` for positions and open orders.
- `/api/portfolio/history` now includes `selection` for canceled orders and recent trades.
- Mobile portfolio snapshot/history mappers now preserve the full selection identity instead of display-label-only metadata.

User interactions supported:

- A user can open a line/live market ticket, submit it in server mode, and have the selected line/outcome identity survive into portfolio open-order and activity data.
- Portfolio surfaces can now display the same selected line label while retaining backend ids needed for future close/retrade/history flows.

State transitions:

- Ticket selection -> canonical order request body -> `ApiOrderRequest` -> portfolio snapshot/history response -> mobile Portfolio state now preserves market/outcome/line identity.

Known limitations:

- `Order` and `Trade` tables still do not have first-class `selection` columns; Cycle AP uses existing `ApiOrderRequest.requestBody` plus market/outcome schema fields to avoid a migration.
- Filled trade identity is inferred from market/outcome fields when no order request relation is available.
- Real live provider data and full orderbook/history routes remain part of PM-GAP-067, not this cycle.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:event-detail-line-portfolio`

## Cycle AO - Live Event Detail Backend Contract

Feature/page worked on:

- World Cup live event detail backend/mobile data contract.
- Live market group, line, outcome-side, depth, chart-history, and live-stat payload wiring.

Frontend components touched:

- `mobile/src/types.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`

Backend components touched:

- `src/server/services/marketReadModel.ts`
- `src/server/services/eventReadModel.ts`
- `src/__tests__/sports.event-market-model.test.ts`

Important functions/services touched:

- `serializeMarketReadModel()` now emits `marketGroupId`, compact `orderbookDepth`, `liquidity`, and outcome bid/ask sizes from existing orderbook quote data.
- `serializeEventSummary()` now passes through optional `liveStats` and `chartHistory` arrays from event metadata or `metadata.mobileLiveDetail`.
- `normalizeMarket()` now preserves backend-shaped live market identity fields: group id, market type, period, line, liquidity, depth, outcome side, and quote sizes.
- `normalizeEventSummary()` now preserves event-level live stats and chart history for the game page chart/stat panels.

User interactions supported:

- Server-hydrated live game pages can now render grouped live markets and selected line/outcome identity from backend data instead of relying only on local fixture structures.
- The selected live market/outcome identity can flow from `/api/events/:slug` into the mobile event detail model used by ticket opening.

State transitions:

- No navigation state changed.
- Data transition improved: backend route payload -> mobile API types -> World Cup adapter -> `EventDetail` render model now keeps live line identity and compact depth.

Known limitations:

- This cycle does not create real provider ingestion for live football stats or chart history.
- This cycle does not prove live line-market order submission through portfolio/history; that remains PM-GAP-068.
- Embedded `orderbookDepth` is compact top depth derived from current open orders, not a full Polymarket-style ladder.

Verification:

- `cmd /c npm.cmd run test:ci -- src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`

## Cycle AN - Live Event Detail Structural Parity

Feature/page worked on:

- World Cup live football event detail.
- Live market group fixture contract.
- Live detail tablet proof route.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/mocks/worldCup.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/smoke-samsung-tabs.ps1`
- `mobile/package.json`

Important functions/services touched:

- `App()` deep-link handling now supports `forceLiveDetail=1` for direct live game-page proof.
- `EventDetail()` now branches live event presentation with live score/clock, live match strip, live labels, live chart scale, and live stats from event data.
- `worldCupEvents` live fixture now models Australia vs Egypt with backend-shaped fields: market group, market type, period, line, side, liquidity, orderbook depth, chart history, and live stats.
- `smoke.ps1` adds `LiveDetail` proof for top, scrolled markets, and ticket carry-through.

User interactions supported:

- Open live football game detail directly.
- View live score/clock/team probabilities.
- Scroll into sticky Game Lines / Player Props rail.
- Inspect live winner, spread, totals, halves, and team-total-style market groups.
- Tap a live outcome and open the bottom-sheet ticket with the selected event/market/outcome preserved.

State transitions:

- Deep link `forceLiveDetail=1,forceResetState=1` resets state, selects the live event, and sets `mainTab` to `live`.
- Live detail scroll sets `compactHeaderVisible`.
- Live outcome tap opens `TradeTicket` with selected live market/outcome context.

Known limitations:

- Backend parity is not complete. Real routes/schema for live market groups, chart history, orderbook depth, live stats, and live line-order identity remain open.
- Location verification seen in Polymarket is intentionally excluded from Holiwyn fake-token scope.
- The branch name still says saved/watchlist, but the cycle is documented and committed as live event detail after user steering changed.

## Cycle T - Whole-App Navigation And Page Map

Feature/page worked on:

- Whole-app navigation and page map.
- Primary bottom tabs.
- Header account/profile access.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/components/BottomTabs.tsx`
- `mobile/src/components/Header.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `App()` state orchestration.
- `setMainTab()` transitions between `home`, `live`, `portfolio`, `search`, and `account`.
- `Header({ openAccount })` callback now routes to the existing Account screen.
- `BottomTabs()` now renders only primary Polymarket-equivalent tabs: Home, Live, Portfolio, Search.
- `Assert-HierarchyDoesNotContain()` smoke helper verifies removed/deprecated controls are not present.
- `WholeAppNavDiscovery` smoke flow now opens Account through `header-account-action`.

User interactions supported:

- Tap Home bottom tab.
- Tap Live bottom tab.
- Tap Portfolio bottom tab.
- Tap Search bottom tab.
- Tap Account/Profile header button.
- Use Home World Cup rail and Games/Futures section through existing Home controls.

State transitions:

- `mainTab: "home" -> "live"` when tapping `holiwyn-live-tab`.
- `mainTab: "live" -> "portfolio"` when tapping `holiwyn-portfolio-tab`.
- `mainTab: "portfolio" -> "search"` when tapping `holiwyn-search-tab`.
- `mainTab: "search" -> "account"` when tapping `header-account-action`.
- `mainTab: "account" -> "home"` when tapping `holiwyn-home-tab`.
- `worldCupTab` remains controlled separately as `games` or `futures`.
- `selectedEvent` still hides the header/bottom nav when an event detail page is open.

Known limitations:

- Account/profile is reachable from the header but still uses Holiwyn's prototype account shell.
- Back-stack behavior is still simple React state, not a full native navigation stack.
- Scroll restoration across tabs is not yet Polymarket-level and remains P1.
- Deep link route restoration is smoke-oriented and remains P2.

## Cycle U - Event Page Top Shell/Action Controls

Feature/page worked on:

- Event page top shell/action controls.
- Top book/order-book action.
- Share sheet action.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` top action row.
- `setOrderBookVisible(true)` now runs from `event-detail-top-order-book`.
- Existing `event-detail-order-book-close` closes the Order Book overlay.
- Existing `event-detail-share` opens the share sheet.
- Existing `event-detail-share-dismiss` closes the share sheet.
- `EventDetailActions` smoke proof now waits for Order Book visibility instead of using a brittle fixed delay.

User interactions supported:

- Tap top book icon on the event page.
- View Order Book for the selected event's primary market.
- Close the Order Book and return to the same event page.
- Tap the share icon.
- Dismiss the share sheet and preserve event context.

State transitions:

- `orderBookVisible: false -> true` from top book tap.
- `orderBookVisible: true -> false` from close tap.
- `shareSheetVisible: false -> true` from share tap.
- `shareSheetVisible: true -> false` from dismiss tap.
- `selectedEvent` and selected event detail tab remain unchanged through both overlays.

Known limitations:

- This focused pass does not complete the full Market/Event page.
- Native OS share parity is deferred.
- World Cup-specific Polymarket top-shell reference needs recapture once the reference app clears location verification.
- Order Book content is still derived from loaded event market data rather than a dedicated live depth route.

## Cycle V - Futures Market Rows

Feature/page worked on:

- World Cup futures outcome rows on the Home/Futures surface.
- Buy Yes/Buy No controls for futures outcomes.
- Futures ticket carry-through from Buy Yes.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `FutureList()` renders Polymarket-style futures rows.
- `futureOutcomeVolume()` derives outcome-level display volume until backend provides it.
- `futureOutcomeFlags` adds local country visual markers.
- `openTicket(market, outcome, undefined, "buy")` is used by Buy Yes.
- `openTicket(market, outcome, undefined, "sell")` is used as the current Buy No approximation.

User interactions supported:

- View World Cup futures rows with flag, volume, probability, Buy Yes, and Buy No.
- Tap Buy Yes for France and open the trade ticket with the selected future outcome preserved.
- Use tablet wrapper flags for futures card and ticket smoke proof.

State transitions:

- Home `worldCupTab: "games" -> "futures"` when tapping `world-cup-futures-tab`.
- `ticket: null -> { market: world-cup-winner, outcome: france, side: "buy" }` when tapping the France Buy Yes row.
- `ticket: null -> { market: world-cup-winner, outcome: france, side: "sell" }` when tapping the France Buy No row.

Known limitations:

- Buy No is represented through the existing sell/no-side ticket path until the backend/mobile contract supports separate binary NO positions.
- Outcome-level volume is local deterministic display data.
- Backend-owned futures catalog/live pricing is still missing; Cycle AK expands the local fallback catalog but does not replace it with server data.

## Cycle AK - Futures Catalog Expansion

Feature/page worked on:

- Home / World Cup / Futures / World Cup Winner catalog expansion.
- Expanded-row ticket carry-through.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/mocks/worldCup.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Important functions/services touched:

- `FutureList()` now tracks `expandedMarketIds` by market id.
- `FutureList()` now renders `visibleOutcomes` as the first three outcomes when collapsed and all outcomes when expanded.
- `futureOutcomeFlags` now includes the expanded World Cup Winner country set.
- `worldCupFutures` fallback data now includes 21 World Cup Winner outcomes.
- `FutureCatalogExpand` smoke flow opens Futures, taps `18 more`, and opens the England ticket.

User interactions supported:

- View collapsed World Cup Winner futures card with France, Argentina, Spain, and `18 more`.
- Tap `18 more` to expand the same market in place.
- Tap Buy Yes for England from the expanded catalog and open the trade ticket.

State transitions:

- `worldCupTab: "games" -> "futures"` from `world-cup-futures-tab`.
- `expandedMarketIds["world-cup-winner"]: false -> true` from `future-more-world-cup-winner`.
- `ticket: null -> selected England World Cup Winner buy ticket` from `future-outcome-world-cup-winner-england`.

Known limitations:

- The 21-outcome catalog is still fallback/mobile-owned data.
- Outcome ordering, volume, yes/no prices, and icon/flag metadata should come from backend/mobile discovery once the server contract supports it.
- Visual density is closer but still not pixel-identical to logged-in Polymarket.

## Cycle W - Futures Chart Range

Feature/page worked on:

- World Cup futures chart/time-range section.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `FutureList()` now stores local `selectedRange`.
- `futureChartRanges` defines `1H`, `1D`, `1W`, `1M`, and `MAX`.
- `FutureChartRange` smoke taps `1D` and `1W`.

User interactions supported:

- View futures chart legend and chart panel.
- Tap `1D` and `1W` range controls.
- Keep futures outcome rows visible after range changes.

State transitions:

- `selectedRange: "MAX" -> "1D" -> "1W"`.

Known limitations:

- Chart lines are local/deterministic and not backend-backed.
- Settings gear behavior is not implemented in this focused cycle.
- Press/hold tooltip remains P2.

## Cycle X - Match Market Tabs And Cards

Feature/page worked on:

- Match-specific market tabs and first market cards on the Event Detail game page.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `EventDetail()` now tracks `activeTab` across `game-lines`, `exact-score`, `halves`, and `player-props`.
- `EventDetail()` now tracks `activeLineDetailTab` across `order-book`, `graph`, and `about`.
- `renderMarketTabs()` renders the Polymarket-style market tab row.
- `renderTeamToAdvanceCard()` renders the first match-specific card with inline detail controls.
- `renderExactScore()` renders exact-score rows.
- `renderHalves()` renders half-market rows from existing market groups.
- `EventDetailMarketTabs` smoke proves tablet tab/card interactions.

User interactions supported:

- View `Game Lines`, `Exact Score`, `Halves`, and `Player Props` tabs.
- View a `Team to Advance` card with volume and outcome price buttons.
- Switch the Team to Advance inline detail from `Order Book` to `Graph`.
- Switch from Game Lines to Exact Score.
- Switch from Exact Score to Halves.

State transitions:

- `activeTab: "game-lines" -> "exact-score" -> "halves"`.
- `activeLineDetailTab: "order-book" -> "graph"`.

Known limitations:

- Exact Score and Halves rows are local/fallback market content rather than backend-discovered market groups.
- Team to Advance card depth and graph are local deterministic UI states.
- The match-level `Live stats` tab remains a P1 gap.

## Cycle Y - Line Adjustment

Feature/page worked on:

- Focused Spreads/Totals adjustable-line behavior on the Event Detail game page.

Frontend components touched:

- No frontend code changes in this cycle; existing EventDetail line selector behavior passed the new Polymarket audit gate.

Important functions/services touched:

- No runtime functions changed.
- `EventDetailLineAdjustment` smoke was rerun on Samsung tablet as the Audit Gate proof.

User interactions supported:

- View Spread and Totals line rails.
- Change Spread line and period.
- Open a Spread ticket that preserves the selected line/period/outcome.
- Change Totals line and period.
- Open a Totals ticket that preserves the selected line/period/outcome.

State transitions:

- Spread line/period selection changes before ticket open.
- Totals line/period selection changes before ticket open.
- Ticket state preserves `marketType`, `line`, `period`, and `displayLabel`.

Known limitations:

- This cycle verifies focused Spreads/Totals only.
- Team totals, halves-specific line cards, corners, and other discovered line markets still require separate same-cycle audits.
- Line prices/probabilities are local deterministic values until backend contracts provide market line quotes.

## Cycle Z - Trade Ticket

Feature/page worked on:

- Focused game-page trade ticket.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `TradeTicket()` quick amount preset list changed to `1`, `5`, `10`, and `100`.
- `EventDetailTrade` smoke now proves amount chip parity and swipe-submit readiness.
- `smoke-tablet.ps1` now exposes `-EventDetailTrade`.

User interactions supported:

- Open ticket from a game-page outcome.
- See selected market/outcome and Buy/Sell controls.
- Use Polymarket-style quick amount chips.
- Tap `+$10` and see amount/estimate updates.
- See `Swipe up to buy` readiness after amount entry.
- Close and reopen ticket for the opposite outcome without stale selection.

State transitions:

- `ticket: null -> selected outcome ticket`.
- `amount: "0" -> "10"` after tapping `ticket-preset-10`.
- `submitLabel: "Choose an amount" -> "Swipe up to buy"`.
- `ticket: selected home outcome -> null -> selected away outcome`.

Known limitations:

- Ticket visual density remains heavier than Polymarket's first ticket view.
- The US view-only/download/login gate is documented but not implemented for fake-token mode.
- Full post-submit portfolio/open-order parity remains in the Portfolio cycle.

## Cycle AA - Portfolio

Feature/page worked on:

- Focused fake-token Portfolio positions, open orders, activity, and cancel behavior.

Frontend components touched:

- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- No runtime Portfolio component code changed.
- `EventDetailLinePortfolio` harness expectation now accepts current ticket amount copy `25 USDT`.
- Direct tablet `OpenOrderCancel` proof was rerun for cancel behavior.

User interactions supported:

- Place a mock line-market order from the game page.
- Land in Portfolio with updated fake balance, latest order, position, activity, and line identity.
- View a disposable open order with cancel control.
- Cancel an open order and see canceled state/activity.

State transitions:

- `amount: "0" -> "25"` in ticket.
- Portfolio fake balance `10000 -> 9975`.
- Portfolio counts update for positions/activity after order.
- Open-order fixture `OPEN -> canceled activity` in cancel proof.

Known limitations:

- Polymarket signed-in Portfolio could not be referenced because native and web were gated.
- Server-mode Portfolio proof should receive its own same-cycle audit gate later.
- Deeper position Buy/Sell/Close ticket transitions remain a later focused cycle.

## Cycle AB - Search/Explore

Feature/page worked on:

- Focused Search/Explore discovery, filter, sort, typed-query retention, and result navigation.

Frontend components touched:

- `mobile/src/components/SearchScreen.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `SearchScreen()` now renders an Explore-style Search page with category chips, dense result rows, a floating Filter pill, and an in-page filter panel.
- `SearchSort` smoke now proves Explore layout, Filter panel open/close, live-first sort, and result-row navigation.
- `smoke-tablet.ps1` now exposes `-SearchSort` for Samsung tablet proof.

User interactions supported:

- Tap bottom Search tab.
- View dense World Cup market rows with sport/category, title, volume/today/liquidity, chat/end metadata, right-side probability/outcome, save control, and chevron.
- Open a floating Filter panel and change status/sort criteria.
- Sort live markets first.
- Tap a result row and open the correct game page.
- Use existing typed query and clear behavior.

State transitions:

- `mainTab: home -> search`.
- `isFilterSheetOpen: false -> true -> false`.
- `sort: popular -> live`.
- `selectedEvent: null -> france-argentina-final` after tapping a result row.

Known limitations:

- Polymarket native Search could not be referenced because the S23 native app is location-gated.
- Polymarket global categories are broader than Holiwyn's World Cup-only scope.
- Holiwyn filter facets are baseline Status/Sort controls; richer discovered facets remain later P1 work.

## Cycle AC - Account/settings

Feature/page worked on:

- Focused signed-out Account/settings shell, More-style menu rows, language/theme rows, safe fake-token balance, and mock login/logout.

Frontend components touched:

- `mobile/src/components/AccountScreen.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `AccountScreen()` now renders a Polymarket-like More menu section with Leaderboard, Rewards, APIs, Accuracy, Status, Documentation, Help Center, Terms of Use, Language, and Theme rows.
- Signed-out actions now use `Log In` and `Sign Up` buttons while still using local mock sign-in only.
- `AccountLogin` smoke now resets local state, scrolls to the auth actions, proves mock login, and proves logout.

User interactions supported:

- Open Account from the header.
- Inspect More/settings menu rows.
- See fake-token balance and disabled real-money helper copy.
- Scroll to Log In / Sign Up actions.
- Mock sign in and sign out without touching real auth or wallet actions.

State transitions:

- `signedIn: false -> true -> false`.
- Account session storage is cleared before the focused proof.

Known limitations:

- Native Polymarket account/settings remains location-gated.
- Holiwyn menu rows are visible affordances; deeper destination pages remain later P1 work.

## Cycle AD - Chart Behavior

Feature/page worked on:

- Focused event-detail chart behavior.
- Chart selected point and tooltip equivalent.
- Tablet smoke proof for chart tap/filter behavior.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `EventDetail()` now tracks `selectedChartPoint` across `latest`, `mid`, and `target`.
- `selectedChartProbability` and `chartPointMeta` derive the visible chart tooltip state from the current selected event/outcome context.
- `event-detail-price-chart` is now pressable and cycles the selected chart point.
- `EventDetailChart` smoke launches the forced Mexico/Ecuador detail route, taps the chart, verifies the selected-point marker, switches to the Live chart filter, and records tablet proof.

User interactions supported:

- View the event chart with current probability context.
- Tap the chart to change selected point state.
- See a tooltip/nearest-point equivalent after chart interaction.
- Switch chart filter state while retaining event context.

State transitions:

- `selectedChartPoint: "latest" -> "mid" -> "target" -> "latest"` on chart taps.
- Chart tooltip label/value/time updates from `Current` to `2H`/`Mid chart` and `Target` states.
- Existing chart filter state remains available through the `event-detail-chart-filter-live` control.

Known limitations:

- Chart points still use deterministic local math instead of backend timestamped history.
- Same-cycle Polymarket reference was mobile web chart behavior because direct native/World Cup chart access was location-gated.
- Exact Polymarket chart animation and touch geometry remain P2 polish.

## Cycle AE - Market Page

Feature/page worked on:

- Focused market-page body `Market` / `Live stats` switch.
- Live Stats panel.
- Market-page tablet proof harness.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` now tracks `activeBodyTab` across `market` and `live-stats`.
- `event-detail-body-tab-market` restores chart and grouped market tabs.
- `event-detail-body-tab-live-stats` opens the new Live Stats panel.
- `EventDetailMarketTabs` smoke now asserts body switch, Live Stats panel, and return-to-market behavior before continuing existing tab/card proof.

User interactions supported:

- View event volume and Holiwyn source label near the body switch.
- Tap `Live stats` from the market page.
- Inspect possession, shots, shots on target, corners, expected goals, and match-flow rows.
- Tap `Market` to return to the chart and grouped market tabs.

State transitions:

- `activeBodyTab: "market" -> "live-stats" -> "market"`.
- Market content remains unchanged when returning from Live Stats.

Known limitations:

- Live Stats values are local deterministic values until backend live-match stats exist.
- Current Polymarket reference event showed Game Lines, Exact Score, and Halves; Holiwyn still retains Player Props from product direction and earlier parity work.
- Tablet smoke captured the focused evidence before wireless ADB reset; the transport issue remains harness reliability risk, not a product behavior gap.

## Cycle AF - Reference Device Preflight Harness

Feature/page worked on:

- Autonomous loop device preflight and recovery guard.

Frontend components touched:

- None.

Important functions/services touched:

- Added `mobile/scripts/polymarket-reference-device-preflight.ps1`.
- Added `preflight:polymarket-reference-device` and `preflight:polymarket-reference-device:expect-blocked` npm scripts.
- Updated `MOBILE_HARNESS_SPEC.md` with the new preflight harness.

User interactions supported:

- None; this is a harness/infrastructure cycle.

State transitions:

- Preflight status can be `pass`, `blocked`, or `expected_blocked`.
- Current proof records `expected_blocked` because the S23 reference model is missing while the Samsung tablet remains connected.

Known limitations:

- This does not complete a product feature.
- It intentionally prevents new UI feature completion claims while same-cycle Polymarket reference access is missing.

## Cycle AG - Trade Ticket

Feature/page worked on:

- Focused trade-ticket first-view density and advanced-details behavior.
- Ticket amount-to-win state.
- Tablet trade-ticket proof harness.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/package.json`

Important functions/services touched:

- `TradeTicket()` now tracks `showDetails` and resets it whenever the selected ticket changes.
- `ticket-settings` now toggles advanced details instead of being a dead icon.
- `compactCash()` formats first-view ticket amount and payout as Polymarket-like dollar values.
- `smoke:tablet:event-detail-trade` runs the focused tablet proof through npm.

User interactions supported:

- Open a sparse ticket bottom sheet from a game-page outcome.
- See drag handle, Buy/Sell pill, market/outcome identity, large amount, quick amount chips, and one primary Trade control.
- Tap `+$10` to update amount, `To win`, price, and submit readiness.
- Tap settings to reveal trading mode, depth, keypad, slippage, and detailed estimates.
- Close and reopen ticket for another outcome without stale selected outcome data.

State transitions:

- `ticket -> showDetails=false` whenever market/outcome/side changes.
- `showDetails: false -> true` when `ticket-settings` is tapped.
- `amount: "0" -> "10"` when `ticket-preset-10` is tapped.
- Selected outcome changes from Mexico to Ecuador after close/reopen proof.

Known limitations:

- True binary NO-share semantics remain approximate until the mobile/backend contract supports explicit binary side ownership.
- Production auth/location/trading eligibility gates remain out of scope for fake-token trading.
- Ticket prices and payout math still use current local outcome probability unless backend quote data is available.

## Cycle AH - Binary Side Ticket

Feature/page worked on:

- Futures `Buy No` ticket/order contract identity.
- S23 native World Cup match ticket-surface reference follow-up.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/App.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Important functions/services touched:

- `openTicket()` now carries `selection.contractSide` into the active ticket.
- `TradeTicket()` now prices and labels explicit `No` contracts separately from Buy/Sell transaction action.
- `submitTicketOrder()` now derives contract probability and sends `contractSide` to the API payload.
- `Portfolio` display helpers now render explicit `No - <outcome>` identity for latest order, positions, activity, and open orders.

User interactions supported:

- Tap futures `Buy No` for France.
- See a Buy ticket with visible `No - France` contract identity and `66c` inverse price.
- Submit a fake-token order and see `MOCK - Buy - No - France` in Portfolio.

State transitions:

- Futures row `Buy No`: `ticket=null -> ticket(side=buy, contractSide=no)`.
- Ticket amount defaults to `$10` in this focused proof and renders inverse payout from 66%.
- Submit: ticket closes, Portfolio opens, latest order/activity retain `contractSide=no`.

Known limitations:

- The S23 native Polymarket outcome tap is location-gated, so the live production order body was not visible in this cycle.
- The S23 reference still proves the native app uses a taller sheet/page surface over the game page; Holiwyn's compact ticket sheet remains a P1 surface-parity gap.

## Cycle AI - Trade Ticket Surface

Feature/page worked on:

- Logged-in Polymarket World Cup ticket-surface parity.
- Holiwyn tall fake-token ticket surface and swipe-ready submit rail.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `TradeTicket()` now keeps the submit label aligned with the swipe interaction after amount entry.
- `TradeTicket()` now renders a taller sheet surface with a larger amount area and larger fixed swipe rail.
- `smoke.ps1` now asserts `Swipe up to buy` in ticket amount and futures Buy No proofs.

User interactions supported:

- Open ticket from a game-page outcome over a dimmed game page.
- Tap quick amount chip and keep a swipe-up submit affordance visible.
- Open futures `Buy No` and keep `No - France` plus inverse price visible with the same swipe-ready surface.

State transitions:

- `amount: "0" -> "10"` changes primary copy from `Choose an amount` to `Swipe up to buy`.
- Existing `buy/sell` and `yes/no` contract-side state is preserved through the taller surface.

Known limitations:

- Logged-in Polymarket on the S23 still shows a location verification gate before production order entry.
- Holiwyn fake-token mode intentionally does not implement the production location/login/trading eligibility gate yet.
- Native drag physics and transition animation remain future polish.

## Cycle AJ - Game Page Compact Scrolled Header

Feature/page worked on:

- Logged-in World Cup game page.
- Scrolled Game Lines compact match context.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` now tracks scroll position and shows `event-detail-compact-game-header` after the user scrolls into the market section.
- The compact header uses current event teams, team codes, probabilities, date/time, and active game context.
- `smoke.ps1` full game-page proof now asserts the compact header in the scrolled markets screenshot.

User interactions supported:

- Scroll from the game-page hero/chart into Game Lines while preserving match context at the top of the screen.
- Continue using market rows, line selectors, ticket opening, chat, share, order book, props, rules, and lower-page content.

State transitions:

- `compactHeaderVisible: false -> true` when scroll offset passes the market-section threshold.
- The compact header hides again when returning to the top.

Known limitations:

- Polymarket's native sticky tab polish and phone-density spacing are still tighter.
- Player Props remains Holiwyn-local product scope and needs a focused reference decision.
- Market data, chart history, and live stats are still local/deterministic unless server hydration is available.

## Cycle AL - Game Page Sticky Market Tabs

Feature/page worked on:

- Logged-in World Cup game page scrolled market state.
- Sticky `Game Lines` / `Player Props` tab rail under compact match context.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `renderMarketTabs(mode)` now supports separate inline and sticky tab rails while sharing the same `activeTab` state.
- `EventDetail()` now wraps the compact match header and sticky market tabs in `event-detail-sticky-market-shell`.
- `smoke.ps1` full game-page proof now asserts sticky tabs through market scroll and proves sticky Player Props switching.

User interactions supported:

- Scroll from the game-page hero into Game Lines and keep market tabs visible beneath the compact match header.
- Continue scrolling into lower Game Lines rows while the sticky tab rail remains visible.
- Tap sticky `Player Props` from the scrolled market state and switch into props content.

State transitions:

- `activeTab: "game-lines" -> "player-props"` can now happen from either the inline tab rail or the sticky tab rail.
- `compactHeaderVisible: true` now shows compact match context plus sticky tabs instead of compact match context alone.

Known limitations:

- Sticky rail animation and exact native phone spacing remain P1/P2 polish.
- Player Props content remains Holiwyn-local and still needs a dedicated reference/product-scope cycle.
- Market groups remain local/fallback unless backend event-detail data provides richer grouped markets.

## Cycle AM - Player Props Unavailable State

Feature/page worked on:

- Game page `Player Props` tab.
- Logged-in S23 reference check of scrolled Player Props label.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` no longer renders local fabricated player-prop rows under `activeTab === "player-props"`.
- The Player Props tab now renders `event-detail-player-props-empty` with `Player Props unavailable for this match`.
- `smoke.ps1` now asserts the empty/unavailable state in full game-page and Player Props smoke paths.

User interactions supported:

- Tap Player Props from the inline tab rail or from the scrolled/sticky rail.
- See a clear unavailable state rather than unsupported local rows.
- Continue scrolling to Market Rules and More Events after the unavailable state.

State transitions:

- `activeTab: "game-lines" -> "player-props"` now shows an empty Player Props state.
- No ticket can be opened from Player Props until backend-supported prop markets are deliberately added.

Known limitations:

- Backend-supported Player Props are deferred.
- The logged-in Polymarket reference did not reveal props content from this scrolled state, so a future dedicated Player Props cycle should recapture if Polymarket exposes real soccer props for a different match/state.

## Cycle AV - Live Orderbook Depth Contract

Feature/page worked on:

- Live event detail orderbook/depth behavior for the primary live soccer market.
- Backend-shaped orderbook ladder contract consumed by the mobile game page.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/marketDepthService.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/scripts/smoke.ps1`

Backend/API components touched:

- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`

Important functions/services touched:

- `PolyApi.getOrderbook(marketId, { outcomeId, maxLevels })` calls the public orderbook route.
- `loadMarketDepthState()` fetches the route-backed depth contract for the selected live market.
- `applyDepthLoadingToEvent()`, `applyDepthStateToEvent()`, and `applyDepthErrorToEvent()` preserve route loading, ready, empty, and error states on the selected event.
- `EventDetail.renderOrderBook()` now exposes `orderbook-source-*`, `orderbook-status-*`, and `event-detail-order-book-depth-state` labels for Audit Gate proof.

User interactions supported:

- Open a live game detail page.
- Open the orderbook/depth overlay from the market row.
- See whether the displayed ladder is fallback, loading, route-backed, empty, or unavailable.
- Tap Buy in the orderbook overlay and preserve selected market/outcome identity into the trade ticket.

State transitions:

- In server mode, selected event depth state moves from `idle -> loading -> ready`, `empty`, or `error`.
- On a route-backed response, the matching market's `orderbookDepth` is replaced by backend-shaped `levels[]`.
- In fallback mode, the existing embedded depth still renders, but the overlay is labeled as fallback so it cannot be mistaken for server-backed parity.

Known limitations:

- Tablet proof ran while backend health was unavailable, so visible device proof shows `orderbook-source-fallback orderbook-status-idle`.
- Real route-backed device proof remains open until local services are healthy and seeded with orderbook depth.
- The route currently derives `levels[]` from the existing public snapshot; richer venue-style depth, stale/delayed states, and provider ingestion remain active structural parity work.

## Cycle AW - Route-Backed Live Depth Seed Harness

Feature/page worked on:

- Live event detail backend data readiness for orderbook/depth proof.
- PM-GAP-067 seeded live World Cup orderbook depth.

Backend/API components touched:

- `src/server/services/mobileLiveOrderbookDepthSeeding.ts`
- `scripts/seed_mobile_live_orderbook_depth.ts`
- `src/__tests__/mobile-live-orderbook-depth-seeding.test.ts`
- `package.json`

Important functions/services touched:

- `buildMobileLiveOrderbookDepthRows()` creates backend-shaped bid/ask rows for each active outcome.
- `mobile:live-orderbook-depth-seed` finds the first live public World Cup orderbook market, upserts stable proof users, clears only those users' existing open proof orders for the market, and creates open BUY/SELL orders consumed by `/api/orderbook/:marketId/book`.

User interactions supported:

- No new UI interaction was added in this cycle.
- Existing tablet orderbook overlay and Buy-ticket carry-through were re-smoked after backend health returned OK.

State transitions:

- Backend proof data moves from no seeded open orders to route-readable open BUY/SELL depth for the selected live World Cup market.
- The public orderbook route returns `emptyState: null` and 12 seeded `levels[]` rows for the seeded market.

Known limitations:

- Holiwyn tablet proof still captured `orderbook-source-fallback orderbook-status-idle`; route-backed mobile UI proof remains open.
- `/api/events/:slug` can return a very large 37-market payload, and `/api/markets/:id/chart?range=1D` timed out during this cycle's route probe. The next structural cycle should add or use a mobile-optimized live detail/depth/chart proof path.
- Seeded orderbook depth is deterministic proof data, not real provider ingestion.

## Cycle CW - Provider Sports Event Discovery Expansion

Feature/page worked on:

- PM-GAP-067 provider discovery for the World Cup live event detail.
- Exact Polymarket sports event fallback for Colombia vs. Ghana (`fifwc-col-gha-2026-07-03`).
- Samsung tablet server-mode live detail and orderbook proof for a real provider-mapped compact event.

Frontend/harness components touched:

- `mobile/scripts/smoke.ps1`

Backend/API components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/app/api/mobile/events/[slug]/provider-candidates/route.ts`
- `scripts/prove_mobile_provider_sports_event_discovery.ts`
- `scripts/probe_mobile_live_detail_route.ts`

Important functions/services touched:

- `discoverMobileLiveProviderCandidates()` now accepts `providerEventSlugs` and can run exact sports-event discovery before broad tag discovery.
- `fetchProviderCandidatesFromSportsEvents()` can fetch exact Gamma event slugs and normalize nested event markets.
- `rankProviderCandidates()` now ranks attach-ready and relevant candidates ahead of high-score irrelevant candidates.
- `assessCandidateRelevance()` now supports legitimate Polymarket Yes/No binary markets by requiring strong same-question/title token relevance instead of generic `Yes`/`No` outcome-name matches.

User interactions supported:

- Open the Holiwyn server-backed Colombia vs. Ghana live detail page on the Samsung tablet.
- Open the route-backed order book for the mapped live winner market.
- See provider-backed `Best bid`, `Best ask`, `Spread`, `Route depth`, `Buy`, and `Sell` controls.

State transitions:

- Local proof event starts with 3 compact markets missing provider identity.
- Exact provider-event discovery finds 3 attach-ready Polymarket markets: `fifwc-col-gha-2026-07-03-col`, `fifwc-col-gha-2026-07-03-draw`, and `fifwc-col-gha-2026-07-03-gha`.
- Provider identity attach moves readiness from 0 to 3 refreshable compact markets.
- No-fallback provider refresh writes 6 quote snapshots and 262 CLOB depth rows.
- Mobile live detail reports 3 ready provider quote snapshots and 3 ready provider orderbook-depth markets.

Known limitations:

- This closes the exact live match winner/draw/Ghana mapping path, not all Polymarket line markets.
- Adjustable spreads/totals/team totals still need real provider event discovery or exact provider slugs when available.
- The first Next dev compile for `/api/mobile/events/:slug/live-detail` was slow, but the serializer probe is fast after route warmup.

## Cycle DG - Provider Fixture Metadata Contract

Feature/page worked on:

- PM-GAP-067 structural provider data contract for the World Cup live event detail.
- Provider fixture identity extraction from the real Polymarket/Gamma Colombia vs Ghana event.
- Mapping readiness metadata that tells the next line-market provider cycle which fixture/team identifiers to use.

Backend/API components touched:

- `src/server/services/mobileLiveProviderFixtureMetadata.ts`
- `src/server/services/mobileLiveProviderMapping.ts`
- `scripts/prove_mobile_provider_fixture_metadata_contract.ts`
- `src/__tests__/mobile-live-provider-fixture-metadata.test.ts`

Important functions/services touched:

- `extractProviderFixtureMetadataFromPolymarketEvent()` extracts `eventMetadata` and market-level provider IDs from a real Gamma event payload.
- `mergeProviderFixtureMetadata()` persists the extracted object under event metadata without discarding existing metadata.
- `getMobileLiveProviderMappingReadiness()` now exposes `providerFixture` when stored event metadata contains it.

User interactions supported:

- No new visible mobile control was added.
- Existing Samsung tablet server-mode Colombia vs Ghana live detail and Book proof was re-smoked to ensure the provider identity contract did not regress the user-facing route-backed flow.

State transitions:

- The local Colombia vs Ghana proof event moves from only provider event slug/match-winner mapping context to a richer `providerFixture` contract with `opticOddsFixtureId`, `opticOddsGameId`, `opticOddsNumericalId`, `sportradarGameId`, team provider IDs, and moneyline provider metadata.
- Mapping readiness now reports `lineMarketSourceContract.intendedProvider=optic_odds` and a fixture key instead of leaving line-market source discovery as an unstructured broad-search problem.

Known limitations:

- This does not ingest OpticOdds line prices yet.
- Polymarket/Gamma still exposes only 3 match-winner markets for the checked exact event; spreads, totals, team totals, halves, corners, and correct-score markets remain open until a real provider route/source is integrated.

## Cycle DH - OpticOdds Line Ingestion Contract

Feature/page worked on:

- PM-GAP-067 structural provider ingestion for live soccer line markets.
- OpticOdds `/fixtures/odds` client and response normalizer.
- Provider refresh report extension for `lineProvider: optic_odds`.

Backend/API components touched:

- `src/server/services/mobileLiveOpticOddsLineIngestion.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `scripts/prove_mobile_optic_odds_line_ingestion_contract.ts`
- `src/__tests__/mobile-live-optic-odds-line-ingestion.test.ts`

Important functions/services touched:

- `fetchOpticOddsFixtureOdds()` builds the official `GET /fixtures/odds` request with `X-Api-Key`, repeated `sportsbook` params, repeated `market` params, `fixture_id`, and `odds_format=PROBABILITY`.
- `buildOpticOddsReferenceQuoteRows()` converts OpticOdds fixture odds into Holiwyn `ReferenceQuoteSnapshot` rows with `source=optic_odds`.
- `refreshOpticOddsLineQuoteSnapshots()` is credential-gated and reports `missing_optic_odds_api_key` instead of silently faking live provider data.
- `refreshMobileLiveProviderQuoteSnapshots()` now includes a `lineProvider` report alongside existing Polymarket Gamma quote/CLOB refresh reports.

User interactions supported:

- No new visible mobile control was added.
- Existing Samsung tablet server-mode Colombia vs Ghana live-detail Book proof was re-smoked to ensure the provider refresh service change did not regress the user-facing route-backed flow.

State transitions:

- With `OPTIC_ODDS_API_KEY` and configured sportsbooks, provider refresh can now fetch fixture odds using `Event.metadata.providerFixture.opticOddsFixtureId` and upsert matching line odds into `ReferenceQuoteSnapshot`.
- Without credentials, refresh returns an explicit skipped line-provider report rather than using dummy line prices.
- Contract proof converts official-response-shaped spread, total, and team-total lines into snapshot rows while marking the current event not ready for live provider apply.

Known limitations:

- `OPTIC_ODDS_API_KEY` is not configured in the local environment, so no live OpticOdds request was executed.
- The current Colombia/Ghana event still needs reviewed per-line provider identity before applying live line rows; otherwise same-family lines can be ambiguous.
- The cycle does not add provider orderbook depth for OpticOdds lines, only quote snapshots.

## Cycle DI - Reviewed Line Provider Identity Gate

Feature/page worked on:

- PM-GAP-067 structural provider identity gate for live soccer line markets.
- Reviewed OpticOdds market/outcome identity for compact live line markets before any line-provider rows are applied.
- OpticOdds row-builder matching hardened to prefer reviewed provider market and odd IDs over loose same-family matching.

Backend/API components touched:

- `src/server/services/mobileLiveLineProviderIdentityReview.ts`
- `src/server/services/mobileLiveOpticOddsLineIngestion.ts`
- `scripts/prove_mobile_line_provider_identity_review.ts`
- `src/__tests__/mobile-live-line-provider-identity-review.test.ts`

Important functions/services touched:

- `reviewMobileLiveLineProviderIdentities()` validates operator-reviewed line-provider mappings, supports dry-run projection, and requires `confirmApply=true` before writing metadata.
- `validateLineProviderIdentityReviews()` blocks wrong provider source, wrong market family, wrong line value, wrong period, missing outcome coverage, duplicate provider market reviews, and duplicate provider odd IDs.
- `summarizeLineProviderIdentityReadiness()` reports how many compact line markets have reviewed market/outcome identity.
- `buildOpticOddsReferenceQuoteRows()` now uses reviewed `lineProviderIdentity` metadata when present, so a selected line/outcome can match a specific provider market and odd ID instead of relying only on market family and line.

User interactions supported:

- No new visible mobile control was added.
- Existing Samsung tablet server-mode Colombia vs Ghana live-detail Book proof was re-smoked to ensure the provider identity gate did not regress the user-facing route-backed flow.

State transitions:

- Dry-run review can project the current Colombia/Ghana compact line markets from missing reviewed line identity to ready line-provider identity without mutating the database.
- Bad review data is blocked before apply and reports concrete reasons such as `provider_market_type_mismatch`, `provider_line_value_mismatch`, and `review_must_include_every_compact_market_outcome`.
- Confirmed apply, when used later with real operator-reviewed mappings, stores `lineProviderIdentity` in `Market.referenceMetadata` and `Outcome.referenceMetadata`.

Known limitations:

- Cycle DI did not apply reviewed identities to the database; proof is intentionally dry-run.
- `OPTIC_ODDS_API_KEY` is still not configured, so live OpticOdds refresh was not executed.
- No live OpticOdds rows were written, and line-market parity remains open until confirmed identities plus credentials produce route-readable provider snapshots.

## Cycle DJ - Line Provider Refresh Execution

Feature/page worked on:

- PM-GAP-067 structural provider refresh execution for reviewed live soccer line markets.
- Protected provider-mapping route support for reviewed `optic_odds` line identity.
- Stale-to-ready live-detail route contract proof for compact line markets.

Backend/API components touched:

- `src/app/api/mobile/events/[slug]/provider-mapping/route.ts`
- `src/app/api/mobile/events/[slug]/provider-refresh/route.ts`
- `src/server/services/mobileLiveProviderMapping.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `scripts/prove_mobile_line_provider_refresh_execution.ts`
- `src/__tests__/mobile-live-provider-mapping.route.test.ts`
- `src/__tests__/mobile-live-provider-refresh.route.test.ts`

Important functions/services touched:

- `POST /api/mobile/events/:slug/provider-mapping` now accepts `lineIdentityReviews[]` and routes them through `reviewMobileLiveLineProviderIdentities()`.
- `getMobileLiveProviderMappingReadiness()` now includes `lineProviderIdentityReadiness` so operators can see reviewed line identity readiness with the normal provider mapping readout.
- `refreshMobileLiveProviderQuoteSnapshots()` accepts an injected line-provider fetch implementation for proof/testing while production still uses the real OpticOdds request path.
- `prove_mobile_line_provider_refresh_execution.ts` applies reviewed line identity, seeds stale official-shaped `optic_odds` rows, runs refresh without contract fallback, and verifies live-detail provider quote state changes to ready.

User interactions supported:

- No new visible mobile control was added.
- Existing Samsung tablet server-mode Colombia vs Ghana live-detail Book proof was re-smoked to ensure the provider refresh route changes did not regress the user-facing route-backed flow.

State transitions:

- Provider mapping route can move compact line markets from missing reviewed line identity to applied reviewed identity when `dryRun=false` and `confirmApply=true`.
- Proof route state starts with target line markets `providerQuoteSnapshot.status=stale` and `shouldRefresh=true`.
- After refresh, target line markets report `providerQuoteSnapshot.status=ready`, `shouldRefresh=false`, and `source=optic_odds` with no contract-proof fallback.

Known limitations:

- Cycle DJ uses an official-shaped OpticOdds response injected by the proof harness. OpticOdds is optional enrichment and missing `OPTIC_ODDS_API_KEY` is not a P0 blocker for Polymarket parity.
- The Polymarket-first path remains Gamma/CLOB for markets that exist on Polymarket; non-Polymarket line enrichments must stay explicitly optional or unavailable.
- It proves provider quote snapshots for reviewed optional line enrichment, not provider orderbook ladder depth.
- Ticket/order/portfolio/history preservation for refreshed line identities remains a separate lifecycle proof.

## Cycle DK - Polymarket-First Provider Path

Feature/page worked on:

- PM-GAP-067 Polymarket-first provider discovery and refresh for the live Colombia vs Ghana World Cup event.
- Missing `OPTIC_ODDS_API_KEY` is no longer treated as a blocker for Polymarket parity; OpticOdds remains optional external enrichment.
- Provider candidate relevance was tightened so a generic Yes/No winner market cannot attach to the wrong team just because it shares the same event context.

Backend/API components touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `scripts/prove_mobile_provider_discovery_expansion.ts`
- `docs/mobile/harness/cycle-current-mobile-polymarket-first-provider-path.json`

Important functions/services touched:

- `assessCandidateRelevance()` now includes `binaryQuestionSubjectRelevant` for generic binary winner markets.
- `isBinaryQuestionSubjectRelevant()` requires the local market question subject tokens to appear in the provider candidate question before same-event binary winner candidates can be considered relevant.
- Existing provider attach and refresh services were exercised with Polymarket Gamma event discovery and CLOB depth refresh while `OPTIC_ODDS_API_KEY` was unset.

User interactions supported:

- Samsung tablet server-mode live-detail proof shows Colombia vs Ghana with `live-data-source-polymarket-gamma`, ready live-data status, and route-backed ready orderbook state.
- The Book UI remains usable with bid/ask, spread, depth rows, and Buy/Sell affordances after Polymarket-backed refresh.

State transitions:

- Before discovery, the compact event has 5 compact markets and 0 provider-refreshable markets.
- Exact Gamma event discovery plus manual slug fallback finds 3 attach-ready Polymarket match-winner markets: Colombia win, draw, and Ghana win.
- Confirmed attach moves 3 markets and 6 outcomes to provider-refreshable Polymarket identity.
- Refresh writes 6 quote snapshots and 96 CLOB depth rows without contract-proof fallback.
- Samsung tablet route proof reports `live-data-status-ready`, `live-data-source-polymarket-gamma`, `orderbook-source-orderbook-route`, and `orderbook-status-ready`.

Known limitations:

- The exact Polymarket event still exposes no verified spread, total, team-total, halves, corners, props, or correct-score provider markets through the current Gamma/CLOB path; those line families remain unavailable/rejected with backend reasons, not silently mocked.
- The event-detail chart still uses fallback chart history in the tablet proof and needs a Polymarket-backed chart/history route later.
- Ticket/order/portfolio/history lifecycle proof for the refreshed Polymarket identities remains a separate milestone.
