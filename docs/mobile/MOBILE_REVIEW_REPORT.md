# Mobile Review Report

Purpose: Record code, UX, architecture, and safety review findings for each verified cycle.

## Review Checklist

- TypeScript is clean.
- App launches on emulator.
- Navigation works for changed screens.
- UI is original to Holiwyn.
- No Polymarket branding, assets, images, or copied copy.
- Touch targets are usable.
- English and Simplified Chinese paths are considered where relevant.
- Backend/schema changes are documented.
- Technical debt is recorded.
- Cycle branch is safe to merge locally.
- Required harnesses from `docs/mobile/MOBILE_HARNESS_SPEC.md` passed or failures are documented.

## Cycle Reviews

### Cycle 001

Date: 2026-07-01
Branch: mobile/cycle-001
Reviewer: Lead/Reviewer pass
Scope: Phase 0 docs, reference screenshots, repo-local mobile bootstrap, emulator launch.
Findings:
- P1: Bootstrap UI is not yet dark-first and not yet close to Polymarket World Cup UX. Acceptable for Phase 0; tracked as TD-002.
- P1: App currently depends on backend events and displays an empty state when no World Cup markets are present. Cycle 002 should add mock World Cup data. Tracked as TD-003.
- P2: npm audit reports moderate dependency advisories. Tracked as TD-001.
- No Polymarket assets or branding were copied into the Holiwyn app.
- Reference screenshots are stored only for internal UX mapping.
Decision: Approve Cycle 001 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 002

Date: 2026-07-01
Branch: mobile/cycle-002
Reviewer: Lead/Reviewer pass with Product Explorer input
Scope: Dark-first Holiwyn app shell, mock World Cup data, Games/Futures tabs, event detail, trade ticket, fake order placement, Portfolio, Search, Live, and localization.
Findings:
- P1: The app is still mock-data first. Backend market and order adapters are required before it can be considered tradable against server state. Tracked as TD-004.
- P2: Bottom safe-area spacing needs polish on long market lists. It is usable through scrolling but should be tightened before broader testing. Tracked as TD-005.
- P2: Emoji/text placeholders are acceptable for cycle speed but should become brand-safe assets. Tracked as TD-006.
- No Polymarket branding, logo, images, or protected copy were copied into Holiwyn.
- TypeScript passed and emulator smoke tests covered the changed flows.
Decision: Approve Cycle 002 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 003

Date: 2026-07-01
Branch: mobile/cycle-003
Reviewer: Lead/Reviewer pass with Reviewer Agent input
Scope: Backend-compatible data adapter, World Cup API query correction, and repeatable emulator smoke harness.
Findings:
- P1: `mobile/App.tsx` remains a large single-file UI; acceptable for this cycle because adapter code is isolated in `mobile/src/adapters/worldCupAdapter.ts`.
- P1: Real order placement remains intentionally mocked because backend order routes require auth/trading guards. Tracked as TD-007.
- P2: Chinese strings rendered correctly in emulator in Cycle 002, but source display can appear mojibake in some shell output. Watch before expanding localization files.
- API query no longer filters only `LIVE`, so scheduled World Cup matches can appear.
- `npm run typecheck` and `npm run smoke` passed.
Decision: Approve Cycle 003 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 004

Date: 2026-07-01
Branch: mobile/cycle-004
Reviewer: Lead/Reviewer pass
Scope: Mobile order service boundary, mock/server mode preparation, Portfolio order-mode metadata.
Findings:
- P1: Server order mode is intentionally guarded and unverified with auth; default mock mode is correct for current fake-token requirement. Tracked as TD-008.
- P1: `mobile/App.tsx` remains large; next cycle should begin component extraction unless a higher-risk backend integration is selected.
- No deposit or withdrawal paths were introduced.
- `npm run typecheck`, `npm run smoke`, and emulator mock order placement passed.
Decision: Approve Cycle 004 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 005

Date: 2026-07-01
Branch: mobile/cycle-005
Reviewer: Lead/Reviewer pass
Scope: Presentation helper extraction.
Findings:
- P2: This is intentionally a small architecture cycle; it reduces helper coupling but does not materially shrink the UI component tree yet.
- P2: Localization table remains in `App.tsx`; broad extraction should wait until encoding is normalized. Tracked as TD-009.
- `npm run typecheck` and `npm run smoke` passed.
Decision: Approve Cycle 005 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 006

Date: 2026-07-01
Branch: mobile/cycle-006
Reviewer: Lead/Reviewer pass
Scope: Bottom navigation component extraction.
Findings:
- P2: Extracted bottom tabs reduce `App.tsx` coupling without changing runtime behavior.
- P2: Some now-unused tab styles remain in `App.tsx`; harmless but should be cleaned during broader component extraction.
- `npm run typecheck` and `npm run smoke` passed.
Decision: Approve Cycle 006 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 007

Date: 2026-07-01
Branch: mobile/cycle-007
Reviewer: Lead/Reviewer pass
Scope: Trade Ticket component extraction.
Findings:
- P1: Trading path was retested after extraction with a mock order and Portfolio verification.
- P2: Old ticket styles remain in `App.tsx`; clean them after more components move out, or in a dedicated style cleanup cycle.
- `npm run typecheck`, `npm run smoke`, and manual ticket order QA passed.
Decision: Approve Cycle 007 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 008

Date: 2026-07-01
Branch: mobile/cycle-008
Reviewer: Lead/Reviewer pass
Scope: Portfolio component extraction.
Findings:
- P1: Portfolio was retested after extraction through the mock order flow.
- P2: The visible test state accumulated several mock positions from prior cycles; acceptable for runtime proof, but a resettable smoke harness would make screenshots cleaner.
- `npm run typecheck`, `npm run smoke`, and manual Portfolio QA passed.
Decision: Approve Cycle 008 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 009

Date: 2026-07-01
Branch: mobile/cycle-009
Reviewer: Lead/Reviewer pass
Scope: Smoke harness app-state reset.
Findings:
- P2: Force-stopping Expo Go before smoke launch prevents screenshots from inheriting prior in-memory navigation/order state.
- P2: Harness still captures only one screen; future harness can add scripted taps for ticket and Portfolio.
- `npm run smoke` passed and screenshot confirmed Home-state rendering.
Decision: Approve Cycle 009 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 010

Date: 2026-07-01
Branch: mobile/cycle-010
Reviewer: Lead/Reviewer pass
Scope: Games/Futures market list component extraction.
Findings:
- P1: Home/Games and Futures list paths were both verified on emulator after extraction.
- P2: Event Detail still owns similar market-row rendering inside `App.tsx`; next extraction should address it or deliberately improve the grouped props UI.
- `npm run typecheck`, `npm run smoke`, and Futures tap QA passed.
Decision: Approve Cycle 010 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 011

Date: 2026-07-01
Branch: mobile/cycle-011
Reviewer: Lead/Reviewer pass
Scope: Event Detail component extraction.
Findings:
- P1: Event detail path was verified on emulator after extraction.
- P2: Backend-fed event detail currently shows generic fixture naming for some imported events; that belongs to future data-quality/grouping work, not the extraction itself.
- `npm run typecheck`, `npm run smoke`, and event-detail tap QA passed.
Decision: Approve Cycle 011 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 012

Date: 2026-07-01
Branch: mobile/cycle-012
Reviewer: Lead/Reviewer pass
Scope: Event Detail grouped market presentation.
Findings:
- P1: Group headers are visible on emulator and preserve outcome button access.
- P2: Backend data quality still produces generic event titles for some fixtures; track as future normalization work.
- `npm run typecheck`, `npm run smoke`, and grouped Event Detail tap QA passed.
Decision: Approve Cycle 012 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 013

Date: 2026-07-01
Branch: mobile/cycle-013
Reviewer: Lead/Reviewer pass
Scope: Deep smoke harness for Home, Ticket, and Portfolio.
Findings:
- P1: `npm run smoke:deep` verifies the fake-token trade path without manual taps.
- P2: The deep smoke still relies on fixed emulator tap coordinates; future harness work should move toward accessibility IDs or Detox/Appium-style selectors.
- Deep smoke passed and screenshots were captured.
Decision: Approve Cycle 013 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 014

Date: 2026-07-01
Branch: mobile/cycle-014
Reviewer: Lead/Reviewer pass
Scope: Backend event display normalization in mobile adapter.
Findings:
- P1: Normalization is narrowly scoped to generic fixture titles where all normalized markets are futures.
- P2: More nuanced event naming is still needed for mixed grouped events and team-vs-team fixtures with incomplete metadata.
- `npm run typecheck`, `npm run smoke`, and normalized detail QA passed.
Decision: Approve Cycle 014 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 015

Date: 2026-07-01
Branch: mobile/cycle-015
Reviewer: Lead/Reviewer pass
Scope: Accessibility labels/test IDs for harness-critical surfaces.
Findings:
- P1: Labels cover featured futures, World Cup tabs, trade ticket, place order, Portfolio screen, and fake balance card.
- P2: Harness still uses coordinates; labels are groundwork for a selector-based follow-up.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 015 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 016

Date: 2026-07-01
Branch: mobile/cycle-016
Reviewer: Lead/Reviewer pass
Scope: Live tab presentation.
Findings:
- P1: Live tab now communicates its state without relying on generic search empty copy.
- P2: Live count is driven by current client-side filtered events; future cycles should add live status refresh/polling or streaming.
- `npm run typecheck`, `npm run smoke`, and Live tab QA passed.
Decision: Approve Cycle 016 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 017

Date: 2026-07-01
Branch: mobile/cycle-017
Reviewer: Lead/Reviewer pass with Audit Agent recommendation
Scope: Android smoke harness hierarchy evidence and bottom tab automation labels.
Findings:
- P1: Harness now saves Android UI hierarchy XML and asserts stable visible text for Home, Ticket, and Portfolio.
- P2: Visible text assertions are safer than relying on React Native `testID`; bottom tab labels are still useful groundwork because they appear in the dumped hierarchy.
- P2: Coordinate taps remain a known limitation, but landed-screen assertions reduce false confidence.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 017 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 018

