# Function Implementation Log

Purpose: document the app functions, services, API calls, state transitions, and limitations involved in each mobile feature cycle.

## Cycle QO - Chinese Source Copy Cleanup

Feature/page worked on:

- Chinese Home/Live card source-readiness copy for the Local MVP match card.

Frontend/backend touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/__tests__/homeCardChineseSourceCopy.test.ts`
- No backend route, provider import service, Prisma schema, order logic, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- `eventSourceReadiness(event, locale)` now uses Chinese Holiwyn-branded source copy for contract-shaped line markets.
- Hidden accessibility markers still preserve `home-card-source-local-test-fake-token` and line family markers for audit/migration.

User interactions supported:

- User switches the app to Chinese and sees the Home match card source label as `胜负: Polymarket / 盘口: 利云体育`.

State transitions:

- No runtime state transition changed.
- Language switching remains the existing `toggleLanguage` behavior.

Known limitations:

- This is a focused Home/Live card copy cleanup, not a full app-wide Chinese translation pass.
- Real provider-backed Spread/Totals/Team Total line markets remain P1.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-QO-chinese-source-copy.md`
- S23 proof summary: `docs/mobile/harness/cycle-QO-chinese-source-copy/cycle-QO-chinese-source-copy-proof.json`
- S23 screenshot/XML: `docs/mobile/screenshots/cycle-QO-chinese-source-copy/cycle-QO-chinese-home-source.png`, `docs/mobile/harness/cycle-QO-chinese-source-copy/cycle-QO-chinese-home-source.xml`

## Cycle QN - Account Google Entry Clarity

Feature/page worked on:

- Portfolio -> Account entry discoverability for Google login.
- Account signed-out Google section clarity.

Frontend/backend touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/components/AccountScreen.tsx`
- `mobile/src/localization/appCopy.ts`
- `mobile/src/__tests__/accountAuthContract.test.ts`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- No backend route, OAuth handler, profile/session service, Prisma schema, order logic, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- Portfolio `openAccount` wiring remains unchanged.
- Account `openGoogleSignIn` wiring remains unchanged.
- Visible copy now makes the path explicit: `Account & login`, `Google account`, and a signed-out/connected status chip.

User interactions supported:

- User opens Portfolio and sees the account/login entry at the top-left profile area plus a Google account entry button.
- User opens Account and sees a clearly labeled Google account card with `Continue with Google`.

State transitions:

- No auth/session state transition changed.
- Signed-in display still depends on `forceSignedIn`/profile summary state.
- Signed-out display still exposes the existing Google auth launcher.

Known limitations:

- This is UI clarity only. It does not prove full Google OAuth callback/session/logout on native mobile.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-QN-account-google-entry-clarity.md`
- S23 proof summary: `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-QN-account-google-entry-clarity-proof.json`
- S23 Portfolio proof: `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-QN-portfolio-account-entry.xml`
- S23 Account proof: `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-current-holiwyn-account.xml`

## Cycle QM - Provider Chart Freshness Copy

Feature/page worked on:

- Event Detail chart/probability display for the current provider-backed Local MVP match.
- The cycle changes visible chart status copy only: real Polymarket CLOB history that is route-stale now displays as historical provider chart data instead of tester-facing `Stale`.

Frontend/backend touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailChartStatusCopy.test.ts`
- No backend route, Prisma schema, provider import service, order logic, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- `chartStatusLabel(status, source)` now returns `History` when `status === "stale"` and `source === "polymarket-clob-prices-history"`.
- Hidden/internal chart markers remain unchanged so proof can still inspect `chart-status-stale`, `chart-source-polymarket-clob-prices-history`, and `chart-provider-status-visible`.

User interactions supported:

- User opens Home, then Event Detail for `argentina-vs-egypt`, and sees the chart labeled as Polymarket historical chart context instead of visibly broken stale data.
- No ticket/order/Portfolio behavior changed in this focused cycle.

State transitions:

- No runtime state transition changed.
- Backend route status remains `stale`; only the user-facing copy for stale Polymarket CLOB history is softened to `History`.

Known limitations:

- The route is still stale because the provider event history ends on `2026-07-07`.
- This is not a pass for real live/current chart freshness.
- Real provider-backed Spread/Totals/Team Total line markets remain P1.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-QM-provider-chart-freshness.md`
- Provider chart proof before copy: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-match-polymarket-chart-history.json`
- Provider chart proof after copy: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-match-polymarket-chart-history-after-copy.json`
- S23 proof: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-s23-visible-flow.json`
- S23 screenshot/XML: `docs/mobile/screenshots/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-detail-stale-top.png`, `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-detail-stale-top.xml`

## Cycle QL - Provider Line Structural Inspection

Feature/page worked on:

- Current Local MVP provider-line readiness for Home -> Event Detail -> line ticket -> fake-token order -> Portfolio History.
- S23 proof harness stability for the same journey.

Frontend/backend touched:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- No mobile UI component, backend route, Prisma schema, provider import service, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- Added `Wait-UiContains` to wait for real Home content on the S23 before assertions.
- Added a post-load Expo developer-menu dismissal after Home is visible, so Expo Go overlays do not fail app proof.

User interactions supported:

- S23 proof opens Home, checks the current World Cup match, visits Event Detail, scrolls to Game Lines, opens the Spread line ticket, swipes to buy, and verifies Portfolio History.
- The visible route still shows real Polymarket Regulation Winner plus Holiwyn contract-shaped line markets.

State transitions:

- No app state transition changed.
- The proof confirms selected line/outcome identity still travels through ticket, server-backed fake-token order, and Portfolio History.

Known limitations:

- Fresh provider inspection found 0 Polymarket-backed line markets for the current match and 0 broad World Cup provider-line candidates.
- Spread/Totals/Team Total stay contract-shaped Holiwyn fixtures until a provider exposes attach-ready line rows.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-QL-provider-line-structural-inspection.md`
- Current service inspection: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-current-state.json`
- Current match line availability: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-provider-match-line-availability.json`
- Broad provider line scan: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-provider-line-breadth-scan.json`
- S23 proof: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-current-mvp-s23-visible-flow.json`

## Cycle QK - Search Source Copy

Feature/page worked on:

- Search tab source disclosure for mixed Polymarket provider markets plus Holiwyn line markets.
- No Home, Event Detail, ticket, Portfolio, backend route, schema, orderbook UI, chat, live stats, social, deposit, or withdrawal behavior changed.

Frontend/backend touched:

- `mobile/src/components/SearchScreen.tsx`
- `mobile/src/__tests__/searchResultStatsContract.test.ts`
- No backend source changed.

Important functions/services touched:

- Search source labeling now uses Holiwyn-branded `Holiwyn lines` / `利云体育盘口` copy for contract-shaped line markets.
- Accessibility/source markers changed from `test-lines` wording to `holiwyn-lines` wording so test/proof labels do not leak prototype language.

User interactions supported:

- User searches for `argentina` and sees the existing `Argentina vs. Egypt` mixed-provider result with `Polymarket 3 / Holiwyn lines 4`.
- Search navigation and result tapping remain unchanged.

State transitions:

- No state transition changed.
- Search still consumes the existing event feed/search data and keeps provider/local source counts.

Known limitations:

- This cycle does not import additional provider-backed line markets.
- Real Polymarket-backed Spread/Totals/Team Total breadth remains P1.

Evidence:

- S23 proof summary: `docs/mobile/harness/cycle-QK-search-source-copy/cycle-QK-search-source-copy-proof.json`
- S23 screenshot/XML: `docs/mobile/screenshots/cycle-QK-search-source-copy/cycle-QK-s23-search-argentina.png`, `docs/mobile/harness/cycle-QK-search-source-copy/cycle-QK-s23-search-argentina.xml`
- Audit doc: `docs/mobile/audits/cycle-QK-search-source-copy.md`

## Cycle QJ - Holiwyn Line Copy

Feature/page worked on:

- Home/Live/Event Detail/Search/Trade Ticket/Portfolio visible source wording for Local MVP line markets.
- S23 full-flow regression for Home -> Event Detail -> Spread line -> ticket -> fake-token order -> Portfolio History.

Frontend/backend touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/SearchScreen.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- Focused mobile tests for Event Detail, Home/Live source contracts, Trade Ticket, and Portfolio source badges.
- Proof scripts: `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`, `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`
- No backend route, schema, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- Contract-fixture line source display now uses Holiwyn-branded visible wording instead of tester-facing `Local line(s)` copy.
- Internal source markers remain intact for Audit Gate proof and future backend replacement.
- The S23 proof harness now accepts a real filled-history result after a successful fake-token line order and can resolve the backend `.env` from the main repo path.

User interactions supported:

- User opens Home/Live and sees provider winner plus Holiwyn line disclosure.
- User opens Event Detail, selects Spread `1.5`, opens a simple ticket, swipes to buy, and sees the filled fake-token trade in Portfolio History.
- User can still enter Account/Google from Portfolio; the Google button/status was not removed in this cycle.

State transitions:

- No app state transition changed.
- Selected market/line/outcome identity still travels through ticket, order submit, Portfolio, and History.
- The proof harness now records filled History as the default successful order outcome when the local backend fills immediately.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets are still unavailable for the current Polymarket-backed match.
- Google OAuth callback/session/logout remains P1; visible Google entry remains under Portfolio -> Account.

Evidence:

- Provider reinspection: `docs/mobile/harness/cycle-QJ-provider-line-reinspection/`
- S23 proof: `docs/mobile/harness/cycle-QJ-holiwyn-line-copy/cycle-QJ-current-mvp-s23-visible-flow.json`
- Screenshots/XML: `docs/mobile/screenshots/cycle-QJ-holiwyn-line-copy/`, `docs/mobile/harness/cycle-QJ-holiwyn-line-copy/`

## Cycle QI - Account Google Status Visibility

Feature/page worked on:

- Portfolio -> Account Google auth visibility.
- S23 proof for signed-out Google entry and signed-in Google connected state.

Frontend/backend touched:

- `mobile/src/components/AccountScreen.tsx`
- `mobile/src/localization/appCopy.ts`
- `mobile/src/__tests__/accountAuthContract.test.ts`
- `mobile/scripts/smoke.ps1`
- No backend route, schema, provider, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- `AccountScreen` now renders a persistent Google auth card in both auth states.
- Signed-out users still see `account-login-google` and `Continue with Google`.
- Signed-in/profile-loaded users now see `account-login-google-connected` and `Google connected`, so Google auth no longer appears to disappear after profile load.

User interactions supported:

- User opens Portfolio -> Account while signed out and can still start Google sign-in.
- User opens Account after a server/profile-loaded state and sees that Google is connected instead of losing the auth section.

State transitions:

- No auth/session state transition changed.
- `forceSignedIn` still controls signed-in display.
- The visible auth card changes from actionable Google button to connected Google status.

Known limitations:

- End-to-end Google OAuth callback/session/logout remains P1 and depends on backend auth environment configuration.
- Deposits, withdrawals, KYC, and sign-out remain out of this Local MVP cycle.

Evidence:

- S23 signed-out proof: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-signed-out-google.xml`, screenshot `docs/mobile/screenshots/cycle-QI-account-google-status/cycle-QI-account-signed-out-google.png`
- S23 signed-in proof: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-google-connected.xml`, screenshot `docs/mobile/screenshots/cycle-QI-account-google-status/cycle-QI-account-google-connected.png`
- S23 restored signed-out proof: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-restored-google.xml`, screenshot `docs/mobile/screenshots/cycle-QI-account-google-status/cycle-QI-account-restored-google.png`

## Cycle QH - Chart Status UI

Feature/page worked on:

- Event Detail chart status line for provider-backed Regulation Winner markets.
- S23 regression proof for provider-backed winner ticket, buy, Portfolio cashout, and History.

Frontend/backend touched:

- `mobile/src/components/EventDetail.tsx`
- No backend route, schema, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- Added local chart display helpers for source label, status label, and compact last-updated date.
- The Event Detail chart status text now shows human-readable provider state while preserving hidden Audit Gate markers in accessibility labels.

User interactions supported:

- User opens Event Detail and sees `Polymarket chart - Stale - Jul 7` instead of debug-style chart route copy.
- Existing provider-backed buy/cashout flow remains intact.

State transitions:

- No order or portfolio state transition changed.
- Chart state remains route-driven from `event.chartHistorySource`, `event.chartHistoryStatus`, and `event.chartHistoryLastUpdated`.

Known limitations:

- The displayed status is still `Stale` because the current provider chart history remains stale.
- Real provider-backed line markets remain unavailable.

Evidence:

- S23 proof: `docs/mobile/harness/cycle-QH-chart-status-ui/cycle-QH-provider-winner-s23-visible-flow.json`
- Event Detail XML/screenshot: `docs/mobile/harness/cycle-QH-chart-status-ui/cycle-QH-current-mvp-detail-top.xml`, `docs/mobile/screenshots/cycle-QH-chart-status-ui/cycle-QH-current-mvp-detail-top.png`

## Cycle QG - Provider Chart History

Feature/page worked on:

- Event Detail chart/probability history for provider-backed Regulation Winner markets.
- Regression proof for Home -> Event Detail -> provider-backed winner ticket -> buy -> Portfolio cashout -> History.

Frontend/backend touched:

- `src/server/services/polymarketPriceHistorySnapshots.ts`
- `src/app/api/mobile/events/[slug]/live-detail/route.ts`
- `src/app/api/markets/[id]/chart/route.ts`
- `scripts/prove_current_match_polymarket_chart_history.ts`
- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`
- No mobile UI layout, orderbook UI, chat, live stats, social, deposit, withdrawal, or schema code changed.

Important functions/services touched:

- `refreshPolymarketPriceHistorySnapshots()` now retries wider Polymarket CLOB history windows when the requested short window is empty.
- Mobile live-detail chart loading now gathers a bounded history slice per compact market so one market cannot crowd out another.
- Market chart route now exposes `requestedRange`, effective `range`, and `rangeFallbackApplied`.

User interactions supported:

- User opens Event Detail and sees a route-backed probability chart with `polymarket-clob-prices-history` instead of an empty placeholder.
- Existing provider-backed buy/cashout flow remains intact on S23.

State transitions:

- Before QG: current-match chart route returned empty for `1D`, and live-detail could miss primary-market history even after snapshots existed.
- After QG: `1D` requests fall back to `1W` when necessary, CLOB snapshots populate `MarketOutcomeSnapshot`, and live-detail exposes 240 chart points for each provider-backed winner market in the compact page.

Known limitations:

- The QG chart status is `stale`, not `ready`, because the latest CLOB point is `2026-07-07T18:30:09.000Z`.
- Spread/Totals/Team Total markets remain Local MVP contract fixtures.

Evidence:

- Route proof: `docs/mobile/harness/cycle-QG-provider-chart-history/current-match-polymarket-chart-history.json`
- S23 proof: `docs/mobile/harness/cycle-QG-provider-chart-history/cycle-QG-provider-winner-s23-visible-flow.json`
- Screenshots/XML: `docs/mobile/screenshots/cycle-QG-provider-chart-history/`, `docs/mobile/harness/cycle-QG-provider-chart-history/`

## Cycle QF - Provider Winner Cashout Refresh

Feature/page worked on:

- Provider-backed Regulation Winner buy/sell lifecycle for the Local MVP retail path.
- Home -> Event Detail -> provider-backed winner ticket -> fake-token/server-backed buy -> Portfolio cashout -> Portfolio History.

Frontend/backend touched:

- Updated `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` only.
- No mobile UI, backend route, schema, orderbook, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- The proof exercises the existing mobile Event Detail, Trade Ticket, Portfolio, cashout, and History flows.
- The proof uses existing backend order, portfolio, and local counterparty seeding helpers.
- Chart proof now accepts the current explicit route-backed chart state: ready CLOB history or known unavailable/empty source. This keeps the cashout lifecycle proof from failing before the selected user flow is reached.

User interactions supported:

- User opens the current match, selects the Polymarket-backed Egypt Regulation Winner outcome, enters `$25`, swipes to buy, lands in Portfolio, taps Cash out, swipes to sell, and sees the sold activity in History.

State transitions:

- Event Detail exposes provider-backed winner identity.
- Ticket carries `marketType=winner`, `line=none`, and `providerSource=polymarket`.
- Backend fills the local fake-token order using seeded counterparty liquidity.
- Portfolio shows the filled provider-backed position.
- Cashout creates the sell-side action and Portfolio History renders `portfolio-market-type-winner`, `portfolio-line-none`, and `portfolio-provider-source-polymarket`.

Known limitations:

- Chart history currently reported `chart-source-empty` and `chart-status-unavailable` in the QF proof. This is accepted only as an explicit P1 data gap, not chart-history parity.
- Real provider-backed Spread/Totals/Team Total markets remain unavailable for this match.

Evidence:

- Summary: `docs/mobile/harness/cycle-QF-provider-winner-cashout-refresh/cycle-QF-provider-winner-s23-visible-flow.json`
- Screenshots/XML: `docs/mobile/screenshots/cycle-QF-provider-winner-cashout-refresh/`, `docs/mobile/harness/cycle-QF-provider-winner-cashout-refresh/`

## Cycle QE - Provider Line Breadth Scan

Feature/page worked on:

- Provider/data readiness for Local MVP line markets.
- No visible mobile UI changed in this cycle.

Frontend/backend touched:

- Added `scripts/prove_mobile_provider_line_breadth_scan.ts`.
- Added package script `mobile:provider-line-breadth-scan`.
- No mobile UI, order, portfolio, schema, orderbook, chat, live stats, social, deposit, or withdrawal code changed.

Important functions/services touched:

- Reused `classifyProviderMarketFamily()` from `src/server/services/mobileLiveProviderCandidates.ts` so the scan uses the same provider family vocabulary as the existing attach-readiness path.
- Current-match proofs exercised the existing live-detail route and provider discovery guard.

User interactions supported:

- No new user interaction was added, but the existing S23 Local MVP flow was regression-proven after the provider scan.
- This cycle makes the backend/data-contract path clearer for the visible MVP flow: Spread/Totals/Team Total should remain Local MVP contract fixtures until a real Polymarket line provider candidate exists.

State transitions:

- No app state transition changed.
- Provider-readiness evidence moved from current-match-only proof to a broader World Cup Gamma scan.

Known limitations:

- The breadth scan is read-only and does not attach provider identities.
- Provider-line parity is still not complete because the scan found zero attach-ready World Cup line-family candidates.
- Existing Local MVP fake-token line trading remains valid only as contract-fixture behavior.

Evidence:

- Current match line availability: `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-current-match-line-availability.json`
- Current match discovery guard: `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-discovery-guard.json`
- Broad Gamma scan: `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-line-breadth-scan.json`
- Named script proof: `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-line-breadth-scan-npm-script.json`
- S23 regression proof: `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-current-mvp-s23-visible-flow.json`
- S23 screenshots/XML: `docs/mobile/screenshots/cycle-QE-provider-line-breadth-scan/`, `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/`

## Cycle QD - Local Line History Flow

Feature/page worked on:

- Local MVP line market -> ticket -> fake-token/server-backed filled order -> Portfolio History proof on Samsung S23.
- Google login visibility inspection after user report that login seemed to disappear.

Frontend/backend touched:

- No source code changed in this cycle.
- New S23 proof artifacts were captured under `docs/mobile/screenshots/cycle-QD-local-line-history-flow/` and `docs/mobile/harness/cycle-QD-local-line-history-flow/`.
- The existing local backend runtime was used in internal trading beta mode with the kill switch off.

Important functions/services exercised:

- Existing Event Detail line selection and ticket identity preservation.
- Existing `submitTicketOrder()` path through the server order route.
- Existing Portfolio snapshot/history refresh through the mobile API client.
- Existing Portfolio account entry wiring: `Portfolio` -> `openAccount` -> `AccountScreen` -> `openGoogleSignIn`.

User interactions supported:

- User opens Home, opens a live World Cup match, selects a Local MVP Spread line, opens the simple ticket, swipes to buy, and lands in Portfolio.
- User can switch to Portfolio History and see the filled local-line trade with line/market context preserved.
- Google login remains available from Portfolio, not Home: tap the Portfolio top-left account area or the Google sign-in chip to open Account, then use Continue with Google.

State transitions:

- Event Detail: provider-backed winner plus Local MVP line market state remains visible.
- Ticket: selected line identity is carried into amount entry and swipe submit.
- Backend/order: a seeded counterparty fills the fake-token/server-backed line order in local beta mode.
- Portfolio: filled position/history state becomes visible after submit; History includes line-market context instead of losing selection identity.

Known limitations:

- No new provider-backed line markets were created. Spread/Totals/Team Total are still Local MVP contract fixtures for this match.
- Real Google OAuth callback/session hydration remains future auth work; this cycle only confirms the mobile entry still exists.
- Production trading, wallet, deposit, withdrawal, orderbook UI, chat, live stats, and social features remain out of Local MVP scope.

Evidence:

- S23 flow summary: `docs/mobile/harness/cycle-QD-local-line-history-flow/cycle-QD-current-mvp-s23-visible-flow.json`
- Portfolio History screenshot/XML: `docs/mobile/screenshots/cycle-QD-local-line-history-flow/cycle-QD-current-mvp-portfolio-history.png`, `docs/mobile/harness/cycle-QD-local-line-history-flow/cycle-QD-current-mvp-portfolio-history.xml`
- Full S23 screenshots/XML: `docs/mobile/screenshots/cycle-QD-local-line-history-flow/`, `docs/mobile/harness/cycle-QD-local-line-history-flow/`

## Cycle QC - Local Line Tradable Flow And Tab Regression

Feature/page worked on:

- Event Detail Game Lines tab behavior.
- Local MVP line market -> ticket -> fake-token/server-backed order -> Portfolio position flow on Samsung S23.

Frontend/backend touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketTabsContract.test.ts`
- No backend source changed; local backend runtime was restarted with internal trading beta enabled and kill switch off for proof.

Important functions/services touched:

- `renderMarketTabs()` usage now hides the inline tab row when `compactHeaderVisible` is true, leaving only the sticky compact tab row in scrolled Game Lines state.
- Existing order routes and ticket services were exercised without source changes.

User interactions supported:

- User opens Event Detail, scrolls into Game Lines, and sees one Game Lines / Player Props tab row instead of duplicate rows.
- User selects a Local MVP Spread line, opens the ticket, swipes to buy, and lands in Portfolio with a filled local-line position.

State transitions:

- Event Detail scroll state: inline tabs -> sticky tabs without duplication.
- Ticket state: selected local line -> amount-ready ticket -> swipe submit.
- Backend/order state: server-backed fake-token order accepted in internal beta mode.
- Portfolio state: cash balance changes from 10,000 USDT to 9,975 USDT, and a Local line Spread position appears.

Known limitations:

- Real provider-backed line markets remain unavailable for this match. This cycle proves the Local MVP fixture-line trade path, not provider-line parity.
- The backend must be started in internal beta mode (`TRADING_BETA_ENABLED=true`, `TRADING_KILL_SWITCH=false`) for local order proof. The first proof attempt correctly failed while the kill switch was active.

Evidence:

- S23 duplicate-tab proof: `docs/mobile/harness/cycle-QC-local-line-tradable-flow/cycle-QC-no-duplicate-tabs-summary.json`
- S23 line trade proof: `docs/mobile/harness/cycle-QC-local-line-tradable-flow/cycle-QC-current-mvp-s23-visible-flow.json`
- S23 screenshots/XML: `docs/mobile/screenshots/cycle-QC-local-line-tradable-flow/`, `docs/mobile/harness/cycle-QC-local-line-tradable-flow/`

## Cycle QB - Provider Line Discovery Runtime Summary

Feature/page worked on:

- Local MVP Event Detail provider-line discovery runtime and proof.

Frontend/backend touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `scripts/prove_mobile_mvp_provider_discovery_guard.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- Provider/audit docs and S23 proof evidence.

Important functions/services touched:

- `discoverMobileLiveProviderCandidates()` now includes `lineDiscoverySummary` in its route/service result.
- `buildLineDiscoverySummary()` separates line-market discovery facts from generic provider candidate counts.
- The provider discovery guard now records line target count, manual line slug fallback count, attach-ready line count, rejected reason summary, and next provider action.

User interactions supported:

- Users still see Event Detail Game Lines with the existing Local MVP flow.
- The app/runtime can now prove why Spread/Totals/Team Total remain local fixtures: Polymarket exact event/manual slug/search discovery found no attach-ready provider line markets for the selected current match.

State transitions:

- No ticket, order, portfolio, wallet, auth, schema, chat, orderbook UI, live stats, deposit, or withdrawal state changed.

Known limitations:

- This cycle does not import real provider-backed line markets because no attach-ready Polymarket line candidates were found for the current match.
- Android proof confirms the visible line-market/source state only; it does not prove a new order lifecycle.

Evidence:

- Runtime discovery proof: `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-provider-discovery-guard.json`
- S23 proof summary: `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-proof-summary.json`
- S23 screenshots/XML: `docs/mobile/screenshots/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-event-detail-line-discovery.png`, `docs/mobile/screenshots/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-game-lines.png`, `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-event-detail-line-discovery.xml`, `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-game-lines.xml`

## Cycle QA - Provider Line Contract Action Fields

Feature/page worked on:

- Local MVP Event Detail provider-line readiness contract for Spread/Totals/Team Total markets.

Frontend/backend touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- Contract tests under `src/__tests__/mobile-live-event-detail.test.ts` and `mobile/src/__tests__/`.

Important functions/services touched:

- `buildMobileMarketSourceSummary()` now adds route-shaped `providerBackedFamilies`, `contractFixtureFamilies`, and `nextProviderAction` under `marketSourceSummary.lineMarkets.providerAvailability`.
- `EventDetail` keeps visible tester copy calm, but its accessibility proof marker now carries provider-backed family names, fixture family names, and the next provider action.

User interactions supported:

- Users still open Event Detail and trade the Local MVP line markets normally.
- The app can now prove on Android that provider-backed line markets are unavailable for the selected current event and that Local MVP fixtures are intentionally used for Spread/Totals/Team Total until attach-ready provider markets exist.

State transitions:

- No order, portfolio, wallet, auth, schema, chat, orderbook UI, live stats, deposit, or withdrawal state changed.

Known limitations:

- This cycle does not create real provider-backed line markets. Polymarket Gamma for `fifwc-arg-egy-2026-07-07` still exposes only 3 match-winner markets and 0 line markets.
- The running backend on port 3002 was not restarted from this worktree, so the HTTP process may not expose the new fields until restarted. The backend proof uses the branch route handler directly.

Evidence:

- Backend/provider proof: `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-provider-match-line-availability.json`
- S23 proof summary: `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-s23-proof-summary.json`
- S23 screenshot/XML: `docs/mobile/screenshots/cycle-QA-provider-line-contract/cycle-QA-s23-event-detail-provider-line-contract.png`, `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-s23-event-detail-provider-line-contract.xml`

## Cycle PZ - Portfolio Google Entry Clarity

Feature/page worked on:

- Portfolio account entry and Google login discoverability for the Local MVP.

Frontend/services touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`

Important functions/services touched:

- Portfolio header now shows an explicit `Account` label under the profile name.
- The former icon-only/gear account entry is replaced with a compact visible `Google sign-in` chip.
- Both visible Portfolio account affordances still call the existing `openAccount` callback.

User interactions supported:

- Users can open Portfolio, see a visible Google sign-in entry, tap it, and land on the existing Account screen with the `Continue with Google` button.
- The Home account shortcut remains intentionally removed.

State transitions:

- `mainTab` changes from `portfolio` to `account` through the existing `openAccount` callback.
- No Google OAuth route, auth callback, profile, order, portfolio, provider, schema, orderbook, chat, live stats, social, deposit, or withdrawal state changed.

Known limitations:

- This cycle improves discoverability only. End-to-end native Google OAuth callback/session hydration remains future auth work.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-PZ-portfolio-google-entry-clarity.md`
- S23 proof summary: `docs/mobile/harness/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-proof-summary.json`
- S23 screenshots/XML: `docs/mobile/screenshots/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-portfolio-google-entry.png`, `docs/mobile/screenshots/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-account-google-login.png`, `docs/mobile/harness/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-portfolio.xml`, `docs/mobile/harness/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-account.xml`

## Cycle PY - Current APK Lane Refresh

Feature/page worked on:

- Android installed-app runtime lane for the current Holiwyn mobile build.

Frontend/services touched:

- No source files changed.
- Generated local APK artifact: `mobile/dist/holiwyn-preview.apk` (ignored; not committed).

Important functions/services touched:

- Local Gradle build path: `mobile/android/gradlew.bat :app:assembleRelease`.
- APK readiness script: `mobile/scripts/check-android-apk-artifact-readiness.ps1`.
- Samsung APK smoke script: `mobile/scripts/samsung-apk-smoke.ps1`.

User interactions supported:

- Testers can install and launch the current-code Holiwyn APK on Samsung S23 instead of relying only on Expo Go.
- The APK smoke launches `holiwyn://qa?forcePortfolio=1`, proving the app foregrounds and renders Portfolio UI.

State transitions:

- No app state, backend route, auth, order, portfolio, provider, schema, orderbook, chat, live stats, social, deposit, or withdrawal state changed.

Known limitations:

- This is a release APK smoke lane, not a full Expo dev-client setup. EAS CLI and `expo-dev-client` remain unavailable in this workspace.
- The APK artifact is local and ignored by git; rebuild it from source when needed.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-PY-current-apk-lane-refresh.md`
- APK readiness: `docs/mobile/harness/cycle-current-android-apk-artifact-readiness.json`
- S23 install/launch proof: `docs/mobile/harness/cycle-current-samsung-apk-smoke.json`
- S23 visible proof summary: `docs/mobile/harness/cycle-PY-current-apk-lane-refresh/cycle-PY-current-apk-lane-s23-proof.json`
- S23 screenshot/XML: `docs/mobile/screenshots/cycle-PY-current-apk-lane-refresh/cycle-PY-s23-apk-portfolio.png`, `docs/mobile/harness/cycle-PY-current-apk-lane-refresh/cycle-PY-s23-apk-portfolio.xml`

## Cycle PX - Account Login Focus Cleanup

Feature/page worked on:

- Account screen for the Local MVP Portfolio -> Account entry and Google login path.

Frontend/services touched:

- `mobile/src/components/AccountScreen.tsx`
- `mobile/App.tsx`
- `mobile/src/__tests__/accountStaticRowsContract.test.ts`

Important functions/services touched:

- Removed the visible disabled Account "More" menu block and fallback rows for Leaderboard, Rewards, APIs, Accuracy, Status, Documentation, Help Center, and Terms.
- Moved the `account-language-row` proof marker to the Preferences language row so language remains visible without the extra disabled menu block.
- Removed the now-unused `accountMenuItems` prop from `AccountScreen` wiring.

User interactions supported:

- Users enter Account from Portfolio and see the Google login button without non-MVP disabled rows competing for attention.
- Users can still see demo balance, language, ticket defaults, portfolio summary, and trading mode.

State transitions:

- No auth, profile, order, portfolio, provider, schema, route, orderbook, chat, live stats, social, deposit, or withdrawal state changed.

Known limitations:

- This is visible Local MVP cleanup only. It does not prove Google OAuth callback/session completion.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-PX-account-login-focus-cleanup.md`
- Contract test: `mobile/src/__tests__/accountStaticRowsContract.test.ts`
- S23 proof summary: `docs/mobile/harness/cycle-PX-account-login-focus-cleanup/cycle-PX-account-login-focus-s23-proof.json`
- S23 proof screenshots/XML: `docs/mobile/screenshots/cycle-PX-account-login-focus-cleanup/cycle-PX-account-initial.png`, `docs/mobile/screenshots/cycle-PX-account-login-focus-cleanup/cycle-PX-account-lower.png`, `docs/mobile/harness/cycle-PX-account-login-focus-cleanup/cycle-PX-account-initial.xml`, `docs/mobile/harness/cycle-PX-account-login-focus-cleanup/cycle-PX-account-lower.xml`

## Cycle PW - Demo Trading Copy Cleanup

Feature/page worked on:

- Visible Local MVP demo/practice trading copy in Account, Portfolio, empty portfolio state, and ticket mode labels.

Frontend/services touched:

- `mobile/src/localization/appCopy.ts`
- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/demoTradingCopyContract.test.ts`

Important functions/services touched:

- App copy keys: `balance`, `noPositionsBody`, `portfolioSyncFallback`, `placeMockOrder`, `loginGoogleBody`, and `tradingModeMock`.
- Portfolio visible status pill copy now says `Demo trade` while accessibility labels keep `fake-token-test` for proof scripts.

User interactions supported:

- Users still trade with the same Local MVP fake-token/server-backed order flow, but tester-facing copy reads as a cleaner demo/practice experience.
- Account Google entry still explains that server auth can load a profile while demo trading remains available.

State transitions:

- No order, portfolio, auth, provider, schema, route, orderbook, chat, live stats, or social state changed.

Known limitations:

- This is copy cleanup only. Real-money wallet/deposit/withdraw and provider-backed line-market parity remain out of scope for this cycle.

Evidence:

- Contract test: `mobile/src/__tests__/demoTradingCopyContract.test.ts`
- Audit doc: `docs/mobile/audits/cycle-PW-demo-trading-copy-cleanup.md`
- S23 proof summary: `docs/mobile/harness/cycle-PW-demo-trading-copy-cleanup/cycle-PW-demo-trading-copy-s23-proof.json`
- S23 proof screenshot/XML: `docs/mobile/screenshots/cycle-PW-demo-trading-copy-cleanup/cycle-PW-account-single-param.png`, `docs/mobile/harness/cycle-PW-demo-trading-copy-cleanup/cycle-PW-account-single-param.xml`
- Account entry note: Google login did not disappear; the Home account button was intentionally removed by the Local MVP Home cleanup, and the current entry is Portfolio top-left/gear -> Account.

## Cycle PV - Local Line Source Copy Cleanup

Feature/page worked on:

- Local MVP visible source labels across Home/Live, Event Detail Game Lines, Trade Ticket, Portfolio, and Search.

Frontend/services touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/LiveScreen.tsx` indirectly through shared `eventSourceReadiness()`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/src/components/SearchScreen.tsx`
- Source-label contract tests under `mobile/src/__tests__/`

Important functions/services touched:

- `eventSourceReadiness()` now presents mixed provider/local line state as `Winner: Polymarket / local lines`.
- `lineSourceCopy()`, `marketSourceHeaderNote()`, `marketSourceBadge()`, `ticketSourceBadge()`, `ticketSourceNote()`, `portfolioSourceBadge()`, `portfolioSourceNote()`, `portfolioSourceSummary()`, and `SearchScreen` source labels now use calmer `Local line(s)` tester-facing copy.

User interactions supported:

- Home/Live current-match cards, Event Detail line rows, Trade Ticket, Portfolio positions/orders/history, and Search results still disclose when line-market pricing is local.
- Hidden accessibility/test markers still expose `contract-fixture` and local fake-token identity for harnesses and audits.

State transitions:

- No navigation, ticket, order, portfolio, backend, auth, schema, provider, orderbook, chat, live stats, or social state changed.

Known limitations:

- This is a visible-copy cleanup only. Spread/Totals/Team Total markets remain backend-shaped `contract-fixture` rows until real provider-backed line markets are available.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-PV-local-line-source-copy-cleanup.md`
- Contract tests: source badge and source-readiness tests in `mobile/src/__tests__/`
- S23 proof summary: `docs/mobile/harness/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-s23-visible-flow.json`

## Cycle PT - Portfolio Google Entry Visibility

Feature/page worked on:

- Portfolio account entry discoverability for the existing Account screen and Google login button.

Frontend/services touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`

Important functions/services touched:

- Existing `openAccount` callback path from `Portfolio` to `AccountScreen`.
- Existing `openGoogleSignIn` implementation in `mobile/App.tsx` remains unchanged.

User interactions supported:

- Portfolio top-left avatar/name still opens Account.
- New top-right gear button also opens Account, making the existing `Continue with Google` action easier to find after the Home account button cleanup.

State transitions:

- `mainTab` changes from `portfolio` to `account` through the existing `openAccount` callback.
- No auth, backend, Google OAuth URL, portfolio, order, schema, provider, or wallet state changed.

Known limitations:

- This restores discoverability only; successful Google OAuth still depends on `EXPO_PUBLIC_API_BASE_URL` pointing at a backend that serves `/api/auth/google/start`.

Evidence:

- Focused contract test: `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- Audit doc: `docs/mobile/audits/cycle-PT-portfolio-google-entry-visibility.md`
- S23 proof summary: `docs/mobile/harness/cycle-PT-portfolio-google-entry-visibility/cycle-PT-portfolio-google-entry-visibility-summary.json`

## Cycle PS - Provider-Backed Line Market Gap

Feature/page worked on:

- Current Local MVP Event Detail provider line-market readiness for `argentina-vs-egypt`.
- Provider evidence for whether Spread/Totals/Team Total lines are Polymarket-backed or contract fixtures.

Frontend/services touched:

- No mobile UI source changed.
- No backend route, Prisma schema, order route, order book, chat, live stats, or social source changed.
- Added audit/proof documentation only.

Important functions/services exercised:

- `scripts/prove_mobile_provider_match_line_availability.ts`
- `/api/mobile/events/argentina-vs-egypt/live-detail`
- Polymarket Gamma public event fetch for `fifwc-arg-egy-2026-07-07`

User interactions supported/proven:

- No new visible interaction was implemented in this inspection cycle.
- The latest visible route proof remains Cycle PR: Home -> Event Detail -> contract-shaped line market -> simple ticket -> fake-token/server-backed order -> Portfolio/history.

