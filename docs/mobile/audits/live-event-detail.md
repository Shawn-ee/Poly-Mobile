# Live Event Detail Audit

Status: Cycle DE passed protected review-first bulk apply: operator-collected slugs can be reviewed and applied through one all-pass workflow, a mixed review set blocks apply and leaves readiness unchanged, and an all-valid set maps 3 real match-winner markets plus 6 outcome token IDs. Cycle DC passed protected bulk exact-slug review: operator-collected slugs can be reviewed in one request, 3 real match-winner reviews become attach-ready mappings, and a totals market rejects a winner slug with `provider_family_mismatch` and `insufficient_market_relevance`. Cycle DB passed provider line-source diagnosis and safety: current checked public provider surfaces do not expose attach-ready line markets for Colombia vs Ghana. Exact event has 3 match-winner candidates and 0 line-family candidates; 23 exact line slug guesses return 0 candidates; 8 backend-shaped line targets and 96 broad candidates produce 0 attach-ready line mappings under the existing family/relevance gate. Cycle DA passed provider discovery expansion for exact match-winner mapping: trusted event slug plus deterministic `COL/draw/GHA` fallback slugs produce 3 real attach-ready Polymarket soccer markets, attach 3 compact markets, refresh 6 quote snapshots, write 246 CLOB depth rows, and preserve Samsung tablet Book proof without weakening relevance checks. Cycle CZ passed exact line-slug family safety: a totals target rejects a match-winner slug with `provider_family_mismatch` and accepts a same-family total-goals candidate when relevance and tokens match. Cycle CY passed provider line-market availability diagnosis and safety: exact `fifwc-col-gha-2026-07-03` exposes 3 match-winner candidates and 0 line-family candidates, while broad line searches produced 0 attach-ready mappings and stayed blocked by relevance checks. Cycle CX passed event-derived exact provider event slug discovery: Holiwyn can derive `fifwc-col-gha-2026-07-03` from the local event instead of requiring a manual discovery slug, attach 3 real provider compact markets, refresh quote/CLOB depth without fallback, and pass Samsung tablet Book proof. Cycle CV passed the provider candidate relevance safety gate: real provider search is reachable for the local World Cup compact event, but unrelated candidates are rejected and no unsafe provider mapping is produced. Cycle CU passed the real provider CLOB depth fetcher for a mapped disposable provider event: refresh writes `polymarket-clob` ladder rows and the Book route moves from provider top-quote fallback to `provider-orderbook-depth` with Samsung tablet proof. Cycle CT passed the provider orderbook depth snapshot contract: the Book route now moves from provider top-quote fallback to `provider-orderbook-depth` when durable ladder rows exist, and Samsung tablet proof still renders route-backed Book depth. Cycle CS passed Samsung tablet proof for the scoped provider quote top-of-book depth bridge after refreshed provider snapshots moved the disposable event from stale/refresh-due to ready. Cycle CR proved real provider-owned stale/refresh-due to ready refresh plus cache invalidation on a disposable mapped provider event and passed Samsung tablet proof. Cycle CQ added manual provider slug preview and passed Samsung tablet regression proof. Cycle CP added protected provider candidate discovery and passed Samsung tablet regression proof. Cycle CO added protected provider identity attach dry-run/apply behavior and passed Samsung tablet regression proof. Cycle CN added protected provider mapping readiness for compact live detail and passed Samsung tablet regression proof. Cycle CM added protected provider refresh execution/invalidation for compact live detail and passed Samsung tablet proof after refresh. Cycle CL passed provider refresh policy contract proof for compact live detail and selected second-half orderbook. Cycle CK passed provider quote snapshot ready-state proof for compact live detail and selected second-half orderbook. Cycle CJ passed provider quote snapshot metadata contract and tablet regression proof. Cycle CI passed compact depth batching policy metadata and preserved tablet route-depth proof. Cycle CH passed batched compact-market route-backed depth proof. Cycle CG passed selected second-half orderbook depth proof. Cycle CF passed selected first-half orderbook depth proof. Cycle CE passed compact per-visible-market availability contract proof. Cycle CD passed selected orderbook availability contract proof. Cycle BC passed the live provider freshness contract and tablet proof. Cycle BB passed selected Team Totals seeded ready-depth proof. Cycle BA passed compact line-group coverage and selected Totals seeded ready-depth proof. Cycle AZ passed selected Spread line-market seeded ready-depth proof. Cycle AY passed selected line-market depth identity proof. Cycle AX passed the compact mobile live-detail route and route-backed primary orderbook-depth tablet proof. Cycle AN passed structural live event detail UI with backend-shaped fixture data and tablet proof; Cycle AO added the real `/api/events/:slug` contract for market identity, line identity, compact depth, and optional chart/live-stat arrays. Cycle AQ sources embedded chart history from `MarketOutcomeSnapshot` rows when available and preserves depth outcome identity in mobile. Cycle AR adds the dedicated `/api/markets/:marketId/chart?range=...` route/client contract. Cycle AS wires EventDetail to consume that chart route in server mode. Cycle AT adds deterministic `MarketOutcomeSnapshot` seeding for local/server proof. Cycle AU exposes chart loading/empty/error route states in the game chart. Cycle AW seeded route-readable orderbook depth. This is still not full backend parity because line markets are not mapped to real Polymarket provider identities, and provider-owned live stats if product keeps that tab remain open.