Date: 2026-07-01
Branch: mobile/cycle-018
Reviewer: Lead/Reviewer pass
Scope: Deep smoke coverage for Live and Search tabs.
Findings:
- P1: Deep smoke now proves the main shell tabs beyond Home/Portfolio by asserting Live and Search hierarchy text.
- P2: Search screenshot shows the intended search input and market list, but typed-query behavior still needs a future product/harness cycle.
- P2: Coordinate taps remain tracked as TD-011.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 018 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 019

Date: 2026-07-01
Branch: mobile/cycle-019
Reviewer: Lead/Reviewer pass after Recovery Harness
Scope: Search result presentation and smoke harness resilience.
Findings:
- P1: Search now opens to a usable results view without keyboard/stylus overlay, with clear result count context.
- P1: Smoke launch now waits for Holiwyn Home and retries the Expo URL, reducing false failures.
- P2: Search filtering itself is still shared text filtering; typed-query QA and richer filters remain future work.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 019 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 020

Date: 2026-07-01
Branch: mobile/cycle-020
Reviewer: Lead/Reviewer pass
Scope: Search quick filters.
Findings:
- P1: Search now supports quick browsing by all, live, and upcoming World Cup markets.
- P2: Filter interaction is visually verified and labels are hierarchy-asserted; tapping each filter should become explicit harness coverage in a future cycle.
- P2: Backend was unavailable during smoke, but mock fallback path is expected and verified.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 020 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 021

Date: 2026-07-01
Branch: mobile/cycle-021
Reviewer: Lead/Reviewer pass
Scope: Search screen component extraction.
Findings:
- P1: Search UI and filter behavior moved into a dedicated component without changing runtime behavior.
- P2: `App.tsx` still owns broad app state and other inline screens; future extraction should continue in small verified cycles.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 021 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 022

Date: 2026-07-01
Branch: mobile/cycle-022
Reviewer: Lead/Reviewer pass
Scope: Live screen component extraction.
Findings:
- P1: Live UI moved into a dedicated component while preserving the live count and empty/populated state behavior.
- P2: Home screen remains the largest inline surface in `App.tsx`; extract in a later cycle.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 022 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 023

Date: 2026-07-01
Branch: mobile/cycle-023
Reviewer: Lead/Reviewer pass after Recovery Harness
Scope: Typed-query Search smoke coverage.
Findings:
- P1: Search zero-result query behavior is now verified on emulator with screenshot and hierarchy evidence.
- P2: The smoke-only soft-input flag is acceptable because it is gated to the Expo smoke process and preserves normal app keyboard behavior.
- P2: A future selector/E2E runner should replace coordinate focus and ADB text entry.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 023 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 024

Date: 2026-07-01
Branch: mobile/cycle-024
Reviewer: Lead/Reviewer pass after Recovery Harness
Scope: Live tab freshness and refresh control.
Findings:
- P1: Live tab now communicates freshness and exposes a refresh action, bringing it closer to sports live-market expectations.
- P2: Refresh currently updates local UI state only; backend/live odds reload is tracked as debt.
- P2: The final harness assertion checks `refreshed`, avoiding the earlier weak match against the live count.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 024 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 025

Date: 2026-07-01
Branch: mobile/cycle-025
Reviewer: Lead/Reviewer pass after Recovery Harness
Scope: Live refresh event reload and API timeout behavior.
Findings:
- P1: Live refresh now invokes the shared World Cup event loader instead of only mutating component-local state.
- P1: Mobile API requests now abort after 3.5 seconds, preventing emulator refresh from hanging indefinitely when the local backend is unavailable.
- P2: Refresh evidence still proves fallback reload behavior; real backend freshness and live odds deltas remain future work when the backend is reachable.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 025 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 026

Date: 2026-07-01
Branch: mobile/cycle-026
Reviewer: Lead/Reviewer pass after Recovery Harness
Scope: Featured futures card component extraction.
Findings:
- P1: Home now uses a dedicated `FeaturedFuture` component for the top futures card while preserving the ticket-opening interaction.
- P2: The old inline `FeaturedFuture` function remains as dead code because removing the encoded block created a noisy file rewrite during recovery; this is tracked as TD-014.
- P2: The extracted component uses the existing Expo icon set for the trophy badge and keeps stable automation labels on outcomes.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 026 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 027

Date: 2026-07-01
Branch: mobile/cycle-027
Reviewer: Lead/Reviewer pass
Scope: Remove stale inline featured futures implementation.
Findings:
- P1: TD-014 is resolved; `App.tsx` no longer carries the dead inline featured futures function.
- P2: The extracted `FeaturedFuture` component remains wired from Home and keeps the same ticket-opening behavior under deep smoke.
- P2: Home still owns SportNav, search box, segmented tabs, and list composition; further extraction remains useful.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 027 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 028

Date: 2026-07-01
Branch: mobile/cycle-028
Reviewer: Lead/Reviewer pass
Scope: Home sports navigation extraction.
Findings:
- P1: `SportNav` is now a dedicated component, reducing `App.tsx` ownership of Home presentation.
- P2: The component preserves the same sport labels and active World Cup state.
- P2: Home still owns Search box, segmented Games/Futures control, and list composition.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 028 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 029

Date: 2026-07-01
Branch: mobile/cycle-029
Reviewer: Lead/Reviewer pass
Scope: Home Games/Futures segmented control extraction.
Findings:
- P1: `WorldCupSegmented` now owns the Games/Futures tab UI and keeps the existing accessibility/test labels.
- P2: The extracted component exports the `WorldCupTab` type, reducing local app type duplication.
- P2: The broader Home screen composition still remains inline and should be a later extraction.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 029 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 030

Date: 2026-07-01
Branch: mobile/cycle-030
Reviewer: Lead/Reviewer pass
Scope: Home screen component extraction.
Findings:
- P1: `HomeScreen` now owns Home layout composition, reducing `App.tsx` to state orchestration and app shell flow.
- P1: The extracted Home screen preserves featured futures, Search, Games/Futures segmented control, and market list behavior under deep smoke.
- P2: `App.tsx` still owns header, copy table, backend loading, and order state; further extraction remains useful.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 030 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 031

Date: 2026-07-01
Branch: mobile/cycle-031
Reviewer: Lead/Reviewer pass
Scope: Portfolio position detail.
Findings:
- P1: Portfolio positions now show entry probability, current value, and estimated P/L, improving trading-app parity without touching wallet deposit/withdraw flows.
- P1: Deep smoke now asserts the new Portfolio detail labels after placing a mock order.
- P2: The P/L model is deterministic mock valuation; real mark prices and server-backed positions remain future work.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 031 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 032

Date: 2026-07-01
Branch: mobile/cycle-032
Reviewer: Lead/Reviewer pass
Scope: Header component extraction.
Findings:
- P1: `Header` now owns brand, language toggle, promo, and notification presentation.
- P2: Header extraction preserves the visible Home shell and full deep-smoke flow.
- P2: Copy still lives in `App.tsx`; extracting localization remains useful after the current component work.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 032 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 033

Date: 2026-07-01
Branch: mobile/cycle-033
Reviewer: Lead/Reviewer pass
Scope: Portfolio aggregate summary metrics.
Findings:
- P1: Portfolio now exposes aggregate Invested, Current value, and Est. P/L cards, improving trading-app account context without touching deposit/withdraw.
- P1: Deep smoke asserts the new `Invested` summary label along with existing position details.
- P2: The valuation remains mock-only and should be replaced with backend/live quote marks when server-backed positions are ready.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 033 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 034

Date: 2026-07-01
Branch: mobile/cycle-034
Reviewer: Lead/Reviewer pass
Scope: Portfolio close-position affordance.
Findings:
- P1: Portfolio positions now expose a `Close position` action in the fake-token flow, improving account/trading ergonomics.
- P1: Deep smoke asserts the new action appears after a mock trade.
- P2: The action is state-backed in app code, but the current smoke only verifies visibility; a future cycle should tap it and assert balance/empty-position state.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 034 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 035

Date: 2026-07-01
Branch: mobile/cycle-035
Reviewer: Lead/Reviewer pass
Scope: Close-position behavior smoke verification.
Findings:
- P1: Deep smoke now taps `Close position` and verifies credited fake balance plus `No positions yet`, closing the Cycle 034 behavior gap.
- P1: The behavior remains fake-token only and does not touch deposit, withdraw, or real-money paths.
- P2: The harness still uses a coordinate tap for this action; selector-based automation remains useful future work.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 035 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 036

Date: 2026-07-01
Branch: mobile/cycle-036
Reviewer: Lead/Reviewer pass
Scope: Localization copy extraction.
Findings:
- P1: `App.tsx` now imports bilingual app copy from `mobile/src/localization/appCopy.ts`, reducing app shell size and ownership.
- P1: Simplified Chinese app copy is normalized with Unicode escapes in the localization module, reducing future encoding drift.
- P2: Component-level copy prop types remain local and duplicated; a future shared `AppCopy` import could tighten type reuse.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 036 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 037

Date: 2026-07-01
Branch: mobile/cycle-037
Reviewer: Lead/Reviewer pass
Scope: Portfolio recent activity.
Findings:
- P1: Portfolio now shows visible Bought and Closed history rows after the fake-token trade lifecycle.
- P1: Deep smoke asserts the activity section after the close flow, so the feature is behavior-verified on emulator.
- P2: Activity history is local state only; server-backed order history remains a future backend integration task.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 037 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 038

Date: 2026-07-01
Branch: mobile/cycle-038
Reviewer: Lead/Reviewer pass
Scope: Expanded World Cup markets and event-detail smoke coverage.
Findings:
- P1: Event detail now includes additional soccer props (`Both teams to score`, `First goal scorer team`) and a live `Next goal` market in mock data.
- P1: Deep smoke now opens Event Detail, verifies grouped game-line/prop markets, scrolls to below-fold props, and then reruns the existing trade/Portfolio/Live/Search path.
- P2: The harness uses an Expo relaunch after detail verification because Android Back exits the state-driven view; improving app-level back handling remains a useful next step.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 038 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 039