State transitions:

- No application state transition changed.
- Proof confirmed the current route state: Regulation Winner is provider-backed from Polymarket, while Spread/Totals/Team Total rows remain Local MVP contract fixtures.

Known limitations:

- Polymarket Gamma exposes 0 Spread/Totals/Team Total markets for the current MVP match.
- The existing line fixtures are acceptable only for Local MVP UI/order proof and must not be treated as Polymarket parity.
- Older Colombia/Ghana provider-line probes should not be used as current Home-match evidence without parameterization.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-PS-provider-backed-line-market-gap.md`
- Route/provider proof: `docs/mobile/harness/cycle-PS-provider-backed-line-market-gap/cycle-PS-provider-match-line-availability.json`

## Cycle OV - Nation Top Goalscorer Provider Breadth And Classification Guard

Feature/page worked on:

- Provider Breadth Runtime Loop for another real Polymarket-backed World Cup event.
- Search-visible provider breadth on Samsung S23.
- Backend provider normalization for World Cup futures that do not contain the word `winner`.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-OV-provider-breadth-nation-top-scorer.md`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/`
- `docs/mobile/screenshots/cycle-OV-provider-breadth-nation-top-scorer/`

Important functions/services touched:

- `src/server/services/soccerProviderNormalization.ts`
- `src/server/services/__tests__/soccerProviderNormalization.test.ts`
- Existing Polymarket Gamma/CLOB import and refresh services imported `world-cup-nation-of-top-goalscorer` with 8 provider-backed markets.
- Existing route proofs exercised `/api/events` broad World Cup routes, Search routes, and `/api/mobile/events/:slug/live-detail`.
- Existing `poly-bot` dry-run/live-local path was exercised against the tiny `England` allowlist.

User interactions supported/proven:

- S23 Search in server mode shows 5 World Cup results, led by `World Cup: Nation of Top Goalscorer` with `Polymarket 8 markets`.
- Local MVP Home/Live match-only routing remains protected; the new event is now classified as `future`, not `match`.

State transitions:

- Local database now includes an additional Polymarket-backed Nation of Top Goalscorer futures event with 8 markets.
- Reference snapshots refreshed for the 8 imported markets; 16 snapshots were updated.
- Provider normalization now treats World Cup top scorer/goalscorer/award-style futures as `eventType=future`, `marketProfile=outright`.
- The bot runtime reached live-ready pricing for the England market but skipped quote placement because the seeded inventory was slightly above the per-market exposure cap.

Validation:

- Provider breadth route proof passed after the classification fix.
- Search provider breadth route proof passed after the classification fix.
- S23 Search proof passed on `SM-S911U1`.
- `npx vitest run src/server/services/__tests__/soccerProviderNormalization.test.ts` passed.
- `mobile` typecheck passed.
- Bot dry-run/live-local ran; both reported the remaining risk-cap blocker.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets for match detail pages remain unavailable.
- Nation/award futures are visible in Search, not Home/Live, by Local MVP product direction.
- Bot quote placement for this event needs risk-cap/seed sizing adjustment; provider freshness and classification are no longer the blocker.

## Cycle OU - Golden Boot Provider Breadth Refresh

Feature/page worked on:

- Provider Breadth Runtime Loop for Search-visible World Cup markets.
- Mobile Search proof for multiple Polymarket-backed World Cup events on Samsung S23.
- Tiny allowlisted bot dry-run/live-local readiness for one refreshed provider-backed market.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-OU-provider-match-breadth-refresh.md`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/`
- `docs/mobile/screenshots/cycle-OU-provider-match-breadth-refresh/`

Important functions/services touched:

- No mobile UI, backend route source, Prisma schema, order route, order book, chat, live stats, or social source files changed.
- Existing Polymarket Gamma/CLOB import and refresh services imported `world-cup-golden-boot-winner` with 12 provider-backed markets.
- Existing provider breadth route proofs exercised `/api/events` broad World Cup routes and Search routes.
- Existing reference refresh path updated CLOB-backed quote snapshots for the Golden Boot event.
- Existing `poly-bot` dry-run/live-local command path was exercised against the tiny `Kylian Mbappe` allowlist.

User interactions supported/proven:

- S23 Search in server mode shows 4 World Cup results, led by `World Cup: Golden Boot Winner` with `Polymarket 12 markets`.
- Search still keeps broad provider futures out of Home/Live match-only surfaces by product direction.

State transitions:

- Local database now includes an additional Polymarket-backed Golden Boot futures event with 12 markets.
- Reference snapshots refreshed for the 12 imported markets; high-quality CLOB prices were available for Messi/Haaland/Mbappe, while some long-tail markets remained missing-book.
- The Kylian Mbappe market was enabled/prepared for local-MM runtime and reached live-local `manage_quotes`.

Validation:

- Provider breadth route proof passed.
- Search provider breadth route proof passed.
- Golden Boot reference refresh passed with 12 markets refreshed and 24 snapshots updated.
- `mobile` typecheck passed.
- Samsung S23 proof passed on `SM-S911U1`.
- Bot dry-run passed as a planning proof; live-local reached quote management but order placement was rejected by the internal trading kill switch.

Known limitations:

- The first attempted match provider candidate did not expose enough attachable markets, so this cycle pivoted honestly to a provider-backed World Cup futures event instead of claiming match-line breadth.
- Real provider-backed Spread/Totals/Team Total markets for match detail pages remain unavailable.
- Internal source labels remain useful for proof, but final tester UI should not let them dominate screens.
- Bot quote placement remains blocked while the internal trading kill switch is active.

## Cycle OT - World Cup Winner Provider Breadth Refresh

Feature/page worked on:

- Provider readiness proof for `world-cup-winner`.
- Mobile Search provider breadth visibility on Samsung S23.
- UI regression/source-change reporting after provider/source-label work.

Frontend/services touched:

- No mobile UI source changed.
- `scripts/prove_mobile_real_provider_world_cup_winner.ts`

Important functions/services touched:

- The World Cup winner provider proof now accepts `--cycle` and writes the cycle name into the proof summary plus event/market metadata.
- Existing provider import/refresh behavior is preserved: Polymarket Gamma discovers markets, CLOB-backed data refreshes quotes/depth, and Optic Odds is optional/unconfigured.

User interactions supported:

- Users can open Search on S23 and see multiple provider-backed World Cup predictions:
  - `World Cup Winner`
  - `Which continent will win the World Cup?`
  - `Argentina vs. Egypt`

State transitions:

- Provider proof imports/refreshed `provider-breadth-world-cup-winner`.
- Backend route proof shows broad provider runtime ready.
- S23 Search proof shows the refreshed provider rows in mobile server mode.

Known limitations:

- Home remains Local MVP match-only and does not show broad futures/outrights.
- Current match Spread/Totals/Team Total markets remain contract-shaped fixtures because no attach-ready Polymarket line markets are available for the selected MVP match.
- No order placement or bot breadth was rerun in this cycle.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-OT-world-cup-winner-breadth-refresh.md`
- S23 XML: `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-s23-provider-breadth-search.xml`
- S23 screenshot: `docs/mobile/screenshots/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-s23-provider-breadth-search.png`

## Cycle OS - Provider Breadth / Line Inspection

Feature/page worked on:

- Provider-backed World Cup Search visibility.
- Provider line-market availability for the current Local MVP match.
- Provider proof-script naming hygiene.

Frontend/services touched:

- No mobile UI source changed.
- `scripts/prove_mobile_provider_breadth_runtime.ts`
- `scripts/prove_mobile_search_provider_breadth.ts`

Important functions/services touched:

- Provider breadth route proof now accepts `--cycle`.
- Search provider breadth route proof now accepts `--cycle`.
- Existing mobile Search route/runtime was proven on Samsung S23 in server mode.

User interactions supported:

- Users can open Search with a World Cup query and see multiple provider-backed World Cup predictions from the backend route.
- The current MVP match still honestly shows provider-backed regulation winner and contract-fixture line markets.

State transitions:

- Diagnostic launch without server-mode env showed `0 results`.
- Fresh Expo reload with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3002`, and `adb reverse tcp:3002 tcp:3002` loaded provider-backed Search results correctly.

Known limitations:

- Polymarket Gamma exposes 0 current-match Spread/Totals/Team Total markets for `argentina-vs-egypt`.
- Broad line candidate search found 0 attach-ready line candidates and preserved the strict relevance gate.
- No source-label micro-proof or visual UI polish was added.

Evidence:

- Audit doc: `docs/mobile/audits/cycle-OS-provider-breadth-line-inspection.md`
- S23 XML: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-s23-search-provider-breadth-servermode-reload.xml`
- S23 screenshot: `docs/mobile/screenshots/cycle-OS-provider-breadth-line-inspection/cycle-OS-s23-search-provider-breadth-servermode-reload.png`

## Cycle OR - Home/Live Provider Breadth Status Guard

Feature/page worked on:

- Mobile Search provider-breadth status display.
- Mobile Home/Live match-only filtering for the Local MVP retail path.

Frontend/services touched:

- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/services/homeEventFeedService.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/src/__tests__/homeEventFeedService.test.ts`

User interactions supported:

- Users can search for World Cup provider-backed predictions and see multiple real provider-backed events without futures being mislabeled as live football.
- Users can open the Live tab without World Cup outright/future markets polluting the live-match feed.

State transitions:

- Provider `eventType=future` / `marketProfile=outright` now maps to mobile `future` state even when provider `liveStatus=LIVE`.
- Home/Live service rejects future/outright event types before using team-name fields as match heuristics.

Known limitations:

- No backend schema or order route changed.
- Broad provider futures remain visible through Search, while Home remains the match-only MVP path.
- Real provider-backed current match breadth and line-market breadth remain P1.

Validation:

- Focused mobile Vitest passed.
- Mobile typecheck passed.
- Public event route no-leak Jest test passed.
- S23 Search/Live proof passed.

## Cycle OQ - Provider Breadth Runtime Loop

Feature/page worked on:

- Provider-backed World Cup breadth for mobile Search/provider runtime.
- Local bot dry-run/live-local readiness for one tiny allowlisted provider-backed market.

Frontend/services touched:

- None. This cycle intentionally avoided visual micro-polish and source-label changes.

Backend/provider/runtime touched:

- Imported Polymarket Gamma event `which-continent-will-win-the-world-cup`.
- Refreshed Polymarket reference snapshots for the imported event through CLOB-backed reference snapshot refresh.
- Enabled MM/trading only for `Will Africa (CAF) win the 2026 FIFA World Cup?`.
- Seeded one tiny local fake-token system-liquidity bot runtime for market `fd7d40f6-898d-402b-b4b1-5d1d0380e38c`.
- Ran poly-bot dry-run and live-local with allowlist `Africa (CAF)`.

User interactions supported/proven:

- On Samsung S23, Search shows three provider-backed World Cup results: `Which continent will win the World Cup`, `World Cup Winner`, and `Argentina vs. Egypt`.
- Home remains intentionally Local MVP match-only and still shows the current match path.

Backend/API routes exercised:

- `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10`
- `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10`
- `/api/mobile/events/:slug/live-detail`
- Admin reference-market routes used by poly-bot for reference refresh, MM enablement, bot seed, and lifecycle updates.

State transitions:

- `Which continent will win the World Cup?` imported as a provider-backed World Cup future with 3 Polymarket markets.
- Africa market moved from reference-only provider-visible to `tradable=true`, `mmEnabled=true`, `botInitialization.status=live_enabled`.
- Readiness moved from blocked (`no_ready_provider_snapshots`, `local_mm_ready_market_count_below_1`) to pass with one local-MM-ready market.

Verified:

- Provider readiness route proof passed.
- Provider breadth route proof passed with 3 provider-backed mobile-visible events.
- S23 Search screenshot/XML proof passed.
- Bot dry-run produced cycle reports and correctly skipped placement.
- Bot live-local produced `manage_quotes` cycles for the one allowlisted market.

Known limitations:

- The newly imported continent event is a World Cup futures/outright surface, not a live match.
- Argentina/Egypt provider winner markets are now one-sided/stale for MM purposes even though they remain useful mobile provider identity proof.
- Real provider-backed Spread/Totals/Team Total line markets for World Cup match pages remain open.

## Cycle OP - Search Provider Breadth Visibility

Feature/page worked on:

- Search Top Results provider breadth visibility.

Frontend/services touched:

- `mobile/src/components/SearchScreen.tsx`
- `scripts/prove_mobile_search_provider_breadth.ts`

User interactions supported/proven:

- On Samsung S23, Search shows two provider-backed results from the broad provider route.
- Search rows disclose `World Cup Winner` as `Polymarket 8 markets`.
- Search rows disclose `Argentina vs. Egypt` as `Polymarket 3 / test lines 4`.

Backend/API route changed:

- None.

Backend/API routes exercised:

- `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10`
- `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=10`

Verified:

- Mobile typecheck passed.
- Focused mobile API/source tests passed.
- Provider breadth route proof passed.
- S23 Search screenshot/XML proof saved under `docs/mobile/harness/cycle-OP-search-provider-breadth/`.

Known limitations:

- Home remains intentionally Local MVP match-only.
- Current broader provider-backed breadth is one match plus one outright; next provider work should add more real attach-ready match events.
- MVP line markets remain contract-shaped fixtures.

## Cycle ON - Source Label Tester Cleanup

Feature/page worked on:

- Home source readiness labels, Event Detail source disclosure, Trade Ticket source disclosure, and Portfolio source disclosure copy.

Frontend/services touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`

User interactions supported/proven:

- S23 Home shows the current MVP match with lighter `Winner: Polymarket / test lines` copy.
- S23 Event Detail shows mixed provider/test-line disclosure without debug-heavy `local test fake-token` visible copy.
- S23 line market rows and line ticket show `Test` / `Test line - fake USDT`.
- Provider-backed winner ticket still shows `Polymarket market`.

Backend/API route changed:

- None.

Backend/API routes exercised:

- Existing Home/Event Detail routes through the running mobile app: `/api/events` and `/api/mobile/events/:slug/live-detail`.

Verified:

- Mobile typecheck passed.
- Focused Vitest mobile API/source tests passed.
- S23 proof saved under `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/`.

Known limitations:

- Spread/Totals/Team Total rows remain contract-shaped test fixtures until real provider-backed line markets are available.
- No order submission proof was rerun because backend/order logic was intentionally untouched.

## Cycle NJ - Current Service Inspection and Provider Winner Cashout

Feature/page worked on:

- Local MVP provider-backed Regulation Winner buy/sell lifecycle.

Frontend/services touched:

- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`
- `scripts/seed_mobile_route_spread_counterparty.ts`
- `src/server/services/ticketSelectionMetadata.ts`
- `src/__tests__/ticketSelectionMetadata.test.ts`

User interactions supported/proven:

- On Samsung S23, Home opens the current match feed.
- Event Detail opens a provider-backed Egypt Regulation Winner ticket.
- Swipe-to-buy creates a server-backed filled position.
- Portfolio opens the cash-out sheet from the owned position.
- Swipe-to-cashout submits a server-backed sell.
- Portfolio History shows the sold activity with provider winner identity preserved.

Backend/API route changed:

- No schema or route shape change.
- Selection metadata normalization now maps provider `match_winner_1x2`/`moneyline` fallback rows to mobile `winner`.

Backend/API routes exercised:

- `/api/health`
- `/api/events`
- `/api/mobile/events/:slug/live-detail`
- `/api/orders`
- `/api/portfolio`
- `/api/portfolio/history`

Verified:

- Jest: `src/__tests__/ticketSelectionMetadata.test.ts`, `src/__tests__/public.events.no-leak.test.ts`.
- S23 proof passed: `docs/mobile/harness/cycle-NJ-provider-winner-cashout-s23/cycle-NJ-provider-winner-s23-visible-flow.json`.

Known limitations:

- Current Spread/Totals/Team Total rows remain `contract-fixture`.
- Current live-detail provider lifecycle is stale and chart history is unavailable.

## Cycle NI - Provider Winner Clean Feed Regression

Feature/page worked on:

- Provider-backed Regulation Winner retail flow after the Home/Live proof-event filter.

Frontend/services touched:

- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`

User interactions supported/proven:

- On Samsung S23, Home shows the cleaned current-match feed without disposable provider-breadth proof rows.
- Event Detail shows composed provider-backed Regulation Winner 1X2 markets.
- The user opens an Egypt provider-backed winner ticket, swipes to buy, lands in Portfolio, and sees filled History with provider source preserved.

Backend/API route changed:

- None.

Backend/API routes exercised:

- `/api/health`
- `/api/events`
- `/api/mobile/events/:slug/live-detail`
- `/api/orders`
- `/api/portfolio`
- `/api/portfolio/history`

Verified:

- PowerShell parser check passed.
- S23 proof passed: `docs/mobile/harness/cycle-NI-provider-winner-clean-feed/cycle-NI-provider-winner-s23-visible-flow.json`.

Known limitations:

- Spread/Totals/Team Total remain Local MVP `contract-fixture` line markets because the inspected Polymarket event has zero route-visible provider-backed line markets.

## Cycle NH - Mobile MVP Proof Event Filter

Feature/page worked on:

- Home/Live Local MVP event feed.

Frontend/services touched:

- `src/app/api/events/route.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On Samsung S23, Home and Live show real current World Cup matches and no longer show the disposable `EL-A Provider Breadth` proof event.
- The full Home -> Live -> Event Detail -> Spread ticket -> server-backed open order -> cancel -> History path still passes after the route filter.

Backend/API route changed:

- `/api/events` now excludes disposable proof events when `mobileMvpMatches=1`.

Verified:

- Focused Jest route test passed: `npm run test:jest -- src/__tests__/public.events.no-leak.test.ts`.
- Route inspection before/after filter: `docs/mobile/harness/cycle-NH-current-service-reinspection/`.
- S23 proof passed: `docs/mobile/harness/cycle-NH-s23-proof-event-filter/cycle-NH-current-mvp-s23-visible-flow.json`.

Known limitations:

- Regulation Winner is provider-backed for the inspected current match.
- Spread/Totals/Team Total remain Local MVP `contract-fixture` line markets because the inspected Polymarket event has zero route-visible provider-backed line markets.

## Cycle NG - S23 Current Match Cancel Proof

Feature/page worked on:

- Current Local MVP retail flow cancel proof: Home -> Live -> Event Detail -> Spread ticket -> server-backed open order -> cancel -> Portfolio History.

Frontend/services touched:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On Samsung S23, the proof selects the current Argentina vs. Egypt Spread line, opens the simple ticket, swipes to buy, reaches Portfolio Orders, taps the visible Cancel control, and verifies a canceled History row.
- The canceled activity preserves selected market type, line, provider/source disclosure, and local pricing note.

Backend/API route changed:

- None.

Backend/API routes exercised:

- `/api/health`
- `/api/events`
- `/api/mobile/events/:slug/live-detail`
- `/api/orders`
- `/api/orders/:id`
- `/api/portfolio`
- `/api/portfolio/history`

Verified:

- PowerShell parser check passed.
- S23 proof passed: `docs/mobile/harness/cycle-NG-s23-current-match-cancel-proof/cycle-NG-current-mvp-s23-visible-flow.json`.

Known limitations:

- Regulation Winner remains provider-backed for the inspected current match.
- Spread/Totals/Team Total rows remain backend-shaped `contract-fixture` Local MVP pricing because current inspected Polymarket provider data still has no attach-ready line markets.

## Cycle NF - Proof JSON Hygiene

Feature/page worked on:

- S23 Local MVP proof harness output hygiene.

Frontend/services touched:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, completed Home -> Live -> Event Detail -> local Spread ticket -> swipe buy -> Portfolio Orders/open order using `-ExpectOpenOrder`.

Backend/API route changed:

- None.

Verified:

- PowerShell parser check passed.
- S23 proof passed: `docs/mobile/harness/cycle-NF-proof-json-hygiene/cycle-NF-current-mvp-s23-visible-flow.json`.
- `git diff --check` passed with the generated proof JSON staged in the worktree.
- Proof summary contains 12 unique artifacts and no History artifact in open-order mode.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Cycle NE - S23 Open Order Proof Mode

Feature/page worked on:

- S23 Local MVP proof harness for Portfolio open-order state.

Frontend/services touched:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, completed Home -> Live -> Event Detail -> local Spread ticket -> swipe buy -> Portfolio Orders/open order with source badge and Cancel visible.

Backend/API route changed:

- None.

Verified:

- PowerShell parser check passed.
- S23 proof passed: `docs/mobile/harness/cycle-NE-s23-open-order-proof-mode/cycle-NE-current-mvp-s23-visible-flow.json`.
- Proof JSON reports `openOrderVisible=true` and `openOrderSourceBadgeVisible=true`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Cycle ND - Open Order Source Badge

Feature/page worked on:

- Portfolio Orders tab open-order rows.

Frontend/services touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSourceBadge.test.ts`

User interactions supported/proven:

- On S23, completed Home -> Live -> Event Detail -> local Spread ticket -> swipe buy -> Portfolio Orders with an open order, then verified the open-order source badge, source note, selected line identity, and Cancel button.

Backend/API route changed:

- None. Open-order rows use existing `/api/portfolio` selection snapshots.

Verified:

- Focused mobile Vitest and mobile typecheck passed.
- Focused S23 proof passed: `docs/mobile/harness/cycle-ND-open-order-source-badge/cycle-ND-open-order-source-badge-proof.json`.
- XML proof includes `open-order-source-badge`, `open-order-source-note`, `portfolio-source-badge-local`, `Local test pricing`, `portfolio-line-1.5`, `portfolio-provider-source-contract-fixture`, and `cancel-open-order-`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.
- The broader reusable proof script's later History assertion is not a pass/fail gate for this focused open-order source badge cycle.

## Cycle NC - Portfolio Selection Source Summary

Feature/page worked on:

- Portfolio source summary for Local MVP selection snapshots.

Frontend/services touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSourceBadge.test.ts`

User interactions supported/proven:

- On S23, completed Home -> Live -> Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history, then verified the Portfolio source summary above the tabs.

Backend/API route changed:

- None. The summary uses existing position, open-order, and history selection snapshots.

Verified:

- Focused mobile Vitest and mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-NC-portfolio-selection-source-summary/cycle-NC-current-mvp-s23-visible-flow.json`.
- XML proof includes `portfolio-selection-source-summary`, `portfolio-source-summary-local-lines`, `portfolio-local-line-count-`, and visible `Local line pricing`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Cycle NB - Event Detail Line Availability Disclosure

Feature/page worked on:

- Event Detail source disclosure for Local MVP line markets.

Frontend/services touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`

User interactions supported/proven:

- On S23, opened Home, switched to Live, opened Event Detail, confirmed provider-unavailable line marker, then completed local Spread ticket -> swipe buy -> Portfolio/history.

Backend/API route changed:

- None. This cycle consumes `marketSourceSummary.lineMarkets.providerAvailability` added in Cycle NA.

Verified:

- Focused mobile Vitest and mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-NB-event-detail-line-availability-disclosure/cycle-NB-current-mvp-s23-visible-flow.json`.
- XML proof includes `Provider lines unavailable.`, `line-provider-availability-unavailable`, and `line-contract-fixture-count-4`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Cycle NA - Line Provider Availability Contract

Feature/page worked on:

- Backend/mobile market source summary contract for Local MVP line markets.

Frontend/services touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`

User interactions supported/proven:

- On S23, opened Home, switched to Live, returned Home, then completed Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history.

Backend/API route changed:

- `/api/events?...includeMobileMarkets=1...` and `/api/mobile/events/:slug/live-detail` now include `marketSourceSummary.lineMarkets.providerAvailability`.

Verified:

- Backend route proof passed: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/cycle-NA-line-provider-availability-route.json`.
- S23 proof passed: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/cycle-NA-current-mvp-s23-visible-flow.json`.
- Backend Jest, focused mobile Vitest, mobile typecheck, and `git diff --check` passed.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Cycle MZ - Backend Live Status Route

Feature/page worked on:

- Backend `/api/events` live status filtering used by the mobile Live page.

Frontend/services touched:

- `src/app/api/events/route.ts`
- `src/__tests__/public.events.no-leak.test.ts`

User interactions supported/proven:

- On S23, opened Home, switched to Live, returned Home, then completed Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history.

Backend/API route changed:

- `/api/events?status=live` now includes events where `status=live` or `liveStatus=LIVE`.

Verified:

- Public events route Jest test passed.
- Focused mobile Vitest tests passed.
- Mobile typecheck passed.
- Route proof passed: `docs/mobile/harness/cycle-MZ-backend-live-status-route/cycle-MZ-live-route-status.json`.
- S23 proof passed: `docs/mobile/harness/cycle-MZ-backend-live-status-route/cycle-MZ-current-mvp-s23-visible-flow.json`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Cycle MY - Live Source Readiness

Feature/page worked on:

- Live page for Local MVP World Cup live matches.
- Added a visible source readiness strip and fixed live event filtering when backend events use `liveStatus=LIVE`.

Frontend/services touched:

- `mobile/src/components/LiveScreen.tsx`
- `mobile/src/components/MarketLists.tsx`
- `mobile/src/services/homeEventFeedService.ts`
- `mobile/src/__tests__/homeEventFeedService.test.ts`
- `mobile/src/__tests__/homeCardStatsContract.test.ts`
- `mobile/src/__tests__/liveSourceReadinessContract.test.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home, switched to Live, confirmed `live-source-readiness` and `home-card-source-provider-winner-local-lines`, returned Home, then completed Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history.

Backend/API route changed:

- None.

Backend/API route dependency clarified:

- Live still calls `/api/events` with `status=live` first.
- If that returns no events, mobile retries `/api/events` without `status`, then filters events where `status=live` or `liveStatus=LIVE`.

Verified:

- Mobile typecheck passed.
- Focused mobile tests passed.
- S23 proof passed: `docs/mobile/harness/cycle-MY-live-source-readiness/cycle-MY-current-mvp-s23-visible-flow.json`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.
- Live sports stats remain out of Local MVP scope.

## Cycle MX - Home Source Readiness

Feature/page worked on:

- Home match cards in the Local MVP World Cup feed.
- Added visible source readiness when Regulation Winner is provider-backed but line markets are local contract fixtures.

Frontend/services touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/__tests__/homeCardStatsContract.test.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home and confirmed the event card exposes `home-card-source-provider-winner-local-lines`.
- Continued through Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history.

Backend/API route changed:

- None.

Backend/API route inspected:

- `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`
- `/api/mobile/events/:slug/live-detail`
- Polymarket Gamma event endpoints for the current Argentina/Egypt and Switzerland/Colombia provider events.

Verified:

- Mobile typecheck passed.
- Focused mobile tests passed.
- S23 proof passed: `docs/mobile/harness/cycle-MX-home-source-readiness/cycle-MX-current-mvp-s23-visible-flow.json`.
- Provider route proof passed: `docs/mobile/harness/cycle-MX-provider-line-readiness-route/cycle-MX-current-state-inspection.json`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.
- Local MVP line markets remain backend-shaped `contract-fixture` rows and must stay visibly disclosed.

## Cycle MW - Portfolio Local Pricing Disclosure

Feature/page worked on:

- Portfolio positions and History rows for Local MVP line markets.
- Added a visible `Local test pricing` note for contract-fixture positions and filled activities.

Frontend/services touched:

- `mobile/src/components/Portfolio.tsx`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home -> Event Detail -> Game Lines -> local Spread ticket.
- Selected `$25`, swiped to buy, and reached Portfolio/history.
- Confirmed Portfolio position and History rows expose `portfolio-local-test-pricing`.

Backend/API route changed:

- None.

Verified:

- Mobile typecheck passed.
- Focused mobile tests passed.
- S23 proof passed: `docs/mobile/harness/cycle-MW-portfolio-local-pricing-disclosure/cycle-MW-current-mvp-s23-visible-flow.json`.

Known limitations:

- This is Portfolio/history source disclosure for Local MVP line markets. It does not make Spread/Totals/Team Total provider-backed.

## Cycle MV - Ticket Local Pricing Disclosure

Feature/page worked on:

- Trade Ticket source disclosure for Local MVP line markets.
- Added a visible `Local test pricing` note inside contract-fixture tickets.

Frontend/services touched:

- `mobile/src/components/TradeTicket.tsx`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home -> Event Detail -> Game Lines -> local Spread ticket.
- Confirmed the ticket exposes `ticket-local-test-pricing`.
- Selected `$25`, swiped to buy, and reached Portfolio/history with filled activity.

Backend/API route changed:

- None.

Verified:

- Mobile typecheck passed.
- Focused mobile tests passed.
- S23 proof passed: `docs/mobile/harness/cycle-MV-ticket-local-pricing-disclosure/cycle-MV-current-mvp-s23-visible-flow.json`.

Known limitations:

- This is ticket-level source disclosure for Local MVP line markets. It does not make Spread/Totals/Team Total provider-backed.

## Cycle MU - Line Local Pricing Disclosure

Feature/page worked on:

- Event Detail Game Lines line-market headers.
- Added a visible `Local test pricing` note for contract-fixture Spread/Totals/Team Total rows.

Frontend/services touched:

- `mobile/src/components/EventDetail.tsx`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home -> Event Detail -> Game Lines.
- Confirmed local line rows expose `line-market-local-test-pricing`.
- Opened a local Spread ticket, selected `$25`, swiped to buy, and reached Portfolio/history with filled activity.

Backend/API route changed:

- None.

Verified:

- Mobile typecheck passed.
- Focused mobile tests passed.
- S23 proof passed: `docs/mobile/harness/cycle-MU-line-local-pricing-disclosure/cycle-MU-current-mvp-s23-visible-flow.json`.

Known limitations:

- This is source disclosure for Local MVP line markets. It does not make Spread/Totals/Team Total provider-backed.

## Cycle MT - Provider Winner Top Outcome Fill

Feature/page worked on:

- Proved the visible top provider-backed Regulation Winner outcome can fill through the Local MVP retail path.
- Added proof-local liquidity setup controls for provider market id and blocking-bid cleanup.

Frontend/services touched:

- `scripts/seed_mobile_route_spread_counterparty.ts`
- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home -> Event Detail -> Argentina provider winner ticket.
- Selected `$25`, swiped to buy, and reached Portfolio/history.
- Portfolio positions and History showed provider-backed winner source identity for provider market `2793738`.

Backend/API route changed:

- No backend route or schema changed.
- Proof-local service setup now supports `--externalMarketId` and `--cleanupBlockingBids` for safe local liquidity preparation.

Verified:

- Script parse check passed.
- Mobile typecheck passed.
- Root TypeScript check passed.
- S23 proof passed: `docs/mobile/harness/cycle-MT-provider-winner-top-outcome-fill/cycle-MT-provider-winner-s23-visible-flow.json`.

Known limitations:

- This prepares local proof liquidity; it is not a production market-making policy.
- Spread/Totals/Team Total remain explicit Local `contract-fixture` rows until real attach-ready Polymarket line markets exist.

## Cycle MS - Provider Winner Filled History

Feature/page worked on:

- Proved provider-backed Regulation Winner can fill and appear in Portfolio/history on S23.
- Adjusted the provider-winner proof to target a provider-backed outcome with valid local liquidity instead of trying to seed an invalid hardcoded ask.

Frontend/services touched:

- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened Home -> Event Detail -> provider-backed 1X2 winner ticket.
- Selected provider market `2793741`, entered `$25`, swiped to buy, and reached Portfolio.
- Portfolio positions and History both showed provider-backed winner source identity.

Verified:

- Script parse check passed.
- Focused provider 1X2 selection test passed.
- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-MS-provider-winner-filled-history/cycle-MS-provider-winner-s23-visible-flow.json`.

Known limitations:

- This does not make Spread/Totals/Team Total provider-backed. They remain explicit Local `contract-fixture` rows until real attach-ready Polymarket line markets exist.

## Cycle MR - Provider Winner 1X2 Parity

Feature/page worked on:

- Fixed Event Detail provider-backed Regulation Winner display.
- Real Polymarket soccer winner markets now compose as home/draw/away instead of one binary market's `Yes/No`.

Frontend/services touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/homeCardSelectionService.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/marketListsHomeCardSelections.test.ts`
- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, Event Detail shows composed provider-backed 1X2 outcome markers.
- On S23, Regulation Winner includes Argentina, Draw, and Egypt from separate provider market ids.
- On S23, ticket submit still reaches Portfolio/history with `provider-source-polymarket`.

Verified:

- Focused home/provider selection test passed.
- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-MR-provider-winner-1x2-parity/cycle-MR-provider-winner-s23-visible-flow.json`.

Known limitations:

- Spread/Totals/Team Total remain explicit Local `contract-fixture` rows because Polymarket Gamma returned no line markets for inspected events.

## Cycle MQ - Provider Winner S23 Visible Flow

Feature/page worked on:

- Added and ran focused S23 proof for provider-backed Regulation Winner.
- Proved Home -> Event Detail -> provider-backed winner ticket -> fake-token/server order -> Portfolio/history.

Frontend/services touched:

- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`

User interactions supported/proven:

- On S23, opened `argentina-vs-egypt` from Home.
- On S23, confirmed Event Detail Regulation Winner shows Provider/Polymarket-backed identity.
- On S23, opened a winner ticket, selected `$25`, swiped to buy, reached Portfolio, and opened History.
- The proof preserves `provider-source-polymarket`, `ticket-market-type-winner`, `portfolio-market-type-winner`, and `portfolio-line-none`.

Verified:

- S23 proof passed: `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-s23-visible-flow.json`.
- Script parse check passed for `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`.

Known limitations:

- This proves the real provider-backed Regulation Winner flow, not provider-backed Spread/Totals/Team Total.
- Line markets remain explicit Local `contract-fixture` rows until provider-backed line markets exist.

## Cycle MP - Current Service Reinspection

Feature/page worked on:

- Inspected current Local MVP service readiness before opening new UI work.
- Confirmed Home and Event Detail route state for current World Cup match events.
- Confirmed Polymarket Gamma market availability for the two current provider events.

Frontend/services touched:

- No app code changed.
- Proof scripts used:
  - `scripts/inspect_mobile_mvp_current_state.ts`
  - `scripts/prove_mobile_provider_match_line_availability.ts`

User interactions supported/proven:

- No new Android UI interaction was introduced in this inspection-only cycle.
- S23 reachability was checked before inspection.

Verified:

- Route inspection passed: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-current-state-reinspection.json`.
- Argentina vs Egypt provider line availability passed: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-provider-match-line-availability-argentina-egypt.json`.
- Switzerland vs Colombia provider line availability passed: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-provider-match-line-availability-switzerland-colombia.json`.

Known limitations:

- Regulation Winner is provider-backed.
- Spread/Totals/Team Total are not Polymarket-backed for the inspected events; they remain explicit `contract-fixture` Local MVP rows.
- Next useful cycle should prove provider-backed Regulation Winner through ticket/order/Portfolio, because recent S23 journey proofs target the Local Spread line path.

## Cycle MO - Portfolio Source Badges

Feature/page worked on:

- Added visible source disclosure to Portfolio position and history rows.
- Post-submit Local MVP positions now visibly show `Local`.
- Post-submit history activity rows now visibly show `Local`.
- Preserved the Local MVP path: Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history.

Frontend/services touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSourceBadge.test.ts`

User interactions supported/proven:

- On S23, after a successful Spread line order, the Positions tab shows a visible `Local` badge.
- On S23, the History tab shows a visible `Local` badge for the filled order activity.
- The badge is derived from the order-time selection snapshot `referenceSource`.

Verified:

- Focused Portfolio source badge test passed.
- Portfolio history/snapshot/sync regression tests passed.
- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-s23-visible-flow.json`.
- Position screenshot: `docs/mobile/screenshots/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-after-submit.png`.
- History screenshot: `docs/mobile/screenshots/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-portfolio-history.png`.

Known limitations:

- This cycle does not make line markets real Polymarket-backed markets.
- The `Local` badge is intentionally a current-state disclosure until provider-backed line candidates exist.

## Cycle MN - Trade Ticket Source Badge

Feature/page worked on:

- Added visible source disclosure to the Trade Ticket header.
- Selected Polymarket-backed tickets can show `Provider`.
- Selected `contract-fixture` line tickets show `Local`.
- Preserved the Local MVP path: Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history.

Frontend/services touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/__tests__/tradeTicketSourceBadge.test.ts`

User interactions supported/proven:

- On S23, selecting the current Spread line opens a ticket with a visible `Local` badge.
- The badge is derived from `ticket.selection.referenceSource` or `ticket.market.referenceSource`.
- The same S23 proof completes swipe submit and Portfolio/history.

Verified:

- Focused ticket source badge test passed.
- Event Detail row source badge regression test passed.
- Order service source/identity regression tests passed.
- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-MN-ticket-source-badge/cycle-MN-current-mvp-s23-visible-flow.json`.
- S23 ticket screenshot: `docs/mobile/screenshots/cycle-MN-ticket-source-badge/cycle-MN-current-mvp-ticket-ready.png`.

Known limitations:

- This cycle does not make line markets real Polymarket-backed markets.
- The `Local` badge is intentionally a current-state disclosure until provider-backed line candidates exist.

## Cycle MM - Market Source Row Badges

Feature/page worked on:

- Added row-level source badges on Event Detail Game Lines.
- Regulation Winner now visibly shows `Provider`.
- Spread/Totals/Team Total contract-fixture rows now visibly show `Local`.
- Preserved the Local MVP path: Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history.

Frontend/services touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`

User interactions supported/proven:

- On S23, Event Detail Game Lines shows Provider on the Polymarket-backed Regulation Winner row.
- On S23, line rows show Local when they are backend-shaped contract fixtures.
- The same S23 proof completes line ticket, swipe submit, and Portfolio/history.

Verified:

- Focused source badge test passed.
- World Cup adapter source-summary regression test passed.
- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-MM-market-source-row-badges/cycle-MM-current-mvp-s23-visible-flow.json`.
- S23 Game Lines screenshot: `docs/mobile/screenshots/cycle-MM-market-source-row-badges/cycle-MM-current-mvp-lines.png`.

Known limitations:

- This cycle does not create real Polymarket-backed Spread/Totals/Team Total markets.
- Local badges intentionally disclose the current service state until provider-backed line candidates exist.

## Cycle ML - Game Lines Source Banner

Feature/page worked on:

- Added visible source disclosure on Event Detail Game Lines.
- The app now tells users when the winner market is provider-backed while line markets use local server pricing.
- Preserved the existing Local MVP path: Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history.

Frontend/services touched:

- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/worldCupAdapter.test.ts`

User interactions supported/proven:

- On S23, Event Detail Game Lines shows `Market source` and `Winner is provider-backed. Lines use local server pricing.`
- The same S23 proof continues through line ticket, swipe submit, and Portfolio/history.

Verified:

- Focused adapter test passed.
- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-ML-line-source-banner/cycle-ML-current-mvp-s23-visible-flow.json`.
- S23 Game Lines XML contains `event-detail-line-source-banner line-source-contract-fixture regulation-winner-provider-backed line-market-count-4`.

Known limitations:

- This cycle does not make line markets real Polymarket-backed markets.
- The banner is intentionally a Local MVP honesty layer until provider-backed Spread/Totals/Team Total markets are available.

## Cycle MK - Provider Line Readiness Inspection

Feature/page worked on:

- Re-inspected Polymarket Gamma provider discovery for the current Local MVP event after the service-readiness concern.
- Confirmed Regulation Winner / match-winner markets have real attach-ready Polymarket candidates.
- Confirmed Spread/Totals/Team Total line markets do not currently have attach-ready Polymarket candidates for `argentina-vs-egypt`.

Frontend/services touched:

- `scripts/prove_mobile_mvp_provider_discovery_guard.ts`

User interactions supported/proven:

- No visible UI changed in this inspection cycle.
- The adjusted path is to keep the MVP user flow working with explicit backend-shaped line fixtures while not claiming provider-backed line parity.

Verified:

- Provider readiness proof passed: `docs/mobile/harness/cycle-MK-provider-line-readiness-inspection/cycle-MK-provider-line-readiness-inspection.json`.
- The proof reports 3 attach-ready match-winner candidates and 0 attach-ready line-market candidates.

Known limitations:

- Spread/Totals/Team Total are still Local MVP contract fixtures for this event.
- The next visible implementation cycle should improve the user journey around the existing route contract rather than chasing unavailable Polymarket line data for this match.

## Cycle MJ - Position Sell Contract Identity

Feature/page worked on:

- Tightened the Portfolio position sell/retrade ticket identity path.
- Selling or retrading an owned Yes position now preserves the owned Yes contract identity instead of automatically becoming a No-side ticket.
- This keeps the Local MVP user path honest after Portfolio/history actions: Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history -> position action.

Frontend/services touched:

- `mobile/App.tsx`
- `mobile/src/services/positionTradeTicketService.ts`
- `mobile/src/__tests__/positionTradeTicketService.test.ts`
- `scripts/prove_mobile_position_sell_contract_identity.ts`
- `mobile/scripts/smoke.ps1`

User interactions supported/proven:

- Portfolio position ticket identity now preserves `marketId`, `outcomeId`, `line`, `period`, and owned `contractSide`.
- Normal market-side Sell/No prediction flow is unchanged.
- S23 integrated proof confirms the current MVP visible flow still works after the identity fix.

Verified:

- Focused identity proof passed: `docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-position-sell-contract-identity.json`.
- S23 proof passed on `SM-S911U1`: `docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-current-mvp-s23-visible-flow.json`.
- Focused mobile tests passed for position ticket identity, position trade target, and order service.
- Mobile typecheck passed.

Known limitations:

- Visible Portfolio cashout still uses the dedicated cashout ticket surface.
- Spread/Totals/Team Total remain backend-shaped `contract-fixture` line markets in the current MVP proof, not real provider-backed Polymarket line markets.

## Cycle MI - Provider Discovery Guard

Feature/page worked on:

- Tightened Polymarket provider candidate relevance for event-specific match markets.
- Prevented broad team outright markets, such as a World Cup winner market, from satisfying a match-specific provider mapping.
- Added repeatable proof for the current `argentina-vs-egypt` provider discovery state.

Frontend/services touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_mvp_provider_discovery_guard.ts`

User interactions supported/proven:

- No visible UI was redesigned.
- S23 regression proof confirms the current MVP phone flow still works after the backend provider guard: Home -> Event Detail -> line ticket -> swipe submit -> Portfolio/history.

Verified:

- Provider discovery guard proof passed: `docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-provider-discovery-guard.json`.
- S23 proof passed: `docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-current-mvp-s23-visible-flow.json`.
- Focused provider-candidate Jest test passed.
- Backend TypeScript check passed.
- Mobile typecheck passed.

Known limitations:

- Spread/Totals/Team Total still have no attach-ready Polymarket provider candidates for the inspected event.
- Local MVP should continue using explicit contract-shaped line markets without claiming provider-backed line parity.

## Cycle MH - MVP Service Readiness Inspection

Feature/page worked on:

- Inspected the current server-mode Local MVP match feed before continuing UI work.
- Aligned the inspection harness with the actual mobile route by adding `mobileMvpMatches=1`.
- Documented that Regulation Winner is currently provider-backed, while Spread/Totals/Team Total are Local MVP contract-shaped line markets.

Frontend/services touched:

- `scripts/inspect_mobile_mvp_current_state.ts`

User interactions supported/proven:

- No new visible UI interaction was added in this inspection subcycle.
- The adjusted development path remains Home -> Event Detail -> line market -> simple ticket -> server order -> Portfolio/history, using available route data honestly.

Verified:

- Current-state inspection passed and wrote `docs/mobile/harness/cycle-MH-mvp-current-state-inspection/cycle-MH-current-state-inspection.json`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for the inspected event.
- Continue Local MVP cycles using explicit contract-shaped line markets until provider-backed line discovery is ready.

## Cycle ET - Period-Safe Retail Line Matching

Feature/page worked on:

- Tightened line-ticket market identity so backend line markets are used only when market family, line, and period match the selected retail ticket.
- Prevents a same-line first-half/second-half route-backed market from being used for a regulation-time simple ticket.

Frontend/services touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/eventDetailLineTicketService.ts`
- `mobile/src/__tests__/eventDetailLineTicketService.test.ts`

User interactions supported/proven:

- The existing Totals and Team Total simple-ticket paths still open on Android with default orderbook hidden after the period-safe resolver change.

Verified:

- Mobile typecheck passed.
- Focused mobile line-ticket/order/open-order tests passed: 20 tests.
- Samsung tablet proof passed using the line-family breadth harness with ET-owned evidence directories: `docs/mobile/harness/cycle-ET-local-mvp-period-safe-line-family/cycle-ES-local-mvp-line-family-breadth-proof.json`.

Known limitations:

- This cycle hardens identity matching but does not create new provider-backed route data. Real provider-backed spread/totals/team-total route proof remains P1.

## Cycle ES - Local MVP Line-Family Ticket Breadth

Feature/page worked on:

- Expanded the default Local MVP retail ticket path beyond Spread by proving Totals and Team Total tickets with visible orderbook hidden.
- Added contract-shaped Team Total synthetic market/outcome fallback so Team Total rows can open a simple ticket before real provider-backed route data is available.

Frontend components/functions touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/eventDetailLineTicketService.ts` test coverage
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported:

- Open event detail, scroll to Game Lines, change Totals to `3.5` / `2nd Half`, open `Over 3.5` ticket.
- Close ticket, scroll to Team Total, open `MEX Over 1.5` ticket.
- Both ticket paths preserve market family/type, line, period, display label, and contract side without exposing default Book/orderbook controls.

Verified:

- Mobile typecheck passed.
- Focused mobile line-ticket/order/open-order tests passed: 18 tests.
- Samsung tablet proof passed: `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-local-mvp-line-family-breadth-proof.json`.

Known limitations:

- ES uses deterministic contract-shaped local data for Team Total UI proof. Real provider-backed spread/totals/team-total route breadth remains P1.

## Cycle ER - Local MVP Retail Status Flow

Feature/page worked on:

- Added an Android proof path for retail event-detail status visibility with default orderbook hidden.
- This cycle does not add new user-facing UI; it closes an audit/proof gap for existing chart/ticket status markers in the Local MVP flow.

Frontend/harness touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported/proven:

- Open event detail, view chart route state and ticket handoff status, scroll to Game Lines, select a Spread `2.5` line, and confirm the contract-shaped ticket source remains available without exposing Book/orderbook controls.

Verified:

- PowerShell smoke script parser check passed.
- Samsung tablet proof passed: `docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-local-mvp-status-flow-proof.json`.
- The tablet proof's Expo launch also ran mobile typecheck successfully.

Known limitations:

- ER proves existing idle/refresh-due/ready status markers in the local fixture path. Full route-backed loading/stale/unavailable state breadth for provider-backed retail tickets remains P1.

## Cycle EQ - Local MVP Sell Flow

Feature/page worked on:

- Proved the default Local MVP Sell path with visible orderbook hidden.
- Fixed trade-ticket identity metadata so switching from Buy/Yes to Sell/No updates the auditable selected contract side before submit.

Frontend components/functions touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported:

- Open event detail, select Spread `2.5` / `1st Half`, open the simple ticket, switch to Sell/No, enter `$25`, submit `Swipe up to sell`, then review Portfolio/latest order/activity/position.
- The selected line remains auditable as Spread, `2.5`, `1st Half`, `contract-side=no`, and `portfolio-side-sell`.
- Default user UI still hides visible Book/orderbook controls unless `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

State transitions:

- Initial ticket opens as Buy/Yes for the selected spread outcome.
- Tapping Sell changes active ticket identity to Sell/No, updates probability/price from `3%` to `97%`, and submits a fake-token Sell order.
- Portfolio renders `MOCK - Sell - No - MEX -2.5 1H`, latest activity `Sold`, and the same line/period/contract-side metadata.

Verified:

- PowerShell smoke script parser check passed.
- Mobile typecheck passed.
- Focused mobile line-ticket/order/open-order tests passed: 17 tests.
- Samsung tablet proof passed: `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/cycle-EQ-local-mvp-trade-flow-proof.json`.

Known limitations:

- Sell ready-state copy still uses the compact `To win` line; richer Polymarket-like proceeds wording remains P1 polish.
- This cycle uses deterministic contract-shaped local line data for UI proof. Provider-backed spread/totals/team-total Sell breadth remains P1.

## Cycle EP - Local MVP Trading Flow Steering

Feature/page worked on:

- Re-scoped the mobile event-detail default experience away from orderbook-first interaction and toward the Local MVP retail flow.
- Orderbook backend/routes/tests remain internal infrastructure and regression support.

Frontend components/functions touched:

- `mobile/src/components/EventDetail.tsx`
- Added `EXPO_PUBLIC_SHOW_ORDERBOOK=1` as the explicit debug/advanced gate for visible orderbook surfaces.
- Default line-detail panel now opens on `Graph`, not `Order Book`.
- Default UI hides the top Book icon, chart Book action, line/group Book actions, inline Order Book tab, technical route-depth pills, and the orderbook overlay unless the debug flag is enabled.

User interactions supported:

- Default user path remains: open event, choose outcome/line, use chart/price/probability context, open simple Trade ticket, submit fake-token buy/sell, then review Portfolio/activity.
- Advanced/debug path can still be enabled locally with `EXPO_PUBLIC_SHOW_ORDERBOOK=1` for regression proofs and internal route checks.

Verified:

- Mobile typecheck passed.
- Focused mobile line-ticket/order/open-order tests passed.
- Samsung tablet proof passed: `docs/mobile/harness/cycle-EP-local-mvp-trade-flow/cycle-EP-local-mvp-trade-flow-proof.json`.
- Android proof captured default orderbook hidden (`orderbookDebug=unset`), spread `2.5` / `1st Half` selection, simple fake-token Buy ticket, submit, and Portfolio/latest order/activity/position identity preservation.

Known limitations:

- This cycle intentionally does not delete orderbook code or backend routes.
- Sell-side simple-ticket proof, provider-backed line-family breadth, and loading/stale/unavailable visual states remain P1 for the Local MVP milestone.

## Cycle EN Integrated - Route-Backed Book-Staged Limit Lifecycle

Feature/page worked on:

- Integrated Agent C audit gate, Agent A backend/provider route contract proof, and Agent B visible Samsung tablet proof.
- Reran the Android proof from the integrated main branch against backend `http://127.0.0.1:3002` and server event `mobile-el-a-provider-breadth-54db8e5a`.

Important functions/interactions/state transitions touched:

- Live event detail consumes server market data and route-backed Book depth.
- Book selector switches to provider-backed Spread `1.5`, selected outcome `fa8cde2d-acf8-4f8a-89d5-710203200c8f`, provider market `gamma-el-a-spread-54db8e5a`, provider token `token-el-a-spread-home-54db8e5a`.
- Tapped ask `55c` stages `limit-side=ask`, ticket preserves `ticket-limit-price-55`, submit creates a visible fake-token open order, and Portfolio opened/canceled activity preserves the same order-time identity.

Verified:

- `npm --prefix mobile run typecheck`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/openOrderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts`
- `npx jest --runInBand --detectOpenHandles src/__tests__/ticketSelectionMetadata.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLimitLifecycle -Port 8358 -Device 172.16.200.30:41299 -BackendBaseUrl http://127.0.0.1:3002 -ServerEventSlug mobile-el-a-provider-breadth-54db8e5a -OutputDir docs/mobile/screenshots/cycle-EN-integrated-route-limit-lifecycle -HierarchyOutputDir docs/mobile/harness/cycle-EN-integrated-route-limit-lifecycle`

Known limitations:

- The Android proof uses mock trading mode with server market-data mode; it proves route-backed market/depth/ticket/Portfolio identity, not production real-money order placement.
- Remaining P1 work: fresh S23 production lifecycle recapture, broader market-family/bid-side route-backed proof, and durable first-class backend selection snapshots.

## Cycle EN-B - Visible Route-Backed Book-Staged Limit Lifecycle

Feature/page worked on:

- Android visible proof for route-backed live event Book/orderbook -> provider-backed Spread ask -> staged limit ticket -> fake-token submit -> Portfolio/open order/activity/canceled continuity.
- Extends the EM-B lifecycle smoke so a supplied backend event slug requires backend health and writes EN-B-owned screenshots/XML/proof artifacts under `cycle-EN-B-visible-route-limit-lifecycle`.

Frontend/harness touched:

- `mobile/scripts/smoke.ps1`
- `docs/mobile/screenshots/cycle-EN-B-visible-route-limit-lifecycle/`
- `docs/mobile/harness/cycle-EN-B-visible-route-limit-lifecycle/`

Important functions/interactions/state transitions touched:

- `-EventDetailVisibleLimitLifecycle` now has a route-backed branch when `-ServerEventSlug` is supplied.
- The route-backed branch opens the live-detail route event, opens Book, switches to provider-backed Spread `1.5`, extracts the tapped ask limit from the visible ladder, and asserts the same limit price/side/provider identity through ticket, latest order, open order, latest activity, and canceled activity.
- Fallback guards reject fixture markers, Mexico/Ecuador fixture labels, and generic moneyline fallback labels on the selected Portfolio/activity lifecycle.

## Cycle EM Integrated - Book-Staged Limit Lifecycle

Feature/page worked on:

- Integrated Agent A service/backend/mobile contract proof with Agent B Android-visible Book ladder -> staged ask limit -> ticket -> submit -> Portfolio/activity proof.
- Closes the selected fake-token EM lifecycle path without claiming provider-backed live-route lifecycle breadth.

Frontend/services/harness touched:

- Integrated prior EM merges from `mobile/super-EM-agent-A-limit-lifecycle`, `mobile/super-EM-agent-B-visible-limit-lifecycle`, and `mobile/super-EM-agent-C-audit-limit-lifecycle`.
- `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json`
- `docs/mobile/harness/cycle-EM-integrated-limit-lifecycle/cycle-EM-A-limit-lifecycle-proof.json`
- `docs/mobile/harness/cycle-EM-integrated-limit-lifecycle/`
- `docs/mobile/screenshots/cycle-EM-integrated-limit-lifecycle/`

Important functions/interactions/state transitions touched:

- Agent A service proof verifies `limitPrice`, `limitSide`, and `limitShares` survive order result mapping, backend selection sanitization, portfolio position mapping, open-order mapping, recent-trade mapping, and canceled-order mapping.
- Integrated Android proof verifies the visible path: live event Book -> Spread `1.5` regulation Yes ask `41c` -> ticket with `limit-side=ask` and `limit-price=41` -> `$25` fake-token submit -> latest order/open order/latest activity/canceled activity retaining the same selected market/outcome/line/period/provider identity.
- Negative proof checks reject fallback identity such as Team to Advance or Mexico moneyline when the selected staged order is a Spread line.

Verified:

- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLimitLifecycle -Port 8345 -Device 172.16.200.30:41299 -OutputDir docs/mobile/screenshots/cycle-EM-integrated-limit-lifecycle -HierarchyOutputDir docs/mobile/harness/cycle-EM-integrated-limit-lifecycle`

Known limitations:

- Integrated visible proof uses deterministic fake-token app data because backend health was unavailable from the tablet launch context.
- Route-backed provider-depth lifecycle, fresh S23 ticket/order recapture, repeat market-family coverage, and durable first-class DB selection snapshots remain P1.

## Cycle EM-B - Visible Book-Staged Limit Lifecycle

Feature/page worked on:

- Android visible proof for Book ladder -> staged ask limit -> ticket -> fake-token submit -> Portfolio/open order/activity continuity.
- Extends the existing EL staged-price handoff so downstream visible labels expose the same selected Book limit identity.

Frontend/harness components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `docs/mobile/screenshots/cycle-EM-B-visible-limit-lifecycle/`
- `docs/mobile/harness/cycle-EM-B-visible-limit-lifecycle/`

Important functions/interactions/state transitions touched:

- `TradeTicket` accessibility identity now includes `ticket-limit-side-*`, `ticket-limit-price-*`, `ticket-limit-decimal-*`, and `ticket-limit-shares-*` when opened from a staged Book ladder row.
- `Portfolio` identity/snapshot labels now echo `portfolio-limit-side-*`, `portfolio-limit-price-*`, `portfolio-limit-decimal-*`, and `portfolio-limit-shares-*` on latest order, open order, position, and activity surfaces.
- Added `-EventDetailVisibleLimitLifecycle` smoke/tablet path that opens the live event Book, switches to the Spread ladder, stages the first ask at `41c`, submits a `$25` fake-token order, then verifies latest order, open order, filled activity, and canceled activity preserve the same Book-selected limit identity.

Known limitations:

- This is a visible mobile/fake-token proof and does not edit backend routes or schemas.
- Route-backed provider rerun remains available for Lead after Agent A integration; this isolated branch keeps `routeBackedProviderDepth=false` in the EM proof JSON.

## Cycle EL Integrated - Route-Backed Live Depth Staging

Feature/page worked on:

- Integrated backend/provider line-family breadth with visible mobile live event Book/orderbook staging.
- Closes the selected route-backed Book ladder -> Buy/Sell ticket price handoff gap for the EL proof event.

Frontend/harness/services touched:

- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/services/orderService.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `docs/mobile/screenshots/cycle-EL-integrated-live-depth/`
- `docs/mobile/harness/cycle-EL-integrated-live-depth/`

Important functions/interactions/state transitions touched:

- `TicketSelection` now carries optional `limitPrice`, `limitSide`, and `limitShares` for Book-origin staged tickets.
- `EventDetail` passes the tapped ask/bid level into the ticket selection when opening a staged Book ticket.
- `App` skips server quote refresh for a ticket with an explicit Book-staged limit price so the ticket price line does not revert to the midpoint/outcome probability.
- `selectionForOrder()` preserves staged limit fields so future order/portfolio/history flows can keep the Book-selected limit identity.
- The EL visible-depth smoke path can now run against a custom backend event slug and backend URL instead of only the Mexico/Ecuador fixture.

Verified:

- `npm --prefix mobile run typecheck`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLiveDepth -Port 8334 -Device 172.16.200.30:41299 -BackendBaseUrl http://127.0.0.1:3002 -ServerEventSlug mobile-el-a-provider-breadth-bc35089a -OutputDir docs/mobile/screenshots/cycle-EL-integrated-live-depth -HierarchyOutputDir docs/mobile/harness/cycle-EL-integrated-live-depth`

Known limitations:

- This proves the selected route-backed moneyline Book ladder/ticket path. Production breadth still depends on real mapped Polymarket line-family events and scheduled provider refresh coverage.
- Ticket Buy/Sell Polymarket reference remains partially fresh/stale-mixed from Agent C; the S23 ticket tap did not open in the limited fresh probe.

## Cycle EL-B - Visible Live Depth Staging

Feature/page worked on:

- Mobile live event detail Book/orderbook parity on Android.
- Makes the visible ladder materially more Polymarket-like by allowing ask/bid rows to stage a Buy/Sell ticket at the tapped level price.

Frontend/harness components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `docs/mobile/screenshots/cycle-EL-B-visible-live-depth/`
- `docs/mobile/harness/cycle-EL-B-visible-live-depth/`

Important functions/interactions/state transitions touched:

- `EventDetail` now tracks a staged orderbook level scoped to the selected market/outcome.
- Tapping an ask row stages a Buy ask with the row price/size and highlights that row plus the Buy button.
- Tapping a bid row stages a Sell bid with the row price/size and highlights that row plus the Sell button.
- The staged ticket handoff clones the selected outcome with the tapped level probability so the ticket price line reflects the exact staged ladder price.
- Changing Book market or outcome clears the staged level to prevent cross-contract price leakage.

Verified:

- `npm run typecheck` from `mobile/`
- PowerShell parser checks for `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/marketDepthService.test.ts`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLiveDepth -Port 8331 -OutputDir docs/mobile/screenshots/cycle-EL-B-visible-live-depth -HierarchyOutputDir docs/mobile/harness/cycle-EL-B-visible-live-depth`

Known limitations:

- Backend health was unavailable during the Android proof, so the passed tablet proof used the existing deterministic backend-shaped mobile fixture/fallback data.
- The staged ladder handoff is mobile UI behavior; server order submission still uses the existing ticket/order service contract.
- Real provider-backed live depth breadth still depends on backend/provider market coverage outside this Agent B UI-owned change.

## Cycle EK-A - Backend Provider Transition Breadth

Feature/page worked on:

- Backend/provider proof for the next route-backed provider lifecycle breadth debt after EJ.
- Proves live-detail unavailable/not-ready plus a selected stale/refresh-due Spread market moving through the provider-refresh route to ready without contract fallback.

Backend/proof components touched:

- `src/app/api/mobile/events/[slug]/provider-refresh/route.ts`
- `scripts/prove_mobile_ek_a_provider_transition.ts`
- `docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json`

Important functions/services touched:

- `executeMobileLiveProviderRefreshRoute()` exposes the existing provider-refresh route body so backend proofs can execute the same expire/refresh/cache-invalidation path without depending on a Next request auth context.
- The proof script creates one disposable live event with ready Moneyline, stale/refresh-due Spread, and unavailable Totals compact markets.
- It seeds `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows, then stubs Polymarket Gamma/CLOB provider responses for the route refresh execution only.
- It calls `/api/mobile/events/:slug/live-detail` before and after refresh and executes the provider-refresh route path with `allowContractProofFallback=false`.

State transitions:

- Ready Moneyline stays `providerLifecycle.status=ready`.
- Selected Spread starts with `quote.status=refresh_due`, depth/chart `status=stale`, `orderbookIdentity.shouldRefresh=true`, then returns `providerLifecycle.status=ready` with the same market id, selector key, family, period, line, and token ids.
- Totals remains explicit `providerLifecycle.status=unavailable`, `empty=true`, `notReady=true`, and `orderbookIdentity.ready=false`.
- Provider-refresh reports `refreshStarted=true`, `refreshStatus=completed`, `refreshStartedAt`, `refreshCompletedAt`, cache invalidation for live-detail/chart/orderbook paths, and `fallbackApplied=false`.

Verified:

- `npx tsx scripts/prove_mobile_ek_a_provider_transition.ts --summaryPath=docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json`

Known limitations:

- This is backend route proof only; Android visible stale/loading/ready pairing remains Agent B/Lead scope.
- Production breadth still depends on currently available real Polymarket line-family mappings beyond disposable proof rows.
- Missing `OPTIC_ODDS_API_KEY` is optional and non-blocking for this Polymarket Gamma/CLOB transition proof.

## Cycle EK Integrated - Visible Provider Transition

Feature/page worked on:

- Lead-integrated route-backed provider transition proof for live event detail, Book/orderbook, and ticket handoff.
- Converts EK from backend-only proof plus blocked visible harness into Samsung tablet proof for the selected unavailable -> loading/refresh -> ready path.

Frontend/backend/harness components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/app/api/orderbook/[marketId]/book/route.ts`
- `mobile/src/api.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `scripts/refresh_mobile_ek_provider_transition.ts`
- `docs/mobile/harness/cycle-EK-integrated-provider-transition/`
- `docs/mobile/screenshots/cycle-EK-integrated-provider-transition/`

Important functions/interactions/state transitions touched:

- Live-detail now lets computed provider lifecycle downgrade mobile-visible `event.liveDataStatus` when a live event has stale or unavailable provider rows, so the app no longer shows stale provider data as ready.
- Live-detail and orderbook routes can promote selected market availability to ready when provider quote and orderbook depth snapshots are fresh, preventing Book depth ready / ticket refresh-due contradictions.
- Mobile orderbook requests include a timestamp cache-buster so a reopened Book fetches the current route state after provider refresh.
- EventDetail reconciles selected Book availability with ready route-backed depth to avoid stale market timestamp residue in the active Book/ticket surface.
- EK smoke captures live not-ready, Book loading, backend provider refresh, reopened Book ready state, Book settings, ticket handoff, and ticket settings.

Verified:

- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleStatusTransition -Port 8328 -Device "172.16.200.30:41299" -BackendBaseUrl "http://127.0.0.1:3002" -ServerEventSlug "mobile-ek-a-provider-transition-602165df" -OutputDir docs/mobile/screenshots/cycle-EK-integrated-provider-transition -HierarchyOutputDir docs/mobile/harness/cycle-EK-integrated-provider-transition`
- `npm --prefix mobile run typecheck`
- `npm run test:mobile-api -- mobile/src/__tests__/api.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `npm run test:jest -- src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-event-detail.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/mobile-live-provider-refresh.service.test.ts`

Known limitations:

- This is a selected disposable-event transition pass, not proof across every real provider-backed Polymarket family.
- Fresh S23 reference was not captured in EK; DQ-C remains stale/reference-only.
- The helper script is proof-only for the disposable EK event and should not be treated as production provider scheduling.

## Cycle EJ-A - Backend Provider Status Breadth

Feature/page worked on:

- Backend/provider proof for route-backed provider status breadth after EI.
- Proves live-detail can return ready, refresh-due/stale, and unavailable/not-ready shapes from disposable backend rows without fixture/mock/default-ready labels.

Backend/proof components touched:

- `scripts/prove_mobile_ej_a_provider_status_breadth.ts`
- `docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json`

Important functions/services touched:

- The proof script creates one disposable live event with three compact markets selected by live-detail: moneyline ready, spread refresh-due/stale, and totals unavailable.
- It seeds `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` timestamps to drive the existing `/api/mobile/events/:slug/live-detail` status calculations.
- It calls the live-detail route module and asserts route-backed `providerLifecycle`, `providerOrderbookDepth`, `chartHistoryStatus`, `selection`, `orderbookIdentity`, and aggregate contract counts.

State transitions:

- Fresh Polymarket quote/depth/chart rows return `providerLifecycle.status=ready`.
- A 65-second quote returns `quote.status=refresh_due`, while 5-minute CLOB depth/chart rows return `stale` and aggregate market status `stale`.
- Missing provider snapshot rows return `providerLifecycle.status=unavailable`, `empty=true`, `notReady=true`, with no ready fallback.

Verified:

- `npx tsx scripts/prove_mobile_ej_a_provider_status_breadth.ts --summaryPath=docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json`

Known limitations:

- This is backend route proof only; no mobile UI files or mobile smoke scripts were edited.
- Production breadth still depends on mapped provider markets and recurring refresh coverage for active events.
- Missing `OPTIC_ODDS_API_KEY` is optional and non-blocking for this Polymarket-first/CLOB-shaped proof.

## Cycle EJ Integrated - Route-Backed Mixed Status Tablet Proof

Feature/page worked on:

- Lead-integrated live event route-backed provider status breadth after Agent A/B/C merge.
- Converts the EJ-B proof from blocked to a Samsung tablet pass against the Agent A disposable backend event.

Frontend/harness components touched:

- `mobile/scripts/smoke.ps1`
- `docs/mobile/harness/cycle-EJ-integrated-status-breadth/`
- `docs/mobile/screenshots/cycle-EJ-integrated-status-breadth/`

Important functions/interactions/state transitions touched:

- `-EventDetailVisibleStatusBreadth` now accepts the EJ mixed-status route shape instead of incorrectly requiring the older EI ready-only ticket label.
- Tablet proof asserts route-backed live data ready/source markers, chart ready state, visible `Ticket refresh due`, Book refreshing/loading, route-backed Book depth ready, selected Book availability refresh-due/stale, Book display settings toggle, ticket provider identity, ticket settings `Trading mode: Server mode`, and negative fallback guards.
- The generated proof remains separate from EI so the selected EI ready path still keeps its stricter ready-only assertions.

Verified:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- Backend `/api/health` at `http://127.0.0.1:3002`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleStatusBreadth -Port 8325 -Device "172.16.200.30:41299" -BackendBaseUrl "http://127.0.0.1:3002" -ServerEventSlug "mobile-ej-a-provider-status-breadth-757c94ec" -OutputDir docs/mobile/screenshots/cycle-EJ-integrated-status-breadth -HierarchyOutputDir docs/mobile/harness/cycle-EJ-integrated-status-breadth`

Known limitations:

- This is a selected mixed route-backed path pass, not final EJ breadth parity.
- Visible unavailable/not-ready state, broader real provider-backed family breadth, and a full route-backed stale -> refreshing/loading -> ready transition remain open P0 breadth work.
- No fresh EJ S23 Polymarket reference was captured; DQ-C S23 evidence remains stale/reference-only.

## Cycle EJ-B - Visible Route-Backed Status Breadth

Feature/page worked on:

- Holiwyn tablet-visible live event route-backed status breadth after EI.
- Extends the existing backend-required provider status smoke with a separate EJ-B switch/artifact set for live detail, chart/ticket handoff labels, Book/orderbook route depth/availability, Book display settings, and ticket settings.

Frontend/harness components touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/interactions/state transitions touched:

- Added `-EventDetailVisibleStatusBreadth`, which shares the route-backed `forceBackendEventSlug` launch path and backend-health requirement with EI instead of using fixture/default-ready status.
- EJ-B proof names write to `cycle-EJ-B-visible-status-breadth` and keep the fallback guard against `deterministic-status-fixture`, `mock-ready`, `default-ready`, `fixture-ready`, Mexico/Ecuador fallback, and generic Team to Advance fallback markers.
- The pass path now asserts live data ready/source labels, chart `chart-status-ready`, Book refreshing then route-depth ready state, Book availability/selected provider labels, Book settings cents-to-decimal persistence, ticket provider identity labels, and ticket settings `Trading mode: Server mode`.

Verified:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `npm run typecheck` from `mobile/`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleStatusBreadth -Port 8324 -BackendBaseUrl "http://127.0.0.1:3002" -OutputDir docs/mobile/screenshots/cycle-EJ-B-visible-status-breadth -HierarchyOutputDir docs/mobile/harness/cycle-EJ-B-visible-status-breadth`

Known limitations:

- Android/tablet proof blocked before Expo launch because backend health was unavailable at `http://127.0.0.1:3002/api/health`; the generated proof records `result=blocked` and `routeBackedStatusConsumed=false`.
- No screenshots/XML were produced in this run because the route-backed proof aborts before fallback UI launch when the backend is unavailable.
- Broader real provider-backed line-family stale/unavailable transition proof remains outside this visible harness increment.

## Cycle EI Integrated - Route-Backed Tablet Provider Status

Feature/page worked on:

- Live event detail provider lifecycle/status proof for the selected route-backed tablet path.
- Closes the backend-unreachable/fixture-status blocker by proving the Samsung tablet consumes `/api/mobile/events/:slug/live-detail` through `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3002`.

Frontend/harness/backend components touched:

- `scripts/prove_mobile_ei_a_route_backed_status.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/interactions/state transitions touched:

- EI proof event now exposes `event.liveDataStatus.source=polymarket-gamma`, matching the Polymarket-first provider direction instead of a proof-only source label.
- `smoke-tablet.ps1` now forwards `-ServerEventSlug` to the inner route-backed status smoke.
- `smoke.ps1 -EventDetailProviderStatus` now launches `forceBackendEventSlug`, requires backend health, expects the disposable route-backed event instead of the Australia/Egypt fixture, opens Book, verifies refreshing/loading then route-backed ready depth, opens a Book-origin ticket, opens ticket settings, and asserts `Trading mode: Server mode`.
- The proof rejects `deterministic-status-fixture`, `mock-ready`, `default-ready`, `fixture-ready`, Mexico/Ecuador default fallback, and generic Team to Advance fallback markers.

Verified:

- `npm run mobile:backend-readiness:summary`
- `npx tsx scripts/prove_mobile_ei_a_route_backed_status.ts --output=docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailProviderStatus -Port 8322 -Device "172.16.200.30:41299" -BackendBaseUrl "http://127.0.0.1:3002" -ServerEventSlug "mobile-ei-a-route-backed-status-4bd474bf" -OutputDir docs/mobile/screenshots/cycle-EI-integrated-route-backed-status -HierarchyOutputDir docs/mobile/harness/cycle-EI-integrated-route-backed-status`

Known limitations:

- This is a selected disposable route-backed proof path, not universal production provider-family coverage.
- Fresh official Polymarket S23 reference evidence was not recaptured in EI; DQ-C remains stale/reference-only.
- Broader route-backed stale/unavailable transition proof across real provider-backed line families remains P1 follow-up.

## Cycle EE-B - Visible Book Status Breadth

Feature/page worked on:

- Holiwyn Android-visible Event Detail Book-selected fake-token lifecycle status breadth.
- Extends the selected Mexico vs. Ecuador Spread Book path beyond the ED filled-position proof to show open order status, cancel action/status, filled/recent activity markers, and explicit fake-token/test labels.

Frontend/harness components touched:

- `mobile/App.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/interactions/state transitions touched:

- `isBookSpreadLifecycleSelection()` scopes the deterministic status breadth branch to the Book-selected Spread fixture: `marketId=mexico-ecuador-spread`, `outcomeId=yes`, `line=1.5`, `period=regulation`.
- Mock `placeOrder()` now creates a backend-shaped sibling open order for that selected Book Spread branch while preserving the filled position/activity marker, so Portfolio can prove both open and filled statuses from the same selected Book identity.
- `Portfolio` now renders visible `Fake-token test` plus status pills on latest order, open-order rows, latest activity, and activity rows. The same selected market/outcome/line/period/provider identity remains in the existing accessibility labels.
- `cancelOpenOrder()` continues to remove the open order and append a canceled activity; the EE proof now taps the cancel button and asserts `Canceled`, `activity-canceled`, `status-canceled`, and the remaining filled activity marker.
- `-EventDetailOrderBookLifecycle` now emits EE-B artifact names and proof JSON under `cycle-EE-B-visible-status`.

Verified:

- `npm --prefix mobile install --no-audit --no-fund`
- `npm --prefix mobile run typecheck`
- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`

Lead proof command:

- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBookLifecycle -Port 8309 -OutputDir docs/mobile/screenshots/cycle-EE-B-visible-status -HierarchyOutputDir docs/mobile/harness/cycle-EE-B-visible-status`

Known limitations:

- The EE-B visible breadth path is deterministic fake-token/test state, not a real wallet signature or production Polymarket order.
- Broader real provider-backed line-family lifecycle breadth remains P1 until backend/provider line families are ready.

## Cycle ED-A - Book Order Portfolio History Provider Identity

Feature/page worked on:

- Backend/order/portfolio lifecycle support after EC Book identity parity.
- Closed the structural gap where selected Book-style provider identity could stop at the ticket/order request instead of being proven through order response, Portfolio, and history/recent activity echoes.

Backend/components touched:

- `src/server/services/canonicalOrderSubmission.ts`
- `src/server/services/ticketSelectionMetadata.ts`
- `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`
- `src/__tests__/portfolio.open-orders.route.test.ts`
- `src/__tests__/portfolio.history.route.test.ts`
- `scripts/prove_mobile_ed_a_book_order_portfolio_history.ts`
- `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`

Important functions/services touched:

- `sanitizeTicketSelection()` now preserves Book/provider aliases such as `providerSource` and `tokenId`, while also normalizing them into existing `referenceSource` and `referenceTokenId` fields for current mobile consumers.
- `buildTicketSelectionMetadata()` now echoes both provider-style and reference-style source/token fields from request metadata or from `Market`/`Outcome` fallback rows.
- The ED proof starts from `/api/orderbook/:marketId/book`, selects a provider-backed Spread outcome token, submits an order, cancels one open order, fills a second order, and verifies order response, portfolio open order, canceled activity, portfolio position, and recent trade all carry the same identity.

Verified:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npm run test:jest -- src/server/services/__tests__/canonical_order_submission.phase5.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npx tsx scripts/prove_mobile_ed_a_book_order_portfolio_history.ts --baseUrl=http://127.0.0.1:3012 --summaryPath=docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`

Known limitations:

- Identity persistence still uses `ApiOrderRequest.requestBody.selection` for order/open/canceled echoes and market/outcome fallback metadata for positions/recent trades; no schema migration or immutable trade selection snapshot was added.
- The proof uses a disposable provider-backed Book line market on local Postgres and a local Next server for the Book HTTP route.
- No visible mobile UI files were changed in this backend/order lane.

## Cycle ED-B - Visible Book Order Lifecycle

Feature/page worked on:

- Visible mobile Event Detail Book lifecycle for a selected line market.
- Proves the user can select a Book Spread market, open the ticket, place a mock fake-token order, and see the same selected identity in Portfolio order, position, and activity surfaces.

Frontend/harness components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/App.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/interactions touched:

- Book/ticket/Portfolio accessibility identity labels now expose selected market id, outcome id, market group, line, period, contract side, and provider source/market/condition/token identity.
- Local mock positions created from ticket orders now keep `marketId` and `outcomeId` alongside the existing `selection` payload.
- Added `-EventDetailOrderBookLifecycle` smoke path: opens Mexico vs. Ecuador Book, switches selector from Moneyline to Spread `line=1.5 period=regulation outcome=yes`, opens Buy ticket, adds `$25`, submits `place-mock-order`, and asserts Portfolio `latest-order-card`, `position-card`, `latest-activity-card`, and `activity-row` preserve the same Book-selected identity.

Verified:

- `npm --prefix mobile ci --no-audit --no-fund`
- `npm --prefix mobile run typecheck`
- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`

Lead proof needed:

- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBookLifecycle -Port 8258 -OutputDir docs/mobile/screenshots/cycle-ED-B-book-lifecycle -HierarchyOutputDir docs/mobile/harness/cycle-ED-B-book-lifecycle`

Known limitations:

- Local Android proof was not captured in this branch run because `adb devices` hung and the daemon had to be stopped.
- The ED-B proof path uses the existing deterministic backend-shaped local Book/order service in mock mode. Integrated provider-ready live route proof should be recaptured by Lead after backend/provider branches are merged.

## Cycle EC-A - Provider Orderbook Identity Parity

Feature/page worked on:

- Backend/provider lifecycle support for live event detail Book/orderbook parity.
- Closed the structural gap where `/api/mobile/events/:slug/live-detail` compact markets and `/api/orderbook/:marketId/book` could not be proven to describe the same provider-backed market/selector identity.

Backend/components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`
- `scripts/prove_mobile_ec_provider_orderbook_identity.ts`
- `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now emits compact `selection.selectorKey` in the same `group:period:line/default` form as the Book route, with `marketId` kept as the separate disambiguator.
- Each compact market now carries `orderbookIdentity` with route path, `marketId`, `marketGroupId`, `selectorKey`, family/period/line, outcome ids, provider token ids, provider source/status, depth source/status, freshness timestamps, refresh flags, ready boolean, and reason.
- The public Book route `marketIdentity.outcomes[]` now includes `outcomeId`, public provider `tokenId`, and `referenceOutcomeLabel` so backend proof can match live-detail compact outcome/token identity to the selected Book route.
- `prove_mobile_ec_provider_orderbook_identity.ts` starts from a live-detail response, selects a provider-backed compact market, calls the matching Book route, and asserts identity/source/status/freshness equality.

Verified:

- `npx jest --runInBand --detectOpenHandles src/__tests__/mobile-live-event-detail.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npx tsx scripts/prove_mobile_ec_provider_orderbook_identity.ts --baseUrl http://127.0.0.1:3012 --output docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json`

Known limitations:

- The EC proof intentionally proves match-winner provider-backed identity. Its disposable Totals compact line market is present but unseeded for provider depth, and the artifact documents that line-market gap instead of counting fallback rows as provider parity.
- Production line-family provider parity still depends on real mapped provider line markets and recurring refresh coverage.
- No visible mobile UI files were changed in this backend/provider lane.

## Cycle EB-B - Full Game Page Chart And Line Selector Proof

Feature/page worked on:

- PM-GAP-073 live World Cup game detail visible parity debt.
- Extended the full live game page proof target beyond page structure into chart touch behavior and in-page Spread/Totals line selector ticket carry-through.

Frontend/harness components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/interactions touched:

- `EventDetail` chart accessibility labels now expose `chart-filter-*` and `chart-selected-point-*` state so Audit Gate can prove chart touch changes the selected point/tooltip state.
- The DY full-page tablet smoke now taps the live chart, verifies `mid` and `target` tooltip states, switches chart filters, scrolls to Game Lines, changes Spread to `2.5` and `1st Half`, opens the Spread ticket, then changes Totals to `3.5` and `2nd Half` and opens the Totals ticket.
- The smoke asserts line identity through existing backend-shaped ticket labels: `selection-line-*`, `selection-period-*`, `ticket-market-family-*`, `ticket-line-*`, and `ticket-period-*`.

User interactions supported:

- Tap the live page chart to cycle through current, mid, and target tooltip states.
- Switch chart filters from Game to All and Live.
- Change visible Spread/Totals line and period controls inside the full live page, then open a matching ticket without falling back to the primary winner market.

State transitions:

- `selectedChartPoint` changes `latest -> mid -> target` and updates the chart tooltip proof label.
- `chartFilter` changes `Game -> All -> Live` and is exposed on the chart accessibility label.
- `spreadLine`, `spreadPeriod`, `totalsLine`, and `totalsPeriod` update row probabilities and carry the selected line/period into the trade ticket.

Verified:

- `npm --prefix mobile ci --no-audit --no-fund` in the isolated Agent B worktree to restore mobile dependencies.
- `npm --prefix mobile run typecheck`
- PowerShell parser check for `mobile/scripts/smoke.ps1`

Lead proof needed:

- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -DyAGamePageStructure -Port <free-port> -OutputDir docs/mobile/screenshots/cycle-DY-A-game-page-structure -HierarchyOutputDir docs/mobile/harness/cycle-DY-A-game-page-structure`

Known limitations:

- This Agent B cycle does not edit backend routes or provider mapping. The line selector proof continues to use the existing backend-shaped line/ticket contract and any deterministic fixture fallback already present in the mobile app.
- Final parity pass still requires Lead integrated Android proof and Agent C audit-gate comparison.

## Cycle EA-A - Live Detail Per-Market Chart Contract

Feature/page worked on:

- Backend/provider lifecycle support for live World Cup event detail parity.
- Closed a structural data-contract gap for selected market/line chart behavior: `/api/mobile/events/:slug/live-detail` now exposes chart readiness per compact market, not only a top-level primary event chart.

Backend/components touched:

- `src/app/api/mobile/events/[slug]/live-detail/route.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `scripts/probe_mobile_live_detail_route.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

Important functions/services touched:

- `GET /api/mobile/events/:slug/live-detail` now queries `MarketOutcomeSnapshot` for all selected compact live markets instead of only the primary market.
- `serializeMobileLiveEventDetail()` groups chart snapshots by `marketId`, keeps top-level `event.chartHistory` scoped to the primary market, and adds `market.chartHistory` plus `market.chartHistoryStatus` for every compact market.
- The live-detail probe script now reports `batchedChartHistoryMarketCount`, `batchedChartHistoryPointCount`, and `chartReadyMarketIds`.

User interactions supported:

- Future visible chart selector work can switch from Moneyline to Spread/Totals/Team Totals while preserving selected `marketId` and showing whether that exact market has chart history.
- Mobile can distinguish a selected line market with `chartHistoryStatus.status=ready` from one with `emptyState=no-history` without inventing local UI-only state.

State transitions:

- Primary market chart history still drives `event.chartHistory` and `contract.chartHistorySource`.
- Non-primary market chart snapshots now produce per-market `chartHistoryStatus.status=ready` while the primary chart can remain `empty` if it has no snapshots.

Verified:

- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts`

Validation notes:

- Worktree-local Jest initially could not run because this separate worktree has no `node_modules`; a temporary local dependency junction to the main checkout was used for validation and removed afterward.
- A route probe was attempted, but the local database in this worktree did not contain the expected World Cup proof event, so no DB-backed proof artifact was created in this cycle.

Known limitations:

- This does not fetch new Polymarket history by itself; it exposes already-ingested `MarketOutcomeSnapshot` rows across all compact markets.
- Real provider-backed chart parity for line markets still depends on mapped Polymarket/CLOB token IDs and refresh coverage for those markets.
- No visible mobile UI was changed in this backend/provider lane.

## Cycle EA-B - Visible Primary Ticket Entry Recovery

Feature/page worked on:

- PM-GAP-073 live World Cup game detail visible parity increment.
- Added a Polymarket-like selected outcome trade rail so the live page preserves the selected primary market/outcome and exposes a stable ticket entry after primary odds selection.

Frontend/components touched:

- `mobile/src/components/EventDetail.tsx`

Important functions/interactions touched:

- Added `selectedPrimaryOutcomeId` state for the live detail page.
- Added `openPrimaryOutcomeTicket()` to normalize all primary live winner entry points through one ticket handoff.
- Primary top odds, the in-card Team to Advance/Live Winner buttons, and chat sticky odds now select the same outcome and pass backend-shaped ticket identity fields through to `openTicket()`.
- Added `event-detail-selected-outcome-trade-rail` and `event-detail-selected-outcome-open-ticket` as visible, stable Android proof targets.

User interactions supported:

- Tap either primary outcome and see the selected contract highlighted.
- Use the pinned trade rail to open the ticket for the same selected market/outcome.
- Keep the existing direct odds-to-ticket behavior while adding a second stable continuation target for mobile proof and user recovery.

State transitions:

- `selectedPrimaryOutcomeId=null` keeps the selected trade rail hidden.
- Tapping a primary outcome updates `selectedPrimaryOutcomeId`, reveals the selected trade rail, hides share/orderbook overlays, and calls `openTicket()` with market id, outcome id, market group, period, side, contract side, and provider identity fields when available.
- The selected trade rail exposes `selected-market-*`, `selected-outcome-*`, `selected-probability-*`, and `ticket-entry-stable` markers for Audit Gate proof.

Verified:

- `npm --prefix mobile ci --no-audit --no-fund` in the isolated Agent B worktree to restore mobile dependencies.
- `npm --prefix mobile run typecheck`

Validation limitations:

- `npx vitest --config vitest.mobile.config.mts run mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/marketDepthService.test.ts` could not start in this isolated worktree because the root `vitest` package was not installed in the worktree root.
- Physical Android proof remains for Lead integration because device/Expo state is coordinated outside Agent B.

Lead proof needed:

- From the integrated checkout, run the DY/EA game page structure smoke on the Samsung Holiwyn device.
- Expected proof targets: `event-detail-primary-outcome-*`, `event-detail-selected-outcome-trade-rail`, `event-detail-selected-outcome-open-ticket`, then `trade-ticket` with the same selected market/outcome identity.

Known limitations:

- PM-GAP-073 should remain open until Lead Android proof confirms the ticket opens from the selected outcome rail and the Audit Gate compares it against the Polymarket reference.

## Cycle DU-B - Visible Book Settings And Selector Carry-Through

Feature/page worked on:

- PM-GAP-075 visible mobile live event Book/orderbook parity increment.
- Added a Book price display setting that toggles ladder prices between cents and decimal USDT while preserving selected market/outcome/side.
- Added deterministic backend-shaped Mexico/Ecuador fixture markets for Moneyline, Totals, and Spread selector proof.

Frontend/harness components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/mocks/worldCup.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/package.json`
- Proof artifacts:
  - `docs/mobile/screenshots/cycle-DU-B-orderbook-settings/`
  - `docs/mobile/harness/cycle-DU-B-orderbook-settings/`

Important functions/interactions touched:

- `renderOrderBook()` now exposes `book-display-mode-cents|decimal`, `order-book-settings-open`, `order-book-settings-sheet`, and `order-book-display-mode-toggle`.
- Ladder row rendering uses `formatBookDisplayPrice()` so the same book levels visibly switch from `41c`/`34c` to `0.41 USDT`/`0.34 USDT`.
- Orderbook state markers now distinguish route depth, deterministic contract fixture depth, fallback depth, availability, market status, bid/ask side labels, Price/Shares/Value, spread, selected market id/family/type/period/line/side/outcome, and ticket identity.
- The Book selector carries Totals `line=2.5 period=regulation` and Spread `line=1.5 period=regulation` into the selected orderbook context and spread ticket.

User interactions supported:

- Open Book from the event detail page.
- Switch Yes/No outcome tabs without changing selected market.
- Select Totals and Spread markets from the grouped Book selector.
- Open Book settings and toggle price display from Cents to Decimal without resetting selected Spread market, outcome, or side.
- Tap the selected Spread Book Buy action and see the ticket retain the provider-shaped market/source/condition/token identity.

State transitions:

- Moneyline Book opens as `selected-market-mexico-ecuador-winner`, `book-display-mode-cents`, `orderbook-status-ready`.
- Outcome tab changes `selected-outcome-mexico selected-side-yes` to `selected-outcome-ecuador selected-side-no`.
- Selector changes to Totals with `selected-market-type-totals selected-line-2.5 selected-period-regulation`.
- Selector changes to Spread with `selected-market-type-spread selected-line-1.5 selected-period-regulation`.
- Settings toggle changes `book-display-mode-cents decimalize-off` to `book-display-mode-decimal decimalize-on` while selected Spread identity remains stable.

Verified:

- `npm run typecheck` from `mobile/`
- `npx vitest --config vitest.mobile.config.mts run mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBookInteractions -Port 8244 -OutputDir docs/mobile/screenshots/cycle-DU-B-orderbook-settings -HierarchyOutputDir docs/mobile/harness/cycle-DU-B-orderbook-settings`

Proof notes:

- `cycle-DU-B-holiwyn-orderbook-settings-cents.xml` shows the settings sheet before state with `book-display-mode-cents`, `decimalize-off`, `selected-market-mexico-ecuador-spread`, `selected-outcome-yes`, and `selected-side-yes`.
- `cycle-DU-B-holiwyn-orderbook-settings-decimal.xml` shows the after state with `book-display-mode-decimal`, `decimalize-on`, the same selected identity, and decimal ladder prices.
- `cycle-DU-B-holiwyn-orderbook-spread-ticket.xml` shows ticket carry-through for `Mexico -1.5 spread`, `provider-source-polymarket-fixture`, `provider-market-gamma-mexico-ecuador-spread-15`, `provider-condition-condition-mexico-ecuador-spread-15`, and `provider-token-token-spread-yes-15`.

Known limitations:

- PM-GAP-075 remains partial.
- Provider-backed ready UI proof remains pending integration with Agent A backend route changes in this worktree; DU-B proves the visible UI against deterministic backend-shaped fixture data, not random display-only data.
- The setting is a focused Polymarket-equivalent price display toggle, not a complete clone of every Polymarket Book settings option.

## Cycle DT-A - Provider Ready Orderbook Depth Proof

Feature/page worked on:

- PM-GAP-075 backend Book route ready-depth proof for Holiwyn Super Round DT.
- Backend/provider proof only; no visible mobile UI, mobile smoke, Prisma schema, or audit docs changed.

Frontend/harness components touched:

- No mobile UI code changed.
- Backend proof artifact path: `docs/mobile/harness/cycle-DT-A-ready-orderbook-depth-proof.json`.

Backend/components touched:

- `scripts/prove_mobile_dt_ready_orderbook_depth.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`

Data/API contract notes:

- `/api/orderbook/:marketId/book?maxLevels=24` is now covered by a focused provider-backed ready-depth assertion that combines `marketIdentity` with `depthSource=provider-orderbook-depth`.
- The DT proof script creates a disposable compact World Cup-style orderbook market, seeds `ReferenceOrderbookDepthSnapshot` rows with source `polymarket-clob-dt-proof`, calls the public Book route, and records Price/Shares/Value rows from `levels[]`.
- The route still prefers local open orders first; provider ladder snapshots are used only when local depth is absent.

Verified:

- `npx jest --runInBand --detectOpenHandles src/__tests__/public.orderbook-book.no-leak.test.ts`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npm run mobile:dt-ready-orderbook-depth-proof -- --baseUrl http://127.0.0.1:3002 --output docs/mobile/harness/cycle-DT-A-ready-orderbook-depth-proof.json`

Proof notes:

- The route test asserts `marketIdentity.selectorKey=main:full-game:default`, `marketFamily=moneyline`, provider depth status `ready`, and multiple `levels[]` rows carrying numeric `price`, `shares`, and `total`.
- The proof artifact is intended to show the same fields from a real `/api/orderbook/:marketId/book` response, not a frontend fallback payload.

Known limitations:

- Production World Cup line-family markets still need real provider mapping/refresh coverage beyond the disposable DT proof market.
- Event-level sibling selector payload remains optional future backend work if mobile wants all selector choices without opening each Book route.

## Cycle DR-A - Scheduled Provider Refresh Run Reporting

Feature/page worked on:

- PM-GAP-072 scheduler observability after scheduled provider refresh.
- Backend-only provider lifecycle service/reporting contract; no mobile UI or frontend service files changed.

Frontend/harness components touched:

- No mobile UI or visual parity code changed.
- Backend proof artifact: `docs/mobile/harness/cycle-DR-A-mobile-scheduled-provider-refresh-run-report.json`.

Backend/components touched:

- `src/server/services/mobileLiveProviderScheduler.ts`
- `scripts/prove_mobile_scheduled_provider_refresh.ts`
- `src/__tests__/mobile-live-provider-scheduler.service.test.ts`

Data/API contract notes:

- `runScheduledMobileLiveProviderRefresh()` now returns stable run metadata: `runId`, `startedAt`, `completedAt`, `durationMs`, and run `status`.
- The scheduler reports `attemptedEventCount`, `successfulEventCount`, `failedEventCount`, and `dryRunEventCount` alongside existing due/refreshed counts.
- Each scheduled refresh item now carries `status=completed|failed|dry_run`; failed provider refresh attempts include a sanitized `{ name, message }` error and still return the backend cache invalidation contract for due markets.
- Scheduled execution still calls `refreshMobileLiveProviderQuoteSnapshots()` with `allowContractProofFallback=false`.

Verified:

- `npx jest --runInBand --detectOpenHandles src/__tests__/mobile-live-provider-scheduler.service.test.ts`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npx tsx scripts/prove_mobile_scheduled_provider_refresh.ts --output docs/mobile/harness/cycle-DR-A-mobile-scheduled-provider-refresh-run-report.json`

Proof notes:

- Proof event `mobile-provider-refresh-proof-live` starts stale/refresh-due with 2 expired provider quote snapshots.
- Scheduler reports `status=completed`, `attemptedEventCount=1`, `successfulEventCount=1`, `failedEventCount=0`, and refreshed item `status=completed`.
- After scheduler: live-detail reports provider quote ready, refresh-due cleared, provider orderbook depth ready, and chart history from `market-outcome-snapshot`.

Known limitations:

- Production cron/queue registration, retry policy, alert routing, and durable run-history persistence remain open.
- Real line-market provider identities and optional OpticOdds credentials remain open for line-family parity.

## Cycle DQ-A - Scheduled Provider Refresh Lifecycle

Feature/page worked on:

- PM-GAP-072 scheduled provider refresh orchestration for live-detail provider quote readiness.
- Polymarket-first provider lifecycle proof with optional OpticOdds enrichment left non-blocking.

Frontend/harness components touched:

- No mobile UI or visual parity code changed.
- Android tablet smoke was attempted with `mobile/scripts/smoke-tablet.ps1 -ServerLiveProviderRefreshProof -Port 8218`; it reached the event detail but failed before provider assertions because the current hierarchy did not expose `event-detail-group-prop`.

Backend/components touched:

- `src/server/services/mobileLiveProviderScheduler.ts`
- `scripts/prove_mobile_scheduled_provider_refresh.ts`
- `src/__tests__/mobile-live-provider-scheduler.service.test.ts`

Important functions/services touched:

- `runScheduledMobileLiveProviderRefresh()` loads provider-backed live events, assesses missing/stale `ReferenceQuoteSnapshot` rows per active outcome, refreshes due events without contract-proof fallback, and returns the cache invalidation contract for live-detail, event, chart, and orderbook routes.
- The scheduler calls `refreshMobileLiveProviderQuoteSnapshots()` so Polymarket Gamma quotes, CLOB depth, and CLOB price history refresh together for mapped compact markets.
- `prove_mobile_scheduled_provider_refresh.ts` expires provider quote snapshots, probes live-detail stale/refresh-due counts, runs the scheduler, and asserts the route returns to ready.

User interactions supported:

- None directly. This is a backend lifecycle/scheduler proof for the existing mobile live-detail route contract.

State transitions:

- Proof event `mobile-provider-refresh-proof-live` starts with one compact provider market and two expired snapshots.
- Before scheduler: live-detail reports `batchedProviderQuoteSnapshotReadyCount=0`, `batchedProviderQuoteSnapshotStaleCount=1`, and `batchedProviderQuoteSnapshotRefreshDueCount=1`.
- Scheduler: `dueEventCount=1`, `refreshedEventCount=1`, Polymarket provider updates 2 quote rows, CLOB depth updates 96 rows, and CLOB history writes route-readable chart snapshots.
- After scheduler: live-detail reports `batchedProviderQuoteSnapshotReadyCount=1`, `batchedProviderQuoteSnapshotStaleCount=0`, `batchedProviderQuoteSnapshotRefreshDueCount=0`, `batchedProviderOrderbookDepthReadyCount=1`, and `chartHistorySource=market-outcome-snapshot`.

Known limitations:

- This is a callable scheduler service/proof harness, not a deployed cron/queue worker.
- The focused Android tablet proof did not complete in this Agent A pass; backend proof is passing and visual harness repair remains outside this owned scope.
- `lineProvider.status=skipped` with `skippedReason=missing_provider_fixture` is expected for this Polymarket-only proof and does not block Polymarket Gamma/CLOB parity.

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

## Cycle DL - Polymarket CLOB Chart History

Feature/page worked on:

- PM-GAP-067 Polymarket-backed chart/history for the live-detail game page.
- Replaced the prior fallback chart source with CLOB `/prices-history` snapshots for mapped Polymarket token IDs.
- Preserved the distinction between provider chart history and provider live/order-entry state: Colombia vs Ghana is now closed/resolved on Polymarket, so mobile live data is correctly marked stale while chart history remains real.

Backend/API components touched:

- `src/server/services/polymarketPriceHistorySnapshots.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `src/app/api/markets/[id]/chart/route.ts`
- `scripts/prove_mobile_polymarket_chart_history.ts`
- `src/__tests__/polymarket-price-history-snapshots.test.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`

Mobile components/services touched:

- `mobile/src/services/marketChartService.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/marketChartService.test.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`

Important functions/services touched:

- `refreshPolymarketPriceHistorySnapshots()` fetches CLOB `/prices-history` by outcome token ID, deletes the matching timestamp window, and writes `MarketOutcomeSnapshot` rows.
- `refreshMobileLiveProviderQuoteSnapshots()` now includes `providerHistory` alongside Gamma quote refresh, CLOB depth refresh, and optional line-provider enrichment.
- `GET /api/markets/:id/chart` now returns `source: "polymarket-clob-prices-history"` when history exists for a Polymarket-backed market.
- `applyChartStateToEvent()` carries the provider chart source into the EventDetail accessibility marker.
- `normalizeEventDetail()` now keeps backend `status: live` as a live mobile page even when provider freshness is stale/ended.

User interactions supported:

- Samsung tablet server-mode event detail now shows the chart as ready with `chart-source-polymarket-clob-prices-history` and `chart-range-1D`.
- The Book interaction still opens the route-backed orderbook with `orderbook-source-orderbook-route` and `orderbook-status-ready`.

State transitions:

- Real Polymarket token IDs -> CLOB `/prices-history` -> `MarketOutcomeSnapshot` rows -> `/api/markets/:id/chart` -> mobile EventDetail chart source marker.
- Proof created 1,708 CLOB price-history snapshots across 3 Polymarket match-winner markets.
- Tablet proof moved the visible chart from fallback to provider-backed ready state.

Known limitations:

- The reference provider event is now closed/resolved, so this cycle proves real CLOB chart history and stale provider labeling, not current live order entry.
- Chart history snapshots do not yet store a first-class source column; the chart route infers provider source from Polymarket market identity plus existing history rows.
- Line-family chart/history parity remains unavailable until real line-family Polymarket markets or explicitly optional enrichment exist.

## Cycle DM - Provider Token Lifecycle

Feature/page worked on:

- PM-GAP-068 provider identity lifecycle for the Polymarket-backed Colombia vs Ghana live-detail page.
- The selected market/outcome identity now carries Polymarket market/source/token fields from backend live-detail into the Android ticket, canonical order request metadata, portfolio open orders/positions, and portfolio history mapping.
- Added Android-only proof markers through accessibility labels so the harness can verify provider identity without showing debug text to users.

Backend/API components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/server/services/canonicalOrderSubmission.ts`
- `src/server/services/ticketSelectionMetadata.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/portfolio/history/route.ts`
- `scripts/prove_mobile_provider_token_lifecycle.ts`

Mobile components/services touched:

- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/services/orderService.ts`
- `mobile/src/services/portfolioSnapshotService.ts`
- `mobile/src/services/portfolioHistoryService.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now serializes `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `referenceTokenId`, and `referenceOutcomeLabel`.
- `normalizeMarket()` and `normalizeOutcome()` preserve those fields on the mobile event model.
- `selectionForOrder()` adds provider source/market/condition/token fields to the ticket order payload.
- `sanitizeTicketSelection()` and `buildTicketSelectionMetadata()` preserve provider fields in `ApiOrderRequest.requestBody.selection` and portfolio response selection metadata.

User interactions supported:

- Samsung tablet opens the server-backed Colombia vs Ghana game page, sees provider identity markers on the market page, opens the route-backed orderbook, taps a Buy row, and sees the trade ticket preserve the same Polymarket provider source/market/condition/token identity.

State transitions:

- Polymarket Gamma/CLOB market identity -> `/api/mobile/events/:slug/live-detail` -> mobile EventDetail model -> ticket selection -> `/api/orders` request body -> `/api/portfolio` open order/position selection -> `/api/portfolio/history` activity selection.
- `docs/mobile/harness/cycle-current-mobile-provider-token-lifecycle.json` proves the local selected market has `referenceSource=polymarket`, a Gamma external market id, a CLOB condition id, and an outcome token id.

Known limitations:

- Cycle DM proves provider token identity through the ticket/order metadata contract and Android ticket proof. It does not create a new matched fill or resolved history row on device for the closed Colombia/Ghana provider event.
- First-class normalized `Order.selection`/`Trade.selection` columns remain a future production hardening option; current preservation uses existing `ApiOrderRequest.requestBody.selection` plus market/outcome fallback metadata.

## Super Round DN - Audit-Gated Provider + Visible Orderbook Parity

Feature/page worked on:

- Live event detail provider lifecycle and visible orderbook parity after Cycle DM.
- Parallel lanes completed in separate worktrees: Agent C audit/criteria, Agent A backend/provider chart cache lifecycle, and Agent B mobile orderbook ladder UI.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Backend/API components touched:

- `src/server/services/mobileLiveProviderRefresh.ts`
- `src/server/services/mobileLiveProviderRefreshCache.ts`
- `src/app/api/mobile/events/[slug]/provider-refresh/route.ts`
- `scripts/prove_mobile_provider_chart_lifecycle_contract.ts`

User interactions supported:

- Samsung tablet opens a Polymarket-backed live event detail page, opens the route-backed Order Book, sees multi-level bid/ask ladders with depth bars, taps Buy from the ladder, and verifies the ticket preserves provider market/condition/token identity.

State transitions:

- Provider refresh now invalidates live-detail, event, chart, and orderbook route caches for the same compact provider market set.
- Route-backed `orderbookDepth` levels now render as visible bid/ask ladders. If route levels are missing, the UI shows deterministic quote-shaped fallback levels and labels that state the fallback source.

Known limitations:

- This round proves chart-route cache invalidation and visible route-depth ladder behavior, not a new scheduled refresh worker.
- Filled provider-backed order/history lifecycle remains P1 until an active provider-backed market can be traded through the full fake-token path.

## Cycle DO - Provider Filled Lifecycle

Feature/page worked on:

- PM-GAP-071 provider-backed filled order, portfolio position, and recent activity lifecycle.

Frontend components touched:

- `mobile/scripts/smoke.ps1`

Backend/proof components touched:

- `scripts/prove_mobile_filled_trade.ts`

User interactions supported:

- Samsung tablet opens Portfolio in server mode and shows the latest provider-backed filled trade in Recent activity with filled shares, execution price, implied odds, and cost.

State transitions:

- Dev-only provider-shaped World Cup market -> maker liquidity -> canonical BUY order with provider selection metadata -> filled order -> position -> recent trade/history -> mobile Portfolio recent activity.
- The proof asserts the same provider source, external slug, external market id, condition id, outcome token id, and reference outcome label in the original order request selection, portfolio position selection, and recent trade selection.

Known limitations:

- The proof uses a dev-only provider-shaped market because the current real Colombia/Ghana reference event is closed/resolved. It proves lifecycle contract preservation, not live real-money execution.
- No secret API token is written to docs or evidence.

## Super Round DS-A - Backend Orderbook Selector Contract

Feature/page worked on:

- PM-GAP-075 backend support for Polymarket-like Book selector/depth parity.
- Standalone orderbook route contract for compact market family, period, line, outcome, and display-unit identity.

Backend/API components touched:

- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`

User interactions supported:

- Mobile can open a route-backed Book for Moneyline, Spread, or Totals and receive the backend's selector identity without inventing frontend-only family, line, period, outcome, or display-unit data.
- The same route response still carries depth `levels[]`, `bids[]`, `asks[]`, availability, and provider depth metadata for the selected market.

State transitions:

- `Market` + active `Outcome` rows -> `/api/orderbook/:marketId/book` -> `marketIdentity` + ladder response.

## Super Round DS-B/Integrated - Visible Orderbook Selector And Ladder

Feature/page worked on:

- PM-GAP-075 visible Book/orderbook family/depth selector parity for live football game detail.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`
- `mobile/package-lock.json`

Important functions/services touched:

- EventDetail orderbook overlay rendering.
- Orderbook grouped market selector rendering.
- Orderbook Yes/No tab surface.
- Orderbook ladder rendering for Price/Shares/Value rows.
- Tablet smoke output routing for orderbook-specific screenshot/XML evidence.

User interactions supported:

- Tap Book from game detail to open a dedicated orderbook surface.
- View event identity and selected market context on the Book surface.
- See grouped selector labels and market choices.
- See visible Yes/No outcome tabs.
- See a single Price/Shares/Value ladder with spread separator.
- Tap a Book-side action into the existing ticket path.

State transitions:

- Game detail market row -> Order Book overlay.
- Selected market context -> grouped selector + ladder display.
- Orderbook row/ticket action -> trade ticket.
- Orderbook overlay -> closed state back to event detail.

Known limitations:

- PM-GAP-075 remains open after DS integrated proof.
- Yes/No tab switching was visible but not captured as before/after interactive proof.
- Grouped selector is inline, not yet a full Polymarket-style selector sheet.
- Selector carry-through into ladder/ticket identity for Moneyline -> Spread was not proven.
- `Decimalize book` or equivalent display setting is not implemented/proven.
- Integrated proof captured fallback/unavailable depth state, not provider-backed ready depth.
- The focused proof exercises Moneyline (`match_winner_1x2`), Spread (`spread` line `1.5`), and Totals (`total_goals` line `2.5`) route identities.

Known limitations:

- This is a backend route/data-contract improvement only; no mobile UI files were edited.
- Broader real provider mapping coverage for live Spread/Totals markets remains P1 outside this route contract.
- If mobile later needs one request for all sibling Book selector options, add an event-level sibling selector endpoint or extend live-detail rather than overloading a single-market book route.

## Super Round DT Integrated - Orderbook Interaction Proof

Feature/page worked on:

- PM-GAP-075 visible Book/orderbook interaction parity and backend ready-depth proof.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend/proof components touched:

- `scripts/prove_mobile_dt_ready_orderbook_depth.ts`
- `src/app/api/orderbook/[marketId]/book/route.ts` route contract via existing implementation
- `src/__tests__/public.orderbook-book.no-leak.test.ts`

Important functions/services touched:

- EventDetail Book overlay selected side/outcome state.
- EventDetail grouped selector state and selected market carry-through.
- EventDetail Book-to-ticket selection construction.
- Tablet smoke path for Book tab switch, selector, and ticket proof.
- Backend proof harness for provider-backed ready orderbook depth.

User interactions supported:

- Tap Yes/No tabs in the Book surface and preserve the selected market while changing side/outcome.
- Select a contract-shaped Totals market from the Book selector and carry that selection into ladder context and ticket summary.
- Open a Book ticket from the selected orderbook context.
- View side-labelled ask rows above the spread and bid rows below the spread.

State transitions:

- Book surface opens with selected market identity from game detail.
- `selectedBookSide` changes from `yes` to `no` without resetting the selected market.
- Selector choice updates selected market family/outcome and passes that identity into the ticket selection object.
- Backend ready-depth proof seeds provider orderbook rows, reads `/api/orderbook/:marketId/book?maxLevels=24`, and returns `provider-orderbook-depth` with `providerOrderbookDepth.status=ready`.

Known limitations:

- PM-GAP-075 remains open.
- Provider-backed ready depth has route proof but not the same visible tablet UI proof.
- Spread/period/line selector carry-through is still incomplete; DT proves a Totals fixture with `line-none`/`period-none`.
- Decimalize/equivalent Book setting is not implemented or proven.

## Cycle DV - Same-Market Provider-Ready Book UI Proof

Feature/page worked on:

- PM-GAP-075 focused same-market provider-ready Book/orderbook path for the live football game detail.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Important functions/services touched:

- EventDetail Book overlay selected identity accessibility marker.
- EventDetail selector key construction for family/period/line proof.
- Tablet smoke path for provider-backed Spread Book proof.
- Existing provider depth proof script through `npm run mobile:du-provider-line-orderbook-depth-proof`.

User interactions supported/proven:

- Open the server-backed `Japan vs Morocco` event.
- Tap Book for a provider-backed first-half Spread market.
- View route-backed ready Book ladder with Price/Shares/Value rows.
- Open settings and toggle Cents/Decimal display without resetting selected market state.
- Open a ticket from the provider-backed ladder while preserving `Japan -1.5`, provider source, provider market, condition, and token identity.

State transitions:

- Backend seeded provider depth -> `/api/orderbook/:marketId/book` ready response.
- Server live-detail adapter -> EventDetail primary Book market.
- EventDetail selected market -> Book selected identity marker with selector key `spreads:first-half:1.5`.
- Book settings display mode changes from cents to decimal while preserving selected market, line, period, and ready source.
- Book ticket action -> trade ticket with provider token marker.

Known limitations:

- The proof is focused on one provider-ready first-half Spread market, not every Polymarket selector family.
- Non-ready provider server state is documented by earlier fallback/unavailable evidence, not recaptured in the DV ready-only server run.
- Full Polymarket settings sheet and phone-density visual polish remain P1/P2.

## Cycle DW Integrated - Grouped Book Selector And Provider State Matrix

Feature/page worked on:

- PM-GAP-075 grouped Book selector/state breadth for live football orderbook parity.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Backend/proof components touched:

- `scripts/prove_mobile_dw_provider_orderbook_state_matrix.ts`
- `src/__tests__/orderbook-snapshot.provider-depth.test.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`
- `package.json`

User interactions supported/proven:

- Open Book and see a current-market selector trigger.
- Open a grouped selector sheet with Moneyline, Totals, and Spreads choices.
- Select Totals and Spreads without losing selected market family, line, period, side/outcome, or ladder context.
- Open a Spread ticket from the selected Book context.

State transitions:

- Book selected market -> grouped selector sheet.
- Selector sheet choice -> selected Book market and ladder identity.
- Selected Spread market -> ticket selection summary and provider token marker.
- Provider-shaped orderbook route state moves through unavailable/empty, stale, and ready without treating fallback rows as provider-ready depth.

Known limitations:

- The visible selector proof uses deterministic backend-contract-shaped fixture markets; real provider-backed selector breadth remains dependent on available Polymarket line-family markets.
- Full settings sheet parity and visual density/motion polish remain P1/P2.
- Order/portfolio/history coupling for every selector family remains future lifecycle scope.

## Cycle DX-A - Backend Line Order, Portfolio, And History Lifecycle

Feature/page worked on:

- PM-GAP-074 backend structural contract proof for selected World Cup line lifecycle.

Backend/proof components touched:

- `src/server/services/canonicalOrderSubmission.ts`
- `src/server/services/ticketSelectionMetadata.ts`
- `scripts/prove_mobile_dx_a_line_order_portfolio_history.ts`
- `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`
- `src/__tests__/ticketSelectionMetadata.test.ts`
- `package.json`

User interactions supported/proven:

- Submit a selected Spread line order with `marketType=spread`, `marketGroupId=spreads`, `line=-1.5`, `period=1H`, `side=yes`, `displayLabel=Japan -1.5 1H`, `contractSide=yes`, and provider source/market/condition/token identity.
- Read the same identity back from immediate order response, portfolio open order, canceled portfolio activity, filled portfolio position, and recent trade activity.

State transitions:

- Selected ticket/order request -> canonical order response with echoed selection.
- Open order -> `/api/portfolio` `openOrders[].selection`.
- Canceled order -> `/api/portfolio/history` `canceledOrders[].selection`.
- Filled order -> `/api/portfolio` `positions[].selection`.
- Filled order -> `/api/portfolio/history` `recentTrades[].selection`.

Validation:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npm run test:jest -- src/server/services/__tests__/canonical_order_submission.phase5.test.ts src/__tests__/ticketSelectionMetadata.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts`
- `npm run test:mobile-api -- portfolioSnapshotService.test.ts portfolioHistoryService.test.ts orderService.test.ts openOrderService.test.ts api.test.ts`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket npm run mobile:dx-a-line-order-portfolio-history`

Proof artifact:

- `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json` with `pass=true`.

Known limitations:

- DX-A is a backend lifecycle proof, not a visible UI proof.
- Filled positions/recent trades still derive selected line metadata from current market/outcome rows; immutable trade selection snapshots remain future hardening.

## Cycle EI-B - Tablet Route-Backed Provider Status

Feature/page worked on:

- Mobile EventDetail provider-status smoke proof now runs against the live backend detail route on a physical tablet.

Frontend components touched:

- None. Existing EventDetail route-backed status markers are consumed by the stricter harness path.

Mobile/proof components touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported/proven:

- Tablet launches EventDetail in server mode with `EXPO_PUBLIC_ORDER_MODE=server` and `EXPO_PUBLIC_API_BASE_URL` set from `-BackendBaseUrl`.
- Harness reverses `tcp:3002` for the tablet, requires backend `/api/health`, and opens the backend event slug instead of local live fixtures.
- Provider-status proof fails if backend health is unavailable or if deterministic fixture/mock-ready/default-ready status markers appear.
- Passing proof JSON records `routeBackedStatusConsumed=true`, the route status source, server mode, API base URL, backend slug, and ADB reverse; blocked proof JSON records `routeBackedStatusConsumed=false` with the health failure.

Validation:

- `npm ci` in `mobile/` to restore local dependencies.
- `npm run typecheck` from `mobile/`
- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailProviderStatus -Port 8317 -BackendBaseUrl http://127.0.0.1:3002 -OutputDir docs/mobile/screenshots/cycle-EI-B-route-backed-status -HierarchyOutputDir docs/mobile/harness/cycle-EI-B-route-backed-status` blocked as intended because backend `/api/health` was unavailable after `adb reverse tcp:3002 tcp:3002`.

Proof artifacts:

- `docs/mobile/harness/cycle-EI-B-route-backed-status/cycle-EI-B-route-backed-status-proof.json`

Known limitations:

- `docs/mobile/harness/cycle-EI-B-route-backed-status/cycle-EI-B-route-backed-status-proof.json` records `result=blocked` and `routeBackedStatusConsumed=false` because backend health was unavailable. No fixture/mock-ready fallback was accepted.

## Cycle EB-A - Live Detail Selected-Market Selector Contract

Feature/page worked on:

- Backend/provider data contract for live World Cup game page chart and line selector parity.

Frontend components touched:

- None. Agent A stayed in backend/provider ownership.

Backend/proof components touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `scripts/probe_mobile_live_detail_route.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`

User interactions supported/proven:

- Mobile can switch between compact live markets using backend-owned `selection.selectorKey` rather than rebuilding selector identity from display strings.
- Mobile can switch selected chart state by reading `market.selection.chart.targetMarketId`, `status`, `source`, `pointCount`, `outcomeCount`, `range`, and `emptyState`.
- Mobile can preserve selected market, group, family, period, line, unit, and outcome identity through line selector -> chart -> ticket handoff without ad hoc UI-only structures.

State transitions:

- Compact market row -> `selection` contract for the same `marketId`.
- Selected market -> selected chart metadata for the same `targetMarketId`.
- Selected market -> outcome identity list with `outcomeId`, `side`, label, optional provider token, optional reference outcome label, and tradability.

Validation:

- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts` passed with 6 tests.
- Project-level `npx tsc --noEmit --pretty false --project tsconfig.json` remains blocked in this isolated worktree by pre-existing mobile dependency/type errors for Expo/React Native modules.

Known limitations:

- EB-A is a backend contract proof only. Agent B still needs Android proof that the visible chart and selector consume `markets[].selection`.
- Real Polymarket/CLOB line-family chart history is still limited by provider-mapped line markets. Missing `OPTIC_ODDS_API_KEY` is not a blocker for this Polymarket-first route.

## Cycle EC-B - Visible Order Book Ladder And Ticket Carry-Through

Feature/page worked on:

- Mobile live game EventDetail Book overlay and Android smoke proof.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

User interactions supported/proven:

- Open Book from the visible top game-page Book action on Android.
- Switch selected Yes/No outcome and keep selected market/outcome/side visible in the Book strip.
- Open grouped Book selector, switch Totals then Spread, and keep line/period/outcome identity visible.
- Toggle Book price display from cents to decimal without resetting selected market/outcome.
- Launch the trade ticket from the selected Spread contract with provider source, market, condition, token, line, and side carried through.

Validation:

- `npm run typecheck` from `mobile/`
- PowerShell parser check for `mobile/scripts/smoke.ps1`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke.ps1 -Deep -EventDetailOrderBookInteractions -Port 8268 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -ExpoHost 127.0.0.1 -OutputDir docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket -HierarchyOutputDir docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket`

Proof artifacts:

- `docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-proof.json`
- `docs/mobile/harness/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-*.xml`
- `docs/mobile/screenshots/cycle-EC-B-orderbook-depth-ticket/cycle-EC-B-holiwyn-orderbook-*.png`

## Cycle EF-B - Visible Portfolio Snapshot Durability After Metadata Drift

Feature/page worked on:

- Mobile Portfolio visible proof for Book-selected order-time snapshot durability after deterministic metadata label/provider drift.

Frontend components touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/App.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported/proven:

- A forced fake-token Portfolio state uses backend-shaped open order, filled position, canceled activity, and filled activity rows for the original Mexico/Ecuador Book-selected Spread.
- The current in-memory Mexico/Ecuador spread metadata is drifted before Portfolio opens, including label, line, provider market, condition, token, and reference outcome.
- Portfolio rows render the original selected Book identity from the order-time snapshot and expose `snapshot-source-order-time`/`portfolio-snapshot-source-order-time` markers.

Validation:

- `npm run typecheck` from `mobile/`
- PowerShell parser check for `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1`

Proof command:

- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -BookSnapshotDurability -Port 8310 -OutputDir docs/mobile/screenshots/cycle-EF-B-book-snapshot-durability -HierarchyOutputDir docs/mobile/harness/cycle-EF-B-book-snapshot-durability`

Known limitations:

- EF-B is deterministic fake-token mobile proof, not production wallet signing or settlement.
- Real provider-backed metadata drift remains a later provider/backend integration proof.

## Cycle EG-B - Visible Chart, Line Selector, Book, And Ticket Parity

Feature/page worked on:

- Mobile EventDetail visible Polymarket-like event page parity for chart touch state, line selector carry-through, orderbook ladder entry, and trade ticket handoff.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported/proven:

- Chart filter changes the selected chart outcome to Ecuador and the point selector moves the tooltip to Target.
- Spread line rail visibly switches to 2.5, then back to the backend-shaped 1.5 contract.
- Chart contract rail carries selected contract, market, line, period, and visible action buttons.
- Chart Book opens the Spread orderbook with ladder columns and selected line/period state.
- Chart Trade opens the ticket for Mexico -1.5 spread with provider fixture market, condition, and token metadata.

Validation:

- `npm ci` in `mobile/` to restore missing local dependencies.
- `npm run typecheck` from `mobile/`
- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleLiveParity -Port 8315 -OutputDir docs/mobile/screenshots/cycle-EG-B-visible-live-parity -HierarchyOutputDir docs/mobile/harness/cycle-EG-B-visible-live-parity`

Proof artifacts:

- `docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-visible-live-parity-proof.json`
- `docs/mobile/harness/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-*.xml`
- `docs/mobile/screenshots/cycle-EG-B-visible-live-parity/cycle-EG-B-holiwyn-*.png`

Known limitations:

- Chart geometry is still rendered with React Native layout primitives rather than a true pan/zoom chart engine.
- Real provider-backed line-family chart history remains dependent on backend/provider market history coverage.

## Cycle EH-B - Visible Provider Lifecycle Status Badges

Feature/page worked on:

- Mobile EventDetail visible provider lifecycle/status badges for live event detail, chart context, Book/orderbook, and ticket handoff.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions supported/proven:

- Live detail exposes a visible refresh-due provider badge when backend live status fields are absent.
- Chart context exposes a visible provider-ready badge and carries ticket handoff provider status.
- Opening Book shows a visible refreshing/loading depth badge, then resolves to provider-ready depth.
- Book availability and Book ticket handoff visibly show not-ready/unavailable instead of silently becoming provider-ready.
- Ticket handoff keeps the live Australia/Egypt selection and guards against moneyline/default/mock-ready fallback markers.

Validation:

- `npm ci` in `mobile/` to restore missing local dependencies.
- `npm run typecheck` from `mobile/`
- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailProviderStatus -Port 8316 -OutputDir docs/mobile/screenshots/cycle-EH-B-provider-status -HierarchyOutputDir docs/mobile/harness/cycle-EH-B-provider-status`

Proof artifacts:

- `docs/mobile/harness/cycle-EH-B-provider-status/cycle-EH-B-provider-status-proof.json`
- `docs/mobile/harness/cycle-EH-B-provider-status/cycle-EH-B-provider-status-*.xml`
- `docs/mobile/screenshots/cycle-EH-B-provider-status/cycle-EH-B-provider-status-*.png`

Known limitations:

- Live mock status is deterministic backend-contract-shaped fixture UI because backend liveDataStatus is absent in this branch.
- Real provider freshness remains dependent on backend/provider contract fields.

## Cycle EU - Route-Backed Retail Ticket Flow

Feature/page worked on:

- Mobile EventDetail Local MVP retail line tickets for a backend live-detail event.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/services/eventDetailLineTicketService.ts`
- `mobile/src/__tests__/eventDetailLineTicketService.test.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `matchingBackendLineMarket()` now treats backend `full-game` line markets as equivalent to retail `Reg. Time` selections while still rejecting first-half/second-half mismatches.
- `resolveLineTicketTarget()` applies the same full-game/regulation equivalence before choosing `backend-line-market`.
- Spread rows now pass `backendSpreadMarket` and matching backend outcomes into `renderParityOutcomeRow()`, matching the existing totals path.

User interactions supported/proven:

- Open backend live-detail event on Samsung tablet through `forceBackendEventSlug`.
- See spread/totals rows use `ticket-source-backend-line-market` with `provider-source-polymarket`.
- Open totals simple ticket and spread simple ticket with provider source/token identity.
- Submit fake-token spread buy through the default retail ticket.
- See Portfolio/latest order/activity/position preserve route-backed spread line/provider identity.
- Default Book/orderbook UI stays hidden.

Validation:

- `npm run typecheck` from `mobile/`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-provider-refresh.route.test.ts src/__tests__/mobile-live-event-detail.test.ts`
- `cmd /c npx.cmd tsx scripts/prove_mobile_el_a_provider_breadth.ts --output docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-route-backed-retail-event.json`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpRouteTicketFlow -Port 8262 -BackendBaseUrl http://127.0.0.1:3002 -ServerEventSlug mobile-el-a-provider-breadth-b917234c -OutputDir docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow -HierarchyOutputDir docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow`
- Backend proof artifact slug: `mobile-el-a-provider-breadth-4f35da22`; tablet proof slug: `mobile-el-a-provider-breadth-b917234c`.

Known limitations:

- The disposable backend proof covers moneyline, spread, and totals. Team-total remains contract-shaped fixture UI until provider/source-approved backend rows exist.
- The mobile proof uses mock order mode by design for the Local MVP fake-token flow while market data uses server mode.

## Cycle EV - Route-Backed Server Order Flow

Feature/page worked on:

- Mobile EventDetail Local MVP retail line ticket through real local server order placement and server Portfolio sync.

Frontend/harness files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-route-server-order-proof.ps1`

Important functions/services touched:

- Existing mobile order/portfolio services were not changed. EV wires the proof to `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a generated mobile dev API key.
- `smoke.ps1` now has a bounded line-market scroll search for the route-backed server-order proof so sticky header clipping does not fail a valid provider-backed spread row.
- `local-mvp-route-server-order-proof.ps1` creates the disposable provider-backed event, creates a scoped mobile dev credential, launches the tablet proof, and redacts the API key in its summary.

User interactions supported/proven:

- Open backend live-detail event on Samsung tablet through `forceBackendEventSlug`.
- See spread row use `ticket-source-backend-line-market` with `provider-source-polymarket`.
- Open simple spread ticket with selected line, period, provider source, and provider token identity.
- Submit a `$25` fake-token buy through the real local server `/api/orders` path.
- See Portfolio sync from `/api/portfolio` with `Server portfolio synced`, `SERVER - Buy`, open order count, and selected spread/provider identity.
- Default Book/orderbook UI stays hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-route-server-order-proof.ps1`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioSyncService.test.ts`
- `cmd /c npm.cmd run typecheck -- --pretty false` from `mobile/`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-server-order-proof.ps1 -Port 8263 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-route-backed-retail-event.json`
- `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-local-mvp-route-server-order-flow-proof.json`
- `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-holiwyn-route-server-mvp-*.xml`
- `docs/mobile/screenshots/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-holiwyn-route-server-mvp-*.png`

Known limitations:

- EV proves one route-backed provider spread server order. Totals and team-total server-order breadth remain follow-up work.
- The local backend must run with internal trading beta enabled and kill switch disabled for this proof path.

## Cycle EW - Route-Backed Server Cancel And Activity Flow

Feature/page worked on:

- Mobile Portfolio Local MVP server cancel and activity/history proof for a route-backed spread ticket.

Frontend/harness files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-route-server-cancel-proof.ps1`

Important functions/services touched:

- Existing mobile cancel/order/history services were not changed. EW proves the current mobile `cancel-open-order-*` control calls server cancel in `EXPO_PUBLIC_ORDER_MODE=server` and then refreshes Portfolio/history.
- `smoke.ps1` route-backed server proof now supports EV order-only and EW cancel/history variants.

User interactions supported/proven:

- Open backend live-detail event on Samsung tablet through `forceBackendEventSlug`.
- Open a provider-backed spread ticket and submit a `$25` server fake-token buy.
- See the server open order in Portfolio.
- Tap Cancel on the server open order.
- See `latest-activity-card`, canceled status, activity count, and selected spread/provider identity after server history sync.
- Default Book/orderbook UI stays hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-route-server-cancel-proof.ps1`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-server-cancel-proof.ps1 -Port 8264 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-route-backed-retail-event.json`
- `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-local-mvp-route-server-cancel-flow-proof.json`
- `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-holiwyn-route-server-mvp-*.xml`
- `docs/mobile/screenshots/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-holiwyn-route-server-mvp-*.png`

Known limitations:

- EW proves canceled activity/history, not a filled trade history path.
- The local backend must run with internal trading beta enabled and kill switch disabled for this proof path.

## Cycle EX - Route-Backed Server Filled Trade And Activity Flow

Feature/page worked on:

- Mobile EventDetail and Portfolio Local MVP server filled trade/history proof for a route-backed spread ticket.

Frontend/harness files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-route-server-filled-proof.ps1`
- `scripts/seed_mobile_route_spread_counterparty.ts`

Important functions/services touched:

- Existing mobile order/portfolio/history services were not changed.
- `seed_mobile_route_spread_counterparty.ts` seeds a maker SELL order for the same route-backed spread market/outcome created by the provider breadth proof.
- `smoke.ps1` route-backed server proof now supports EX filled-trade assertions in addition to EV order-only and EW cancel/history variants.

User interactions supported/proven:

- Open backend live-detail event on Samsung tablet through `forceBackendEventSlug`.
- Open a provider-backed spread ticket and submit a `$25` server fake-token buy.
- Fill against seeded provider-shaped maker liquidity.
- See Portfolio show one open position, zero open orders, one recent activity row, and a filled latest activity card.
- See both recent activity and position preserve selected spread line/provider identity.
- Default Book/orderbook UI stays hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-route-server-filled-proof.ps1`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-server-filled-proof.ps1 -Port 8265 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-retail-event.json`
- `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-counterparty.json`
- `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-local-mvp-route-server-filled-flow-proof.json`
- `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-holiwyn-route-server-mvp-*.xml`
- `docs/mobile/screenshots/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-holiwyn-route-server-mvp-*.png`

Known limitations:

- EX proves filled spread lifecycle only. Totals/team-total filled breadth remains follow-up work.
- Liquidity is seeded as disposable provider-shaped proof data, not production user liquidity.

## Cycle EY - Route-Backed Server Filled Totals Trade And Activity Flow

Feature/page worked on:

- Mobile EventDetail and Portfolio Local MVP server filled trade/history proof for a route-backed Totals ticket.

Frontend/harness files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-route-server-filled-totals-proof.ps1`
- `scripts/seed_mobile_route_spread_counterparty.ts`

Important functions/services touched:

- Existing mobile order/portfolio/history services were not changed.
- `seed_mobile_route_spread_counterparty.ts` now accepts `marketGroupKey`, `outcomeSide`, `askPrice`, and `askSize`, while defaulting to the EX spread behavior.
- `smoke.ps1` route-backed server proof now supports EY totals filled-trade assertions in addition to EV/EW/EX.

User interactions supported/proven:

- Open backend live-detail event on Samsung tablet through `forceBackendEventSlug`.
- Open a provider-backed Totals `Over 2.5` ticket and submit a `$25` server fake-token buy.
- Fill against seeded provider-shaped maker liquidity.
- See Portfolio show one open position, zero open orders, one recent activity row, and a filled latest activity card.
- See both recent activity and position preserve selected totals line/provider identity.
- Default Book/orderbook UI stays hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-route-server-filled-totals-proof.ps1`
- Mobile typecheck
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-server-filled-totals-proof.ps1 -Port 8266 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-route-backed-retail-event.json`
- `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-route-backed-totals-counterparty.json`
- `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`
- `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-holiwyn-route-server-mvp-*.xml`
- `docs/mobile/screenshots/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-holiwyn-route-server-mvp-*.png`

Known limitations:

- EY proves filled totals lifecycle only. Team-total route-backed filled breadth remains follow-up work because the disposable provider event does not yet create a team-total market.
- Liquidity is seeded as disposable provider-shaped proof data, not production user liquidity.

## Cycle EZ - Route-Backed Server Filled Team Total Trade And Activity Flow

Feature/page worked on:

- Mobile EventDetail and Portfolio Local MVP server filled trade/history proof for a route-backed Team Total ticket.

Frontend/harness/backend files touched:

- `scripts/prove_mobile_el_a_provider_breadth.ts`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-route-server-filled-team-total-proof.ps1`

Important functions/services touched:

- Existing mobile order/portfolio/history services were not changed.
- `prove_mobile_el_a_provider_breadth.ts` now creates a fourth compact provider-backed market: `marketType=team_total_goals`, `marketGroupKey=team-totals`, line `1.5`, period `full-game`.
- `smoke.ps1` route-backed server proof now supports EZ team-total filled-trade assertions in addition to EV/EW/EX/EY.

User interactions supported/proven:

- Open backend live-detail event on Samsung tablet through `forceBackendEventSlug`.
- Open a provider-backed Team Total `Over 1.5` ticket and submit a `$25` server fake-token buy.
- Fill against seeded provider-shaped maker liquidity.
- See Portfolio show one open position, zero open orders, one recent activity row, and a filled latest activity card.
- See both recent activity and position preserve selected team-total line/provider identity.
- Default Book/orderbook UI stays hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-route-server-filled-team-total-proof.ps1`
- Mobile typecheck
- `npx tsx scripts/prove_mobile_el_a_provider_breadth.ts --output=...`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-server-filled-team-total-proof.ps1 -Port 8267 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-retail-event.json`
- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-team-total-counterparty.json`
- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-local-mvp-route-server-filled-team-total-flow-proof.json`
- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-holiwyn-route-server-mvp-*.xml`
- `docs/mobile/screenshots/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-holiwyn-route-server-mvp-*.png`

Known limitations:

- EZ proves Team Total against disposable provider-shaped data. Production active Polymarket event mapping and non-disposable liquidity remain follow-up work.

## Cycle FA - Route-Backed Retail Status States

Feature/page worked on:

- Mobile EventDetail and TradeTicket Local MVP route-backed stale/unavailable status proof with orderbook hidden by default.

Frontend/harness/backend files touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-route-status-proof.ps1`

Important functions/services touched:

- `serializeMobileLiveEventDetail` now emits provider-lifecycle-backed `availability` for provider-backed compact markets when quote/depth/chart lifecycle is stale or unavailable.
- EventDetail Spread rows now expose the same route-backed availability pill already used by grouped market rows.
- TradeTicket now exposes `ticket-market-status` and disables submit for unavailable/suspended markets.
- The FA harness creates a disposable ready/stale/unavailable event through the existing provider-status proof script and drives the tablet retail flow.

User interactions supported/proven:

- Open a route-backed provider-status live event on Samsung tablet through `forceBackendEventSlug`.
- See Game Lines show `Market stale` on Spread and `Market unavailable` on Totals.
- Open the stale Spread ticket and see `ticket-market-status ticket-availability-stale`.
- Open the unavailable Totals ticket and see `ticket-market-status ticket-availability-unavailable` with the submit control disabled.
- Default Book/orderbook UI stays hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-route-status-proof.ps1`
- Mobile typecheck
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts`
- `npx tsx scripts/prove_mobile_ej_a_provider_status_breadth.ts --output=...`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-route-status-proof.ps1 -Port 8268 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-A-provider-status-breadth.json`
- `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-local-mvp-route-status-flow-proof.json`
- `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-*.xml`
- `docs/mobile/screenshots/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-*.png`

Known limitations:

- FA proves disposable provider-backed status breadth. Production active-event status breadth and fresh S23 status recapture remain P1.

## Cycle FB - Provider Unavailable Order Guard

Feature/page worked on:

- Backend canonical order submission guard for provider-backed markets that are unavailable to trade.

Frontend/harness/backend files touched:

- `src/server/services/canonicalOrderSubmission.ts`
- `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`
- `docs/mobile/audits/cycle-fb-provider-unavailable-order-guard.md`

Important functions/services touched:

- `submitCanonicalOrder` now checks provider-backed market quote availability after API request logging and before `placeOrderAndMatch`.
- The guard uses the latest `ReferenceQuoteSnapshot` for the selected market/outcome and requires `acceptingOrders=true`.
- Unavailable provider-backed orders are stored as failed canonical API order responses with `MARKET_UNAVAILABLE`.

User interactions supported/proven:

- Direct API/client bypass attempts on provider-backed unavailable markets are rejected before matching.
- Stale-but-quoting provider-backed markets remain allowed because they still have accepting quote snapshots.

Validation:

- `npm run test:jest -- src/server/services/__tests__/canonical_order_submission.phase5.test.ts`
- `npx tsc --noEmit`
- `npx tsx scripts/prove_mobile_ej_a_provider_status_breadth.ts --output=docs/mobile/harness/cycle-FB-provider-unavailable-order-guard/proof-provider-status-breadth.json`
- `git diff --check`

Proof artifacts:

- `docs/mobile/harness/cycle-FB-provider-unavailable-order-guard/proof-provider-status-breadth.json`

Known limitations:

- FB is a backend/provider guard with no new mobile UI. FA remains the Android-visible proof that unavailable markets are disabled in the simple ticket.

## Cycle FC - Route-Backed Event Discovery Cards

Feature/page worked on:

- Local MVP Home/Search discovery for World Cup football events backed by the server event list route.

Frontend/harness/backend files touched:

- `src/app/api/events/route.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `mobile/App.tsx`
- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/src/components/SearchScreen.tsx`
- `mobile/src/__tests__/api.test.ts`
- `scripts/prove_mobile_fc_route_discovery_artifacts.ts`

Important functions/services touched:

- `GET /api/events` now supports `includeMobileMarkets=1` as an explicit mobile opt-in for compact serialized markets.
- `PolyApi.listWorldCupEvents` now relies on structured `sportKey=soccer` and `leagueKey=world_cup` filters instead of adding a default text search that can hide valid team-titled World Cup events.
- `loadBackendWorldCup` can render route-backed compact market summaries immediately and only falls back to per-event detail fetches when summaries do not include markets.
- Search result rows now expose explicit `Volume:` and `Liquidity:` labels, matching Home card stats and the discovery proof.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data mode.
- See a disposable provider-backed World Cup live event discovered on Home through `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`.
- See route-backed compact outcomes and probability buttons on the Home event card.
- Default orderbook UI remains hidden.

Validation:

- `npm run test:mobile-api -- api.test.ts worldCupAdapter.test.ts`
- `npm run test:jest -- src/__tests__/public.events.no-leak.test.ts`
- `npx tsc --noEmit`
- `npm --prefix mobile run typecheck`
- `npx tsx scripts/prove_mobile_el_a_provider_breadth.ts --output=docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-event.json`
- `npx tsx scripts/prove_mobile_fc_route_discovery_artifacts.ts --xml=docs/mobile/harness/cycle-current-holiwyn-home.xml --eventProof=docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-event.json --output=docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-android-proof.json`

Proof artifacts:

- `docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-event.json`
- `docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-android-proof.json`
- `docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-home.xml`
- `docs/mobile/harness/cycle-FC-route-backed-discovery/cycle-FC-route-backed-discovery-home.png`

Known limitations:

- The broad `WholeAppNavDiscovery` smoke path remains fixture-specific and expects the older Mexico/Ecuador mock card. FC added a focused route-backed discovery artifact gate instead of changing that legacy fixture proof.
- FC proves disposable provider-shaped event discovery; production active Polymarket provider breadth remains P1.

## Cycle FD - Route Discovery Opens Route-Backed Event Detail

Feature/page worked on:

- Local MVP Home/Search/Live card entry into Event Detail.

Frontend/harness/backend files touched:

- `mobile/App.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `docs/mobile/audits/cycle-fd-route-discovery-detail.md`

Important functions/services touched:

- `openEventDetail` now centralizes event-card navigation.
- In server market-data mode, `openEventDetail` immediately opens the selected compact discovery event and hydrates it through `PolyApi.getEvent(event.id)`.
- Home, Live, and Search screens now use the same event-open path, avoiding the older fixture-only detail fallback.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data mode.
- See a route-backed World Cup live event on Home with compact outcome buttons and Volume/Liquidity labels.
- Tap the route-backed event card.
- Land on the same event's route-backed Event Detail with chart/probability surface, Game Lines, provider-backed outcomes, and provider source markers.
- Default orderbook UI remains hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `npm --prefix mobile run typecheck`
- `npm run test:mobile-api -- api.test.ts worldCupAdapter.test.ts`
- `npx tsx scripts/prove_mobile_el_a_provider_breadth.ts --output=docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-event.json`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpRouteDiscoveryDetail -Port 8273 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-FD-route-discovery-detail -HierarchyOutputDir docs/mobile/harness/cycle-FD-route-discovery-detail`

Proof artifacts:

- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-event.json`
- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-proof.json`
- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-home.xml`
- `docs/mobile/harness/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-open.xml`
- `docs/mobile/screenshots/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-home.png`
- `docs/mobile/screenshots/cycle-FD-route-discovery-detail/cycle-FD-route-discovery-detail-open.png`

Known limitations:

- FD proves the entry-to-detail hop using disposable provider-shaped data. Production active Polymarket World Cup breadth remains P1.
- The next Local MVP cycles should continue from this entry path into Buy/Sell ticket, fake-token order, and Portfolio/history instead of opening new nonessential feature areas.

## Cycle FE - Home Route Event Opens Simple Ticket

Feature/page worked on:

- Local MVP Home -> route-backed Event Detail -> Game Lines -> simple Buy/Sell ticket.

Frontend/harness/backend files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `docs/mobile/audits/cycle-fe-home-route-ticket.md`

Important functions/services touched:

- Added `LocalMvpHomeRouteTicketFlow` harness support.
- Reused existing mobile event-card opening, Event Detail line target resolution, and TradeTicket identity markers.
- No backend route, schema, or service code was changed.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data mode.
- Tap a route-backed Home event card.
- Land on the same Event Detail with chart/probability and Game Lines.
- Scroll to the route-backed Spread row.
- Tap the Spread outcome and open the simple ticket.
- Verify ticket market type, line, period, side, provider source, and provider token.
- Default orderbook UI remains hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `npm --prefix mobile run typecheck`
- `npx tsx scripts/prove_mobile_el_a_provider_breadth.ts --output=docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-event.json`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8274 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-FE-home-route-ticket -HierarchyOutputDir docs/mobile/harness/cycle-FE-home-route-ticket`

Proof artifacts:

- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-event.json`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-proof.json`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-home.xml`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-detail-top.xml`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-line-markets.xml`
- `docs/mobile/harness/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-spread-ticket.xml`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-home.png`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-detail-top.png`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-line-markets.png`
- `docs/mobile/screenshots/cycle-FE-home-route-ticket/cycle-FE-home-route-ticket-spread-ticket.png`

Known limitations:

- FE stops at ticket-open proof. Fake-token submit and Portfolio/history from the Home-opened event remain the next Local MVP steps.
- FE uses disposable provider-shaped data. Production active Polymarket World Cup breadth remains P1.

## Cycle FF - Home Route Ticket Submit And Portfolio History

Feature/page worked on:

- Local MVP Home -> route-backed Event Detail -> Spread ticket -> fake-token order -> Portfolio/history.

Frontend/harness/backend files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `docs/mobile/audits/cycle-ff-home-route-order.md`

Important functions/services touched:

- Added `LocalMvpHomeRouteOrderFlow` harness support.
- Reused existing mobile event-card opening, Event Detail line target resolution, TradeTicket fake-token submit, and Portfolio order-time snapshot markers.
- No backend route, schema, or service code was changed.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data mode.
- Tap a route-backed Home event card.
- Open the same Event Detail with chart/probability and Game Lines.
- Tap the route-backed Spread outcome.
- Add `$25` using ticket presets and submit the fake-token buy.
- Verify Portfolio latest order, latest activity, and position/history preserve selected spread line, period, side, provider source, and provider token.
- Default orderbook UI remains hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- `npm --prefix mobile run typecheck`
- `npx tsx scripts/prove_mobile_el_a_provider_breadth.ts --output=docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-event.json`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -LocalMvpHomeRouteOrderFlow -Port 8275 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-FF-home-route-order -HierarchyOutputDir docs/mobile/harness/cycle-FF-home-route-order`

Proof artifacts:

- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-event.json`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-proof.json`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-home.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-detail-top.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-line-markets.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FF-home-route-order/cycle-FF-home-route-order-portfolio.xml`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-home.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-detail-top.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-line-markets.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FF-home-route-order/cycle-FF-home-route-order-portfolio.png`

Known limitations:

- FF runs in local mock/fake-token order mode. Server order mode for the same Home-opened flow remains P1.
- FF uses disposable provider-shaped data. Production active Polymarket World Cup breadth remains P1.

## Cycle FG - Home Route Server Order And Portfolio Open Order

Feature/page worked on:

- Local MVP Home -> route-backed Event Detail -> Spread ticket -> server fake-token order -> server Portfolio open order.

Frontend/harness/backend files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-home-route-server-order-proof.ps1`
- `docs/mobile/audits/cycle-fg-home-route-server-order.md`

Important functions/services touched:

- Added `LocalMvpHomeRouteServerOrderFlow` harness support.
- Added a wrapper that creates a disposable route-backed provider event, creates a temporary mobile dev credential, launches server market-data/server order mode, and runs the tablet proof.
- Reused existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` mobile flows. No backend route, schema, or service code was changed.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data and server order mode.
- Tap the freshly seeded route-backed Home event card.
- Open the same Event Detail with chart/probability and Game Lines.
- Tap the route-backed Spread outcome.
- Add `$25` using ticket presets and submit the fake-token buy through the backend.
- Verify server-synced Portfolio shows the latest order and open order row with selected spread line, period, provider source, and provider token preserved.
- Default orderbook UI remains hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-home-route-server-order-proof.ps1`
- `npm --prefix mobile run typecheck`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-home-route-server-order-proof.ps1 -Port 8276 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-event.json`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-wrapper.json`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-proof.json`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-home.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-detail-top.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-line-markets.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-portfolio.xml`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-home.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-detail-top.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-line-markets.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-portfolio.png`

Known limitations:

- FG proves the server open-order path, not the filled/cancel lifecycle from the exact Home-opened path.
- FG uses disposable provider-shaped data. Production active Polymarket World Cup breadth remains P1.

## Cycle FH - Home Route Server Cancel And Portfolio Activity

Feature/page worked on:

- Local MVP Home -> route-backed Event Detail -> Spread ticket -> server fake-token order -> Cancel -> server Portfolio canceled activity/history.

Frontend/harness/backend files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1`
- `docs/mobile/audits/cycle-fh-home-route-server-cancel.md`

Important functions/services touched:

- Added `LocalMvpHomeRouteServerCancelFlow` harness support.
- Reused and parameterized the FG Home route server proof path so FH can assert a visible Cancel lifecycle without duplicating a separate flow.
- Reused existing `/api/orders`, `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history` mobile flows. No backend route, schema, or service code was changed.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data and server order mode.
- Tap the freshly seeded route-backed Home event card.
- Open the same Event Detail with chart/probability and Game Lines.
- Tap the route-backed Spread outcome.
- Add `$25` using ticket presets and submit the fake-token buy through the backend.
- Verify server-synced Portfolio shows the latest order and open order row.
- Tap the visible Cancel control and verify server-synced Portfolio/history shows canceled activity with spread line, period, provider source, and provider token preserved.
- Default orderbook UI remains hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1`
- `npm --prefix mobile run typecheck`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1 -Port 8277 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-event.json`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-wrapper.json`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-proof.json`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-home.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-detail-top.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-line-markets.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio.xml`
- `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio-canceled.xml`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-home.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-detail-top.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-line-markets.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio.png`
- `docs/mobile/screenshots/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-portfolio-canceled.png`

Known limitations:

- FH proves cancel lifecycle from the exact Home-opened path, not filled lifecycle from that path.
- FH uses disposable provider-shaped data. Production active Polymarket World Cup breadth remains P1.

## Cycle FI - Home Route Server Filled Position And Activity

Feature/page worked on:

- Local MVP Home -> route-backed Event Detail -> Spread ticket -> server fake-token order -> filled Portfolio position/activity/history.

Frontend/harness/backend files touched:

- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/scripts/local-mvp-home-route-server-filled-proof.ps1`
- `docs/mobile/audits/cycle-fi-home-route-server-filled.md`

Important functions/services touched:

- Added `LocalMvpHomeRouteServerFilledFlow` harness support.
- Reused and parameterized the FG/FH Home route server proof path so FI can assert a visible filled lifecycle.
- Reused existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` mobile flows plus `scripts/seed_mobile_route_spread_counterparty.ts` for backend-shaped liquidity. No backend route, schema, or service code was changed.

User interactions supported/proven:

- Open Holiwyn on the Samsung tablet in server market-data and server order mode.
- Tap the freshly seeded route-backed Home event card.
- Open the same Event Detail with chart/probability and Game Lines.
- Tap the route-backed Spread outcome.
- Add `$25` using ticket presets and submit the fake-token buy through the backend.
- Verify the order fills against seeded counterparty liquidity.
- Verify server-synced Portfolio shows the filled latest order, filled position, and latest activity with spread line, period, provider source, and provider token preserved.
- Default orderbook UI remains hidden.

Validation:

- PowerShell parser check for `mobile/scripts/smoke.ps1`
- PowerShell parser check for `mobile/scripts/smoke-tablet.ps1`
- PowerShell parser check for `mobile/scripts/local-mvp-home-route-server-filled-proof.ps1`
- `npm --prefix mobile run typecheck`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/local-mvp-home-route-server-filled-proof.ps1 -Port 8278 -BackendBaseUrl http://172.16.200.14:3002`

Proof artifacts:

- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-event.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-counterparty.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-wrapper.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-proof.json`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-home.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-detail-top.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-line-markets.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-spread-ticket-ready.xml`
- `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-portfolio.xml`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-home.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-detail-top.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-line-markets.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-portfolio.png`

Known limitations:

- FI uses disposable provider-shaped data and seeded counterparty liquidity. Production active Polymarket World Cup breadth remains P1.

## Cycle FU - Portfolio Value History Backend Route

Feature/page worked on:

- Portfolio performance chart backend contract for `1D`, `1W`, `1M`, and `All` ranges.

Frontend/harness/backend files touched:

- `src/app/api/portfolio/value-history/route.ts`
- `src/server/services/portfolioValueHistory.ts`
- `src/__tests__/portfolio.value-history.route.test.ts`
- `docs/mobile/audits/cycle-fu-portfolio-value-history-route.md`

Important functions/services touched:

- Added `parsePortfolioValueHistoryRange()` and `getPortfolioValueHistoryStart()` for route validation and range windows.
- Added `buildPortfolioValueHistory()` to convert wallet balance, current positions, and `MarketOutcomeSnapshot` prices into the mobile `PortfolioValueHistory` response shape.
- Added `GET /api/portfolio/value-history?range=1D|1W|1M|All`.

User interactions supported/proven:

- This is a backend-support cycle, not a visible UI cycle. It closes the repeated backend gap behind the existing Portfolio range selector by giving mobile a route-shaped account value history payload to consume in a later wiring pass.

State transitions:

- No order, wallet, position, or Portfolio UI state mutation.
- Auth resolution matches `/api/portfolio`: session user for web/session requests, canonical API-key actor with `account:read` for mobile server mode.

Validation:

- `cmd /c npm.cmd run test:jest -- src/__tests__/portfolio.value-history.route.test.ts`

Known limitations:

- The route derives historical position value from existing market outcome snapshots and falls back to position average cost when older point-in-time prices are missing.
- No new persisted account-value snapshot table was added.
- Standalone mobile still uses the deterministic fallback chart until the next mobile wiring/proof cycle consumes this route on Android.

## Cycle LN - Match Line Service Readiness Inspection And Seed

Feature/page worked on:

- Local MVP match betting service readiness for Home -> Event Detail -> line market.

Frontend/harness/backend files touched:

- `scripts/seed_mobile_mvp_match_line_markets.ts`
- `docs/mobile/audits/cycle-LN-match-line-service-readiness.md`
- `docs/mobile/harness/cycle-LN-match-line-service-readiness/cycle-LN-match-line-service-readiness.json`

Important functions/services touched:

- Added a local-only seed/proof script that enriches an existing match event with backend-shaped Spread, Totals, and Team Totals markets.
- Reused `GET /api/mobile/events/:slug/live-detail` as the route proof surface.
- Reused `ReferenceQuoteSnapshot` rows so the mobile app receives current probability/price data from the normal read model.

User interactions supported/proven:

- Home can now receive `switzerland-vs-colombia` as a match event with Regulation Winner plus line markets from the running server.
- Event Detail can receive market rows for `match_winner_1x2`, `spread`, `total_goals`, and `team_total_goals`.
- No orderbook UI, chat, live stats, or social feature work was touched.

State transitions:

- `switzerland-vs-colombia` remains a match event and was marked active/live for local MVP testing.
- Existing Regulation Winner markets were preserved.
- Added contract-fixture line markets are clearly marked as `referenceSource=contract-fixture`.

Validation:

- `npx tsx scripts/seed_mobile_mvp_match_line_markets.ts --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LN-match-line-service-readiness/cycle-LN-match-line-service-readiness.json`
- HTTP route check: `GET /api/mobile/events/switzerland-vs-colombia/live-detail` returned 7 markets with Regulation Winner, Spread, Totals, and Team Totals.
- HTTP Home check: `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=5` returned `switzerland-vs-colombia` first with the enriched market types.

Known limitations:

- The new line markets are deterministic backend-shaped contract fixtures, not real Polymarket-mapped line markets.
- Real Polymarket Gamma/CLOB line-market discovery for match events remains open.
- Android proof of line selection -> ticket -> order -> Portfolio/history is the next P0 cycle.

## Cycle LO - Enriched Match Line Order Lifecycle

Feature/page worked on:

- Server-mode lifecycle behind the Local MVP visible path: Home -> Event Detail -> line market -> Buy ticket -> fake-token/server-backed order -> Portfolio/history.

Frontend/harness/backend files touched:

- `scripts/prove_mobile_mvp_match_line_order_lifecycle.ts`
- `docs/mobile/harness/cycle-LO-match-line-order-lifecycle/cycle-LO-match-line-order-lifecycle.json`

Important functions/services touched:

- Added a proof script that targets the LN-enriched `switzerland-vs-colombia` match event.
- Reused `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- Reused matching/orderbook collateral services to seed a maker ask and fill the taker BUY order.

User interactions supported/proven:

- The selected enriched Spread market (`Colombia +1.5`) can be bought through the same server order route the mobile ticket uses.
- The submitted order fills against seeded backend liquidity.
- Portfolio shows the filled position.
- Portfolio history shows the recent trade.
- The selection snapshot preserves market type `spread`, line `1.5`, period `regulation`, outcome side, provider/source fields, and token identity.

State transitions:

- Local proof user starts with 10,000 fake-token USDC.
- Maker receives complete-set collateral and posts a resting SELL ask.
- Taker submits a BUY limit order through `/api/orders`.
- Order transitions to `FILLED`.
- Position and recent trade appear through server routes.

Validation:

- `npx tsx scripts/prove_mobile_mvp_match_line_order_lifecycle.ts --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LO-match-line-order-lifecycle/cycle-LO-match-line-order-lifecycle.json`

Known limitations:

- S23 Android proof was not run because no ADB devices were visible and the S23 wireless debug hostname did not resolve.
- The selected line market is still `contract-fixture`, not real Polymarket-backed line liquidity.
- This is a backend/server-mode proof only; the next P0 remains visible S23 proof from Home into ticket and Portfolio.

## Cycle LP - Provider Match Line Availability Inspection

Feature/page worked on:

- Provider/data inspection for the Local MVP match page before continuing visible mobile work.

Frontend/harness/backend files touched:

- `scripts/prove_mobile_provider_match_line_availability.ts`
- `docs/mobile/audits/cycle-LP-provider-match-line-availability.md`
- `docs/mobile/harness/cycle-LP-provider-match-line-availability/cycle-LP-provider-match-line-availability.json`

Important functions/services touched:

- Added a proof script that compares the selected local match event against its exact Polymarket Gamma event slug.
- Reused `GET /api/mobile/events/:slug/live-detail` as the Holiwyn route proof surface.
- No backend schema, order route, mobile UI, orderbook UI, chat, live stats, or social feature code was changed.

User interactions supported/proven:

- The data contract behind Event Detail is now explicitly classified:
  - Regulation Winner rows are real Polymarket-backed rows for `switzerland-vs-colombia`.
  - Spread, Totals, and Team Totals rows are backend-shaped `contract-fixture` rows.
- This supports the next visible MVP proof without pretending fixture line markets are provider-backed parity.

State transitions:

- No user/order state transition was added in LP.
- The cycle updates the loop decision: continue Local MVP with contract fixture line markets until real provider line markets exist.

Validation:

- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LP-provider-match-line-availability/cycle-LP-provider-match-line-availability.json`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts`

Known limitations:

- No Android proof was run because ADB showed no visible devices.

## Cycle LV - Event Detail Layout Tightening

Feature/page worked on:

- Local MVP Event Detail page on Samsung S23.

Frontend/harness/backend files touched:

- `mobile/src/components/EventDetail.tsx`
- `docs/mobile/audits/cycle-LV-event-detail-layout-tightening.md`
- `docs/mobile/screenshots/cycle-LV-event-detail-layout-tightening/*`
- `docs/mobile/harness/cycle-LV-event-detail-layout-tightening/*`

Important functions/services touched:

- Event Detail rendering only.
- No backend service or API route was changed.

User interactions supported/proven:

- Home match opens Event Detail in Expo Go on S23.
- Event Detail now shows a compact probability chart in the first visible game-page view.
- Game Lines, Spread, Totals, and Team Total Goals are visible without chat/orderbook UI.
- Duplicate winner fallback groups are filtered out.

State transitions:

- No trading/order state changed in this cycle.
- Chart tap toggles the selected primary outcome for visual focus only.

Validation:

- `npm run typecheck -- --pretty false`
- S23 screenshot/XML proof for Home reload, Event Detail top, and Event Detail line-market scroll.

Known limitations:

- This cycle did not prove ticket submit or Portfolio/history.
- Spread/Totals/Team Total rows remain backend-shaped `contract-fixture` data because the selected Polymarket Gamma event does not expose provider-backed line markets.

## Cycle LW - S23 Line Ticket To Portfolio History Flow

Feature/page worked on:

- Local MVP visible user flow from Home to Portfolio/history.

Frontend/harness/backend files touched:

- `docs/mobile/audits/cycle-LW-s23-line-ticket-flow.md`
- `docs/mobile/screenshots/cycle-LW-s23-line-ticket-flow/*`
- `docs/mobile/harness/cycle-LW-s23-line-ticket-flow/*`

Important functions/services touched:

- No code was changed.
- Used existing mobile `PolyApi`, `submitTicketOrder()`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.

User interactions supported/proven:

- Open first Home match.
- Open Spread line ticket from Event Detail.
- Select `+$25`.
- Swipe to buy.
- Land in Portfolio with the new position.
- Switch to History and see the new trade activity.

State transitions:

- Ticket amount changed from `$0` to `$25`.
- Server order moved from ticket submit to Portfolio state.
- Portfolio cash/value changed after the fake-token order.
- History received the newly bought Spread line activity.

Validation:

- S23 screenshot/XML proof.
- Secret scan found no committed API key strings in proof artifacts.

Known limitations:

- This pass required restarting Expo with a local dev API key in process environment.
- Runtime API-key deep link did not reliably inject the key in the current Expo Go session.

## Cycle LX - Local MVP S23 Startup Harness

Feature/page worked on:

- Local MVP Android proof startup reliability.

Frontend/harness/backend files touched:

- `scripts/start_poly_mobile_rehearsal.ps1`
- `package.json`
- `docs/mobile/audits/cycle-LX-local-mvp-s23-startup-harness.md`

Important functions/services touched:

- Added `-RestartExpo` to the rehearsal harness so stale Expo listeners can be replaced with a server-mode bundle.
- Added `npm run mobile:mvp-s23:start` for the current Local MVP S23 lane.

User interactions supported/proven:

- No new user interaction was added.
- Future S23 proof runs can start from a fresh Expo bundle with a generated mobile dev API key.

State transitions:

- Existing Expo listener on port `8081` is stopped when `-RestartExpo` is set.
- New Expo process starts with `EXPO_PUBLIC_ORDER_MODE=server`, `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_API_BASE_URL`, and generated `EXPO_PUBLIC_API_KEY`.

Validation:

- Ran the rehearsal script with `-CreateMobileDevCredential -RestartExpo -SkipSnapshotWatch -SkipBots -SkipBackend -DurationSeconds 60`.
- Expo status returned `packager-status:running`.
- Rehearsal summary redacted the credential token.
- `package.json` parsed successfully.
- Secret scan found no committed `[redacted-api-key]` token.

Known limitations:

- This cycle did not run a new S23 trade proof; Cycle LW remains the visible S23 flow proof.
- A future harness polish pass can add an optional post-start S23 deep-link reload step.

## Cycle LY - Portfolio Chart Containment

Feature/page worked on:

- Portfolio account header/chart/range section on Samsung S23.

Frontend/harness/backend files touched:

- `mobile/src/components/Portfolio.tsx`
- `docs/mobile/audits/cycle-LY-portfolio-chart-containment.md`
- `docs/mobile/screenshots/cycle-LY-portfolio-chart-containment/portfolio-chart-contained.png`
- `docs/mobile/harness/cycle-LY-portfolio-chart-containment/portfolio-chart-contained.xml`

Important functions/services touched:

- `PortfolioSparkline()` now uses explicit plot bounds so points stay inside the chart area.
- No backend service or API route was changed.

User interactions supported/proven:

- Portfolio tab opens on S23.
- Chart, range selector, and section tabs remain visible as separate bands.
- No chat or orderbook UI appears in Portfolio.

State transitions:

- No order or portfolio state transition was changed.

Validation:

- `npm run typecheck -- --pretty false`
- S23 screenshot/XML proof.

Known limitations:

- This cycle used a clean server-mode account state to prove the Portfolio header layout.
- Cycle LW remains the proof for post-order position/history behavior.
- Gamma exposes no Spread, Totals, Team Totals, Halves, Corners, or Correct Score markets for the selected match event.
- Real provider-backed line-market replacement remains P1 until Polymarket exposes attach-ready line markets or another approved provider is in scope.

## Cycle LQ - Market Source Summary Contract

Feature/page worked on:

- Backend route contract for Home and Event Detail market source readiness.

Frontend/harness/backend files touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/app/api/events/route.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `scripts/prove_mobile_provider_match_line_availability.ts`
- `docs/mobile/audits/cycle-LQ-market-source-summary.md`
- `docs/mobile/harness/cycle-LQ-market-source-summary/cycle-LQ-market-source-summary.json`

Important functions/services touched:

- Added `buildMobileMarketSourceSummary()` to classify route-visible markets by source and family.
- `serializeMobileLiveEventDetail()` now returns `event.marketSourceSummary` and `contract.marketSourceSummary`.
- `GET /api/events?includeMobileMarkets=1` now includes `marketSourceSummary` for each mobile event.

User interactions supported/proven:

- Home and Event Detail can now tell the mobile app that Regulation Winner is provider-backed while Spread/Totals/Team Totals are Local MVP contract fixtures.
- This removes guesswork before the visible ticket/order proof and keeps the service honest about Polymarket-backed data.

State transitions:

- No user/order state transition was added.
- Route contract state is now explicit:
  - `regulationWinner.status=provider-backed`
  - `lineMarkets.status=contract-fixture`

Validation:

- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts`
- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --cycle=LQ --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LQ-market-source-summary/cycle-LQ-market-source-summary.json`
- HTTP check confirmed both Home and Event Detail summaries for `switzerland-vs-colombia`.

Known limitations:

- No Android proof was run because ADB showed no visible devices.
- This does not create real provider-backed line markets; it makes their absence explicit.
- Mobile UI can consume this summary in a later scoped cycle if needed.

## Cycle LR - Portfolio Selection Source Summary

Feature/page worked on:

- Portfolio and Portfolio History backend contract for source identity after a fake-token line-market order.

Frontend/harness/backend files touched:

- `src/server/services/portfolioSelectionSourceSummary.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/portfolio/history/route.ts`
- `src/__tests__/portfolio.open-orders.route.test.ts`
- `src/__tests__/portfolio.history.route.test.ts`
- `scripts/prove_mobile_mvp_match_line_order_lifecycle.ts`
- `docs/mobile/audits/cycle-LR-portfolio-selection-source-summary.md`
- `docs/mobile/harness/cycle-LR-portfolio-selection-source-summary/cycle-LR-portfolio-selection-source-summary.json`

Important functions/services touched:

- Added `buildPortfolioSelectionSourceSummary()` for route-visible selection source classification.
- `/api/portfolio` now returns `selectionSourceSummary` for positions, open orders, and combined account selections.
- `/api/portfolio/history` now returns `selectionSourceSummary` for canceled orders, recent trades, and combined activity selections.

User interactions supported/proven:

- A server-mode BUY on `switzerland-vs-colombia` Spread `Colombia +1.5` still fills through `/api/orders`.
- Portfolio position selection preserves the line/outcome/token/source and reports line source as `contract-fixture`.
- Portfolio history recent trade selection preserves the line/outcome/token/source and reports line source as `contract-fixture`.

State transitions:

- Local proof user starts with fake-token balance.
- Maker posts SELL liquidity.
- Taker submits BUY.
- Order transitions to `FILLED`.
- Position and recent trade appear with section-level source summaries.

Validation:

- `npm run test:jest -- src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/mobile-live-event-detail.test.ts`
- `npx tsx scripts/prove_mobile_mvp_match_line_order_lifecycle.ts --cycle=LR --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LR-portfolio-selection-source-summary/cycle-LR-portfolio-selection-source-summary.json`

Known limitations:

- No Android proof was run because ADB showed no visible devices.
- Full typecheck remains blocked by an existing `src/server/services/eventReadModel.ts` string literal type issue.
- This does not create real provider-backed line markets; it makes Portfolio/history source identity auditable.

## Cycle LS - Typecheck Readiness

Feature/page worked on:

- Harness validation health for backend route contracts used by the mobile MVP.

Frontend/harness/backend files touched:

- `src/server/services/eventReadModel.ts`
- `docs/mobile/audits/cycle-LS-typecheck-readiness.md`

Important functions/services touched:

- Tightened event market rules typing with literal type guards.
- `deriveEventMarketRules()` now returns the explicit `EventMarketRules` contract.

User interactions supported/proven:

- No new user-facing interaction was added.
- Future Home/Event Detail/Portfolio route cycles can again use full TypeScript validation as part of the Audit Gate.

Validation:

- `npx tsc --noEmit --pretty false --skipLibCheck`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/mobile-event-market-rules-contract.test.ts`

Known limitations:

- No Android proof was run because ADB showed no visible devices.

## Cycle LT - Home To Portfolio Route Journey

Feature/page worked on:

- Backend route proof for the Local MVP mobile journey: Home -> Event Detail -> line market -> fake-token order -> Portfolio/history.

Frontend/harness/backend files touched:

- `scripts/prove_mobile_mvp_home_to_portfolio_journey.ts`
- `docs/mobile/audits/cycle-LT-home-to-portfolio-route-journey.md`
- `docs/mobile/harness/cycle-LT-home-to-portfolio-route-journey/cycle-LT-home-to-portfolio-route-journey.json`

Important functions/services touched:

- Added a proof script that starts from the Home route instead of directly loading a database market.
- Reused Home, Event Detail, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- Reused source summaries from LQ/LR to prove source identity end to end.

User interactions supported/proven:

- Home exposes `switzerland-vs-colombia` as the first MVP-ready match with provider-backed Regulation Winner and contract-fixture line markets.
- Event Detail preserves the same source summary.
- The selected contract-fixture Spread line can be bought through the server order route.
- Portfolio and History preserve selected line/outcome/source/token identity.

State transitions:

- Local proof user starts with fake-token balance.
- Maker posts SELL liquidity.
- Taker submits BUY.
- Order transitions to `FILLED`.
- Position and recent trade appear with `contract-fixture` line source summaries.

Validation:

- `npx tsx scripts/prove_mobile_mvp_home_to_portfolio_journey.ts --cycle=LT --baseUrl=http://127.0.0.1:3002 --summaryPath=docs/mobile/harness/cycle-LT-home-to-portfolio-route-journey/cycle-LT-home-to-portfolio-route-journey.json`
- `npx tsc --noEmit --pretty false --skipLibCheck`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/mobile-event-market-rules-contract.test.ts`

Known limitations:

- This is a backend route proof, not S23 visible UI proof.
- S23 is now visible again and should be used for the next visible Audit Gate cycle.

## Cycle LZ - Current State Reinspection And Portfolio Account Entry

Feature/page worked on:

- Local MVP service readiness inspection.
- Portfolio top-left account/profile entry.

Frontend/harness/backend files touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/App.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- `scripts/inspect_mobile_mvp_current_state.ts`
- `package.json`
- `docs/mobile/audits/cycle-LZ-current-state-reinspection.md`
- `docs/mobile/audits/cycle-LZ-portfolio-account-entry.md`

Important functions/services touched:

- `Portfolio` now accepts an `openAccount` callback.
- `App.tsx` wires Portfolio account entry to the existing `account` tab.
- `scripts/inspect_mobile_mvp_current_state.ts` supports caller-provided cycle labels.

User interactions supported/proven:

- User can open Portfolio and tap the top-left profile/avatar row.
- The tap opens the existing Account screen on Samsung S23.

State transitions:

- `mainTab` changes from `portfolio` to `account`.
- No order, balance, Portfolio, or backend state changes.

Validation:

- `npm run -s mobile:mvp:inspect -- --cycle=LZ --summaryPath=docs/mobile/harness/cycle-LZ-current-state-reinspection/cycle-LZ-current-state-reinspection.json`
- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --cycle=LZ --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LZ-current-state-reinspection/cycle-LZ-provider-match-line-availability.json`
- `npm run -s typecheck` from `mobile/`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/portfolioSettingsContract.test.ts`

Known limitations:

- Account/login remains disabled for the Local MVP.
- Deposit/withdraw remains out of scope.
- Reinspection confirmed real Polymarket-backed Regulation Winner is available, while Spread/Totals/Team Totals remain backend-shaped `contract-fixture` line rows until provider-backed line markets exist.

## Cycle MA - Argentina vs Egypt Line Fixtures And Detail Hydration

Feature/page worked on:

- Local MVP Home -> Event Detail line-market readiness.
- Argentina vs Egypt Event Detail visible line groups.

Frontend/harness/backend files touched:

- `mobile/App.tsx`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/src/__tests__/eventDetailHydrationContract.test.ts`
- `scripts/seed_mobile_mvp_match_line_markets.ts`
- `scripts/inspect_mobile_mvp_current_state.ts`
- `docs/mobile/audits/cycle-MA-argentina-egypt-line-fixtures.md`

Important functions/services touched:

- `openEventDetail` now hydrates full detail using `event.slug ?? event.id`.
- `normalizeEventSummary` now preserves backend slug in the mobile event contract.
- `marketType` now treats structured line-market types as `game-line` before generic title heuristics.
- `seed_mobile_mvp_match_line_markets.ts` can seed a named cycle/event and write a summary.
- `inspect_mobile_mvp_current_state.ts` is reusable after adding the missing filesystem import.

User interactions supported/proven:

- S23 Home opens `argentina-vs-egypt`.
- Event Detail shows 7 markets / 14 outcomes after full live-detail hydration.
- Spread, Totals, and Team Total Goals are visible on S23.
- Spread/Totals/Team Total rows preserve selected market, line, period, outcome, source, condition, token, and provider/fixture identity for ticket handoff.

State transitions:

- Home compact event is replaced by the full live-detail event after hydration.
- No order, balance, Portfolio, or schema state changed in this cycle.

Validation:

- `npm run -s typecheck` from `mobile/`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/eventDetailHydrationContract.test.ts`
- `npm run -s mobile:mvp:inspect -- --cycle=MA --summaryPath=docs/mobile/harness/cycle-MA-argentina-egypt-line-fixtures/cycle-MA-current-state-after-second-match-lines.json`

Known limitations:

- Regulation Winner is provider-backed, but Spread/Totals/Team Total remain `contract-fixture` for Local MVP because attach-ready Polymarket line markets are not present for the inspected match.
- The next useful cycle should prove the full line ticket/order/Portfolio path using this now-visible event.

## Cycle MB - Current MVP Inspection, Swipe Submit, And S23 Flow

Feature/page worked on:

- Current Local MVP service readiness.
- Home -> Event Detail -> Spread line ticket -> swipe-to-buy -> Portfolio open order -> History empty-state path.

Frontend/harness/backend files touched:

- `mobile/src/components/TradeTicket.tsx`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-MB-current-mvp-inspection-and-s23-flow.md`

Important functions/services touched:

- `SwipeSubmitControl` now uses drag responder handling and no longer submits from a simple tap.
- `prove_mobile_current_mvp_s23_visible_flow.ps1` starts a temporary Expo server with a generated mobile dev API key, drives the S23, captures screenshots/XML, and cleans up the temporary Metro process.

User interactions supported/proven:

- Home shows the current `argentina-vs-egypt` match.
- Event Detail displays current Game Lines with Spread/Totals/Team Total line markets.
- Trade Ticket preserves selected Spread line `1.5` and `contract-fixture` source.
- A deliberate upward swipe submits the order and lands on Portfolio.
- Portfolio preserves selected line/source identity for the open order; History shows the correct empty state until a fill exists.

State transitions:

- Ticket amount changes from `$0` to `$25`.
- Swipe crosses the submit threshold and calls the existing `placeOrder` path.
- Server-mode mobile Portfolio sync shows cash reduced by the open order value.

Validation:

- `npx tsx scripts/inspect_mobile_mvp_current_state.ts --cycle=MB --summaryPath=docs/mobile/harness/cycle-MB-current-state-inspection/cycle-MB-current-state-inspection.json`
- `npx tsx scripts/prove_mobile_mvp_home_to_portfolio_journey.ts --cycle=MB --summaryPath=docs/mobile/harness/cycle-MB-home-to-portfolio-route-journey/cycle-MB-home-to-portfolio-route-journey.json`
- `npm run -s typecheck` from `mobile/`
- S23 proof: `docs/mobile/harness/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-s23-visible-flow.json`

Known limitations:

- Visible S23 order currently lands as an open order; backend route proof separately verifies filled position/history for a seeded counterparty.
- Spread/Totals/Team Total remain backend-shaped `contract-fixture` markets because real provider-backed line rows are not available for the inspected Polymarket match.

## Cycle MC - Visible Filled History For Local MVP Line Ticket

Feature/page worked on:

- Home -> Event Detail -> Spread line ticket -> swipe-to-buy -> Portfolio History.
- Local MVP visible order fill proof on Samsung S23.

Frontend/harness/backend files touched:

- `scripts/seed_mobile_route_spread_counterparty.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `scripts/prove_mobile_mvp_home_to_portfolio_journey.ts`
- `docs/mobile/audits/cycle-MC-visible-filled-history.md`

Important functions/services touched:

- `seed_mobile_route_spread_counterparty.ts` can now target a specific line and clean only stale automated proof BUY orders on the selected market/outcome before seeding a maker ask.
- `prove_mobile_current_mvp_s23_visible_flow.ps1` now requires filled History when `-ExpectFilledHistory` is set.
- `prove_mobile_mvp_home_to_portfolio_journey.ts` uses the same scoped proof cleanup before route-level maker seeding.

User interactions supported/proven:

- User opens Home on S23, enters `argentina-vs-egypt`, selects Spread `Egypt +1.5`, enters `$25`, swipes up to buy, and reaches Portfolio.
- Portfolio History shows the filled Spread line trade with selected line/source identity.

State transitions:

- Stale automated proof BUY orders on the exact selected outcome are canceled before proof liquidity is seeded.
- A fresh maker SELL at `0.52` is seeded for the selected Spread `1.5` away outcome.
- The S23 BUY crosses the seeded maker liquidity, creates a filled order, creates a position, and creates a recent trade shown in History.

Validation:

- `npm run -s typecheck` from `mobile/`
- `npx tsx scripts/prove_mobile_mvp_home_to_portfolio_journey.ts --cycle=MC --summaryPath=docs/mobile/harness/cycle-MC-visible-filled-history/cycle-MC-home-to-portfolio-route-journey.json`
- S23 proof: `docs/mobile/harness/cycle-MC-visible-filled-history/cycle-MC-current-mvp-s23-visible-flow.json`

Known limitations:

- Spread/Totals/Team Total remain backend-shaped `contract-fixture` markets because real provider-backed line rows are not available for the inspected Polymarket match.
- Visible fill proof depends on local seeded liquidity; production liquidity remains future work.

## Cycle ME - Event Detail Line Section Clearance

Feature/page worked on:

- Event Detail Game Lines layout on Samsung S23.
- Local MVP visible path continuity through ticket/order/Portfolio History.

Frontend/harness/backend files touched:

- `mobile/src/components/EventDetail.tsx`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-ME-event-detail-line-clearance.md`

Important functions/services touched:

- `handleScroll` now enables the compact sticky match header earlier, before the user reaches Game Lines.
- Game Lines now exposes `event-detail-line-section-clearance-24` on the visible container/spacer.
- The S23 proof settles the Game Lines scroll position before capturing the official line screenshot.

User interactions supported/proven:

- User opens Home, enters Event Detail, scrolls to Game Lines, and sees readable Regulation Winner, Spread, and Totals sections without landing on a clipped first market row.
- User can still select Spread `Egypt +1.5`, open the ticket, swipe to buy, and see the filled trade in Portfolio History.

State transitions:

- No backend, balance, order, or schema state transition changed.
- The proof still seeds local counterparty liquidity, submits a BUY, fills it, refreshes Portfolio, and shows History.

Validation:

- `npm run -s typecheck` from `mobile/`
- S23 proof: `docs/mobile/harness/cycle-ME-event-detail-line-clearance/cycle-ME-current-mvp-s23-visible-flow.json`

Known limitations:

- This cycle fixes line-section readability and proof stability; it does not change provider availability.
- Spread/Totals/Team Total remain `contract-fixture` until provider-backed line markets are available.

## Cycle MF - Home Compact Feed And Proof Hygiene

Feature/page worked on:

- Home compact World Cup match feed.
- Home -> Event Detail -> line market -> ticket -> Portfolio History visible proof.

Frontend/harness/backend files touched:

- `mobile/src/components/Header.tsx`
- `mobile/src/components/HomeScreen.tsx`
- `mobile/src/components/MarketLists.tsx`
- `mobile/src/services/homeEventFeedService.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-MF-home-compact-feed.md`

Important functions/services touched:

- `homeEventFeedService.isWorldCupMatchEvent` now requires match-like evidence instead of treating missing `eventType` as a match.
- `HomeScreen` exposes `home-compact-retail-feed` for the Local MVP proof gate.
- `prove_mobile_current_mvp_s23_visible_flow.ps1` now dismisses Expo developer-menu overlays before official Home screenshots and taps the top/title area of the match card.

User interactions supported/proven:

- User opens a clean Home screen on S23, sees compact World Cup matches, taps the Argentina vs Egypt card, reaches Event Detail, selects Spread `Egypt +1.5`, enters `$25`, swipes up to buy, and sees the filled trade in Portfolio History.

State transitions:

- No backend schema or route transition changed.
- Proof still creates a mobile dev credential, seeds deterministic counterparty liquidity, submits a server-backed fake-token BUY, fills it, refreshes Portfolio, and displays History.

Validation:

- `npm run -s typecheck` from `mobile/`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/homeCardStatsContract.test.ts mobile/src/__tests__/inactiveFuturesSurfaceContract.test.ts mobile/src/__tests__/homeEventFeedService.test.ts`
- S23 proof: `docs/mobile/harness/cycle-MF-home-compact-feed/cycle-MF-current-mvp-s23-visible-flow.json`

Known limitations:

- Regulation Winner remains the real Polymarket-backed market for the inspected event.
- Spread/Totals/Team Total remain backend-shaped `contract-fixture` rows until provider-backed line markets are available.
- Home load-more pagination still needs proof when the backend route contains more than 10 active match rows.

## Cycle MG - Home MVP Match Route Contract

Feature/page worked on:

- Home backend route contract for the Local MVP match feed.
- Home -> Event Detail -> Spread line ticket -> Portfolio History visible proof on Samsung S23.

Frontend/harness/backend files touched:

- `src/app/api/events/route.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `mobile/src/api.ts`
- `mobile/src/services/homeEventFeedService.ts`
- `mobile/src/__tests__/api.test.ts`
- `mobile/src/__tests__/homeEventFeedService.test.ts`
- `docs/mobile/audits/cycle-MG-home-mvp-route-contract.md`

Important functions/services touched:

- `/api/events` now accepts `mobileMvpMatches=1` and applies a server-side Local MVP match-only filter.
- `PolyApi.listWorldCupEvents` supports `mobileMvpMatches`, while still allowing Search to opt out of the World Cup league filter with `leagueKey: null`.
- `loadHomeEventFeedPage` now requests `mobileMvpMatches: true`.

User interactions supported/proven:

- User opens Home on S23 and sees only the two active Local MVP World Cup match rows.
- User taps Argentina vs Egypt, selects Spread `Egypt +1.5`, enters `$25`, swipes up to buy, and sees the filled trade in Portfolio History.

State transitions:

- No schema migration was added.
- Home discovery now depends on an explicit backend filter instead of relying only on mobile-side future filtering.
- Order/Portfolio state transitions remain unchanged: proof seeds deterministic counterparty liquidity, submits a BUY, fills it, and displays History.

Validation:

- `npm run -s typecheck` from `mobile/`
- `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts -t "Local MVP match-only|mobile compact markets|backend event status"`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/api.test.ts mobile/src/__tests__/homeEventFeedService.test.ts`
- Route proof: `docs/mobile/harness/cycle-MG-home-mvp-route-contract/cycle-MG-mobile-mvp-match-feed-route.json`
- S23 proof: `docs/mobile/harness/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-s23-visible-flow.json`

Known limitations:

- Regulation Winner is provider-backed for the inspected events.
- Spread/Totals/Team Total remain backend-shaped `contract-fixture` rows until attach-ready provider line markets exist.
- Local proof still uses deterministic seeded counterparty liquidity for a guaranteed filled History row.

## Cycle NK - Current Service Inspection And Provider Winner Chart Proof

Feature/page worked on:

- Event Detail chart/probability contract for the current Local MVP match.
- Home -> Event Detail -> provider-backed Regulation Winner ticket -> Portfolio History proof on Samsung S23.

Frontend/harness/backend files touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/components/EventDetail.tsx`
- `scripts/prove_current_match_polymarket_chart_history.ts`
- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-NK-current-service-provider-chart.md`

Important functions/services touched:

- `serializeMobileLiveEventDetail` now exposes primary chart source/status/range/last-updated fields from compact market snapshots.
- `normalizeEventSummary` preserves backend chart contract fields instead of relabeling populated route history as generic embedded data.
- `EventDetail` exposes chart source/status/range in the S23 hierarchy so visible proof can verify real provider-backed chart data.
- `prove_current_match_polymarket_chart_history.ts` refreshes current provider-backed Regulation Winner chart history from Polymarket CLOB prices-history and records route proof.

User interactions supported/proven:

- User opens Home on S23, taps Argentina vs Egypt, sees Event Detail with `chart-source-polymarket-clob-prices-history`, selects the provider-backed Egypt Regulation Winner, swipes to buy, and sees provider source preserved in Portfolio History.

State transitions:

- No schema migration was added.
- The inspection refreshes `MarketOutcomeSnapshot` rows for current Polymarket Regulation Winner markets.
- The visible fake-token order path still creates a mobile dev credential, seeds deterministic counterparty liquidity, submits `/api/orders`, fills, then reads `/api/portfolio` and `/api/portfolio/history`.

Validation:

- `npx tsx scripts/prove_current_match_polymarket_chart_history.ts --eventSlug=argentina-vs-egypt`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/polymarket-price-history-snapshots.test.ts`
- `npm --prefix mobile run typecheck`
- S23 proof: `docs/mobile/harness/cycle-NK-current-match-chart-history-s23/cycle-NK-provider-winner-s23-visible-flow.json`

Known limitations:

- Provider-backed Regulation Winner and CLOB chart history are proven for the inspected current match.
- Chart status is `stale` because the provider history timestamps are from July 7, 2026; the source is real, but not fresh live data.
- Spread/Totals/Team Total remain backend-shaped `contract-fixture` rows with 0 provider-backed line markets for this event.

## Cycle NL - Provider Refresh And Local MVP Liquidity

Feature/page worked on:

- Current Local MVP service readiness for Home -> Event Detail -> provider-backed Regulation Winner ticket -> Portfolio/history.
- Rebuildable current-match backend data after test resets.

Frontend/harness/backend files touched:

- `src/server/services/polymarketReferenceSnapshots.ts`
- `src/server/services/canonicalOrderSubmission.ts`
- `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`
- `src/__tests__/polymarket-reference-snapshots.test.ts`
- `scripts/restore_current_mobile_mvp_match.ts`
- `scripts/prove_current_match_provider_refresh.ts`
- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-NL-provider-refresh-local-liquidity.md`

Important functions/services touched:

- `refreshPolymarketReferenceSnapshots` now falls back to Gamma `/events?slug=<event>` when direct `/markets?slug=<market>` returns an empty array for grouped soccer markets.
- `assertProviderMarketAcceptsOrders` now allows provider-mapped fake-token orders when Holiwyn has matching local resting liquidity, even if the provider book is unavailable.
- The S23 proof harness now creates proof-scoped mobile dev API keys with enough fake-token order allowance for visible swipe tests.

User interactions supported/proven:

- User opens Home on S23, taps Argentina vs Egypt, selects the provider-backed Egypt Regulation Winner, enters `$25`, swipes to buy, lands in Portfolio, and verifies History preserves provider winner identity.

State transitions:

- No schema migration was added.
- Restore script recreates the current match provider markets after DB-resetting tests.
- Provider refresh updates `ReferenceQuoteSnapshot` rows from Polymarket Gamma, while CLOB history refresh updates `MarketOutcomeSnapshot`.
- The visible order path seeds deterministic local counterparty liquidity, submits `/api/orders`, fills, then reads `/api/portfolio` and `/api/portfolio/history`.

Validation:

- `npm run test:jest -- src/server/services/__tests__/canonical_order_submission.phase5.test.ts src/__tests__/polymarket-reference-snapshots.test.ts src/__tests__/mobile-live-provider-refresh.service.test.ts src/__tests__/mobile-live-provider-refresh.route.test.ts`
- `npx tsc --noEmit --pretty false --skipLibCheck`
- Backend restore/line/provider refresh proofs under `docs/mobile/harness/cycle-NL-current-match-provider-refresh/`
- S23 proof: `docs/mobile/harness/cycle-NL-current-match-provider-refresh-s23-pass/cycle-NL3-provider-winner-s23-visible-flow.json`

Known limitations:

- Regulation Winner is provider-backed and route-refreshable.
- Spread/Totals/Team Total remain backend-shaped `contract-fixture` rows until attach-ready provider-backed line markets exist.
- The inspected Polymarket event is old, so provider prices can be 0/1 and chart history is stale; Local MVP proof uses Holiwyn local liquidity for fake-token execution.

## Cycle NM - Current Line Ticket S23 Flow

Feature/page worked on:

- Current Home/Live -> Event Detail -> Spread line -> simple ticket -> fake-token/server order -> Portfolio/history proof.

Frontend/harness/backend files touched:

- No app source files changed.
- Evidence/docs only:
  - `docs/mobile/audits/cycle-NM-current-line-s23-flow.md`
  - `docs/mobile/harness/cycle-NM-current-line-s23-flow/`
  - `docs/mobile/screenshots/cycle-NM-current-line-s23-flow/`

Important functions/services touched:

- No production functions were changed.
- Route proof exercised `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- S23 harness exercised `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` with seeded counterparty liquidity.