## Cycle DE Bulk Review Apply Workflow

Result: Pass for protected review-first bulk apply. Partial for full line-market provider parity because real line slugs/source are still missing.

Reference audit:

- Continues Cycle CW/CX/CY S23 Polymarket Colombia vs Ghana reference and exact Gamma event `fifwc-col-gha-2026-07-03`.
- Targets the operator-reviewed apply workflow needed after Cycle DC added bulk preview and Cycle DB proved broad provider line search is exhausted.

What became materially closer to Polymarket:

- Holiwyn now has an all-pass workflow for moving reviewed provider identities into backend market/outcome identity.
- A failed review blocks all apply rather than silently mapping only passing markets.
- The same reviewed payload can be dry-run first, then confirmed with `confirmApply=true`.

Acceptance criteria:

- P0: Bulk apply path accepts `reviews[]` on `/api/mobile/events/:slug/provider-mapping`.
- P0: Any failed review blocks the attach call and reports failed review reasons.
- P0: Blocked mixed review leaves provider-refreshable readiness unchanged.
- P0: All-valid reviews dry-run without mutation.
- P0: All-valid reviews with explicit confirmation apply real market and outcome token identity.
- P0: Samsung tablet proof keeps the provider-backed live-detail Book path working.
- P1: Build operator/admin UI to collect exact slugs and call the workflow.
- P1: Find real provider line-market slugs/source.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-bulk-review-apply-workflow.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Cycle DC Bulk Manual Slug Review Contract

Result: Pass for protected bulk exact-slug preview. Partial for full line-market provider parity because real line slugs/source are still missing.

Reference audit:

- Continues Cycle CW/CX/CY S23 Polymarket Colombia vs Ghana reference and exact Gamma event `fifwc-col-gha-2026-07-03`.
- Targets the operator-reviewed slug workflow needed after Cycle DB proved current broad provider search is exhausted for line markets.

What became materially closer to Polymarket:

- Holiwyn can now review multiple exact provider slugs in one protected request before mapping them into backend market identity.
- The bulk result returns only passing mappings and reports failed reviews, preventing silent wrong-family attachment.
- The proof demonstrates that match-winner slugs are accepted for match-winner markets but rejected for a totals market.

Acceptance criteria:

- P0: Bulk preview accepts multiple review entries.
- P0: Passing reviews return attach-ready mappings without applying them.
- P0: Wrong-family line reviews fail with explicit reasons.
- P0: Samsung tablet proof keeps the provider-backed live-detail Book path working.
- P1: Build operator/admin UI to collect real line slugs and submit bulk reviews.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-bulk-slug-review.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Cycle DB Provider Line Source Probe

Result: Pass for source diagnostic and safety. Partial/fail for actual line-market provider mapping parity because no attach-ready line-market candidate exists in the checked surfaces.

Reference audit:

- Continues Cycle CW/CX/CY S23 Polymarket Colombia vs Ghana reference and exact Gamma event `fifwc-col-gha-2026-07-03`.
- Checks exact event payload, exact line slug guesses, and broad line-oriented provider search for spreads, totals, team totals, first-half markets, corners, and correct score.

What became materially closer to Polymarket:

- The loop no longer treats “try broader Gamma search” as an open-ended solution for line markets.
- Holiwyn now has concrete evidence that current public Gamma surfaces are sufficient for match-winner mapping but not for the checked line-market families.
- The next implementation path is clearer: capture real line slugs from the reference app/operator review or add a different provider source.