Date: 2026-07-01
Branch: mobile/cycle-039
Reviewer: Lead/Reviewer pass
Scope: Android Event Detail back behavior.
Findings:
- P1: Event Detail now intercepts Android hardware Back and returns to Home instead of exiting Expo.
- P1: Deep smoke verifies Event Detail, scrolled props, hardware Back return to Home, and the downstream trading path without the forced relaunch workaround.
- P2: Coordinate taps still drive several harness steps; selector-based Android automation remains a future improvement.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 039 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 040

Date: 2026-07-01
Branch: mobile/cycle-040
Reviewer: Lead/Reviewer pass
Scope: Server-mode Portfolio history adapter.
Findings:
- P1: Mobile now has a typed `GET /api/portfolio/history` client method and maps resolved backend history into Portfolio activity rows.
- P1: The adapter is only loaded in server order mode, so fake-token mock development and smoke behavior remain unchanged.
- P2: The adapter covers resolved history only; open orders/positions still need a dedicated server-mode Portfolio path.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 040 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 041

Date: 2026-07-01
Branch: mobile/cycle-041
Reviewer: Lead/Reviewer pass
Scope: Server-mode Portfolio snapshot adapter.
Findings:
- P1: Mobile now has a typed `GET /api/portfolio` client method and maps backend wallet/open-position data into mobile balance and Portfolio positions.
- P1: The adapter is gated to server order mode, preserving safe fake-token mock behavior in normal emulator development.
- P2: Open orders and combo orders are typed at the response boundary but not yet displayed in Portfolio.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 041 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 042

Date: 2026-07-01
Branch: mobile/cycle-042
Reviewer: Lead/Reviewer pass
Scope: Server-mode Portfolio open orders display.
Findings:
- P1: Server snapshot open orders are now mapped into a typed mobile `OpenOrder` model and passed into Portfolio.
- P1: Portfolio can render open order market, side, outcome, status, price, and remaining size when backend data exists.
- P2: Open orders are read-only; cancel/edit actions remain a future trading parity step.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 042 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 043

Date: 2026-07-01
Branch: mobile/cycle-043
Reviewer: Lead/Reviewer pass
Scope: Portfolio order confirmation.
Findings:
- P1: Portfolio now shows an immediate `Order placed` confirmation after the mock order transitions into a position.
- P1: Deep smoke asserts the confirmation and still verifies close-position behavior plus activity history.
- P2: Confirmation is local state only; server-mode acknowledgement should eventually reflect backend order status.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 043 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 044

Date: 2026-07-01
Branch: mobile/cycle-044
Reviewer: Lead/Reviewer pass
Scope: Trade Ticket available balance display.
Findings:
- P1: Trade Ticket now shows available fake balance before order submission, improving sizing clarity.
- P1: Deep smoke asserts `Fake balance` and `10,000 USDT` in the ticket before placing the mock order.
- P2: Ticket still lacks a max/percent sizing control; that remains a useful next trading ergonomics step.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 044 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 045

Date: 2026-07-01
Branch: mobile/cycle-045
Reviewer: Lead/Reviewer pass
Scope: Trade Ticket Max amount control.
Findings:
- P1: Trade Ticket now exposes a `Max` control for fast fake-balance sizing.
- P1: Deep smoke taps Max and verifies the updated ticket estimate before placing the order.
- P2: Max is still tested through coordinates; selector-driven mobile automation remains a useful harness improvement.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 045 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 046

Date: 2026-07-01
Branch: mobile/cycle-046
Reviewer: Lead/Reviewer pass
Scope: Trade Ticket amount preset controls.
Findings:
- P1: Trade Ticket now exposes common fake-token amount presets for 100, 500, and 1,000 USDT.
- P1: Presets preserve the existing manual amount, Max sizing, estimated cost/payout, and mock order path.
- P2: The harness still relies on coordinates for ticket actions; the Max coordinate was adjusted after the preset row changed layout.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 046 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 047

Date: 2026-07-01
Branch: mobile/cycle-047
Reviewer: Lead/Reviewer pass
Scope: Selector-driven ticket harness taps.
Findings:
- P1: Smoke harness now resolves tappable bounds from the Android UI hierarchy for `ticket-max-amount` and `place-mock-order`.
- P1: This removes the exact coordinate drift that interrupted Cycle 046 after the ticket layout changed.
- P2: Other smoke actions still use fixed coordinates; future cycles should continue moving stable controls onto hierarchy ids.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 047 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 048

Date: 2026-07-01
Branch: mobile/cycle-048
Reviewer: Lead/Reviewer pass
Scope: Expanded selector-driven harness taps.
Findings:
- P1: Smoke harness now supports prefix matching, allowing dynamic close-position controls to be tapped without fixed coordinates.
- P1: Close-position, Live tab, Live refresh, Search tab, and Search input actions now resolve from Android hierarchy ids.
- P2: Event-card selection, prop scrolling, hardware Back, and initial ticket opening still use coordinates/key events.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 048 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 049

Date: 2026-07-01
Branch: mobile/cycle-049
Reviewer: Lead/Reviewer pass
Scope: Server-mode Portfolio sync status states.
Findings:
- P1: App now tracks server Portfolio load state and passes a hidden/syncing/synced/error status into Portfolio.
- P1: Portfolio renders a visible server-sync card only outside mock mode, with localized fallback copy when server sync is unavailable.
- P2: The server-mode visual state is typechecked but not emulator-smoked because backend health is unavailable and server trade mode would call real backend endpoints.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 049 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 050

Date: 2026-07-01
Branch: mobile/cycle-050
Reviewer: Lead/Reviewer pass
Scope: Selector-driven event and event-outcome harness taps.
Findings:
- P1: Market event cards and outcome buttons now expose deterministic test/accessibility ids based on event, market, and outcome ids.
- P1: Deep smoke uses those ids for Event Detail opening and event-market ticket opening, reducing coordinate dependence in the highest-value trading path.
- P2: The harness still uses a device scroll before tapping a below-fold event outcome; prop scrolling and hardware Back remain lower-level actions.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 050 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 051

Date: 2026-07-01
Branch: mobile/cycle-051
Reviewer: Lead/Reviewer pass
Scope: Ticket order failure feedback.
Findings:
- P1: `placeOrder` now catches failed submissions, leaves the ticket open, and surfaces localized retry copy.
- P1: Successful mock order behavior still clears the ticket, records activity, and navigates to Portfolio.
- P2: The failure visual state is not yet emulator-forced; a later harness should inject a failed order mode and assert `ticket-order-error`.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 051 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 052

Date: 2026-07-01
Branch: mobile/cycle-052
Reviewer: Lead/Reviewer pass
Scope: Forced order-failure emulator harness.
Findings:
- P1: Smoke harness now has `smoke:order-failure`, which launches Holiwyn with a runtime deep-link flag and asserts `ticket-order-error`.
- P1: Normal `smoke:deep` still verifies the successful event-market trade, close, Live, and Search flows.
- P2: Forced failure uses a dedicated harness launch path and should remain test-only; no production wallet/deposit behavior was added.
- `npm run typecheck`, `npm run smoke:deep`, and `npm run smoke:order-failure` passed.
Decision: Approve Cycle 052 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 053

Date: 2026-07-01
Branch: mobile/cycle-053
Reviewer: Lead/Reviewer pass
Scope: Portfolio open-order cancel affordance.
Findings:
- P1: Open-order rows now expose a localized Cancel control with stable `cancel-open-order-*` accessibility/test ids.
- P1: Server mode calls the canonical `DELETE /api/orders/:id` endpoint and records immediate local canceled activity feedback.
- P2: The emulator smoke remains mock-data based, so a later harness should inject or fetch a real open order before asserting the cancel row directly.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 053 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 054

Date: 2026-07-01
Branch: mobile/cycle-054
Reviewer: Lead/Reviewer pass
Scope: Open-order cancel emulator harness.
Findings:
- P1: `smoke:open-order-cancel` launches a controlled Portfolio open-order fixture, taps `cancel-open-order-smoke-open-order`, and asserts canceled activity feedback.
- P1: Normal `smoke:deep` still passes after the new launch flag and harness branch were added.
- P2: The fixture is test-only; later server-mode work should seed or fetch an authenticated backend open order before canceling it end-to-end.
- `npm run typecheck`, `npm run smoke:open-order-cancel`, and `npm run smoke:deep` passed.
Decision: Approve Cycle 054 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 055

Date: 2026-07-01
Branch: mobile/cycle-055
Reviewer: Lead/Reviewer pass
Scope: Selector-driven Event Detail back navigation.
Findings:
- P1: Event Detail back control now exposes stable `event-detail-back` accessibility/test ids.
- P1: Deep smoke taps that selector after prop verification and no longer uses Android hardware Back for this route.
- P2: The harness still uses scroll gestures to reveal props and return the back control to view; future cycles can reduce those remaining device actions.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 055 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 056

Date: 2026-07-01
Branch: mobile/cycle-056
Reviewer: Lead/Reviewer pass
Scope: Event Detail group jump controls and prop selector smoke.
Findings:
- P1: Event Detail now exposes market group jump chips such as `event-detail-group-prop`, improving navigation and reducing fixed-coordinate smoke behavior.
- P1: The back control is persistent above the scroll area, so it remains available after jumping to lower market groups.
- P2: The first run uncovered the back-visibility issue; the final run passed after the persistent-back recovery.
- `npm run typecheck` and final `npm run smoke:deep` passed.
Decision: Approve Cycle 056 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 057

Date: 2026-07-01
Branch: mobile/cycle-057
Reviewer: Lead/Reviewer pass
Scope: Featured futures ticket smoke path.
Findings:
- P1: Deep smoke now taps visible `featured-future-france` after returning from Event Detail, removing a fixed Home list swipe.
- P1: The harness still verifies ticket Max, mock order placement, Portfolio close, Live refresh, and Search after the futures ticket path.
- P2: Event-row direct trade coverage should become a focused smoke if that specific path needs ongoing regression proof.
- `npm run typecheck` and `npm run smoke:deep` passed.
Decision: Approve Cycle 057 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 058

