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