Acceptance criteria:

- P0: Exact event line-family count is explicit.
- P0: Exact line slug guesses are checked and reported.
- P0: Broad line-query candidates remain blocked unless family/relevance gates pass.
- P0: Samsung tablet proof keeps the provider-backed live-detail Book path working.
- P1: Real provider line-market slugs/source remains required.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-line-source-probe.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Cycle DA Provider Discovery Expansion

Result: Pass for exact event plus manual slug fallback match-winner provider mapping. Partial for full line-market provider parity.

Reference audit:

- Continues the Cycle CW/CX/CY S23 Polymarket Colombia vs Ghana logged-in game-page evidence and exact Gamma event `fifwc-col-gha-2026-07-03`.
- Targets provider discovery expansion, team/event normalization, and exact manual slug fallback behavior.

What became materially closer to Polymarket:

- Holiwyn can recover multiple real attach-ready soccer markets from the trusted Polymarket event, not from irrelevant broad search candidates.
- The discovery path now records the exact fallback slugs it tried, making mapping review auditable.
- Quote and CLOB refresh ran after attach, so the live-detail Book remains backed by real provider data.

Acceptance criteria:

- P0: Exact provider event plus fallback slugs produce multiple real attach-ready provider markets.
- P0: Fallback candidates must still pass family, token, and relevance gates.
- P0: Provider attach and refresh run without contract-proof fallback.
- P0: Samsung tablet proof keeps the provider-backed live-detail Book path working.
- P1: Real provider line-market identities remain required for spreads, totals, team totals, halves, corners, props, and correct score.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-discovery-expansion.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Cycle CZ Line Slug Family Gate

Result: Pass for exact-slug safety. Partial for actual line-market provider mapping because real exact line slugs are still missing.

Reference audit:

- Builds on the Cycle CY conclusion that exact Colombia vs Ghana Gamma data has no line-family candidates.
- Targets the operator exact-slug path needed once line slugs are found manually or via a stronger provider endpoint.

What became materially closer to Polymarket:

- Holiwyn can safely review future line-market slugs without confusing match-winner binaries for totals/spreads/team totals.
- Generic Over/Under outcomes now have a guarded relevance path for line markets: provider family and important match tokens must match.

Acceptance criteria:

- P0: A Holiwyn totals target rejects a match-winner provider slug with `provider_family_mismatch`.
- P0: A same-family totals candidate can pass when outcome tokens and important match relevance are present.
- P0: Samsung tablet proof keeps the provider-backed live-detail Book path working.
- P1: Replace synthetic proof with real exact line slug preview when a provider line slug exists.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-line-slug-family-gate.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Cycle CY Provider Line Market Availability Diagnostic

Result: Pass for diagnostic and safety. Partial/fail for actual line-market provider mapping parity because no safe attach-ready line candidates exist in the checked provider surface.

Reference audit:

- Continues the S23 Polymarket Colombia vs Ghana logged-in game-page evidence and exact Gamma event `fifwc-col-gha-2026-07-03`.
- Checks provider availability for line families that Polymarket-style soccer pages need: spreads, totals, team totals, first-half markets, corners, and related line groups.

What became materially closer to Polymarket:

- Holiwyn now has an auditable provider-family report instead of a vague deferred line-market gap.
- Exact event data proves match-winner mapping is real while line-family mapping still needs another source or exact reviewed slugs.
- Broad provider search remains blocked from unsafe attach, so line-market parity work will not map Holiwyn line markets to unrelated high-volume markets.

Acceptance criteria:

- P0: Exact provider event family summary lists explicit line-family zero counts.
- P0: Broad line-market searches produce 0 attach-ready candidates unless the relevance gate passes.
- P0: Proof artifact records next required action for line-market mapping.
- P0: Samsung tablet proof keeps the provider-backed live-detail Book path working.
- P1: Find/import real provider line-market identities from a stronger source or reviewed exact slugs.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-line-market-availability.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Cycle CX Provider Event Slug Hint Discovery Audit

Result: Pass for event-derived exact sports-event provider discovery. Partial for full World Cup line-market provider parity.

Reference audit:

- Continues the S23 Polymarket Colombia vs Ghana logged-in game-page evidence and exact Gamma event `fifwc-col-gha-2026-07-03` from Cycle CW.
- This cycle targets backend search ownership rather than a new visual UI section.