Date: 2026-07-01
Branch: mobile/cycle-058
Reviewer: Lead/Reviewer pass
Scope: Focused Event Detail trade smoke.
Findings:
- P1: Event Detail outcome buttons now expose stable `event-detail-outcome-*` selectors.
- P1: `smoke:event-detail-trade` proves a Mexico match-winner ticket opens directly from Event Detail, preserving event-market regression coverage after main deep smoke moved to featured futures.
- P2: The focused smoke asserts ticket opening only; order placement remains covered by the main deep smoke path.
- `npm run typecheck`, final `npm run smoke:event-detail-trade`, and `npm run smoke:deep` passed.
Decision: Approve Cycle 058 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 059

Date: 2026-07-01
Branch: mobile/cycle-059
Reviewer: Lead/Reviewer pass
Scope: Focused Search query smoke.
Findings:
- P1: App launch can force Search with a query for harness use, giving zero-result Search a no-keyboard proof path.
- P1: `smoke:search-query` verifies `zzzz`, `0 results`, empty-state copy, and Clear.
- P2: Main deep smoke still uses device keyboard entry for broad end-to-end Search interaction; focused smoke is now available as a cleaner recovery harness.
- `npm run typecheck`, `npm run smoke:search-query`, and `npm run smoke:deep` passed.
Decision: Approve Cycle 059 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 060

Date: 2026-07-01
Branch: mobile/cycle-060
Reviewer: Lead/Reviewer pass
Scope: Mobile server-mode API key wiring.
Findings:
- P0: `App.tsx` now reads `EXPO_PUBLIC_API_KEY` and passes it into `PolyApi`, allowing authenticated Bearer requests in server mode.
- P1: `.env.example` now defaults to the Android emulator host backend and declares `EXPO_PUBLIC_ORDER_MODE`.
- P1: `check:server-auth` verifies the auth wiring and env defaults, while `smoke:deep` verifies mock mode remains stable.
- P2: This is not a live authenticated backend order proof; it removes the config blocker that would have prevented that proof.
- `npm run typecheck`, final `npm run check:server-auth`, and `npm run smoke:deep` passed.
Decision: Approve Cycle 060 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 061

Date: 2026-07-01
Branch: mobile/cycle-061
Reviewer: Lead/Reviewer pass
Scope: Mobile API client request-level tests.
Findings:
- P0: Mobile `PolyApi` now has automated tests proving configured Bearer auth is sent.
- P0: Limit order requests are tested for canonical `/api/orders`, `Idempotency-Key`, JSON body, and client order id.
- P1: Cancel requests are tested for encoded `/api/orders/:id` DELETE behavior and auth header.
- P2: This is mocked-fetch request proof, not live backend order execution.
- Final `npm run test:mobile-api` and mobile `npm run typecheck` passed.
Decision: Approve Cycle 061 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 062

Date: 2026-07-01
Branch: mobile/cycle-062
Reviewer: Lead/Reviewer pass
Scope: Server-mode preflight harness.
Findings:
- P0: `preflight:server-mode` runs the mobile server-auth config check before any strict server-mode smoke.
- P1: The preflight validates API key shape when present, checks backend health when available, and prints exact emulator launch env vars for server mode.
- P1: Current environment correctly reports backend unavailable and API key missing without pretending live authenticated proof has passed.
- `npm run preflight:server-mode`, mobile `npm run typecheck`, and `npm run test:mobile-api` passed.
Decision: Approve Cycle 062 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 063

Date: 2026-07-01
Branch: mobile/cycle-063
Reviewer: Lead/Reviewer pass
Scope: Strict server-mode launch gate.
Findings:
- P0: `server-mode-preflight.ps1` now honors `HOLIWYN_BACKEND_BASE_URL` and `EXPO_PUBLIC_API_BASE_URL` environment overrides while retaining safe local/emulator defaults.
- P0: `preflight:server-mode:strict` requires both backend and API-key proof, preventing accidental claims of live server readiness.
- P1: Non-strict preflight, mobile typecheck, and mobile API request tests passed.
- P2: Strict preflight currently fails as expected because this environment has no live API key configured.
Decision: Approve Cycle 063 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 064

Date: 2026-07-01
Branch: mobile/cycle-064
Reviewer: Lead/Reviewer pass
Scope: Mobile dev API credential helper.
Findings:
- P0: `mobile:dev-credential` creates a local fake-token user/API key using the existing canonical API credential model and scopes.
- P0: The helper funds the mobile dev user up to the 10,000 USDT target through the existing ledger service and does not touch deposit/withdraw flows.
- P1: Dry-run mode proves policy/env output without requiring DB access; live execution is correctly gated by local Postgres availability.
- P1: Mobile API request tests, mobile server preflight, and mobile typecheck passed.
Decision: Approve Cycle 064 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 065

Date: 2026-07-01
Branch: mobile/cycle-065
Reviewer: Lead/Reviewer pass
Scope: Mobile backend readiness harness.
Findings:
- P0: `mobile:backend-readiness` gives the loop a safe, read-only backend readiness check for Docker, compose, DB URL source/target, and DB TCP reachability.
- P0: `mobile:backend-readiness:start` provides the explicit recovery action to start the compose DB when Docker Desktop is available.
- P1: The harness masks the database password when reporting `DATABASE_URL`.
- P1: Current environment is accurately diagnosed: Docker CLI exists, daemon is not reachable, and local DB port is closed.
- P1: Mobile API request tests, mobile server preflight, and mobile typecheck passed.
Decision: Approve Cycle 065 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 066

Date: 2026-07-01
Branch: mobile/cycle-066
Reviewer: Lead/Reviewer pass
Scope: Server-unavailable emulator smoke.
Findings:
- P0: `smoke:server-unavailable` launches Holiwyn in server mode against an intentionally unreachable backend and verifies the Portfolio fallback UI.
- P0: The smoke asserts `Server sync unavailable`, `Showing local fake-token portfolio.`, open orders, and cancel controls, proving the app remains usable while backend proof is blocked.
- P1: The harness restores Expo environment variables after the run.
- P1: Mobile typecheck, server-unavailable emulator smoke, and mobile API request tests passed.
Decision: Approve Cycle 066 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 067

Date: 2026-07-01
Branch: mobile/cycle-067
Reviewer: Lead/Reviewer pass
Scope: Server order failure emulator smoke.
Findings:
- P0: `smoke:server-order-failure` launches Holiwyn in server mode with an unreachable API base and verifies ticket-level retry feedback after order submission fails.
- P0: The smoke proves no local Portfolio position is created on failed server submission because the ticket remains open with `ticket-order-error`.
- P1: The harness reuses the server-mode env restore path added in Cycle 066.
- P1: Mobile typecheck, server-order-failure emulator smoke, and mobile API request tests passed.
Decision: Approve Cycle 067 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 068

Date: 2026-07-01
Branch: mobile/cycle-068
Reviewer: Lead/Reviewer pass
Scope: Event Detail trading stats.
Findings:
- P1: Event Detail now exposes localized Volume, Liquidity, and Traders stats, adding trading context to World Cup market pages.
- P1: Stats are deterministic mock values for offline mode and can later map to backend metrics without changing the UI contract.
- P1: Focused Event Detail smoke asserts the stats and still opens a ticket from Event Detail.
- P2: Visual QA on emulator shows no overlap in the stats strip.
- Mobile typecheck, focused Event Detail smoke, and mobile API request tests passed.
Decision: Approve Cycle 068 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 069

Date: 2026-07-01
Branch: mobile/cycle-069
Reviewer: Lead/Reviewer pass
Scope: Trade Ticket estimate rows.
Findings:
- P1: Trade Ticket now shows estimated shares and average price, giving users clearer pre-trade context.
- P1: New labels are localized in English and Simplified Chinese.
- P1: Focused Event Detail ticket smoke asserts `Est. shares` and `Avg price` and still reaches the submit action.
- P2: Visual QA on emulator shows the added rows fit without hiding the primary order button.
- Mobile typecheck, focused Event Detail smoke, and mobile API request tests passed.
Decision: Approve Cycle 069 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 070

Date: 2026-07-01
Branch: mobile/cycle-070
Reviewer: Lead/Reviewer pass
Scope: Event Detail market depth preview.
Findings:
- P1: Event Detail market cards now show localized Best bid, Best ask, and Spread values.
- P1: The depth values are deterministic local estimates for offline mode and can later be replaced by backend order-book data.
- P1: Focused Event Detail smoke asserts the depth labels and still opens a ticket from the market card.
- P2: Visual QA shows the first market card remains readable and outcome buttons remain reachable.
- Mobile typecheck, focused Event Detail smoke, and mobile API request tests passed.
Decision: Approve Cycle 070 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 071

Date: 2026-07-01
Branch: mobile/cycle-071
Reviewer: Lead/Reviewer pass
Scope: Side-specific Trade Ticket copy.
Findings:
- P1: Trade Ticket primary CTA now switches between `Place buy order` and `Place sell order`.
- P1: Sell mode changes the first estimate row from estimated cost to estimated proceeds.
- P1: Buy/Sell segmented controls now have stable selectors for focused smoke coverage.
- P2: Sell mode remains estimate-only until backend positions and order-book execution are live.
- Mobile typecheck, focused sell-ticket smoke, and mobile API request tests passed.
Decision: Approve Cycle 071 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 072

Date: 2026-07-01
Branch: mobile/cycle-072
Reviewer: Lead/Reviewer pass
Scope: Account/Login entry point.
Findings:
- P1: Holiwyn now has a dedicated Account tab with signed-out state, mock phone/email login buttons, demo balance context, and disabled deposit/withdraw copy.
- P1: Account copy is localized in English and Simplified Chinese through the existing app copy module.
- P1: Focused Account smoke launches directly to the Account tab and asserts the first visible account viewport.
- P2: Login controls remain non-functional by design until backend authentication is intentionally connected.
- Mobile typecheck, focused Account smoke, and mobile API request tests passed.
Decision: Approve Cycle 072 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 073

