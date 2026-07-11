# Batch Internal Readiness Gap List

Date: 2026-07-11

Branch: `batch/internal-readiness-audit-fix-proof`

Base: `main` at `223de7ca` (`Merge cycle WH trade ticket header simplification`)

Scope: Local MVP retail betting flow only: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope for this batch: order book UI, chat, live sports statistics, social/watchlist, deposit/withdraw, non-MVP polish.

## Audit Evidence

- GitHub CI for base main: green, run `29141383547`.
- Backend health: `GET /api/health` returned `status=ok`, `db=connected`, env `development`.
- Docker/Postgres: Docker daemon reachable; `poly_postgres` healthy; `DATABASE_URL` points to `localhost:5432/polymarket`.
- Mobile backend readiness summary: `docs/mobile/harness/batch-internal-readiness/mobile-backend-readiness.json`.
- Internal exchange readiness summary: `docs/mobile/harness/batch-internal-readiness/check-poly-internal-exchange-readiness.json`.
- Internal backend restart summary: `docs/mobile/harness/batch-internal-readiness/internal-beta-backend-restart.json`.
- Final filled S23 order proof summary: `docs/mobile/harness/batch-internal-readiness-final-fill/cycle-BATCHFINALFILL-current-mvp-s23-visible-flow.json`.
- S23 device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.

## Current Runtime Snapshot

- Home app endpoint: `/api/events?sportKey=soccer&leagueKey=world_cup&limit=10&source=polymarket&mobileMvpMatches=1&includeMobileMarkets=1`.
- Current MVP event: `argentina-vs-egypt`.
- Mobile-visible events: 1.
- Current match markets: 7.
- Provider-backed winner markets: 3 Polymarket Regulation Winner markets.
- Local fixture line markets: 4 contract-fixture markets across Spread, Totals, and Team Total.
- Provider-backed line markets: 0 attached/approved.
- Provider quote snapshots: present but stale in the audit run.
- Local MM-ready provider markets: 0.
- S23 final proof: passed for Home -> Live -> Event Detail -> Team Total line -> ticket -> swipe submit -> Portfolio filled position -> Portfolio History.

## Issues