What became materially closer to Polymarket:

- Holiwyn no longer depends on a manual `providerEventSlug` discovery parameter when the event already stores provider slug metadata.
- Exact provider event discovery remains narrow and relevance-gated, avoiding unrelated broad World Cup futures.
- Tablet proof confirms the event-derived mapping still reaches the Holiwyn live detail Book with real provider quote/depth state.

Acceptance criteria:

- P0: Discovery reports `providerEventSlugSource=event` when the local event carries a trustworthy provider event slug.
- P0: Discovery finds multiple attach-ready compact markets for the same Polymarket soccer event.
- P0: Provider attach and refresh run without contract-proof fallback.
- P0: Samsung tablet proof shows route-backed ready Book state for the provider-mapped live detail page.
- P1: Production fixture import must persist provider event slug metadata for every real World Cup fixture.
- P1: Spreads, totals, team totals, halves, corners, and props still need provider mapping when available.

Evidence:

- `docs/mobile/harness/cycle-current-mobile-provider-sports-event-discovery-proof.json`
- `docs/mobile/harness/cycle-current-mobile-live-detail-route-probe.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`

## Scope

- Feature: World Cup live football game detail.
- Reference device: Samsung S23 running Polymarket Android experience.
- Holiwyn proof device: Samsung tablet running Holiwyn through Expo Go.
- Cycle branch name: `mobile/cycle-AN-saved-watchlist-parity`, re-scoped honestly to live event detail after product steering changed.
- Out of scope: deposit, location verification, notifications, non-football live markets, World Cup informational ad/detail pages.

## Cycle CV Provider Candidate Relevance Gate Audit

Result: Pass for provider candidate relevance safety. Partial for full World Cup provider parity because no real compact soccer mapping was attached.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: official Android game page with provider-backed live prices, market rows, and Book/depth behavior.
- Uses real Polymarket Gamma provider search responses for the backend mapping audit.
- Cycle CV targeted provider candidate correctness before applying mappings, not a new visual UI section.

What became materially closer to Polymarket:

- Holiwyn now refuses unrelated provider candidates, preventing a World Cup soccer market from being mapped to unrelated markets like World Cup outright futures or pop-culture binaries.
- The provider-candidate route can distinguish “provider reachable but no safe match” from “provider fetch failed”.
- The next mapping cycle has a cleaner contract: exact slugs or discovered candidates must pass relevance before attach.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CV-P0-01 | P0 | Candidate attach readiness includes relevance checks, not only condition/token completeness. | Unit test/code review | Pass |
| LED-CV-P0-02 | P0 | Token-complete unrelated provider candidates are rejected with `insufficient_market_relevance`. | Unit test | Pass |
| LED-CV-P0-03 | P0 | Real provider discovery for the local World Cup compact event reports candidates without unsafe attach proposals. | Provider proof | Pass |
| LED-CV-P0-04 | P0 | Holiwyn Android device proof still opens the World Cup second-half Book after the backend guard. | Samsung tablet proof | Pass |
| LED-CV-P1-01 | P1 | Real compact World Cup soccer markets are mapped to provider identities and refreshed without fallback. | Future provider import proof | Open |
| LED-CV-P1-02 | P1 | Provider discovery finds high-confidence exact soccer market slugs rather than unrelated candidates. | Future provider discovery proof | Open |

Holiwyn evidence:

- Provider proof: `docs/mobile/harness/cycle-current-mobile-provider-candidate-relevance-gate.json`
- Device XML proof: `docs/mobile/harness/cycle-current-holiwyn-server-live-second-half-order-book.xml`
- Device screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-server-live-second-half-order-book.png`
- Unit/build proof: `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts src/__tests__/mobile-live-provider-mapping.route.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/polymarket-orderbook-depth-snapshots.test.ts`, `cmd /c npm.cmd run build`, mobile `cmd /c npm.cmd run typecheck`

Unresolved P0 gaps: 0 for Cycle CV provider candidate relevance gate.

Remaining P1/P2 gaps:

- Real compact World Cup soccer provider mappings.
- Improved provider discovery or reviewed exact soccer slugs.
- Provider-specific ladder source label in the mobile UI if product wants to distinguish real CLOB depth from generic route depth.

## Cycle CU Provider CLOB Depth Fetcher Audit

Result: Pass for real provider CLOB/depth fetch execution on a mapped disposable provider event. Partial for full World Cup parity because real compact soccer markets still need provider identity mapping before this path covers production soccer events.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: official Android game page with live provider-backed prices and Book/depth behavior on prediction markets.
- Official Polymarket CLOB documentation was checked for the provider dependency: `GET /book?token_id=...` returns bid/ask price-size rows for an outcome token.
- Cycle CU targeted provider-owned depth ingestion and route behavior, not a new visual section.

What became materially closer to Polymarket:

- Holiwyn now executes a real provider-owned orderbook refresh for mapped compact markets instead of relying only on proof rows or quote-estimated top of book.
- The selected Book route visibly changes from provider quote fallback to provider ladder depth after refresh.
- The provider depth path is tied to stable backend identity: `Market.externalSlug`, `Outcome.referenceTokenId`, `marketId`, `outcomeId`, `side`, `price`, and `size`.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CU-P0-01 | P0 | Official CLOB `/book?token_id=...` contract is implemented behind a tested fetcher that parses bid/ask price-size rows. | Unit test and provider contract review | Pass |
| LED-CU-P0-02 | P0 | Provider refresh runs the CLOB fetcher for mapped compact markets and reports `providerDepth` counts. | Route test | Pass |
| LED-CU-P0-03 | P0 | Real refresh writes `polymarket-clob` depth rows and the selected Book route returns `depthSource=provider-orderbook-depth`. | Route proof | Pass |
| LED-CU-P0-04 | P0 | Holiwyn Android device proof opens the refreshed event and Book surface with route-backed ready depth. | Samsung tablet proof | Pass |
| LED-CU-P1-01 | P1 | Real World Cup compact soccer markets are mapped to provider identities and use this provider depth path. | Future provider import proof | Open |
| LED-CU-P1-02 | P1 | Production provider retry/error taxonomy covers slow, partial, and unavailable CLOB responses. | Future route/service proof | Open |

Holiwyn evidence:

- Route proof: `docs/mobile/harness/cycle-current-mobile-provider-clob-depth-refresh-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-provider-clob-depth-prep.json`
- Device XML proof: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Device screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`
- Unit/build proof: `cmd /c npm.cmd run test:ci -- src/__tests__/polymarket-orderbook-depth-snapshots.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/orderbook-snapshot.provider-depth.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts`, `cmd /c npm.cmd run build`, mobile `cmd /c npm.cmd run typecheck`

Unresolved P0 gaps: 0 for Cycle CU provider CLOB depth fetcher.

Remaining P1/P2 gaps:

- Real World Cup compact soccer provider mapping.
- Production provider retry/error taxonomy.
- Provider-specific ladder source label in the mobile UI if product wants to distinguish real CLOB depth from generic route depth.

## Cycle CT Provider Orderbook Depth Snapshot Contract Audit

Result: Pass for provider orderbook depth snapshot contract. Partial for full provider parity because the cycle proves the durable table/route contract with proof rows, not a real provider CLOB fetcher or real World Cup provider mapping.

Reference audit:

- Continues the S23 Polymarket live-game reference used in Cycle CH: official Android game page with Book/depth behavior on live prediction markets.
- Cycle CT targeted the backend depth ladder contract behind the Book surface rather than a new visual section.

What became materially closer to Polymarket:

- Holiwyn can now represent provider-owned ladder depth separately from local Holiwyn orders and estimated top-of-book quote depth.
- The Book route source is auditable: local orderbook, provider ladder, provider quote fallback, or empty.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-CT-P0-01 | P0 | Schema has a durable provider orderbook depth snapshot model keyed by market/outcome/source/side/price. | Prisma schema/migration review | Pass |
| LED-CT-P0-02 | P0 | Book route prefers provider ladder rows over provider quote top-of-book fallback when local orders are absent. | Route proof | Pass |
| LED-CT-P0-03 | P0 | Compact live-detail exposes provider ladder counts and per-market provider ladder metadata. | Unit test | Pass |
| LED-CT-P0-04 | P0 | Holiwyn Android device proof still opens the Book surface with route-backed depth after provider ladder rows exist. | Samsung tablet proof | Pass |
| LED-CT-P1-01 | P1 | Real provider CLOB/depth fetcher populates `ReferenceOrderbookDepthSnapshot`. | Future provider proof | Open |
| LED-CT-P1-02 | P1 | Real World Cup compact soccer markets are mapped to provider identities and use this provider ladder path. | Future provider import proof | Open |