Date: 2026-07-01
Branch: mobile/cycle-073
Reviewer: Lead/Reviewer pass
Scope: Account mock sign-in state.
Findings:
- P1: Account phone/email controls now activate a local signed-in state with a Holiwyn Demo profile card.
- P1: A sign-out action returns the screen to the signed-out login state without touching backend auth or wallet money movement.
- P1: Focused Account Login smoke taps sign-in, verifies the demo profile, taps sign-out, and verifies the signed-out state.
- P2: Signed-in state is intentionally local and session-only until backend authentication is integrated.
- Mobile typecheck, focused Account Login smoke, and mobile API request tests passed.
Decision: Approve Cycle 073 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 074

Date: 2026-07-01
Branch: mobile/cycle-074
Reviewer: Lead/Reviewer pass
Scope: Home market filters.
Findings:
- P1: Home discovery now includes All, Live, and Today market filters above the Games/Futures segmented control.
- P1: Filters operate only on the Games list so Futures browsing remains unchanged.
- P1: Focused Home filter smoke taps Live and Today chips and verifies the expected World Cup markets.
- P2: Filter state is local to Home and resets on app restart, which is acceptable for the current discovery layer.
- Mobile typecheck, focused Home filter smoke, and mobile API request tests passed.
Decision: Approve Cycle 074 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 075

Date: 2026-07-01
Branch: mobile/cycle-075
Reviewer: Lead/Reviewer pass
Scope: Saved markets watchlist.
Findings:
- P1: Home market cards now expose a local save/star control when rendered from Home.
- P1: Home discovery includes a Saved filter that shows only locally saved World Cup events.
- P1: Focused Saved smoke scrolls to the first event, taps the star, switches to Saved, and verifies the saved market remains visible/tradable.
- P2: Saved state is local and session-only until user profile/backend persistence exists.
- Mobile typecheck, focused Saved smoke, and mobile API request tests passed.
Decision: Approve Cycle 075 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 076

Date: 2026-07-01
Branch: mobile/cycle-076
Reviewer: Lead/Reviewer pass
Scope: Home market card stats.
Findings:
- P1: Home event cards now show Volume and Liquidity context using existing localized labels.
- P1: Stats are deterministic local estimates and align with the Event Detail stats/depth direction.
- P1: Focused Home card stats smoke scrolls to the first event and verifies Volume/Liquidity/USDT.
- P2: Values should later map to backend quote/order-book liquidity once available.
- Mobile typecheck, focused Home card stats smoke, and mobile API request tests passed.
Decision: Approve Cycle 076 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 077

Date: 2026-07-01
Branch: mobile/cycle-077
Reviewer: Lead/Reviewer pass
Scope: Saved Search integration.
Findings:
- P1: Saved event state is now owned by `App.tsx`, so Home and Search share the same session watchlist.
- P1: Search adds a Saved filter and shows saved-event star controls through the existing market list component.
- P1: Focused Saved Search smoke saves Mexico on Home, opens Search, taps Saved, and verifies one saved result.
- P2: Saved state remains local/session-only until account persistence is integrated.
- Mobile typecheck, focused Saved Search smoke, and mobile API request tests passed.
Decision: Approve Cycle 077 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 078

Date: 2026-07-01
Branch: mobile/cycle-078
Reviewer: Lead/Reviewer pass
Scope: Search card market stats.
Findings:
- P1: Search result cards now reuse Volume/Liquidity metadata already present on Home cards.
- P1: Focused Search card stats smoke opens Search and verifies Volume/Liquidity/USDT on the first result.
- P2: Stats remain deterministic local estimates until backend market metrics are available.
- Mobile typecheck, focused Search card stats smoke, and mobile API request tests passed.
Decision: Approve Cycle 078 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 079

Date: 2026-07-01
Branch: mobile/cycle-079
Reviewer: Lead/Reviewer pass
Scope: Search Saved empty state.
Findings:
- P1: Search Saved filter now uses `No saved markets yet.` instead of the generic no-results message.
- P1: The new empty copy is localized in English and Simplified Chinese.
- P1: Focused Search Saved empty smoke verifies initial Search results, taps Saved, and confirms the zero-saved state.
- P2: Empty state remains text-only; a richer saved onboarding panel can be added later.
- Mobile typecheck, focused Search Saved empty smoke, and mobile API request tests passed.
Decision: Approve Cycle 079 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 080

Date: 2026-07-01
Branch: mobile/cycle-080
Reviewer: Lead/Reviewer pass
Scope: Event Detail save control.
Findings:
- P1: Event Detail now exposes a save/star control bound to the app-level saved-event state.
- P1: Saved state created from Event Detail appears in Search's Saved filter.
- P1: Focused Event Detail save smoke opens Mexico, saves it, returns Home, opens Search Saved, and verifies one saved result.
- P2: Saved state remains local/session-only until account persistence is integrated.
- Mobile typecheck, focused Event Detail save smoke, and mobile API request tests passed.
Decision: Approve Cycle 080 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 081

Date: 2026-07-01
Branch: mobile/cycle-081
Reviewer: Lead/Reviewer pass
Scope: Search sort controls.
Findings:
- P1: Search now exposes Popular and Live first controls beneath the existing result filters.
- P1: Live first sorting promotes live markets ahead of non-live results while preserving the existing Search card layout.
- P1: Focused Search sort smoke opens Search, verifies sort controls, taps Live first, and confirms the live France vs. Argentina market plus Volume/Liquidity context.
- P2: Popular ordering is currently based on local outcome depth until backend volume/popularity ranking is available.
- Mobile typecheck, focused Search sort smoke, and mobile API request tests passed.
Decision: Approve Cycle 081 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 082

Date: 2026-07-01
Branch: mobile/cycle-082
Reviewer: Lead/Reviewer pass
Scope: Home Saved empty state.
Findings:
- P1: Home now shows `No saved markets yet.` when the Saved filter has no events.
- P1: The empty copy is placed above the Games/Futures switch so it is visible immediately after tapping Saved.
- P1: Focused Home Saved empty smoke taps the Saved filter and verifies the empty copy, selected Saved state, and Games context.
- P2: Saved state remains local/session-only until account persistence is integrated.
- Mobile typecheck, focused Home Saved empty smoke, and mobile API request tests passed.
Decision: Approve Cycle 082 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 083

Date: 2026-07-01
Branch: mobile/cycle-083
Reviewer: Lead/Reviewer pass
Scope: Market/outcome query matching.
Findings:
- P1: Shared Home/Search discovery matching now includes market titles and outcome labels.
- P1: A Home launch harness query for `clean` proves the England clean-sheet market is discoverable even though the event title does not contain the query.
- P1: Focused Home search-query smoke verifies the filtered England card plus Volume/Liquidity context.
- P2: Matching remains simple substring search until a backend search/ranking endpoint exists.
- Mobile typecheck, focused Home search-query smoke, and mobile API request tests passed.
Decision: Approve Cycle 083 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 084

Date: 2026-07-01
Branch: mobile/cycle-084
Reviewer: Lead/Reviewer pass
Scope: Home search clear action.
Findings:
- P1: Home search now shows an accessible close-icon Clear action only when a query is active.
- P1: Clearing the query restores the full Home market list without leaving stale filtered state.
- P1: Focused Home clear-search smoke launches with `clean`, taps Clear, scrolls to the restored list, and verifies Mexico plus Volume/Liquidity context.
- P2: Search tab still uses text Clear and can later align with the icon treatment if desired.
- Mobile typecheck, focused Home clear-search smoke, and mobile API request tests passed.
Decision: Approve Cycle 084 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 085

Date: 2026-07-01
Branch: mobile/cycle-085
Reviewer: Lead/Reviewer pass
Scope: Search clear icon action.
Findings:
- P1: Search now uses the same accessible close-icon Clear action pattern as Home.
- P1: Clearing a zero-result query restores Top results, the full result count, and existing sort controls.
- P1: Focused Search clear-query smoke launches with `zzzz`, taps Clear, and verifies Mexico vs. Ecuador returns.
- P2: First smoke attempt failed on an Expo Go generic error screen while Metro rebuilt cache; Recovery Harness rerun passed without code changes.
- Mobile typecheck, focused Search clear-query smoke, and mobile API request tests passed.
Decision: Approve Cycle 085 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 086

Date: 2026-07-01
Branch: mobile/cycle-086
Reviewer: Lead/Reviewer pass
Scope: Expo launch recovery hardening.
Findings:
- P1: `Wait-HierarchyContains` now allows more launch attempts for cold Metro rebuilds.
- P1: If Expo Go shows `Something went wrong.` during launch, the harness force-stops Expo Go and restarts the target URL before retrying.
- P1: Focused Search clear-query smoke still passes with the hardened launch path.
- P2: This improves smoke reliability but does not replace a future custom dev-client build.
- Mobile typecheck, focused Search clear-query smoke, and mobile API request tests passed.
Decision: Approve Cycle 086 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 087

Date: 2026-07-01
Branch: mobile/cycle-087
Reviewer: Lead/Reviewer pass
Scope: Futures card market stats.
Findings:
- P1: Home Futures cards now show localized Volume and Liquidity context, matching match-card discovery context.
- P1: Focused Futures card stats smoke switches to Futures, scrolls the card into view, and verifies World Cup winner plus Volume/Liquidity/USDT.
- P1: Stats are deterministic local estimates and do not change backend/API behavior.
- P2: Futures stats should later map to backend liquidity/volume metrics once available.
- Mobile typecheck, focused Futures card stats smoke, and mobile API request tests passed.
Decision: Approve Cycle 087 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 088