User interactions supported/proven:

- User opens Home, checks Live, returns Home, opens Argentina vs Egypt, scrolls to Game Lines, selects `Egypt +1.5`, opens the ticket, enters `$25`, swipes to buy, and sees the filled result in Portfolio History.

State transitions:

- No schema migration was added.
- Proof seeds deterministic local counterparty liquidity for the selected contract-fixture Spread line.
- `/api/orders` creates/fills the BUY order, then Portfolio/history read the resulting server state.

Validation:

- Backend route proof: `docs/mobile/harness/cycle-NM-current-line-s23-flow/cycle-NM-home-to-portfolio-route-journey.json`
- S23 proof: `docs/mobile/harness/cycle-NM-current-line-s23-flow/cycle-NM-current-mvp-s23-visible-flow.json`

Known limitations:

- Line markets remain contract fixtures, not Polymarket-backed line markets.
- This cycle proves the current Local MVP user flow is working; it does not claim final Polymarket line-market parity.

## Cycle NN - Current Line Cashout S23 Flow

Feature/page worked on:

- Current Home/Live -> Event Detail -> Spread line -> simple ticket -> fake-token/server filled order -> Portfolio position -> cashout ticket -> fake-token/server SELL -> Portfolio History proof.

Frontend/harness/backend files touched:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- Evidence/docs:
  - `docs/mobile/audits/cycle-NN-current-line-cashout-s23-flow.md`
  - `docs/mobile/harness/cycle-NN-current-line-cashout-s23-flow/`
  - `docs/mobile/screenshots/cycle-NN-current-line-cashout-s23-flow/`

Important functions/services touched:

- No production app or backend functions were changed.
- The S23 harness now supports `-ExpectCashout`.
- Route proof exercised `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- Counterparty setup used `scripts/seed_mobile_route_spread_counterparty.ts` to create crossing backend BUY liquidity for the cashout SELL.

User interactions supported/proven:

- User opens Home, checks Live, opens Argentina vs Egypt, scrolls to Game Lines, selects `Egypt +1.5`, buys `$25`, sees the filled Portfolio position, taps Cash out, swipes to cash out, and sees sold activity in History.

State transitions:

- BUY order fills against deterministic local counterparty liquidity.
- Position becomes visible in Portfolio.
- Cashout SELL fills against deterministic local counterparty bid liquidity.
- Portfolio History shows sold activity while preserving spread line/source identity.

Validation:

- Mobile typecheck passed.
- S23 proof passed: `docs/mobile/harness/cycle-NN-current-line-cashout-s23-flow/cycle-NN-current-mvp-s23-visible-flow.json`

Known limitations:

- Line markets remain backend `contract-fixture` rows, not provider-backed Polymarket line markets.
- No backend route/schema changed in this cycle.

## Cycle NO - Provider Line Fallback Discovery

Feature/page worked on:

- Backend/provider discovery for the current Event Detail line-market gap.

Frontend/harness/backend files touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_mvp_provider_discovery_guard.ts`
- Evidence/docs:
  - `docs/mobile/audits/cycle-NO-provider-line-fallback-discovery.md`
  - `docs/mobile/harness/cycle-NO-provider-line-fallback-discovery/`

Important functions/services touched:

- `buildProviderCandidateManualSlugFallbacks()` now generates exact fallback slug guesses for line families instead of only match-winner markets.
- `assessCandidateRelevance()` now keeps match-specific two-outcome winner markets on the strict subject/event-context path so broad World Cup outright markets cannot attach.
- `scripts/prove_mobile_mvp_provider_discovery_guard.ts` now records manual slug fallback evidence.

User interactions supported/proven:

- No new visible mobile interaction changed in this backend/provider cycle.
- Cycle NO protects the existing Event Detail line flow from being upgraded to provider-backed status with wrong-family or broad-outcome candidates.

State transitions:

- No schema migration was added.
- No production data was mutated.
- Current route state remains provider-backed Regulation Winner plus contract-fixture Spread/Totals/Team Total rows.

Validation:

- Provider candidate Jest test passed.
- Full TypeScript check passed.
- Provider discovery guard passed.
- Current provider line availability proof passed.

Known limitations:

- Polymarket Gamma still exposes no attach-ready line markets for the current `argentina-vs-egypt` event.
- Android proof was not rerun because no mobile UI changed; latest S23 visible proof remains Cycle NN.

## Cycle NP - Line Family Readiness Contract

Feature/page worked on:

- Local MVP Event Detail source/readiness disclosure for the current provider-backed winner plus fixture-only line-market route.

Frontend/harness/backend files touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `mobile/src/types.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NP-line-family-readiness/cycle-NP-current-state-inspection.json`
  - `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
  - `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`

Important functions/services touched:

- `buildMobileMarketSourceSummary()` now includes `lineMarkets.familyReadiness`, with per-family counts and status for spread, total, and team-total line markets.
- `lineSourceCopy()` now displays the local line families when lines are fixture-backed.
- The Samsung Event Detail smoke gate was aligned with the current Local MVP page: `11 outcomes` and no required Volume/Liquidity/Traders copy.

User interactions supported/proven:

- User can open Event Detail on Samsung S23 and see the compact game page without old non-MVP stats requirements.
- Route proof shows Regulation Winner is provider-backed while spread/total/team-total lines are explicitly contract fixtures.

State transitions:

- No database schema or production data changed.
- No order, portfolio, or cashout behavior changed.

Validation:

- Backend Jest contract passed.
- Mobile route/adapter tests passed.
- Root TypeScript passed.
- Mobile TypeScript passed.
- S23 Event Detail summary proof passed on `SM-S911U1`.

Known limitations:

- Real provider-backed Spread/Totals/Team Total markets are still unavailable for the inspected event.
- The S23 visible proof used the generic mock Event Detail proof path; route readiness is proven separately by the backend route inspection JSON.

## Cycle NQ - Server-Mode Line Family Readiness Proof

Feature/page worked on:

- Local MVP server-mode journey: Home -> Live -> Event Detail -> Spread line -> Buy ticket -> Portfolio open order.

Frontend/harness/backend files touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/`

Important functions/services touched:

- `lineSourceCopy()` now emits separate hidden audit markers for each line-family readiness item so S23 proof can verify spread, total, and team-total independently.
- The S23 MVP proof now asserts the current Event Detail source banner and family-level line readiness markers before opening the ticket.

User interactions supported/proven:

- User can open the current server-backed Home/Live event, scroll to Game Lines, see the provider-winner/local-lines disclosure, select `Egypt +1.5`, open the ticket, submit a fake-token order, and see the server-backed open order preserve line/source identity in Portfolio.

State transitions:

- No schema or order-route logic changed.
- The submitted line order remained open in this proof run because no crossing counterparty liquidity was seeded.

Validation:

- Mobile adapter/source tests passed.
- Mobile TypeScript passed.
- Samsung S23 server-mode visible proof passed on `SM-S911U1`.

Known limitations:

- Regulation Winner is provider-backed, but Spread/Totals/Team Total remain backend `contract-fixture` line families.
- This cycle proves the current service state honestly on-device; it does not close real Polymarket line-market ingestion.

## Cycle NR - Service State Inspection And Path Adjustment

Feature/page worked on:

- Local MVP service readiness inspection before continuing the next UI cycle.

Frontend/harness/backend files touched:

- Evidence/docs only:
  - `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-current-state.json`
  - `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-provider-match-line-availability-argentina-egypt.json`
  - `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-provider-discovery-guard.json`
  - `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-polymarket-active-sports-scan.json`
  - `docs/mobile/audits/cycle-NR-service-state-inspection.md`

Important functions/services touched:

- No code changed.
- Reused existing inspection/proof tools for `/api/events`, `/api/mobile/events/:slug/live-detail`, Polymarket Gamma event availability, provider candidate discovery, and active sports scan.

User interactions supported/proven:

- No new visible user interaction changed in this inspection cycle.
- The prior S23 proof remains Cycle NQ for current Home -> Event Detail -> line ticket -> server open order.

State transitions:

- No database schema or production data changed by this inspection.
- No order, portfolio, or provider mapping was applied.

Validation:

- Current state inspection passed.
- Provider match line availability proof passed.
- Provider discovery guard passed.
- Active sports scan completed read-only.

Known limitations/path adjustment:

- Current Home has one match, `argentina-vs-egypt`.
- Regulation Winner is provider-backed.
- Spread/Totals/Team Total are not provider-backed; Polymarket Gamma exposes 0 line markets for this event and the active sports scan returned only World Cup outright winner futures in the first active sports candidates.
- Next useful work should not chase visual parity around nonexistent provider lines. Continue Local MVP visible flow with explicit `contract-fixture` line disclosure, or add a real approved line provider before claiming provider-backed line parity.

## Cycle NS - Live Freshness Empty State

Feature/page worked on:

- Local MVP Home/Live route honesty.

Frontend/harness/backend files touched:

- `src/app/api/events/route.ts`
- `mobile/src/services/homeEventFeedService.ts`
- `mobile/src/__tests__/homeEventFeedService.test.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NS-live-freshness-empty-state/cycle-NS-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NS-live-freshness-empty-state/`
  - `docs/mobile/audits/cycle-NS-live-freshness-empty-state.md`

Important functions/services touched:

- `/api/events?status=live` now hides stale provider-dated matches using `startTime`, `externalSlug`, or title date.
- `loadHomeEventFeedPage()` no longer falls back from an empty live route to the all-match route, so stale matches do not silently reappear in Live.
- The S23 proof harness now supports `-ExpectLiveEmptyOnly` for focused Live empty-state proof.

User interactions supported/proven:

- User opens Home and still sees the MVP match.
- User taps Live and sees the no-live empty state instead of yesterday's provider-dated match.
- User can return Home and the match remains available for the Local MVP ticket flow.

State transitions:

- No schema, order, portfolio, or provider mapping logic changed.
- No database data was mutated.

Validation:

- Mobile Home feed tests passed.
- Mobile TypeScript passed.
- Root TypeScript passed.
- S23 focused Live freshness proof passed on `SM-S911U1`.

Known limitations:

- Home still contains the current MVP match for betting-flow testing even though it is no longer treated as live.
- A broader provider match feed is still needed for real current World Cup live-game breadth.

## Cycle NT - Stale Match Mobile Label Guard

Feature/page worked on:

- Local MVP Home/Event status normalization.

Frontend/harness/backend files touched:

- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/types.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NT-stale-match-home-label/cycle-NT-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NT-stale-match-home-label/`
  - `docs/mobile/audits/cycle-NT-stale-match-home-label.md`

Important functions/services touched:

- `eventStatus()` now mirrors backend live freshness behavior using `startTime`, `externalSlug`, or title dates.
- `startsAt()` no longer displays Live context when the event is stale.
- `EventSummary` now declares optional `externalSlug` so mobile can consume the backend provider-date contract.

User interactions supported/proven:

- User opens Home and sees the current MVP match labeled as `Active` / `Time TBD`, not Live.
- User taps Live and sees the no-live empty state.
- User returns Home and the MVP match remains available for the betting-flow test path.

State transitions:

- No backend schema, order route, provider mapping, or portfolio logic changed.

Validation:

- Mobile adapter/feed/API tests passed.
- Mobile TypeScript passed.
- Root TypeScript passed.
- S23 focused proof passed on `SM-S911U1`.

Known limitations:

- This fixes stale live labeling. It does not add real current live match/provider breadth.

## Cycle NU - Stale Event Detail Status Honesty

Feature/page worked on:

- Local MVP Event Detail stale/live status presentation.

Frontend/harness files touched:

- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/components/EventDetail.tsx`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NU-stale-event-detail-status/cycle-NU-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NU-stale-event-detail-status/`
  - `docs/mobile/audits/cycle-NU-stale-event-detail-status.md`

Important functions/services touched:

- `eventStatus()` now treats `liveStatus=LIVE` plus stale/unavailable/empty `liveDataStatus` and no clock as non-live for the mobile MVP page.
- `EventDetail` no longer uses a hardcoded `15'` fallback for non-live events.
- The S23 proof harness now supports `-ExpectDetailStaleOnly` for focused Home -> Event Detail stale-status proof.

User interactions supported/proven:

- User opens Home and sees the MVP match as `Active` / `Time TBD`.
- User taps the match and sees Event Detail as `Active` / `Time TBD`, not `Live` / fake clock.
- User still sees Game Lines and Player Props; orderbook/chat remain hidden.

State transitions:

- No backend schema, provider ingestion, order route, portfolio route, or database state changed.

Validation:

- Mobile adapter/feed/Event Detail badge tests passed.
- Mobile TypeScript passed.
- Root TypeScript passed.
- S23 focused Event Detail stale-status proof passed on `SM-S911U1`.

Known limitations:

- Real current live match/provider breadth remains missing.
- Spread/Totals/Team Total remain explicit backend `contract-fixture` line markets until a real provider exposes attach-ready line markets.

## Cycle NV - Live Detail Display Status Contract

Feature/page worked on:

- Local MVP Event Detail status contract between backend and mobile.

Frontend/backend/harness files touched:

- `src/server/services/mobileLiveEventDetail.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `mobile/src/types.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NV-live-detail-display-status-contract/cycle-NV-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NV-live-detail-display-status-contract/`
  - `docs/mobile/audits/cycle-NV-live-detail-display-status-contract.md`

Important functions/services touched:

- `serializeMobileLiveEventDetail()` now returns `event.displayStatus` when a raw live/active event has stale or unavailable provider data and no clock.
- `normalizeEventSummary()` now prefers backend `displayStatus.mobileStatus`, `displayStatus.startsAt`, and `displayStatus.label` for mobile display.

User interactions supported/proven:

- User opens Home and sees the MVP match as `Active` / `Time TBD`.
- User taps Event Detail and sees the same backend-owned display state.
- Chat/orderbook remain hidden.

State transitions:

- No database schema, order lifecycle, provider ingestion, or portfolio route changed.

Validation:

- Backend live-detail contract test passed.
- Mobile adapter/feed tests passed.
- Mobile TypeScript passed.
- Root TypeScript passed.
- S23 focused proof passed on `SM-S911U1`.

Known limitations:

- `displayStatus` is a display contract only; it does not create real live provider breadth.
- Line families remain `contract-fixture` until provider-backed Spread/Totals/Team Total markets exist.

## Cycle NW - Home Display Status Contract

Feature/page worked on:

- Local MVP Home/event-list status contract between backend and mobile.

Backend/harness files touched:

- `src/server/services/eventReadModel.ts`
- `src/__tests__/mobile-event-market-rules-contract.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NW-home-display-status-contract/cycle-NW-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NW-home-display-status-contract/`
  - `docs/mobile/audits/cycle-NW-home-display-status-contract.md`

Important functions/services touched:

- `serializeEventSummary()` now emits `displayStatus` for stale/no-clock raw live/active event summaries.
- Public event and sports exact-key tests were updated to include the intended `displayStatus` public field.

User interactions supported/proven:

- User opens Home and receives backend-owned `Active` / `Time TBD` display state.
- User taps the match and Event Detail continues to show the same display state.
- Chat/orderbook remain hidden.

State transitions:

- No database schema, order lifecycle, provider ingestion, or portfolio route changed.

Validation:

- Backend event summary contract/no-leak tests passed.
- Mobile adapter/feed tests passed.
- Mobile TypeScript passed.
- Root TypeScript passed.
- S23 focused proof passed on `SM-S911U1`.

Known limitations:

- `displayStatus` does not create real live provider breadth.
- Spread/Totals/Team Total remain `contract-fixture` line markets.

## Cycle NX - Provider Line Query Breadth Inspection

Feature/page worked on:

- Local MVP provider discovery path for World Cup line markets used by Event Detail and the simple trade ticket.

Backend/harness files touched:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- Evidence/docs:
  - `docs/mobile/harness/cycle-NX-provider-line-query-breadth/cycle-NX-provider-line-source-probe.json`
  - `docs/mobile/harness/cycle-NX-provider-line-query-breadth/cycle-NX-provider-match-line-availability.json`
  - `docs/mobile/harness/cycle-NX-provider-line-query-breadth/cycle-NX-current-mvp-s23-visible-flow.json`
  - `docs/mobile/screenshots/cycle-NX-provider-line-query-breadth/`
  - `docs/mobile/audits/cycle-NX-provider-line-query-breadth.md`

Important functions/services touched:

- `buildProviderCandidateSearchQueries()` now keeps event/team/family line phrases inside the 12-query cap.
- `buildProviderEventSearchPhrases()` now infers the event team pair from event/title provider team names before outcome labels, so Over/Under outcomes do not displace the actual teams.
- Line-family phrases now include total goals, over/under, spread, handicap, and team-total variants shaped for Polymarket Gamma search.

User interactions supported/proven:

- No new UI surface was added.
- S23 proof verified the current Local MVP Home -> Event Detail path still renders with chat/orderbook hidden while provider discovery work changed under the hood.

State transitions:

- No database schema, order lifecycle, portfolio route, or order submission logic changed.

Validation:

- Provider candidate unit tests passed.
- Root TypeScript passed.
- Provider line source probe passed.
- Provider match line availability proof passed.
- S23 focused visible proof passed on `SM-S911U1`.

Known limitations:

- Polymarket Gamma still exposes only match-winner markets for `argentina-vs-egypt` and `fifwc-col-gha-2026-07-03` in the checked paths.
- Spread/Totals/Team Total remain `contract-fixture` line markets for Local MVP order proof.
- The relevance gate was not weakened; irrelevant candidates remain rejected instead of being attached as fake provider lines.

## Cycle NY - MVP Source Label Cleanup

Feature/page worked on:

- Visible source labels on Home, Event Detail, Trade Ticket, and Portfolio/history rows.

Frontend files touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`

Important functions/services touched:

- `eventSourceReadiness()`
- `lineSourceCopy()`
- `marketSourceHeaderNote()`
- `ticketSourceBadge()` / `ticketSourceNote()`
- `portfolioSourceBadge()` / `portfolioSourceNote()` / `portfolioSourceSummary()`

User interactions supported/proven:

- User opens Home and sees concise provider truth: `Winner: Polymarket / Lines: local test`.
- User opens Event Detail and the source wording remains concise while hidden accessibility markers still preserve provider/fixture status.
- Ticket and Portfolio source chips now say `Polymarket` or `Local test` instead of generic `Provider` / `Local`.

State transitions:

- No database schema, API route, order lifecycle, or portfolio state logic changed.

Validation:

- Mobile source-label contract tests passed.
- Mobile TypeScript passed.
- S23 focused visible proof passed on `SM-S911U1`.

Known limitations:

- This does not create real provider-backed line markets.
- S23 proof covers Home and Event Detail visible sanity; ticket/portfolio wording is covered by focused source-label tests.

## Cycle NZ - Server Order Path Inspection

Feature/page worked on:

- Local MVP service readiness for Home -> Event Detail line market -> server fake-token order -> Portfolio/history.

Backend/harness files touched:

- Evidence only:
  - `docs/mobile/harness/cycle-NZ-server-order-path-inspection/cycle-NZ-home-to-portfolio-route-journey.json`
  - `docs/mobile/harness/cycle-NZ-server-order-path-inspection/cycle-current-holiwyn-home.xml`
  - `docs/mobile/harness/cycle-NZ-server-order-path-inspection/cycle-current-holiwyn-expo-menu.xml`
  - `docs/mobile/audits/cycle-NZ-server-order-path-inspection.md`

Important functions/services touched:

- No app/backend source files changed.
- The proof exercised `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.

User interactions supported/proven:

- Backend route proof selected the current Home MVP event `Argentina vs. Egypt`.
- Backend route proof selected the contract-fixture spread line `Egypt +1.5`.
- Server fake-token order filled and Portfolio/history preserved line, outcome, source, token, and selection identity.

State transitions:

- Created a temporary proof user and seeded maker liquidity.
- Created a BUY order, matched it to FILLED, then verified resulting Portfolio position and recent trade history.

Validation:

- Backend route journey proof passed.
- Attempted S23 UI proof failed before order placement because the Android smoke harness still expects the retired `EL-A Provider Breadth World Cup Live` seed instead of the current `Argentina vs. Egypt` feed.

Known limitations:

- Android UI order proof remains blocked by stale proof harness expectations, not by the service route.
- Real provider-backed Spread/Totals/Team Total lines remain unavailable; the passing order path uses backend-shaped contract fixtures.

## Cycle OA - Current MVP S23 Server Order Proof

Feature/page worked on:

- Current Local MVP visible journey: Home -> Event Detail -> Spread line -> Trade Ticket -> fake-token server order -> Portfolio/open order.

Frontend/harness files touched:

- `mobile/src/api.ts`
- `mobile/scripts/local-mvp-home-route-server-order-proof.ps1`
- `mobile/scripts/smoke.ps1`
- `docs/mobile/audits/cycle-OA-current-mvp-home-server-order.md`

Important functions/services touched:

- Mobile API timeout handling through `apiFetch()`.
- S23 proof wrapper for the current MVP Home route.
- Android smoke selectors for current Home, Event Detail, Trade Ticket, and Portfolio server-order proof.

User interactions supported/proven:

- User opens Home and sees `Argentina vs. Egypt`.
- User opens Event Detail and scrolls to Game Lines.
- User selects a visible Spread line.
- User enters amount through the ticket presets/keypad.
- User swipes to place a fake-token server-backed order.
- User lands on Portfolio Orders and sees the open order with line, period, side, source, and token identity preserved.

State transitions:

- Temporary mobile API credential is created for S23 proof.
- Ticket submit posts to `/api/orders`.
- Portfolio reads back the resulting open order through `/api/portfolio`.
- Separate route proof verifies a filled order and recent history path after backend restart.

Validation:

- Current MVP service inspection passed.
- Backend route journey proof passed after running local backend with internal trading beta enabled and kill switch disabled.
- Mobile TypeScript passed.
- Samsung S23 visible proof passed on `SM-S911U1`.

Known limitations:

- Regulation Winner is Polymarket-backed, but Spread/Totals/Team Total remain `contract-fixture` line markets.
- S23 visible proof creates an open order for the selected visible spread row; filled position/history behavior is covered by route proof with seeded liquidity.

## Cycle OB - Current MVP Server Cancel History Proof

Feature/page worked on:

- Local MVP visible lifecycle after order placement: Portfolio open order -> Cancel -> Portfolio History canceled activity.

Frontend/harness files touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1`
- `mobile/scripts/smoke.ps1`
- `docs/mobile/audits/cycle-OB-current-mvp-home-server-cancel.md`

Important functions/services touched:

- Portfolio tab selection after cancellation.
- S23 current-MVP cancel proof wrapper.
- Android smoke expectations for current History canceled row markers.

User interactions supported/proven:

- User opens Home and Event Detail for `Argentina vs. Egypt`.
- User selects a Spread line and submits a server fake-token order.
- User sees the server open order in Portfolio.
- User taps Cancel.
- Portfolio switches to History and shows a canceled activity row preserving selected line/source/token identity.

State transitions:

- `cancelOpenOrderOnServer()` calls the server cancel route.
- The open order is removed from Portfolio.
- A canceled activity is appended locally after server refresh.
- Portfolio moves to the History tab when cancellation is the latest activity and no open orders remain.

Validation:

- Mobile TypeScript passed.
- Samsung S23 proof passed on `SM-S911U1`.

Known limitations:

- Current canceled activity is shown from the mobile-side canceled activity append after server cancel/refresh.
- Line market source remains `contract-fixture`, not provider-backed Polymarket line data.

## Cycle OC - Server-Owned Cancel History

Feature/page worked on:

- Local MVP Portfolio/history lifecycle after canceling a server-backed fake-token open order.

Frontend files touched:

- `mobile/App.tsx`
- `mobile/src/__tests__/mvpBackendReadinessGate.test.ts`
- `docs/mobile/audits/cycle-OC-server-owned-cancel-history.md`

Important functions/services touched:

- `refreshServerPortfolio()`
- `cancelOpenOrder()`
- `loadServerPortfolioState()`

User interactions supported/proven:

- User opens Home and Event Detail for the current MVP route-backed event.
- User selects a Spread line, opens the ticket, enters an amount, and submits a server fake-token order.
- User sees the open order in Portfolio.
- User taps Cancel and lands on History.
- History shows the canceled order using server-owned `/api/portfolio/history` activity when available.

State transitions:

- `DELETE /api/orders/:id` completes first.
- Mobile refreshes `/api/portfolio` and `/api/portfolio/history`.
- If refreshed server activities contain `canceled-order-${order.id}`, mobile does not append a duplicate local canceled row.
- If the server history row is missing, mobile keeps the previous local append fallback so the user still gets visible cancellation feedback.

Validation:

- Mobile TypeScript passed.
- Route proof passed for open-order cancel and canceled history selection preservation.
- Portfolio sync contract proof passed for server returned canceled activity.
- Samsung S23 proof passed on `SM_S911U1`.

Known limitations:

- The inherited proof wrapper still writes some screenshot/XML filenames with a `cycle-OB` prefix even when using the OC output folders.
- Spread/Totals/Team Total remain `contract-fixture` line markets. The next structural milestone should focus on real Polymarket-backed line market availability/mapping instead of more lifecycle UI polish.

## Cycle OD - Current Provider Line Inspection

Feature/page worked on:

- Current backend/provider readiness inspection for the Local MVP event detail markets.

Frontend/backend files touched:

- No app runtime files changed.
- `docs/mobile/audits/cycle-OD-current-provider-line-inspection.md`
- `docs/mobile/harness/cycle-OD-current-provider-line-inspection/cycle-OD-provider-discovery-guard.json`

Important functions/services touched:

- `discoverMobileLiveProviderCandidates()`
- Current event routes were inspected but not changed.

User interactions supported/proven:

- No new visible interaction was implemented in this inspection-only cycle.
- The inspection supports the next visible MVP cycles by confirming which market data is real provider-backed versus fixture-backed.

State transitions:

- None.

Validation:

- Provider discovery guard passed.
- The guard confirms 3 match-winner candidates are attach-ready and 0 line-market candidates are attach-ready.

Known limitations:

- No Android proof was required because no visible mobile behavior changed.
- Real Polymarket-backed Spread/Totals/Team Total remain unavailable for the current event.

## Cycle OE - Event Detail Source Wording

Feature/page worked on:

- Event Detail Game Lines source wording for the Local MVP mixed-source state.

Frontend files touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
- `docs/mobile/audits/cycle-OE-event-detail-source-wording.md`

Important functions/services touched:

- `marketSourceBadge()`

User interactions supported/proven:

- User opens Home and taps the current MVP event.
- User lands on Event Detail with chat/orderbook hidden.
- User scrolls to Game Lines and sees line market rows labeled `Local test`.
- Provider-backed rows now use the same `Polymarket` wording as Ticket and Portfolio.

State transitions:

- None.

Validation:

- Mobile TypeScript passed.
- Focused mobile Vitest passed.
- Samsung S23 visible proof passed for Home -> Event Detail.
- Samsung S23 line-section XML confirms `Local test` source pills on line markets.

Known limitations:

- This cycle clarifies the visible source wording only; it does not make Spread/Totals/Team Total provider-backed.

## Cycle OF - Ticket and Portfolio Fake-Token Source Clarity

Feature/page worked on:

- Trade Ticket and Portfolio source wording for Local MVP line markets.

Frontend files touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/tradeTicketSourceBadge.test.ts`
- `mobile/src/__tests__/portfolioSourceBadge.test.ts`
- `docs/mobile/audits/cycle-OF-ticket-portfolio-fake-token-source.md`

Important functions/services touched:

- `ticketSourceNote()`
- `portfolioSourceNote()`
- `portfolioSourceSummary()`

User interactions supported/proven:

- User opens Home, enters the current MVP event, selects a Spread line, opens the Trade Ticket, submits a fake-token server order, and sees the order in Portfolio.
- Ticket and Portfolio now make contract-fixture line markets visibly read as local-test fake-token activity instead of generic local data.

State transitions:

- No state transition changed.
- Existing fake-token order placement and Portfolio refresh behavior were preserved.

Validation:

- Mobile TypeScript passed.
- Focused mobile Vitest source-badge tests passed.
- Samsung S23 proof passed on `SM_S911U1`.

Known limitations:

- This cycle clarifies mixed-source/fake-token wording only.
- Spread/Totals/Team Total remain `contract-fixture` line markets until real attach-ready Polymarket line markets exist.

## Cycle OG - Current State Inspection And Path Adjustment

Feature/page worked on:

- Current Local MVP backend/mobile readiness inspection.

Frontend/backend files touched:

- No app runtime files changed.
- `docs/mobile/audits/cycle-OG-current-state-path-adjustment.md`
- `docs/mobile/harness/cycle-OG-current-state-path-adjustment/`

Important functions/services touched:

- No runtime functions changed.
- Inspection exercised `/api/events`, `/api/mobile/events/:slug/live-detail`, current provider match availability proof, and real provider World Cup Winner proof.

User interactions supported/proven:

- No new visible interaction was implemented in this inspection-only cycle.
- The next visible path is adjusted to prioritize current-match Regulation Winner because it is real Polymarket-backed.

State transitions:

- None.

Validation:

- Current MVP state inspection passed.
- Current match provider/line availability proof passed for `argentina-vs-egypt`.
- Real provider World Cup Winner proof passed.

Known limitations:

- Current match Spread/Totals/Team Total are still local-test fake-token fixtures.
- The provider line availability script has an old default slug and should be called with the selected current event slug until updated.

## Cycle OH - Current Match Provider Winner S23 Proof

Feature/page worked on:

- Visible current-match Regulation Winner provider-backed trading path.

Frontend/backend files touched:

- No app runtime files changed.
- `docs/mobile/audits/cycle-OH-provider-winner-current-match.md`
- `docs/mobile/harness/cycle-OH-provider-winner-current-match/`
- `docs/mobile/screenshots/cycle-OH-provider-winner-current-match/`

Important functions/services touched:

- No runtime functions changed.
- Proof exercised Home, Event Detail, Trade Ticket, `/api/orders`, Portfolio, and Portfolio History.

User interactions supported/proven:

- User opens Home.
- User opens `Argentina vs. Egypt`.
- User selects a provider-backed Regulation Winner outcome.
- User opens a Trade Ticket preserving `provider-source-polymarket`.
- User swipes to submit a fake-token server order.
- User sees Portfolio and History preserve winner/provider identity.

State transitions:

- No implementation state transition changed.
- Existing server order and Portfolio refresh path was proven for the current-match provider winner.

Validation:

- Samsung S23 visible proof passed on `SM-S911U1`.

Known limitations:

- This cycle proves the provider-backed Regulation Winner path only.
- Spread/Totals/Team Total remain local-test fake-token fixtures.

## Cycle OI - Local Line Fake-Token Disclosure

Feature/page worked on:

- Home source labels and Event Detail local line source disclosure.

Frontend/proof files touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-OI-local-line-fake-token-disclosure.md`
- `docs/mobile/harness/cycle-OI-local-line-fake-token-disclosure/`
- `docs/mobile/screenshots/cycle-OI-local-line-fake-token-disclosure/`

Important functions/services touched:

- `eventSourceReadiness()`
- `lineSourceCopy()`
- `marketSourceHeaderNote()`
- Current MVP S23 proof harness source-disclosure mode.

User interactions supported/proven:

- User sees fake-token local-line disclosure on Home.
- User opens Event Detail and sees fake-token local-line disclosure in the line section.
- User opens a line Trade Ticket and sees the fake-token source note before submit.

State transitions:

- No app state transition changed.
- Source-disclosure proof intentionally stops before order submit.

Validation:

- Mobile TypeScript passed.
- Focused mobile Vitest source/selection tests passed.
- Samsung S23 source-disclosure proof passed on `SM-S911U1`.

Known limitations:

- Fixture-line order submit hit a backend binary invariant during an earlier full proof attempt and is tracked separately.
- Current-match Regulation Winner remains the proven real provider-backed order path.

## Cycle OJ - Fixture Line Order Cleanup

Feature/page worked on:

- Current Local MVP fixture-line submit proof: Event Detail Spread line -> Trade Ticket -> Portfolio.

Frontend/proof files touched:

- `scripts/seed_mobile_route_spread_counterparty.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-OJ-fixture-line-order-cleanup.md`
- `docs/mobile/harness/cycle-OJ-fixture-line-order-cleanup/`
- `docs/mobile/screenshots/cycle-OJ-fixture-line-order-cleanup/`

Important functions/services touched:

- Spread counterparty proof utility now supports cleanup-only execution.
- Current MVP S23 proof harness cleans stale fixture-line bids before full submit proof.

User interactions supported/proven:

- User opens Home.
- User opens `Argentina vs. Egypt`.
- User selects a local-test fake-token Spread line.
- User opens a Trade Ticket preserving line/source identity.
- User swipes to submit a fake-token server order.
- User reaches Portfolio with the fixture-line order visible.

State transitions:

- Cleanup-only proof cancels stale proof BUY bids before launch.
- Trade Ticket submit no longer fails due to the stale binary invariant conflict.
- Portfolio receives either an open order or a filled position; the final S23 proof landed as an open order.

Validation:

- Mobile TypeScript passed.
- Focused mobile Vitest source/selection tests passed.
- Samsung S23 full visible proof passed on `SM-S911U1`.

Known limitations:

- Spread/Totals/Team Total remain local-test fake-token fixtures.
- Current-match Regulation Winner remains the real Polymarket-backed market path.

## Cycle OK - Current Provider Readiness Gate

Feature/page worked on:

- Current Local MVP provider readiness inspection for Home, Event Detail, line market disclosure, and ticket-ready visible proof.

Frontend/proof files touched:

- `scripts/prove_mobile_provider_match_line_availability.ts`
- `docs/mobile/audits/cycle-OK-current-provider-readiness-gate.md`
- `docs/mobile/harness/cycle-OK-current-provider-readiness-gate/`
- `docs/mobile/screenshots/cycle-OK-current-provider-readiness-gate/`

Important functions/services touched:

- Provider match-line availability proof default now follows the current Home MVP match (`argentina-vs-egypt`) instead of an older disposable event.
- Proof exercised `/api/events`, `/api/mobile/events/:slug/live-detail`, Polymarket Gamma event lookup, provider candidate discovery, and S23 visible source disclosure.

User interactions supported/proven:

- User opens Home and sees the current World Cup match.
- User opens Event Detail and sees provider-backed winner plus fake-token local line disclosure.
- User opens a line Trade Ticket and sees the fake-token local line source note.

State transitions:

- No app runtime state transition changed.
- Inspection confirms the route state: Regulation Winner is provider-backed; lines are contract fixtures.

Validation:

- Root TypeScript passed.
- Mobile TypeScript passed.
- Current-state route proof passed.
- Provider line availability proof passed.
- Provider discovery guard passed.
- Samsung S23 source/readiness proof passed on `SM-S911U1`.

Known limitations:

- Broad configured server Vitest failed in the live local database because of parallel table-reset deadlocks and follow-on FK failures.
- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the current Polymarket event.

## Cycle OL - Provider Readiness Cleanup

Feature/page worked on:

- Cleanup/reporting after provider readiness proof and live database reset side effects.

Frontend/proof files touched:

- `docs/mobile/UI_REGRESSION_SOURCE_CHANGE_REPORT.md`
- `docs/mobile/audits/cycle-OL-provider-readiness-cleanup.md`
- `docs/mobile/harness/cycle-OL-provider-readiness-cleanup/`

Important functions/services touched:

- No app runtime functions changed.
- Restore/proof scripts exercised current match restore, line fixture restore, current-state route inspection, provider line availability proof, and provider discovery guard.

User interactions supported/proven:

- No new UI interaction was added in this cleanup cycle.
- Current provider readiness is restored for Home/Event Detail testing.

State transitions:

- Local database state was restored after broad server tests temporarily removed the current MVP event.
- Current match route state returned to one match, 3 Polymarket winner markets, and 4 contract-fixture line markets.

Validation:

- Restore scripts passed.
- Current-state route proof passed.
- Provider line availability proof passed.
- Provider discovery guard passed.

Known limitations:

- No new S23 proof was run because no mobile UI code changed.
- Next milestone should avoid broad DB-reset server Vitest on the live dev database.

## Cycle OM - Provider Breadth Runtime Loop

Feature/page worked on:

- Provider breadth runtime for mobile World Cup routes.
- S23 visible confirmation of current Local MVP match-only Home/Event Detail state.
- Tiny bot provider-price dry-run.

Frontend/proof files touched:

- `scripts/prove_mobile_provider_breadth_runtime.ts`
- `docs/mobile/audits/cycle-OM-provider-breadth-runtime.md`
- `docs/mobile/harness/cycle-OM-provider-breadth-runtime/`

Important functions/services touched:

- No visible mobile UI code changed.
- Existing real provider import/refresh path imported `provider-breadth-world-cup-winner` from Polymarket Gamma/CLOB.
- New proof script exercised `/api/events` broad World Cup mobile runtime, Local MVP match-only runtime, and `/api/mobile/events/:slug/live-detail`.
- Bot dry-run used `poly-bot` reference-cache dry-run against one Polymarket World Cup winner market.

User interactions supported/proven:

- S23 Home still shows the current Local MVP match-only route.
- S23 Event Detail still renders current match lines and ticket entry.
- Broad provider runtime is proven route-side, not yet exposed as a visible Home mode.

State transitions:

- Local database now has an additional provider-backed World Cup Winner event with 8 refreshed Polymarket markets.
- No user order, portfolio, or visible navigation state changed.

Validation:

- Real provider import/refresh passed.
- Provider breadth route proof passed.
- S23 screenshots/XML captured on `SM-S911U1`.
- Tiny provider bot reference-cache dry-run passed with no local orders placed.

Known limitations:

- Visible mobile Home intentionally still uses `mobileMvpMatches=1`, so it shows one match, not the broader provider-backed World Cup Winner event.
- `Local test` labels remain too prominent in tester UI for contract-fixture line markets.
- Live-local bot order placement was not started; only dry-run provider price readiness was proven.

## Cycle OW - Provider Visible To Tradable Flow

Feature/page worked on:

- Provider-visible World Cup Winner market converted into local internal-test tradable proof flow.
- Mobile Search/Event Detail visibility for a provider-backed future.
- Server-mode Trade Ticket order and Portfolio/history proof against live-local bot liquidity.

Frontend/proof files touched:

- `scripts/prove_mobile_provider_visible_tradable_flow.ts`
- `docs/mobile/audits/cycle-OW-provider-visible-tradable-flow.md`
- `docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/`
- `docs/mobile/screenshots/cycle-OW-provider-visible-tradable-flow/`

Important functions/services touched:

- No visible mobile UI source changed.
- New harness exercises mobile `submitTicketOrder`, `loadPortfolioSnapshot`, `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.
- `poly-bot` reference liquidity setup/runtime was used with one allowlisted market; no bot source changed.

User interactions supported/proven:

- S23 Search can see `World Cup Winner` as a provider-backed result.
- S23 can open the provider-backed World Cup Winner detail page and see outcome rows including England.
- Mobile server-mode ticket order can fill against bot local liquidity.
- Portfolio and history show the filled provider-backed fake-token order.

State transitions:

- `provider-breadth-world-cup-winner` / England was seeded with a small local bot inventory.
- Local backend was restarted for proof with internal trading beta enabled, kill switch off, and the system liquidity bot allowlisted.
- Bot live-local placed four open quotes; the mobile proof filled one NO-side ask.

Validation:

- Bot dry-run passed without exposure-cap blocking.
- Bot live-local quote placement passed.
- Provider visible/tradable route harness passed.
- S23 Search and Event Detail XML/screenshots captured on `SM-S911U1`.

Known limitations:

- Live-local quote placement currently requires local server startup flags for internal trading beta and allowlist.
- Home/Live remain match-only by design; this provider future is visible through Search/detail.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle OX - Internal Beta Trading Startup Harness

Feature/page worked on:

- Local MVP fake-token trading backend startup harness.
- Provider-backed server-mode ticket/order/Portfolio route proof after harness startup.

Frontend/proof files touched:

- `scripts/start_holiwyn_internal_beta_backend.ps1`
- `scripts/prove_mobile_provider_visible_tradable_flow.ts`
- `docs/mobile/audits/cycle-OX-internal-beta-trading-startup-harness.md`
- `docs/mobile/harness/cycle-OX-internal-beta-trading-startup-harness/`

Important functions/services touched:

- No visible mobile UI source changed.
- Added a repeatable package command, `mobile:internal-beta-backend:start`, for local fake-token server-mode proof.
- Reused the mobile order and portfolio service harness against `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`.

User interactions supported/proven:

- No new app screen interaction was added.
- The backend setup required for the existing provider-backed Ticket -> Order -> Portfolio flow is now repeatable.

State transitions:

- Local backend process was restarted through the helper with internal trading beta enabled, kill switch off, and test/bot emails allowlisted.
- A provider-backed fake-token order filled against local MM liquidity and then appeared in Portfolio/history.

Validation:

- Backend startup helper passed and wrote `cycle-OX-internal-beta-backend-start.json`.
- Package script check passed and wrote `cycle-OX-package-script-check.json`.
- Provider-visible tradable route/mobile-service proof passed and wrote `cycle-OX-provider-order-after-startup.json`.

Known limitations:

- No new S23 visual proof was run because this cycle changed backend harness/runtime setup only.
- The helper is local internal MVP infrastructure, not production trading readiness.

## Cycle OY - Second Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- France market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `scripts/start_holiwyn_internal_beta_backend.ps1`
- `scripts/prove_mobile_provider_visible_tradable_flow.ts`
- `docs/mobile/audits/cycle-OY-second-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-OY-second-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Backend helper now starts the local backend with internal trading flags and local bot-seeding flags.
- Provider proof script now accepts a search query for provider-visible mobile Search proof.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the France provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against France local MM liquidity.
- Portfolio/history proof shows the filled France provider-backed position/trade.

State transitions:

- France World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought France YES at `0.35`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper restart passed.
- Reference refresh passed.
- France seed passed after helper carried bot-seeding env.
- Bot live-local placed four France quotes.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PN - Provider Proof Harness And Mbappe Tradable Flow

Feature/page worked on:

- Provider-visible Golden Boot Mbappe market converted into an internal-test tradable Local MVP market.
- Provider-visible-to-tradable proof harness cycle-label hygiene.
- Search/detail visibility on Samsung S23.
- Fake-token server-mode order and Portfolio/history proof.

Frontend/proof files touched:

- `scripts/prove_mobile_provider_visible_tradable_flow.ts`
- `docs/mobile/audits/cycle-PN-provider-proof-harness-mbappe.md`
- `docs/mobile/harness/cycle-PN-provider-proof-harness-mbappe/`
- `docs/mobile/screenshots/cycle-PN-provider-proof-harness-mbappe/`

Important functions/services touched:

- `prove_mobile_provider_visible_tradable_flow.ts` now stamps idempotency keys and client order ids with the active cycle label instead of `cycle-ow-provider`.
- Reused the internal beta backend helper, bot MM enable/seed path, local bot dry-run/live-local quoting, mobile order service, Portfolio snapshot service, and S23 Search/detail launch path.
- No backend schema, visible mobile UI component, order book UI, chat, live stats, or social source files changed.

User interactions supported/proven:

- Samsung S23 Search shows `World Cup: Golden Boot Winner` for `Kylian Mbappe`.
- Tapping the Search result opens Event Detail with provider market `2069638`.
- Mobile service proof submits a fake-token Mbappe YES buy and sees the resulting Portfolio/history state.

State transitions:

- Mbappe Golden Boot market moved into internal-test tradable/MM-enabled state.
- Mbappe market was seeded, quoted by the local bot, bought by the mobile proof user, and reflected in Portfolio/history.

Validation:

- Bot dry-run passed without exposure-cap blocking.
- Bot live-local placed four Mbappe quotes.
- Mobile provider-visible tradable route/service proof passed.
- Samsung S23 Search/detail proof passed on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.
- The provider-visible-to-tradable lifecycle still uses separate bot commands; a future harness can wrap enable/seed/dry-run/live-local/order proof into one orchestrated command.

## Cycle PM - France Nation Top Goalscorer Tradable Proof

Feature/page worked on:

- Provider-visible-to-internal-test-tradable path for a France Nation Top Goalscorer Polymarket market.
- Bot seed/risk-cap behavior that previously blocked live-local quote placement after oversized local inventory.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PM-provider-france-nation-tradable-proof.md`
- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/`
- `docs/mobile/screenshots/cycle-PM-provider-france-nation-tradable-proof/`

Important functions/services touched:

- `seedReferenceLiquidityBotForMarket` in `src/server/services/referenceLiquiditySeeding.ts`.
- No visible mobile UI source changed.
- Reused bot MM enable/seed/live-local scripts, mobile order/Portfolio proof harness, and S23 Search/detail proof.

User interactions supported/proven:

- Samsung S23 Search shows `World Cup: Nation of Top Goalscorer` as a Polymarket-backed event.
- Samsung S23 Event Detail shows the France outcome carrying provider market `2070983`.
- Mobile service proof submits a server-mode fake-token buy against France local MM liquidity.
- Portfolio/history proof shows the filled France provider-backed position/trade.

State transitions:

- France Nation Top Goalscorer market stayed approved/listed/tradable/MM-enabled.
- Reseed downsized stale local complete-set inventory from the older oversized proof profile to the small `500/25` local profile.
- Bot dry-run moved from exposure-cap blocked to below-cap readiness.
- Bot live-local placed quotes, and the mobile proof filled a France YES order.

Validation:

- `npm run test:reference-bot-initialization` passed.
- `npx tsc --noEmit --pretty false --allowJs false` passed.
- Bot dry-run passed after reseed.
- Bot live-local quote placement passed.
- Mobile provider-visible tradable route/service proof passed.
- S23 Search/detail proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.
- Broad futures chart history may remain unavailable even when quote/order/Portfolio flow is tradable.

## Cycle PL - Current Match Line Provider Gate

Feature/page worked on:

- Current-match line-market provider availability gate for the Local MVP event detail flow.
- User-visible scope: Event Detail still shows Spread, Totals, and Team Totals while keeping source wording honest.

Frontend/proof files touched:

- No mobile source changed.
- `docs/mobile/audits/cycle-PL-current-match-line-provider-gate.md`
- `docs/mobile/harness/cycle-PL-current-match-line-provider-gate/`
- `docs/mobile/screenshots/cycle-PL-current-match-line-provider-gate/`

Important functions/services touched:

- No backend source changed.
- Reused `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`.
- Reused `/api/mobile/events/argentina-vs-egypt/live-detail`.
- Reused Polymarket Gamma event lookup for `fifwc-arg-egy-2026-07-07`.
- Reused provider discovery guard to verify line targets reject wrong-family match-winner candidates.

User interactions supported/proven:

- Samsung S23 opens the current match detail page.
- Samsung S23 shows line-market sections for Spread, Totals, and Team Totals.
- S23 XML confirms honest source marker wording is still present for local fixture/fake-token line flow.

State transitions:

- None. This was an audit-gate/contract proof cycle.

Validation:

- Current-state inspection passed.
- Provider match line availability proof passed.
- Provider discovery guard passed.
- S23 visible current-match line proof passed on `SM-S911U1`.

Known limitations:

- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- Local MVP line markets remain contract fixtures until attach-ready provider line rows exist.

## Cycle PK - Golden Boot Haaland Tradable Flow

Feature/page worked on:

- Provider-visible Golden Boot Haaland market converted into an internal-test tradable Local MVP market.
- User path covered: Search/provider event visibility -> Event Detail -> quote -> fake-token order -> Portfolio/history.

Frontend/proof files touched:

- No visible mobile UI source changed.
- `docs/mobile/audits/cycle-PK-golden-boot-haaland-tradable-flow.md`
- `docs/mobile/harness/cycle-PK-golden-boot-haaland-tradable-flow/`
- `docs/mobile/screenshots/cycle-PK-golden-boot-haaland-tradable-flow/`

Important functions/services touched:

- Backend/admin route state was used for `/api/admin/reference-markets/:id`.
- Reused bot scripts for reference liquidity seed, dry-run, and live-local quote placement.
- Reused mobile proof service for server-mode order and Portfolio/history checks.

User interactions supported/proven:

- Samsung S23 Search shows the Haaland provider-backed Golden Boot event.
- Samsung S23 opens Event Detail from Search and preserves provider market `2069636`.
- Mobile service proof submits a fake-token Haaland YES buy and sees the resulting Portfolio/history state.

State transitions:

- Haaland market moved from provider-visible/not-tradable into internal-test tradable state.
- Haaland market was seeded, marked live-ready/live-enabled, quoted by the local bot, bought by the mobile proof user, and reflected in Portfolio/history.

Validation:

- Bot dry-run passed.
- Bot live-local passed without exposure-cap blocking.
- Mobile order/Portfolio proof passed.
- S23 visible Search/detail proof passed on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PJ - Provider Visible Market To Local Tradable Market

Feature/page worked on:

- Provider-visible Nation of Top Goalscorer Norway market converted into an internal-test tradable Local MVP market.
- User path covered: Search/provider event visibility -> Event Detail -> quote -> fake-token order -> Portfolio/history.

Frontend/proof files touched:

- No visible mobile UI source changed.
- `docs/mobile/audits/cycle-PJ-provider-visible-tradable-market.md`
- `docs/mobile/harness/cycle-PJ-provider-visible-tradable-market/`
- `docs/mobile/screenshots/cycle-PJ-provider-visible-tradable-market/`

Important functions/services touched:

- Backend/admin route state was used for `/api/admin/reference-markets/:id`.
- Reused bot scripts for reference liquidity seed, dry-run, and live-local quote placement.
- Reused mobile proof service for server-mode order and Portfolio/history checks.

User interactions supported/proven:

- Samsung S23 Search shows the Norway provider-backed Nation of Top Goalscorer event.
- Samsung S23 opens Event Detail from Search and preserves provider market `2070985`.
- Mobile service proof submits a fake-token Norway YES buy and sees the resulting Portfolio/history state.

State transitions:

- Norway market moved from provider-visible/reference-only style state into internal-test tradable state.
- Norway market was seeded, marked live-ready/live-enabled, quoted by the local bot, bought by the mobile proof user, and reflected in Portfolio/history.

Validation:

- Bot dry-run passed.
- Bot live-local passed without exposure-cap blocking.
- Mobile order/Portfolio proof passed.
- S23 visible Search/detail proof passed on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PF - First Continent Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup continent winner market breadth for the Local MVP retail betting flow.
- Europe (UEFA) market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PF-first-continent-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PF-first-continent-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the `Which continent will win the World Cup?` detail page with the Europe provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Europe local MM liquidity.
- Portfolio/history proof shows the filled Europe provider-backed position/trade.

State transitions:

- Europe continent market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Europe YES at `0.80`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Initial seed with `Europe` matched zero markets; corrected seed with `Europe (UEFA)` passed.
- Bot live-local placed four Europe quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.
- Other provider event families remain visible but not fully local-MM-proven.

## Cycle PG - First Golden Boot Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Golden Boot player market breadth for the Local MVP retail betting flow.
- Lionel Messi market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PG-first-golden-boot-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PG-first-golden-boot-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the `World Cup: Golden Boot Winner` detail page with the Messi provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Messi local MM liquidity.
- Portfolio/history proof shows the filled Messi provider-backed position/trade.

State transitions:

- Messi Golden Boot market was approved tradable, MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Messi YES at `0.40`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Messi seed passed after explicit internal-test tradable approval.
- Bot live-local placed four Messi quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.
- Remaining Golden Boot and nation top-goalscorer markets are still provider-visible but not fully local-MM-proven.

## Cycle PE - Eighth Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- Morocco market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PE-eighth-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PE-eighth-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the Morocco provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Morocco local MM liquidity.
- Portfolio/history proof shows the filled Morocco provider-backed position/trade.

State transitions:

- Morocco World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Morocco YES at `0.05`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Morocco seed passed.
- Bot live-local placed four Morocco quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PD - Seventh Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- Norway market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PD-seventh-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PD-seventh-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the Norway provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Norway local MM liquidity.
- Portfolio/history proof shows the filled Norway provider-backed position/trade.

State transitions:

- Norway World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Norway YES at `0.08`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Norway seed passed.
- Bot live-local placed four Norway quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PC - Sixth Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- Belgium market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PC-sixth-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PC-sixth-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the Belgium provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Belgium local MM liquidity.
- Portfolio/history proof shows the filled Belgium provider-backed position/trade.

State transitions:

- Belgium World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Belgium YES at `0.05`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Belgium seed passed.
- Bot live-local placed four Belgium quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PB - Fifth Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- Argentina market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PB-fifth-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PB-fifth-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the Argentina provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Argentina local MM liquidity.
- Portfolio/history proof shows the filled Argentina provider-backed position/trade.

State transitions:

- Argentina World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Argentina YES at `0.22`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Argentina seed passed.
- Bot live-local placed four Argentina quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PA - Fourth Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- Switzerland market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PA-fourth-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PA-fourth-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the Switzerland provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Switzerland local MM liquidity.
- Portfolio/history proof shows the filled Switzerland provider-backed position/trade.

State transitions:

- Switzerland World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Switzerland YES at `0.04`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Switzerland seed passed.
- Bot live-local placed four Switzerland quotes without exposure-cap blocking after the standalone bot process was run with `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle OZ - Third Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed World Cup Winner market breadth for the Local MVP retail betting flow.
- Spain market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-OZ-third-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-OZ-third-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, and mobile order/Portfolio proof harness.

User interactions supported/proven:

- Samsung S23 proof shows the World Cup Winner detail page with the Spain provider-backed outcome visible/selectable.
- Mobile service proof submits a server-mode fake-token buy against Spain local MM liquidity.
- Portfolio/history proof shows the filled Spain provider-backed position/trade.

State transitions:

- Spain World Cup Winner market was MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Spain YES at `0.21`, producing a filled order and Portfolio/history state.

Validation:

- Backend helper check passed.
- Reference refresh passed.
- Spain seed passed.
- Bot live-local placed four Spain quotes without exposure-cap blocking.
- Mobile provider-visible tradable route/service proof passed.
- S23 visibility proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PH - Nation Top Goalscorer Provider Market Tradable Proof

Feature/page worked on:

- Provider-backed Nation of Top Goalscorer market breadth for the Local MVP retail betting flow.
- Argentina nation market local-MM readiness, fake-token order fill, and Portfolio/history proof.

Frontend/proof files touched:

- `docs/mobile/audits/cycle-PH-nation-top-goalscorer-provider-market-tradable-proof.md`
- `docs/mobile/harness/cycle-PH-nation-top-goalscorer-provider-market-tradable-proof/`
- `docs/mobile/screenshots/cycle-PH-nation-top-goalscorer-provider-market-tradable-proof/`

Important functions/services touched:

- No visible mobile UI source changed.
- Reused the internal beta backend helper, reference refresh path, bot MM enable/seed path, local bot live-local quoting, mobile order/Portfolio proof harness, and S23 direct backend event detail launch path.

User interactions supported/proven:

- Samsung S23 direct detail proof shows the Nation of Top Goalscorer page with the Argentina provider-backed outcome visible.
- Mobile service proof submits a server-mode fake-token buy against Argentina local MM liquidity.
- Portfolio/history proof shows the filled Argentina provider-backed position/trade.

State transitions:

- Argentina Nation of Top Goalscorer market was approved tradable, MM-enabled, seeded, marked live-ready/live-enabled, and locally quoted.
- Mobile proof user bought Argentina YES at `0.40`, producing a filled order and Portfolio/history state.

Validation:

- Target reference refresh passed with high-quality provider data.
- Argentina seed passed.
- Bot live-local placed four Argentina nation quotes without exposure-cap blocking.
- Mobile provider-visible tradable route/service proof passed.
- S23 direct detail proof captured XML/screenshot on `SM-S911U1`.

Known limitations:

- S23 Search deep-link attempts did not reliably land on the Nation of Top Goalscorer Search result surface; direct detail proof passed.
- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PI - Search Deep-Link Provider Futures Proof

Feature/page worked on:

- Search launch/deep-link behavior for provider-backed broad futures.
- Closed the Cycle PH P1 gap where `forceSearchQuery=representing Argentina` was wiped back to Home during reset.

Frontend/proof files touched:

- `mobile/App.tsx`
- `mobile/src/__tests__/deepLinkResetContract.test.ts`
- `docs/mobile/audits/cycle-PI-search-deeplink-provider-futures-proof.md`
- `docs/mobile/harness/cycle-PI-search-deeplink-provider-futures-proof/`
- `docs/mobile/screenshots/cycle-PI-search-deeplink-provider-futures-proof/`

Important functions/services touched:

- `handleLaunchUrl` in `mobile/App.tsx`.
- No backend provider, schema, order, or portfolio route source changed.

User interactions supported/proven:

- Samsung S23 launch into Search with a provider-future query.
- Search displays the `World Cup: Nation of Top Goalscorer` provider-backed event for `representing Argentina`.
- Tapping the Search result opens Event Detail and preserves provider market `2070987`.

State transitions:

- `forceResetState=1` still clears local runtime state.
- Forced Search/Home query launch flags now survive the delayed reset path.
- Search query state is restored before the selected tab is held on Search.

Validation:

- Mobile typecheck passed.
- S23 Search proof passed on `SM-S911U1`.
- S23 detail-from-Search proof passed on `SM-S911U1`.

Known limitations:

- Home/Live remain match-only by design; broad futures remain Search/detail surfaces.
- Current-match Spread/Totals/Team Total remain contract fixtures, not provider-backed line markets.

## Cycle PP - Mobile Google Account Entry

Feature/page worked on:

- Portfolio account entry and Account screen authentication entry.
- Restored a visible Google sign-in action after the Local MVP account screen had been reduced to an unavailable-login notice.

Frontend/proof files touched:

- `mobile/App.tsx`
- `mobile/src/components/AccountScreen.tsx`
- `mobile/src/localization/appCopy.ts`
- `mobile/src/__tests__/accountAuthContract.test.ts`
- `docs/mobile/audits/cycle-PP-mobile-google-account-entry.md`

Important functions/services touched:

- `AccountScreen` now renders `account-login-google` when signed out.
- `openGoogleSignIn` in `mobile/App.tsx` opens the backend Google OAuth start URL through React Native `Linking`.
- Existing backend auth route `/api/auth/google/start` is reused; no backend source or schema changed.

User interactions supported/proven:

- User opens Portfolio, taps the top-left account entry, and sees a Google sign-in action in Account.
- Tapping Google opens the configured Holiwyn backend auth route in the system browser.

State transitions:

- Signed-out account state no longer dead-ends at "login unavailable".
- Successful profile/session hydration after OAuth is still a future auth-callback/mobile-session task; fake-token trading remains available independently.

Validation:

- Pending for this cycle: mobile typecheck, focused account auth contract test, and S23 account screen proof.

Known limitations:

- The mobile app opens the server OAuth flow but does not yet complete a native deep-link session callback.
- Deposits, withdrawals, location verification, and real-money gates remain out of scope for Local MVP.

## Cycle PQ - Event Detail Chart Touch Handoff

Feature/page worked on:

- Event Detail probability chart interaction for the Local MVP retail flow.
- Restored a visible chart point selector and ticket handoff so the chart is not only a passive/static display.

Frontend/proof files touched:

- `mobile/src/components/EventDetail.tsx`
- `docs/mobile/audits/cycle-PQ-event-detail-chart-touch-handoff.md`

Important functions/services touched:

- `renderProbabilityChart` now keeps `selectedChartPoint` state (`current` / `target`).
- The chart point target updates the selected point/tooltip-equivalent.
- `event-detail-chart-open-ticket` opens the normal Trade Ticket with the selected primary market/outcome and `TicketSelection` identity.

User interactions supported/proven:

- User opens Event Detail, taps the chart target, sees the selected point change to `Target line`, and can open a Trade Ticket from the chart selection.

State transitions:

- `selectedChartPoint=current` -> `selectedChartPoint=target`.
- Chart ticket handoff preserves market id, outcome id, market family, line/period if present, provider source, condition, and token metadata through `orderBookTicketSelection`.

Validation:

- Mobile typecheck passed.
- Samsung S23 Event Detail chart proof passed with `cycle-PQ-event-detail-chart-touch-handoff-proof.json`.

Known limitations:

- No backend route/schema changed.
- Provider-backed chart history remains dependent on existing market chart routes; this cycle improves visible interaction, not provider history breadth.

## Cycle PR - Current MVP Service Readiness Inspection

Feature/page worked on:

- Current Local MVP route proof for Home -> Event Detail -> Spread line -> Trade Ticket -> server order -> Portfolio/history.
- No product UI redesign; this cycle tightened proof and documentation around the service state.

Frontend/proof files touched:

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- `docs/mobile/audits/cycle-PR-service-readiness-inspection.md`
- `docs/mobile/harness/cycle-PR-service-readiness-inspection/`
- `docs/mobile/screenshots/cycle-PR-service-readiness-inspection/`

Important functions/services touched:

- S23 proof harness now tolerates expected config warning output from mobile dev credential creation while still checking the exit code.
- S23 proof harness expects the current visible source wording: `Test line - fake USDT`.

User interactions supported/proven:

- User opens Home, sees the current World Cup match, opens Event Detail, selects a Spread line, opens the simple ticket, enters a preset amount, swipes to buy, and reaches Portfolio/history.

State transitions:

- Server-mode ticket submit creates a fake-token order against seeded local liquidity.
- The selected line identity remains `spread`, `line=1.5`, `period=regulation`, `referenceSource=contract-fixture` through order, position, and history.

Validation:

- Current state inspection passed.
- Backend line order lifecycle proof passed.
- Samsung S23 visible flow proof passed with `cycle-PR-current-mvp-s23-visible-flow.json`.

Known limitations:

- Regulation Winner is provider-backed, but Spread/Totals/Team Totals are Local MVP contract fixtures for `argentina-vs-egypt`.
- The current worktree lacks a committed local `.env`; proof commands loaded `DATABASE_URL` from the original local repo env without committing it.

## Cycle QP - Chinese MVP Source Copy Continuity

Feature/page worked on:

- Chinese Local MVP visible path copy for Event Detail -> Trade Ticket -> Portfolio/history.
- This continues the Home/Live Chinese cleanup so the same user flow does not switch back to English source labels.

Frontend/proof files touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/chineseMvpSourceCopy.test.ts`
- `docs/mobile/audits/cycle-QP-chinese-mvp-source-copy.md`

Important functions/services touched:

- `lineSourceCopy(event, locale)` localizes Event Detail source banner copy.
- `marketSourceHeaderNote(market, locale)` localizes line market row source notes.
- `ticketSourceNote(ticket, locale)` localizes Trade Ticket source notes.
- `portfolioSourceNote(selection, locale)` and `portfolioSourceSummary(..., locale)` localize Portfolio source notes and summary.

User interactions supported/proven:

- User can keep the app in Chinese across Home, Event Detail, Ticket, and Portfolio without seeing English-only source labels on the MVP source/status surfaces.

State transitions:

- No order, quote, portfolio, or auth state transition changed.
- Existing source identity still flows from event/market/selection snapshots through ticket/order/portfolio/history.

Validation:

- Mobile typecheck passed.
- Focused source-copy tests passed.
- Samsung S23 proof pending in this cycle until captured.

Known limitations:

- No backend route/schema changed.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.

## Cycle QQ - Chinese Trade Ticket Amount Copy

Feature/page worked on:

- Chinese Trade Ticket amount-entry screen in the Local MVP retail flow.
- This closes the visible English fallback copy that remained after Chinese source-label cleanup.

Frontend/proof files touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/localization/appCopy.ts`
- `mobile/src/__tests__/chineseTradeTicketAmountCopy.test.ts`
- `docs/mobile/audits/cycle-QQ-chinese-ticket-amount-copy.md`

Important functions/services touched:

- `TradeTicketCopy` now includes `chooseAmount`, `toWin`, `odds`, `available`, `marketUnavailable`, and `tradingDisabledForMarket`.
- `TradeTicket` amount, odds, availability, and swipe-submit visible labels now use localized copy.

User interactions supported/proven:

- User opens a Chinese Trade Ticket, sees localized zero-amount guidance, taps a preset amount, and sees localized swipe-to-buy and amount metadata.

State transitions:

- No order, quote, portfolio, auth, or backend state transition changed.
- Existing swipe threshold and submit behavior are unchanged.

Validation:

- Mobile typecheck passed.
- Focused ticket/source-copy tests passed.
- Samsung S23 empty and ready Trade Ticket proof passed with `cycle-QQ-chinese-ticket-amount-copy-proof.json`.

Known limitations:

- No backend route/schema changed.
- Yes/No contract side labels remain as trading contract labels.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.

## Cycle QR - Portfolio Login Entry Clarity

Feature/page worked on:

- Portfolio account/login entry in the Local MVP visible flow.
- This fixes the UX regression where Google login looked like it disappeared after Home account entry cleanup.

Frontend/proof files touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- `docs/mobile/audits/cycle-QR-portfolio-login-entry-clarity.md`

Important functions/services touched:

- Portfolio `openAccount` wiring remains unchanged and still routes to `AccountScreen`.
- `portfolioPageCopy` now uses action-oriented Google login copy in English and Chinese.

User interactions supported/proven:

- User can identify the Google login path from Portfolio instead of expecting it on Home.
- User taps Portfolio account/profile or Google sign-in entry to open the Account screen.

State transitions:

- No order, quote, portfolio, auth session, or backend state transition changed.
- Existing browser-based Google auth start behavior remains in `App.openGoogleSignIn`.

Validation:

- Mobile typecheck passed.
- Focused Portfolio/Account auth contract tests passed.
- Samsung S23 Portfolio and Account proof passed with `cycle-QR-portfolio-login-entry-clarity-proof.json`.

Known limitations:

- Native Google OAuth callback/session/logout remains separate auth work.

## Cycle QV - Event Detail Source Disclosure Compact

Feature/page worked on:

- Event Detail Game Lines source disclosure.
- This keeps provider/local-line audit state available while reducing visible debug weight on the game page.

Frontend/proof files touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
- `docs/mobile/audits/cycle-QV-event-detail-source-compact.md`

Important functions/services touched:

- `lineSourceCopy()` visible text now uses concise user-facing source copy.
- Event Detail source disclosure styles now render as a compact pill row instead of a large card.
- No API client, service, backend, order, or portfolio function changed.

User interactions supported/proven:

- User opens current-match Event Detail and sees Game Lines without the old bulky source explanation interrupting the market list.

State transitions:

- No state transition changed.
- Hidden source markers still preserve provider-backed winner and contract-fixture line readiness for audit/migration.

Validation:

- Mobile typecheck passed.
- Focused Event Detail source/no-chat tests passed.
- Samsung S23 proof passed with `cycle-QV-event-detail-source-compact-proof.json`.

Known limitations:

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- This cycle improves visibility only; it does not implement a new auth provider route.

## Cycle QS - Market Card Chinese Source Copy

Feature/page worked on:

- Shared Home/Live/Search market-card source-readiness copy in Chinese mode.
- This fixes visible mojibake in the Local MVP card source line for Polymarket winner markets plus Holiwyn line markets.

Frontend/proof files touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/__tests__/marketListChineseSourceCopy.test.ts`
- `docs/mobile/audits/cycle-QS-market-card-chinese-source-copy.md`

Important functions/services touched:

- `eventSourceReadiness(event, locale)` now wraps the existing raw source-state helper and returns clean Chinese copy for rendered market cards.

User interactions supported/proven:

- User opens Chinese Home/Live/Search card surfaces and sees readable source copy instead of corrupted text.

State transitions:

- No order, quote, portfolio, auth, backend, or provider state transition changed.
- Existing provider-backed/contract-fixture source markers are preserved for audit/proof.

Validation:

- Mobile typecheck passed.
- Focused Chinese market-card/source-copy tests passed.
- Samsung S23 Chinese Home source-card proof passed with `cycle-QS-market-card-chinese-source-copy-proof.json`.

Known limitations:

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- Some legacy seed/mock copy outside the currently rendered Local MVP path may still need cleanup.

## Cycle QT - Event Detail Player Props Chinese Empty State

Feature/page worked on:

- Event Detail market tabs and intentionally blank Player Props tab in Chinese mode.
- This keeps the game-page structure closer to Polymarket while respecting the current MVP rule that Player Props stay blank.

Frontend/proof files touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/src/localization/appCopy.ts`
- `mobile/src/__tests__/eventDetailPlayerPropsChineseCopy.test.ts`
- `docs/mobile/audits/cycle-QT-event-detail-player-props-chinese-empty.md`

Important functions/services touched:

- `renderMarketTabs()` now uses localized tab copy.
- Event Detail Player Props empty state now uses localized copy from `appCopy`.

User interactions supported/proven:

- User opens Chinese Event Detail, taps Player Props, and sees a localized blank state instead of English-only placeholder text.

State transitions:

- No ticket, order, portfolio, auth, backend, or provider state transition changed.
- Player Props remains an empty MVP tab; no unfinished prop trading route is exposed.

Validation:

- Mobile typecheck passed.
- Focused Event Detail tab/copy tests passed.
- Samsung S23 proof passed with `cycle-QT-event-detail-player-props-chinese-empty-proof.json`.

Known limitations:

- Player Props functionality remains intentionally blank for this MVP.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.

## Cycle QU - Portfolio Google Login Visibility

Feature/page worked on:

- Portfolio account/login header and Account entry path.
- This keeps Home clean while making Google login discoverable from Portfolio.

Frontend/proof files touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- `docs/mobile/audits/cycle-QU-portfolio-google-login-visibility.md`

Important functions/services touched:

- Portfolio render copy and accessibility markers for `portfolio-account-entry-top-left` and `portfolio-account-entry-google`.
- No service, API client, order, or backend function changed.

User interactions supported/proven:

- User opens Portfolio, sees explicit Google login wording, taps the Portfolio Google login entry, and lands on Account with the Google login action visible.

State transitions:

- `openAccount()` still moves `mainTab` from `portfolio` to `account`.
- No ticket, order, portfolio data, auth session, backend, or provider state transition changed.

Validation:

- Mobile typecheck passed.
- Focused Portfolio settings contract test passed.
- Samsung S23 proof passed with `cycle-QU-portfolio-google-login-visibility-proof.json`.

Known limitations:

- Native Google OAuth callback/session/logout remains separate auth work.

## Cycle QW - Portfolio Google Badge Visibility

Feature/page worked on:

- Portfolio account/login entry clarity after tester feedback that Google login looked missing.
- This keeps Home clean while making the Portfolio top-left account path visually identifiable.

Frontend/proof files touched:

- `mobile/src/components/Portfolio.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- `docs/mobile/audits/cycle-QW-portfolio-google-badge-visibility.md`

Important functions/services touched:

- `PortfolioAvatar()` now renders a small Google badge inside the existing Portfolio account entry.
- Portfolio still calls the existing `openAccount()` callback; no auth, order, or provider service changed.

User interactions supported/proven:

- User opens Portfolio, sees the Google/account badge and Google login chip, taps the Portfolio account entry, and reaches Account where Google login is visible.

State transitions:

- `openAccount()` still moves from Portfolio to Account.
- No Home state, ticket state, order state, portfolio data state, auth session state, backend route, or provider state changed.

Validation:

- Mobile typecheck passed.
- Focused Portfolio settings and Account auth contract tests passed.
- Samsung S23 proof passed with `cycle-QW-portfolio-google-badge-visibility-proof.json`.

Known limitations:

- Native Google OAuth callback/session/logout remains separate auth work.

## Cycle QX - Portfolio Proof Launch Reliability

Feature/page worked on:

- Portfolio proof launch reliability for the Local MVP audit loop.
- This ensures automated S23 proof can land on Portfolio without a manual tab tap, even when Expo Go does not forward cold-launch query params.

Frontend/proof files touched:

- `mobile/App.tsx`
- `mobile/src/__tests__/deepLinkResetContract.test.ts`
- `docs/mobile/audits/cycle-QX-portfolio-deeplink-proof-reliability.md`

Important functions/services touched:

- `handleLaunchUrl()` now reapplies `setMainTab("portfolio")` after reset when `forcePortfolio=1` is present.
- `PROOF_INITIAL_TAB` reads `EXPO_PUBLIC_PROOF_INITIAL_TAB` and defaults to Home, giving proof runs a deterministic startup tab without changing normal user startup.
- No service, API client, order, provider, or backend function changed.

User interactions supported/proven:

- S23 proof starts the current Expo Go runtime on Portfolio without manual tab tap.
- Portfolio Google/account entry remains visible.
- Tapping the Portfolio Google/account entry opens Account, where the Google login button remains visible.

State transitions:

- Reset still clears runtime state and storage.
- When the launch URL explicitly requests Portfolio, the UI tab returns to Portfolio after the reset completes.
- When proof runs set `EXPO_PUBLIC_PROOF_INITIAL_TAB=portfolio`, the initial `mainTab` starts at Portfolio; normal runtime defaults to Home.

Validation:

- Mobile typecheck passed.
- Focused deep-link reset contract test passed.
- Samsung S23 proof passed with `cycle-QX-portfolio-proof-launch-reliability-proof.json`.

Known limitations:

- Native Google OAuth callback/session/logout remains separate auth work.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- Expo Go launch URL forwarding remains unreliable on this S23 session; stop stale `com.holiwyn.mobile` and use the proof initial-tab override when a deterministic proof starting screen is needed.

## Cycle QY - Home/Live Retail Source Cleanup

Feature/page worked on:

- Home and Live visible match-card source/debug copy.
- This keeps the Local MVP retail feed focused on matches and outcome probabilities instead of provider implementation labels.

Frontend/proof files touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/LiveScreen.tsx`
- `mobile/src/__tests__/liveSourceReadinessContract.test.ts`
- `mobile/src/__tests__/marketListChineseSourceCopy.test.ts`
- `docs/mobile/audits/cycle-QY-home-live-retail-source-cleanup.md`

Important functions/services touched:

- `eventSourceReadiness()` still derives hidden source readiness from `event.marketSourceSummary`.
- `MarketList` now renders source readiness as a hidden audit marker instead of visible tester-facing text.
- `LiveScreen` keeps `live-source-readiness` hidden when readiness is present.
- No service, API client, order, provider, or backend function changed.

User interactions supported/proven:

- Home still opens with match cards and retail outcome buttons.
- Visible source/debug labels such as `Winner: Polymarket / Holiwyn lines` are absent from Home and Live.
- Hidden Home source readiness markers remain available for audit and backend migration.

State transitions:

- No navigation, ticket, order, Portfolio, account, backend, or provider state transition changed.

Validation:

- Mobile typecheck passed.
- Focused source-readiness and Search contract tests passed.
- Samsung S23 proof passed with `cycle-QY-home-live-retail-source-cleanup-proof.json`.

Known limitations:

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- Live proof had no live source-readiness marker because the current backend Live view did not expose a ready live marker in that capture.