Holiwyn evidence:

- Route proof: `docs/mobile/harness/cycle-current-mobile-provider-depth-snapshot-route-proof.json`
- Proof prep: `docs/mobile/harness/cycle-current-mobile-provider-depth-snapshot-prep.json`
- Device XML proof: `docs/mobile/harness/cycle-current-holiwyn-provider-refresh-proof-order-book.xml`
- Device screenshot proof: `docs/mobile/screenshots/cycle-current-holiwyn-provider-refresh-proof-order-book.png`
- Unit/build proof: `cmd /c npm.cmd run test:ci -- src/__tests__/orderbook-snapshot.provider-depth.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts`, `cmd /c npm.cmd run build`, mobile `cmd /c npm.cmd run typecheck`

Unresolved P0 gaps: 0 for Cycle CT provider orderbook depth snapshot contract.

Remaining P1/P2 gaps:

- Real provider CLOB/depth fetcher.
- Real World Cup compact soccer provider mapping.
- Provider-specific ladder source label in the mobile UI if product wants to distinguish real CLOB depth from route depth.

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

## Cycle CW Provider Sports Event Discovery Expansion Audit

Result: Pass for focused exact provider sports-event discovery and route-backed tablet Book proof.

What became materially closer to Polymarket:

- Holiwyn can now discover and attach real provider-owned markets from the exact Polymarket World Cup live event rather than relying on broad search or local fixture data.
- The relevance gate remains strict: noisy broad candidates and unrelated futures are not accepted as proof for a live match when an exact event slug is available.
- The Colombia vs Ghana Holiwyn proof event now has 3 provider-refreshable compact markets matching the Polymarket event's live binary markets: Colombia win, draw, and Ghana win.
- Route-backed Book proof on the Samsung tablet now shows provider-backed depth for the exact mapped event, closing the old fallback-only route-backed proof gap for this focused event.

Acceptance criteria:

| Criterion ID | Priority | Status | Verification |
| --- | --- | --- | --- |
| LD-CW-P1-01 | P1 | Pass | Exact Gamma event route returned `fifwc-col-gha-2026-07-03-col`, `-draw`, and `-gha`. |
| LD-CW-P1-02 | P1 | Pass | Provider discovery proof shows 3 attach-ready candidates and 0 provider errors. |
| LD-CW-P1-03 | P1 | Pass | Applied mappings move readiness from 0 to 3 provider-refreshable compact markets. |
| LD-CW-P1-04 | P1 | Pass | No-fallback refresh writes 6 quote snapshots and 262 CLOB depth rows. |
| LD-CW-P1-05 | P1 | Pass | Mobile live-detail route probe shows 3 ready quote snapshots and 3 ready provider orderbook-depth markets. |
| LD-CW-P1-06 | P1 | Pass | Samsung tablet proof shows Colombia vs Ghana route-backed orderbook with ready status, Best bid/ask, Spread, Buy, and Sell. |

Evidence:

- `docs/mobile/reference/screenshots/cycle-CW-polymarket-s23-window.xml`
- `docs/mobile/harness/cycle-current-mobile-provider-sports-event-discovery-proof.json`
- `docs/mobile/harness/cycle-current-mobile-live-detail-route-probe.json`
- `docs/mobile/harness/cycle-current-mobile-live-detail-http-warm.json`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-candidates.service.test.ts src/__tests__/mobile-live-provider-candidates.route.test.ts`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke.ps1 -Deep -ServerLiveDetailOrderBook -ServerEventSlug world-cup-2026-colombia-vs-ghana-2026-07-03 -Port 8181 -Device adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp -ExpoHost 172.16.200.14 -BackendBaseUrl http://127.0.0.1:3002`

Unresolved P0 gaps: 0 for this focused provider discovery expansion.

Remaining P1 gaps:

- Discover/attach provider-owned spreads, totals, team totals, halves, corners, props/correct score, and other line markets when exact provider markets are available.
- Move the proof harness into an operator/admin mapping workflow if mappings should be reviewed outside scripts.
- Prove selected provider market/line/outcome through ticket, order, portfolio, and history for the exact mapped event.
- Add provider-owned scheduled refresh/ingestion beyond manual proof execution.