Date: 2026-07-01
Branch: mobile/cycle-088
Reviewer: Lead/Reviewer pass
Scope: Futures list trade smoke.
Findings:
- P1: Added focused emulator coverage for opening a buy ticket from a Futures list outcome.
- P1: The smoke switches to Futures, scrolls to World Cup winner, taps France, and verifies balance/estimate/CTA ticket details.
- P1: This increases trading confidence without changing product behavior or backend contracts.
- P2: Future cycles should still test actual mock order placement from Futures list tickets.
- Mobile typecheck, focused Futures list trade smoke, and mobile API request tests passed.
Decision: Approve Cycle 088 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 089

Date: 2026-07-01
Branch: mobile/cycle-089
Reviewer: Lead/Reviewer pass
Scope: Futures list mock order smoke.
Findings:
- P1: Added focused emulator coverage for placing a mock order from a Futures list ticket.
- P1: The smoke switches to Futures, opens France / World Cup winner, places the buy order, and verifies Portfolio position state.
- P1: Balance, position title/outcome, invested value, entry, current value, P/L, close action, and order confirmation are all asserted.
- P2: This remains mock-token trading; server-backed Futures order placement still needs authenticated backend proof.
- Mobile typecheck, focused Futures list order smoke, and mobile API request tests passed.
Decision: Approve Cycle 089 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 090

Date: 2026-07-01
Branch: mobile/cycle-090
Reviewer: Lead/Reviewer pass
Scope: Futures list sell ticket smoke.
Findings:
- P1: Added focused emulator coverage for switching a Futures list ticket to Sell.
- P1: The smoke opens France / World Cup winner from Futures, taps Sell, and verifies Estimated proceeds plus Place sell order.
- P1: This confirms side-specific ticket copy works from Futures list entry points, not only match/event-detail tickets.
- P2: Future cycles should add sell order placement behavior once position-aware selling is modeled.
- Mobile typecheck, focused Futures list sell smoke, and mobile API request tests passed.
Decision: Approve Cycle 090 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 091

Date: 2026-07-01
Branch: mobile/cycle-091
Reviewer: Lead/Reviewer pass
Scope: Futures list close-position smoke.
Findings:
- P1: Added focused emulator coverage for closing a position created from a Futures list mock order.
- P1: The smoke buys France / World Cup winner, verifies Portfolio, closes the position, and verifies empty positions plus Closed/Bought activity.
- P1: Balance recovery and recent activity are asserted through hierarchy and screenshot evidence.
- P2: Closing remains local fake-token behavior until server-backed positions are fully integrated.
- Mobile typecheck, focused Futures list close smoke, and mobile API request tests passed.
Decision: Approve Cycle 091 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 092

Date: 2026-07-01
Branch: mobile/cycle-092
Reviewer: Lead/Reviewer pass
Scope: Portfolio open positions count.
Findings:
- P1: Portfolio now shows a localized Open positions count card.
- P1: Focused smoke verifies the count is `0` on empty Portfolio and `1` after placing a Futures mock order.
- P1: The count sits above the summary grid and improves scanability without changing trading math.
- P2: Count is local-state based until server-backed portfolio state is fully available.
- Mobile typecheck, focused Portfolio position-count smoke, and mobile API request tests passed.
Decision: Approve Cycle 092 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 093

Date: 2026-07-01
Branch: mobile/cycle-093
Reviewer: Lead/Reviewer pass
Scope: Portfolio recent activity count.
Findings:
- P1: Portfolio now shows a localized Recent activity count card.
- P1: Focused smoke verifies the count is `0` on empty Portfolio and `1` after placing a Futures mock order.
- P1: The harness recovered from an over-specific below-fold assertion by checking visible Portfolio activity/count proof instead.
- P2: Count is local-state based until server-backed portfolio activity/history is fully available.
- Mobile typecheck, focused Portfolio activity-count smoke, and mobile API request tests passed.
Decision: Approve Cycle 093 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 094

Date: 2026-07-01
Branch: mobile/cycle-094
Reviewer: Lead/Reviewer pass
Scope: Portfolio closed trades count.
Findings:
- P1: Portfolio now shows a localized Closed trades count card.
- P1: Focused smoke verifies the count starts at `0` and reaches `1` after a Futures mock order is closed.
- P1: The same smoke verifies Recent activity reaches `2` after the buy and close actions.
- P1: Harness recovery scrolls to the close control after the new count card changes vertical layout.
- P2: Count is local activity-state based until server-backed portfolio history is fully available.
- Mobile typecheck, focused Portfolio closed-count smoke, and mobile API request tests passed.
Decision: Approve Cycle 094 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 095

Date: 2026-07-01
Branch: mobile/cycle-095
Reviewer: Lead/Reviewer pass
Scope: Portfolio compact count grid.
Findings:
- P1: Open positions, Recent activity, and Closed trades now render as a compact three-tile grid.
- P1: Focused smoke still verifies the Futures buy/close flow and closed-state counts after the layout change.
- P1: Screenshot evidence shows `0`, `2`, and `1` count values fitting without overlap in the first viewport.
- P2: Count values remain local activity-state based until server-backed portfolio history is fully available.
- Mobile typecheck, focused Portfolio closed-count smoke, and mobile API request tests passed.
Decision: Approve Cycle 095 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 096

Date: 2026-07-01
Branch: mobile/cycle-096
Reviewer: Lead/Reviewer pass
Scope: Saved-market persistence.
Findings:
- P1: Saved market ids now hydrate from and persist to AsyncStorage with a startup hydration guard.
- P1: Harness-only deep links can clear, seed, and open Search state for deterministic persistence proof.
- P1: Focused smoke clears local Expo data, seeds Mexico vs. Ecuador into saved storage, restarts the app, and verifies Search restores the saved market.
- P2: The normal user tap-to-save UI was already covered in earlier cycles; this cycle focuses on storage durability.
- Mobile typecheck, focused saved-persistence smoke, and mobile API request tests passed.
Decision: Approve Cycle 096 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 097

Date: 2026-07-01
Branch: mobile/cycle-097
Reviewer: Lead/Reviewer pass
Scope: Account mock session persistence.
Findings:
- P1: Account mock sign-in state now hydrates from and persists to AsyncStorage.
- P1: Empty storage no longer overwrites a fresh sign-in after mount.
- P1: Focused smoke clears local Expo data, seeds signed-in account state, restarts the app, and verifies Account restores as Signed in.
- P2: This remains mock local account state; real backend auth is intentionally not implemented yet.
- Mobile typecheck, focused account-persistence smoke, and mobile API request tests passed.
Decision: Approve Cycle 097 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 098

Date: 2026-07-01
Branch: mobile/cycle-098
Reviewer: Lead/Reviewer pass
Scope: Language preference persistence.
Findings:
- P1: Language preference now hydrates from and persists to AsyncStorage with a startup hydration guard.
- P1: Harness-only `forceChinese` and `forceEnglish` deep links allow deterministic language-state proof.
- P1: Focused smoke clears Expo data, seeds Chinese, restarts the app, and verifies restored Chinese mode through ASCII-safe hierarchy checks plus visual screenshot proof.
- P2: Preference is local-only until backend profile sync exists.
- Mobile typecheck, focused language-persistence smoke, and mobile API request tests passed.
Decision: Approve Cycle 098 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 099

Date: 2026-07-01
Branch: mobile/cycle-099
Reviewer: Lead/Reviewer pass
Scope: Mock Portfolio persistence.
Findings:
- P1: Fake-token balance, positions, latest order, open orders, and activity now hydrate from and persist to AsyncStorage with a startup hydration guard.
- P1: Focused smoke opens the France World Cup winner ticket, places a real mock ticket order, restarts Expo Go, and verifies Portfolio restores the open position and activity count.
- P1: Visual evidence confirms restored balance and position cards match the placed order state after restart.
- P2: Portfolio persistence is local mock storage only; authenticated server portfolio remains the eventual source of truth.
- Mobile typecheck, focused portfolio-persistence smoke, and mobile API request tests passed.
Decision: Approve Cycle 099 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 100

Date: 2026-07-01
Branch: mobile/cycle-100
Reviewer: Lead/Reviewer pass
Scope: Backend readiness retry.
Findings:
- P1: Backend readiness harness confirms Docker CLI is available and compose/DATABASE_URL configuration still point at the expected local Postgres port.
- P1: The same harness reports Docker daemon and database TCP readiness are unavailable, preserving the known gate for live server-mode proof.
- P1: Mobile API request tests and mobile typecheck still pass, so mock-mode product progress can continue safely.
- P2: No backend schema or credential mutation was attempted because the readiness gate did not pass.
Decision: Approve Cycle 100 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 101

Date: 2026-07-01
Branch: mobile/cycle-101
Reviewer: Lead/Reviewer pass
Scope: Ticket default persistence.
Findings:
- P1: Ticket amount and buy/sell side now hydrate from and persist to AsyncStorage through app-level preference state.
- P1: TradeTicket starts from saved defaults and updates the saved preference when amount, preset, max, or side changes.
- P1: Focused smoke seeds a 500 USDT sell preference, restarts Expo Go, reopens the France ticket, and verifies the sell ticket restores with amount 500.
- P2: Defaults are local-only until backend profile/preference sync exists.
- Mobile typecheck, focused ticket-defaults persistence smoke, and mobile API request tests passed.
Decision: Approve Cycle 101 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 102

Date: 2026-07-01
Branch: mobile/cycle-102
Reviewer: Lead/Reviewer pass
Scope: Account preference summary.
Findings:
- P1: Account now receives the saved ticket default amount/side and renders it in Preferences.
- P1: Preferences were moved above login method actions so saved settings are visible without fragile scrolling.
- P1: Focused smoke seeds Sell 500 USDT defaults and verifies Account displays the saved preference.
- P2: Preference display remains local-only until backend profile/preference sync exists.
- Mobile typecheck, focused account-preferences smoke, and mobile API request tests passed.
Decision: Approve Cycle 102 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 103

