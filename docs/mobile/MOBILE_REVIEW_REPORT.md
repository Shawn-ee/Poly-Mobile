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
