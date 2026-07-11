# Batch Internal Readiness Gap List

Date: 2026-07-11

Branch: `main`

Base: `main` at `fe404729` (`Merge current MVP S23 proof refresh`)

Scope: Local MVP retail betting flow only: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope for this batch: order book UI, chat, live sports statistics, social/watchlist, deposit/withdraw, non-MVP polish, and provider futures/player-prop imports.

## Phase 1 Audit Snapshot

- Backend health: `GET /api/health` on `http://127.0.0.1:3002` returned `status=ok`, `db=connected`, `env=development`.
- Docker/Postgres: Docker daemon reachable; `poly_postgres` is healthy on local port `5432`.
- S23 reachability: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`, is connected.
- S23 full MVP proof: passed for Home -> Live -> Event Detail -> Spread line -> ticket -> swipe submit -> Portfolio filled position -> Portfolio History.
- Latest S23 proof: `docs/mobile/harness/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-s23-visible-flow.json`, `result=pass`.
- Node process health before proof: 3 Node processes; no stale multi-Expo pile-up observed.
- Root validation before source fixes: `npx tsc --noEmit --pretty false --incremental false` passed.
- Root CI tests before source fixes: `npm run test:ci` passed.
- Mobile validation before source fixes: `cd mobile && npm run typecheck` passed.
- Focused mobile contract tests for Google/account and Portfolio settings passed.

## Current Runtime Snapshot

- Home/MVP route: `/api/events?sportKey=soccer&leagueKey=world_cup&limit=10&source=polymarket&mobileMvpMatches=1&includeMobileMarkets=1`.
- Current mobile-visible match: `argentina-vs-egypt`.
- Mobile-visible events: 1.
- Current match markets: 7.
- Provider-backed winner markets: 3 Polymarket Regulation Winner markets.
- Local fixture line markets: 4 contract-shaped markets across Spread, Totals, and Team Total.
- Provider-backed line markets: 0 attached/approved.
- Provider winner snapshots: present but Polymarket books are closed/unusable (`not_accepting_orders`, missing book, or invalid terminal price). The batch now reports this as provider unavailability rather than generic setup failure.
- World Cup match scanner: 193 Gamma events inspected, 4 World Cup team-match events found, 0 usable attach-ready team-match events. Usable candidates are mostly futures, awards, player props, MLS/NFL/etc., and should not be imported to fake World Cup match breadth.
- Mobile credential readiness: ready to create a dev credential. Manual server mode is ready through the local-only `.runtime/mobile-manual-testing/server-mode-env.ps1` file; committed summaries redact the API key and report `serverModeApiKeySource=local-runtime-env`.

## Page/Function Audit

| ID | Page/function | Actual behavior | Expected behavior | Priority | Affected files/routes | Proof needed | Blocks internal testing? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BATCH-P0-01 | Full fake-token order path | Current source supports Home -> Live -> Event Detail -> line market -> ticket -> server-backed fake-token order -> Portfolio/history. Fresh S23 proof passed on `SM_S911U1`. | The current main state must pass one full S23 MVP proof with a filled order and visible Portfolio History. | P0 closed | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history`; `mobile/src/components/TradeTicket.tsx`; `mobile/src/components/Portfolio.tsx` | Passed: `docs/mobile/harness/cycle-BATCHS23-current-mvp-proof/cycle-BATCHS23-current-mvp-s23-visible-flow.json` shows `result=pass`, `swipeSubmitReachedPortfolio=true`, `filledPositionVisible=true`, `filledHistoryVisible=true`, and `orderbookHidden=true`. | No. |
| BATCH-P0-02 | Local validation/CI baseline | Root TypeScript, root CI tests, and mobile typecheck pass locally on this branch before source changes. | Keep main green; do not introduce source changes unless a P0 is confirmed. | P0 closed | Root package, mobile package, TypeScript configs, Jest config. | Local command logs plus GitHub CI after push. | No. |
| BATCH-P1-01 | Provider/internal exchange readiness | `poly:internal-exchange-readiness` reports `readyForInternalMobileExchange=false` because the current mapped Polymarket World Cup match books are closed/unusable. The batch now refreshes `argentina-vs-egypt` reference snapshots before this check, so the blocker reflects current provider book state instead of stale inherited data. | At least one provider-backed match market must have an accepting-order usable book before claiming provider-backed internal exchange readiness. Do not seed local MM against closed/unusable provider books. | P1 | `scripts/check_poly_internal_exchange_readiness.ts`; `scripts/refresh_reference_snapshots.ts`; `scripts/mobile_internal_readiness_batch.ps1`; provider market metadata; reference snapshots. | Readiness summary showing `readyForInternalMobileExchange=true`, or `providerBooksUnavailableOrClosed=true` as explicit defer evidence while Local MVP fixture-line trading remains the current test path. | No for fixture-line fake-token flow; yes for provider-backed local-MM testing. |
| BATCH-P1-02 | Home/Search breadth | Current Home endpoint returns 1 match. The scanner confirms no current attach-ready World Cup team-match breadth from Polymarket Gamma/CLOB. Search remains clean but thin. | Internal testers should eventually see more than one real match, but only if events are match-like and provider-valid. Do not import futures/player props to fake match breadth. | P1 | `/api/events`; `src/app/api/events/route.ts`; `mobile/src/services/homeEventFeedService.ts`; `mobile/src/components/HomeScreen.tsx`; `mobile/src/components/SearchScreen.tsx`; provider import scripts. | Route proof showing 2+ valid mobile-visible match events, plus S23 Home/Search screenshots if breadth changes. | No for single-match MVP flow; yes for broader discovery testing. |
| BATCH-P1-03 | Provider line market honesty | Regulation Winner is Polymarket-backed, but Spread/Totals/Team Total are `contract-fixture`. UI/backend route reports this honestly. | Local MVP can keep fixture lines, but provider-backed line parity must not be claimed until a real provider route/schema supports it. | P1 | `/api/mobile/events/[slug]/live-detail`; `src/server/services/mobileLiveEventDetail.ts`; fixture line seeding/restoration scripts; Event Detail source disclosure. | Current route proof plus S23 Event Detail line-market proof. | No for fake-token line flow; yes for provider-backed line parity claims. |
| BATCH-P1-04 | Provider-visible tradable match proof | The provider tradable-flow harness now targets the match-only MVP path by default. It finds `argentina-vs-egypt` and a Polymarket-backed Regulation Winner market, but reports `provider_mvp_match_snapshot_not_mm_safe` because the latest provider snapshot/book is not accepting orders and not safe for local-MM seeding. It rejects non-match futures unless explicitly overridden for a non-MVP audit. | A provider-backed match market should be visible, locally MM-ready from a safe provider snapshot, seeded with a safe bot quote, fillable through the simple ticket, and visible in Portfolio/history before provider-backed match trading is claimed. | P1 | `scripts/prove_mobile_provider_visible_tradable_flow.ts`; `scripts/mobile_internal_readiness_batch.ps1`; `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history`; `ReferenceQuoteSnapshot`. | Batch JSON `provider-visible-tradable-flow.json` showing `pass=true`, or explicit blocker summary while fixture-line MVP proof remains the test path. | No for contract-fixture fake-token flow; yes for provider-backed match local-MM testing. |
| BATCH-P1-05 | Google/account runtime convenience | Google/account UI and mobile package preflight scripts exist. Root `package.json` exposes localhost, strict, and LAN callback preflight wrappers. Non-strict proof reaches `accounts.google.com` without printing secrets; LAN proof now shows whether the running backend emits the phone-reachable callback expected by S23. | Tester docs should call the root wrapper or the mobile script. The wrapper must not print Google secrets. LAN/strict preflight should pass before claiming real Google consent readiness. | P1 improved, still auth-config-gated | `package.json`; `scripts/mobile_google_lan_auth_preflight.ps1`; `docs/mobile/audits/BATCH_INTERNAL_READINESS_HARNESS.md`; `mobile/scripts/google-auth-runtime-preflight.ps1`; `mobile/package.json`; local auth env. | `npm run mobile:google-auth-runtime-preflight`; `npm run mobile:google-auth-lan-preflight`; strict S23 callback proof after aligning Google Cloud authorized redirect URI with a hosted/LAN `NEXTAUTH_URL/api/auth/google/callback`. | No for fake-token trade path; yes for real Google consent testing. |
| BATCH-P1-06 | Bot/runtime mode clarity | No continuous bot is intentionally running. Existing MVP proof uses one-shot liquidity/credential/counterparty setup. Provider MM readiness remains false because provider books are unavailable/closed; the provider tradable-flow guard now stops before bot-quote checks when the provider snapshot is unsafe. | Final report should clearly state bot is not continuous and avoid recommending local-MM seeding until a usable provider book exists. | P1 improved | package scripts `reference:snapshot-watch`, `bot:e2e:*`, `test:reference-bot-initialization`, `poly:internal-exchange-readiness`, `mobile:provider-visible-tradable-flow`. | Process health plus `providerBooksUnavailableOrClosed=true` and `providerMvpTradableFlowBlocker` in batch summary. | No for current fixture-line proof; yes for continuous provider-backed local-MM testing. |
| BATCH-P2-01 | Legacy sports route | `/api/sports/soccer/world-cup/events` is not the current mobile MVP endpoint and can remain irrelevant for this flow. | Remove it from tester docs or align later only if the app starts using it. | P2 | `src/app/api/sports/soccer/world-cup/events/route.ts`; docs/start instructions if they mention it. | Route proof only if docs/app start depending on it. | No. |

## Non-Issues Confirmed

- Home is clean: World Cup/Matches/Live focused, no Home search block, no Trending, no Home account button.
- Search filter/sort controls are removed from visible UI.
- Event Detail hides chat and order book in the Local MVP path.
- Trade Ticket uses the simple retail amount/keypad/swipe flow and preserves backend submit behavior.
- Portfolio has account entry, Google entry, value header, chart/range tabs, Positions/Orders/History, cash-out, order cancel, and history rows.
- Deposit/withdraw remain hidden for Local MVP.

## Phase 2 Fix Plan

P0:

1. Run the fresh full S23 proof for the current main state. Status: passed on S23.

High-value P1 only if low risk:

1. Keep provider breadth/MM readiness deferred while Polymarket World Cup match books are closed/unusable.
2. Re-run provider discovery only when batch evidence shows a new usable World Cup match or attach-ready line-market candidate.

Do not fix in this batch:

- Provider breadth imports.
- Provider-backed line market parity.
- Continuous bot lifecycle.
- Order book/chat/live-stat UI.
- Visual P2 polish.