Date: 2026-07-01
Branch: mobile/cycle-103
Reviewer: Lead/Reviewer pass
Scope: Account language summary.
Findings:
- P1: Account now receives and renders the active language value in Preferences.
- P1: The language row changed from generic instruction copy to a concrete `Language: English` summary.
- P1: Focused smoke verifies the language summary and saved ticket default summary together in Account.
- P2: Account preference summaries remain local-only until backend profile/preference sync exists.
- Mobile typecheck, focused account-language-summary smoke, and mobile API request tests passed.
Decision: Approve Cycle 103 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 104

Date: 2026-07-01
Branch: mobile/cycle-104
Reviewer: Lead/Reviewer pass
Scope: Profile preferences sync seam.
Findings:
- P1: `PolyApi` now exposes typed get/save methods for `/api/profile/preferences`.
- P1: A profile preferences service maps local app state to backend shape for locale, ticket default amount/side, and saved event ids.
- P1: Mobile API tests verify authenticated PUT request shape and JSON payload for saved preferences.
- P2: Runtime sync remains intentionally disabled until backend auth/profile readiness is available.
- Mobile typecheck and mobile API request tests passed.
Decision: Approve Cycle 104 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 105

Date: 2026-07-01
Branch: mobile/cycle-105
Reviewer: Lead/Reviewer pass
Scope: Guarded runtime profile preference sync.
Findings:
- P1: App shell now attempts profile preference load/save only when server mode and an API key are both present.
- P1: Loaded server preferences hydrate locale, ticket defaults, and saved market ids into local app state.
- P1: Later local preference changes save through the typed profile preference service after the initial server load attempt finishes.
- P2: Sync failures are intentionally silent in the app until a user-facing backend account/sync status is designed.
- Mobile typecheck and mobile API/profile-preference service tests passed.
Decision: Approve Cycle 105 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 106

Date: 2026-07-01
Branch: mobile/cycle-106
Reviewer: Lead/Reviewer pass
Scope: Backend readiness retry after profile sync seam.
Findings:
- P1: Backend readiness harness still confirms Docker CLI, compose file, and DATABASE_URL local-port alignment.
- P1: Docker daemon and local Postgres TCP readiness remain unavailable, so live profile/portfolio/order proof stays gated.
- P1: Mobile typecheck and mobile API/profile-preference tests still pass after the readiness retry.
- P2: No schema, credential, or runtime backend mutation was attempted because the readiness gate did not pass.
Decision: Approve Cycle 106 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 107

Date: 2026-07-01
Branch: mobile/cycle-107
Reviewer: Lead/Reviewer pass
Scope: Visible Account profile sync state.
Findings:
- P1: Account now receives profile preference sync status and renders server-mode sync/unavailable state only when profile sync is enabled.
- P1: Profile preference load/save failures now set an Account-visible error state instead of staying silent.
- P1: Focused smoke launches server mode with a harness API key and unreachable backend, then verifies `Profile sync unavailable` plus local preference fallback copy on emulator.
- P2: This remains a status/recovery surface only; live profile proof still depends on backend readiness.
- Mobile typecheck, focused account-profile-sync-error smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 107 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 108

Date: 2026-07-01
Branch: mobile/cycle-108
Reviewer: Lead/Reviewer pass
Scope: Account saved-market summary.
Findings:
- P1: Account now receives the saved-market count and renders it in Preferences with localized labels.
- P1: The focused smoke seeds Mexico vs. Ecuador into saved markets, opens Account, and verifies `Saved markets: 1 saved`.
- P1: Mock mode remains local-only; server profile sync can later carry this value through the existing saved-event preference seam.
- P2: The count is a summary only; Account does not yet provide a saved-market management screen.
- Mobile typecheck, focused account-saved-summary smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 108 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 109

Date: 2026-07-01
Branch: mobile/cycle-109
Reviewer: Lead/Reviewer pass
Scope: Account open-position summary.
Findings:
- P1: Account now receives open position count and renders it in Preferences with the existing localized Open positions label.
- P1: The focused smoke seeds a mock World Cup winner position, opens Account, and verifies `Open positions: 1`.
- P1: This keeps Account/profile closer to a trading app profile surface without touching deposit/withdraw flows.
- P2: The row is a summary only; detailed position management remains in Portfolio.
- Mobile typecheck, focused account-position-summary smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 109 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 110

Date: 2026-07-01
Branch: mobile/cycle-110
Reviewer: Lead/Reviewer pass
Scope: Account portfolio value summary.
Findings:
- P1: Account now receives estimated portfolio value derived from fake balance plus current open-position value.
- P1: The focused smoke seeds a mock World Cup winner position and verifies `Portfolio value: 10,281.25 USDT`.
- P1: Visual review moved the value row higher so the screenshot evidence shows it clearly above the bottom tab.
- P2: The value is still estimated from local/mock position math until backend positions and pricing feed the mobile app.
- Mobile typecheck, focused account-portfolio-value smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 110 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 111

Date: 2026-07-01
Branch: mobile/cycle-111
Reviewer: Lead/Reviewer pass
Scope: Event Detail market/outcome summary.
Findings:
- P1: Event Detail now displays compact market and outcome count pills in the hero.
- P1: A focused smoke opens Mexico vs. Ecuador directly and verifies `4 markets`, `8 outcomes`, and the first Match winner market.
- P1: The direct detail route removes a fragile below-fold tap dependency from this harness path.
- P2: Counts are still derived client-side from the current event payload until backend market metadata is richer.
- Mobile typecheck, focused event-detail-summary smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 111 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 112

Date: 2026-07-01
Branch: mobile/cycle-112
Reviewer: Lead/Reviewer pass
Scope: Event Detail per-market outcome count.
Findings:
- P1: Each Event Detail market card now displays its own outcome count next to the market title.
- P1: Focused smoke opens Mexico vs. Ecuador detail directly and verifies Match winner shows `2 outcomes` with depth labels.
- P1: ADB/emulator offline recovery was handled by restarting the emulator and rerunning the same focused smoke successfully.
- P2: Counts are derived from the local event payload; backend metadata can replace or enrich them later.
- Mobile typecheck, focused event-detail-market-outcome-count smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 112 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 113

Date: 2026-07-01
Branch: mobile/cycle-113
Reviewer: Lead/Reviewer pass
Scope: Live market breadth summary.
Findings:
- P1: Live screen now calculates and displays total live markets and outcomes above the live card list.
- P1: Focused smoke opens Live directly and verifies `2 markets`, `6 outcomes`, and visible France vs. Argentina trading outcomes.
- P1: The direct Live route improves harness reliability for future live-market cycles.
- P2: Counts are still derived from local/mock event payloads until live backend market metadata feeds the app.
- Mobile typecheck, focused live-summary smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 113 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 114

Date: 2026-07-01
Branch: mobile/cycle-114
Reviewer: Lead/Reviewer pass
Scope: Live outcome ticket opening coverage.
Findings:
- P1: Focused smoke opens Live directly, taps the France live outcome, and verifies the trade ticket opens with France vs. Argentina context.
- P1: Ticket proof includes fake balance, estimate rows, and the buy-order CTA, strengthening the live trading path toward final DoD.
- P1: No product code behavior changed this cycle; the improvement is harness coverage for existing live trading behavior.
- P2: Live ticket order placement still relies on the broader ticket/order harnesses rather than this focused live-ticket smoke.
- Mobile typecheck, focused live-ticket smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 114 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 115

Date: 2026-07-01
Branch: mobile/cycle-115
Reviewer: Lead/Reviewer pass
Scope: Live ticket in-play badge.
Findings:
- P1: TradeTicket now detects live-origin events and renders a visible `Live World Cup` badge in the ticket header.
- P1: Focused live-ticket smoke verifies the badge together with event context, fake balance, estimates, and buy-order CTA.
- P1: This is a product-facing live trading affordance, not only harness coverage.
- P2: Badge text is tied to the existing Live World Cup copy; later backend live-state metadata can refine the label.
- Mobile typecheck, focused live-ticket smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 115 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 116

Date: 2026-07-01
Branch: mobile/cycle-116
Reviewer: Lead/Reviewer pass
Scope: Expo Go live order placement proof.
Findings:
- P1: Focused smoke now opens Live directly, opens the France live ticket, places a fake-token buy order, and verifies the resulting Portfolio position.
- P1: The proof covers durable trading state: fake balance drops to `9,900 USDT`, open positions and recent activity both show `1`, and the France vs. Argentina position is visible.
- P1: The harness now handles Expo Go developer-menu interruptions during clean-state runs by closing Expo UI, relaunching the deep link if needed, and retrying the ticket tap.
- P2: Expo Go remains a development shell; production payment, signing, notifications, and native SDK work should later move to an Expo dev build or native build.
- Mobile typecheck, focused live-order smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 116 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 117

Date: 2026-07-01
Branch: mobile/cycle-117
Reviewer: Lead/Reviewer pass
Scope: Live mock order close-position proof.
Findings:
- P1: Focused smoke now proves the live trading lifecycle from Live screen to ticket, order placement, Portfolio position, and close-position action.
- P1: Closed-state proof verifies fake balance `10,007.32 USDT`, open positions `0`, recent activity `2`, and closed trades `1`.
- P1: The live ticket harness now recovers from both visible Expo developer menus and transparent Expo touch-layer interruptions.
- P2: Close-position value remains local mock math until backend pricing/position settlement feeds the app.
- Mobile typecheck, focused live-order-close smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 117 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 118

Date: 2026-07-01
Branch: mobile/cycle-118
Reviewer: Lead/Reviewer pass
Scope: Live-origin Portfolio badge.
Findings:
- P1: Live ticket orders now persist `isLive` metadata into open positions, latest-order confirmation, and activity records.
- P1: Portfolio renders a compact Live World Cup badge on live-origin open positions; focused smoke verifies the visible position badge after a France live order.
- P1: The heavier live-order smoke path now has a longer initial launch window to tolerate Expo Go blank startup.
- P2: Latest-order and activity live badges are product-wired but not yet separately deep-scroll verified because they can sit below the first Android hierarchy viewport.
- Mobile typecheck, focused live-portfolio-badge smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 118 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 119