| ID | Page/function | Actual behavior | Expected behavior | Priority | Affected files/routes | Proof needed | Blocks internal testing? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BATCH-P0-01 | Full order proof coverage | Phase 1 S23 audit used `SourceDisclosureOnly`, so it stopped at ticket-ready and did not submit an order or verify Portfolio/history in this batch run. Phase 2 reran the same path with seeded counterparty liquidity and passed the full filled path. | Unified proof should run the full S23 path: Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history. | P0 closed | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history`; `mobile/src/components/TradeTicket.tsx`; `mobile/src/components/Portfolio.tsx` | Passed: `docs/mobile/harness/batch-internal-readiness-final-fill/cycle-BATCHFINALFILL-current-mvp-s23-visible-flow.json` shows `swipeSubmitReachedPortfolio=true`, `filledPositionVisible=true`, `filledHistoryVisible=true`, `orderbookHidden=true`. | No. |
| BATCH-P1-01 | Provider/internal exchange readiness | `check_poly_internal_exchange_readiness.ts` reports `readyForInternalMobileExchange=false`: only 1 mobile-visible event, no ready provider snapshots, and 0 local-MM-ready provider markets. Provider winner markets are visible but stale/not seeded for local MM. | At least one provider-backed market should have fresh provider snapshot and local-MM readiness when claiming provider-backed internal exchange readiness. | P1 | `scripts/check_poly_internal_exchange_readiness.ts`; `scripts/refresh_reference_snapshots.ts`; `scripts/test_reference_bot_initialization.ts`; provider market metadata; reference snapshots; bot initialization metadata. | Readiness summary showing `readyForInternalMobileExchange=true` or an explicit defer reason if Local MVP fixture-line trading remains the current test path. | No for fixture-line fake-token flow; yes for provider-backed local-MM testing. |
| BATCH-P1-02 | Home/Search breadth | Current Home endpoint returns 1 match. The readiness gate expects at least 2 mobile-visible events. Search can show the current match and has filters removed, but breadth is thin. | Internal testers should see more than one provider-visible match when testing Home/Search discovery, or the app should clearly be treated as a one-match smoke environment. | P1 | `/api/events`; `src/app/api/events/route.ts`; `mobile/src/services/homeEventFeedService.ts`; `mobile/src/components/HomeScreen.tsx`; `mobile/src/components/SearchScreen.tsx`; provider import scripts. | Route proof showing 2+ mobile-visible events, plus S23 Home/Search screenshots if breadth is changed. | No for single-match MVP flow; yes for broader internal discovery testing. |
| BATCH-P1-03 | Google/account local callback configuration | `GET /api/auth/google/start?returnTo=%2Fportfolio` initially redirected to Google with `redirect_uri=http://localhost:3000/api/auth/google/callback` while the local backend under test runs on port `3002`. The account button exists, but local callback may land on the wrong port unless another server is running on 3000 or env origin is configured. | Local auth start should use the active configured backend origin, or docs/start commands should make the required auth origin explicit. | P1 fixed for local helper | `scripts/start_holiwyn_internal_beta_backend.ps1`; `src/app/api/auth/google/start/route.ts`; Google auth env; `.env`; mobile Account/Portfolio Google entry. | Startup helper now sets `NEXTAUTH_URL` to `http://127.0.0.1:$Port` by default and exposes `-AuthBaseUrl` for hosted auth override. Route proof after restart should show redirect URI on the selected auth origin. | No for fake-token trade path; still requires real Google Cloud authorized callback for end-to-end consent. |
| BATCH-P1-04 | Provider line market honesty | Regulation Winner is Polymarket-backed, but Spread/Totals/Team Total remain `contract-fixture`; provider availability reports 0 provider-backed line families. UI correctly discloses this, but parity with Polymarket line markets is still incomplete. | Local MVP can keep fixture lines, but internal testers must know line trading is not real Polymarket line data yet. | P1 | `/api/mobile/events/[slug]/live-detail`; `src/server/services/mobileLiveEventDetail.ts`; fixture line seeding/restoration scripts; Event Detail source banners. | Current route proof plus S23 Event Detail lines screenshot. | No, because fake-token line flow works; yes for provider-backed line parity claims. |
| BATCH-P1-05 | Bot/runtime mode clarity | No continuous bot is running. Existing proof scripts seed/prepare liquidity in one-shot mode; readiness reports provider markets are not bot-seeded. | Final report should clearly state bot is not continuous and provide exact one-shot/continuous commands. | P1 | package scripts `reference:snapshot-watch`, `bot:e2e:*`, `test:reference-bot-initialization`, `poly:internal-exchange-readiness`; bot metadata. | Process health and one-shot command result or explicit defer. | No for the current fixture-line proof; yes for continuous local-MM testing. |
| BATCH-P2-01 | Legacy sports route | `/api/sports/soccer/world-cup/events` returns an empty list, but the mobile app uses `/api/events?...mobileMvpMatches=1&includeMobileMarkets=1`, which returns the current match. | Either keep the legacy route irrelevant, remove it from tester docs, or align it later. | P2 | `src/app/api/sports/soccer/world-cup/events/route.ts`; docs/start instructions if they mention it. | Route proof only if docs or app start using this endpoint. | No. |

## Non-Issues Confirmed

- Home is clean: World Cup/Matches focused, no search area, no Trending, no Home account button.
- Search filter/sort controls are removed from visible UI; hidden audit markers remain.
- Event Detail hides chat and order book in the Local MVP path.
- Trade Ticket header now shows the actual selected line (`Argentina Over 1.5`) in the S23 proof.
- Portfolio has positions/orders/history/account hooks, cash-out action, order cancel UI, and Google/account entry markers.
- Backend and local DB are reachable.

## Batch Fix Plan

Fix P0 first:

1. Run the full S23 proof without `SourceDisclosureOnly`; if it fails, fix the concrete blocker in the batch branch. Status: passed in Phase 2.

High-value P1 only if low risk after P0:

1. Clarify or fix local Google redirect origin if it is controlled by a simple env/config path. Status: fixed in the local internal backend startup helper.
2. Improve readiness docs/commands around bot/provider mode if no code change is needed.

Do not fix in this batch:

- Provider breadth/import expansion unless the full fake-token flow is blocked.
- Provider-backed line market parity.
- Legacy `/api/sports/soccer/world-cup/events` route unless a current app path or docs depend on it.
- Visual P2 polish.