Date: 2026-07-01
Branch: mobile/cycle-119
Reviewer: Lead/Reviewer pass
Scope: Deep-scroll proof for live Portfolio latest-order and activity badges.
Findings:
- P1: Focused smoke now verifies the live latest-order card below the open position, including `LIVE WORLD CUP`, `Mock order placed`, `100 USDT`, and France vs. Argentina context.
- P1: Focused smoke then scrolls further and verifies the Recent activity row keeps the live badge and bought France live-market context.
- P1: This closes the Cycle 118 proof gap without product UI churn; the product behavior was already wired, and this cycle strengthens repeatable evidence.
- P2: Backend health remained unavailable during the smoke, so this is mock-mode evidence only. Live backend proof remains gated by local backend availability.
- Mobile typecheck through the smoke script, focused live-portfolio-badge-deep smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 119 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 120

Date: 2026-07-01
Branch: mobile/cycle-120
Reviewer: Lead/Reviewer pass
Scope: Live ticket clock context.
Findings:
- P1: TradeTicket now surfaces the live event clock under the Live World Cup badge, giving users immediate in-play context before placing an order.
- P1: Focused live-ticket smoke verifies `ticket-live-clock` and `Live - 63'` alongside ticket context, fake balance, estimates, and CTA.
- P1: The smoke harness now clears Expo Go for `LiveTicket` runs, preventing stale fake balance from leaking into live-ticket-only proof.
- P2: The clock comes from local/mock `startsAt` text and is normalized for display; backend live clock metadata should replace it when available.
- Mobile typecheck through the smoke script, focused live-ticket smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 120 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 121

Date: 2026-07-01
Branch: mobile/cycle-121
Reviewer: Lead/Reviewer pass
Scope: Portfolio live clock persistence.
Findings:
- P1: Live orders now store `liveClock` on open positions, latest-order confirmation, and activity records.
- P1: Portfolio renders the live clock below the live badge for positions, latest-order card, and Recent activity.
- P1: Focused deep Portfolio smoke verifies `Live - 63'` through the full live ticket to order to Portfolio flow.
- P2: Expo Go reload latency remains the main loop speed risk; next cycle should reduce reliance on full Expo app clears.
- Mobile typecheck through the smoke script, focused live-portfolio-badge-deep smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 121 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 122

Date: 2026-07-01
Branch: mobile/cycle-122
Reviewer: Lead/Reviewer pass
Scope: Fast app-level reset for live smoke harnesses.
Findings:
- P1: Live smoke URLs now include `forceResetState=1` and the app clears relevant Holiwyn runtime/persisted state without wiping the Expo Go package.
- P1: Warm deep links are handled through `Linking.addEventListener`, so repeated smoke runs can reset the app while Expo Go remains open.
- P1: The focused live-ticket proof passes with `10,000 USDT`, `Live - 63'`, and the place-order CTA.
- P2: The harness still starts Metro with `--clear` for many focused smokes; future cycles can selectively reduce that once bundle freshness remains proven.
- Mobile typecheck through the smoke script, focused live-ticket smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 122 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 123

Date: 2026-07-01
Branch: mobile/cycle-123
Reviewer: Lead/Reviewer pass
Scope: Fast reset for live order/Portfolio proof.
Findings:
- P1: App-level reset now clears modal/search/detail state in addition to Portfolio and saved preferences, preventing warm smoke runs from landing on a stale ticket.
- P1: Focused live-portfolio-badge-deep smoke passes without Expo Go package clear, proving the fast path works for live order, Portfolio position, latest-order, and activity evidence.
- P1: The proof keeps clean fake-token assumptions while reducing the long blank hierarchy wait caused by package clearing.
- P2: Metro still starts with `--clear`; future harness cycles can remove that selectively for stable flows.
- Mobile typecheck through the smoke script, focused live-portfolio-badge-deep smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 123 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 124

Date: 2026-07-01
Branch: mobile/cycle-124
Reviewer: Lead/Reviewer pass
Scope: No-clear live Portfolio smoke harness.
Findings:
- P1: Proven live reset smokes no longer force Metro `--clear`, reducing repeated Expo rebuild cost for the heaviest live Portfolio proof.
- P1: Retry deep-link launches now pause before UI dump, avoiding stale hierarchy reads after Expo Go relaunch.
- P1: Deep live Portfolio proof still passes and verifies live ticket, mock order, open position, latest-order, and Recent activity evidence.
- P2: Expo Go remains a speed bottleneck; documented device policy now keeps Samsung for reference/later real-device QA and emulator for repeatable Holiwyn automation, with a future dev/APK harness milestone.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 124 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 125

Date: 2026-07-01
Branch: mobile/cycle-125
Reviewer: Lead/Reviewer pass
Scope: Event Detail market group count indicators.
Findings:
- P1: Event Detail group tabs now show per-category market counts, making game lines and props easier to scan before scrolling.
- P1: Group section headers also show the same counts, preserving context after jumping into a market group.
- P1: Focused event-detail-summary smoke verifies Mexico vs. Ecuador displays `Game lines`, `1 market`, `Props`, `3 markets`, `4 markets`, and `8 outcomes`.
- P2: This is still mock-data backed in the focused emulator proof because local backend health was unavailable.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 125 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 126

Date: 2026-07-01
Branch: mobile/cycle-126
Reviewer: Lead/Reviewer pass
Scope: Trade ticket implied odds.
Findings:
- P1: Trade tickets now show implied decimal odds derived from the selected outcome probability.
- P1: The Mexico event-detail buy ticket verifies `Implied odds` and `1.6x` alongside fake balance, cost, shares, average price, payout, and CTA.
- P1: The focused event-detail trade harness now starts from clean Expo Go state and recovers if the Expo developer menu appears over the app.
- P2: This remains mock-mode order economics; backend quote/depth odds should replace mock probability math when server quote integration is available.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 126 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 127

Date: 2026-07-01
Branch: mobile/cycle-127
Reviewer: Lead/Reviewer pass
Scope: Event Detail outcome odds.
Findings:
- P1: Event Detail outcome buttons now show decimal odds below each probability.
- P1: Focused market-outcome-count smoke verifies the visible Mexico outcome shows `64%` plus `1.6x`.
- P1: The visual proof keeps the market card readable with bid/ask/spread and group-count context still visible.
- P2: Odds still derive from local mock probability math; backend quote/depth odds remain a later integration target.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 127 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 128

Date: 2026-07-01
Branch: mobile/cycle-128
Reviewer: Lead/Reviewer pass
Scope: Trade ticket potential profit.
Findings:
- P1: Trade tickets now show potential profit, calculated as estimated payout minus capped order cost.
- P1: Focused event-detail-trade smoke verifies the Mexico buy ticket shows `Potential profit` and `56.25 USDT`.
- P1: Visual QA confirms the added row does not hide the primary buy CTA.
- P2: Profit math is still mock/probability-derived and should be replaced by backend quote/order economics when server quote integration is available.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 128 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 129

Date: 2026-07-01
Branch: mobile/cycle-129
Reviewer: Lead/Reviewer pass
Scope: Device strategy and Android development build/APK policy.
Findings:
- P1: Documentation now clearly separates Samsung S23 reference/later real-device QA from emulator-based Holiwyn automation.
- P1: The harness spec now includes a Development Build/APK Harness with pass criteria, fallback behavior, and payment/deposit/withdraw guardrails.
- P1: The mobile README gives contributors the same practical device strategy: Expo Go for fast iteration, emulator for repeatable automation, and dev build/APK once core flows are stable.
- P2: No app runtime behavior changed in this cycle, so no emulator smoke was required.
Decision: Approve Cycle 129 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 130

Date: 2026-07-01
Branch: mobile/cycle-130
Reviewer: Lead/Reviewer pass
Scope: Portfolio open-order economics and cancel hardening.
Findings:
- P1: Open orders now render before the no-position empty card, so pending orders are visible and actionable without extra scrolling.
- P1: Each open order shows limit price, implied odds, order value, remaining amount, and a visible Cancel button.
- P1: `forceOpenOrder=1` now seeds a clean fake-token portfolio, preventing stale canceled activity from polluting repeatable smoke runs.
- P1: Cancel is idempotent and no longer inserts duplicate canceled activity rows if a tap/retry fires twice.
- P2: Open-order economics are still mock fixture values until backend orderbook/quote integration becomes the source of truth.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 130 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 131

Date: 2026-07-01
Branch: mobile/cycle-131
Reviewer: Lead/Reviewer pass
Scope: Latest-order execution details and focused order smoke hardening.
Findings:
- P1: Latest order confirmation now appears above positions, making post-order feedback visible immediately after placement.
- P1: Confirmation details include filled shares, execution price, and implied odds derived from the same mock economics as the ticket.
- P1: `forceWorldCupWinnerFranceTicket=1` now survives clean-state reset by skipping the delayed second reset for forced-ticket URLs.
- P1: Focused order smoke now uses deterministic ticket launch and verifies the execution detail row.
- P2: Execution details remain mock/probability-derived until backend fills/quotes provide authoritative values.
- Mobile typecheck through the smoke script and mobile API/profile-preference tests passed.
Decision: Approve Cycle 131 for local commit/merge after scoped diff review.
Merge approved: Yes

### Cycle 132

Date: 2026-07-01
Branch: mobile/cycle-132
Reviewer: Lead/Reviewer pass
Scope: Recent activity execution details for order history parity.
Findings:
- P1: Opened and closed activity records can now carry side and probability metadata without breaking existing backend history rows.
- P1: Bought Recent activity rows show filled shares, execution price, and implied odds using the same mock trade economics as the ticket/latest-order confirmation.
- P1: The future-list-order smoke now scrolls into Recent activity and verifies the execution detail line after placing the France World Cup winner order.
- P2: Backend history rows still do not provide execution price/share metadata; the optional fields keep the UI compatible until server fills/history are richer.
- Mobile typecheck, focused emulator smoke, and mobile API/profile-preference tests passed.
Decision: Approve Cycle 132 for local commit/merge after scoped diff review.
Merge approved: Yes
