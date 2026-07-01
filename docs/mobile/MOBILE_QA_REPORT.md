# Mobile QA Report

Purpose: Record emulator and device testing for Holiwyn.

## Current Status

Cycle 003 completed backend-compatible mobile data adapter work and added a repeatable emulator smoke harness. Holiwyn still launches through Expo Go, keeps mock fallback, and can hydrate World Cup event cards from backend event/detail responses when available.

## Required Smoke Tests

| Test | Status | Notes |
| --- | --- | --- |
| App launches on Android emulator | Passed | Verified with Expo Go on emulator. |
| Home loads | Passed | Dark-first Holiwyn World Cup shell rendered. |
| Language switcher works | Passed | Toggled to Simplified Chinese on event detail. |
| World Cup tab opens | Passed | Home category row and Games/Futures tabs verified. |
| Market card opens event detail | Passed | Mexico vs. Ecuador detail opened from Games card. |
| Trade ticket opens | Passed | France World Cup winner outcome opened ticket. |
| Amount input works | Passed | Default amount rendered and estimates updated from amount state. |
| Mock order can be placed | Passed | Order placed from ticket. |
| Portfolio opens | Passed | Portfolio showed new position after mock order. |
| Wallet/balance screen opens | Passed | Fake balance appears in Portfolio. Deposit/withdraw intentionally not implemented. |
| Search opens | Passed | Search input renders in Home/Search surfaces. |
| No crash during tab switching | Passed | Home, Live, Portfolio, Search, Games, Futures, detail, ticket, and language toggle did not crash. |

## Harnesses

QA cycles should reference the relevant harnesses from `docs/mobile/MOBILE_HARNESS_SPEC.md`, especially:

- Emulator Runtime Harness
- Screenshot Evidence Harness
- QA Smoke Harness
- Trading Simulation Harness when trade behavior is changed
- Localization Harness when user-visible copy changes

## Cycle Notes

### Cycle 001

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm install`
- `npm run typecheck`
- `npx expo start --host localhost --port 8082 --clear`
- `adb reverse tcp:8082 tcp:8082`
- `adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8082`
Result: Passed Phase 0 emulator runtime harness. App launches and renders the Holiwyn bootstrap market screen.
Screenshots:
- `docs/mobile/screenshots/cycle-001-holiwyn-renamed-home-final.png`
Bugs:
- Unsupported Expo host flag recovered by switching to `--host localhost`.
- Expo developer overlay appeared on first run and was closed.
Notes:
- `npm audit` reports 11 moderate advisories; tracked as TD-001.

### Cycle 002

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npx expo start --host localhost --port 8082 --clear`
- `adb reverse tcp:8082 tcp:8082`
- `adb shell am start -a android.intent.action.VIEW -d exp://10.0.2.2:8082`
Result: Passed product smoke. Home, World Cup Games/Futures, event detail, trade ticket, fake order, portfolio balance, and Simplified Chinese mode all rendered on emulator.
Screenshots:
- `docs/mobile/screenshots/cycle-002-holiwyn-home.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-futures.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-futures-scrolled.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-games-scrolled.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-002-holiwyn-zh.png`
Bugs:
- Direct `exec-out screencap` capture produced an unreadable PNG in PowerShell. Recovered by saving on the emulator and pulling the PNG.
Notes:
- Fake order changed balance from 10,000 USDT to 9,900 USDT and added a France World Cup winner position.

### Cycle 003

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
Result: Passed adapter/harness smoke. The harness typechecked the app, confirmed backend health, launched Expo on the emulator, and captured a screenshot through the device-file pull method.
Screenshots:
- `docs/mobile/screenshots/cycle-003-holiwyn-smoke.png`
Bugs:
- PowerShell smoke harness needed separate stdout/stderr logs.
- PowerShell smoke harness needed `npx.cmd`.
- Smoke screenshot default path needed to point inside `Poly/docs/mobile/screenshots`.
Notes:
- Backend API adapter now targets `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` and `/api/events/:slug`.
- Mock order placement remains local by design until authenticated order mode is proven.

### Cycle 004

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through: featured future outcome, place order, Portfolio verification.
Result: Passed. The new order service preserved mock order behavior and Portfolio displayed a `MOCK` position after ticket submission.
Screenshots:
- `docs/mobile/screenshots/cycle-004-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-004-holiwyn-order-service-portfolio.png`
Bugs: None found.

### Cycle 016

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through to Live tab.
Result: Passed. Live tab displays a dedicated heading, count badge, and live-specific empty state.
Screenshots:
- `docs/mobile/screenshots/cycle-016-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-016-holiwyn-live-tab.png`
Bugs: None found.

### Cycle 017

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Deep smoke now saves Android UI hierarchy XML and asserts visible Home, Ticket, and Portfolio text.
Screenshots:
- `docs/mobile/screenshots/cycle-017-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-017-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-017-holiwyn-portfolio.png`
Harness evidence:
- `docs/mobile/harness/cycle-017-holiwyn-home.xml`
- `docs/mobile/harness/cycle-017-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-017-holiwyn-portfolio.xml`
Bugs: None found.

### Cycle 018

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Deep smoke now verifies Home, Ticket, Portfolio, Live, and Search with screenshots plus Android hierarchy assertions.
Screenshots:
- `docs/mobile/screenshots/cycle-018-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-018-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-018-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-018-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-018-holiwyn-search.png`
Harness evidence:
- `docs/mobile/harness/cycle-018-holiwyn-home.xml`
- `docs/mobile/harness/cycle-018-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-018-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-018-holiwyn-live.xml`
- `docs/mobile/harness/cycle-018-holiwyn-search.xml`
Bugs: None found.

### Cycle 019

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after recovery. Search shows result header/count without opening the keyboard overlay, and deep smoke waits for Home before screenshot capture.
Screenshots:
- `docs/mobile/screenshots/cycle-019-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-019-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-019-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-019-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-019-holiwyn-search.png`
Harness evidence:
- `docs/mobile/harness/cycle-019-holiwyn-home.xml`
- `docs/mobile/harness/cycle-019-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-019-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-019-holiwyn-live.xml`
- `docs/mobile/harness/cycle-019-holiwyn-search.xml`
Bugs fixed:
- Search `autoFocus` opened a stylus/keyboard overlay over results.
- Live smoke expected only an empty live state.
- Smoke captured emulator home when the Expo URL did not land immediately.

### Cycle 020

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Search tab displays `All`, `Live`, and `Upcoming` filters and deep smoke asserts those labels.
Screenshots:
- `docs/mobile/screenshots/cycle-020-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-020-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-020-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-020-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-020-holiwyn-search.png`
Harness evidence:
- `docs/mobile/harness/cycle-020-holiwyn-home.xml`
- `docs/mobile/harness/cycle-020-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-020-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-020-holiwyn-live.xml`
- `docs/mobile/harness/cycle-020-holiwyn-search.xml`
Bugs: None found.

### Cycle 021

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Search screen extraction preserved Search rendering and deep smoke assertions.
Screenshots:
- `docs/mobile/screenshots/cycle-021-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-021-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-021-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-021-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-021-holiwyn-search.png`
Harness evidence:
- `docs/mobile/harness/cycle-021-holiwyn-home.xml`
- `docs/mobile/harness/cycle-021-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-021-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-021-holiwyn-live.xml`
- `docs/mobile/harness/cycle-021-holiwyn-search.xml`
Bugs: None found.

### Cycle 022

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Live screen extraction preserved Live rendering and deep smoke assertions.
Screenshots:
- `docs/mobile/screenshots/cycle-022-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-022-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-022-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-022-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-022-holiwyn-search.png`
Harness evidence:
- `docs/mobile/harness/cycle-022-holiwyn-home.xml`
- `docs/mobile/harness/cycle-022-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-022-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-022-holiwyn-live.xml`
- `docs/mobile/harness/cycle-022-holiwyn-search.xml`
Bugs: None found.

### Cycle 023

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after recovery. Deep smoke types `zzzz` into Search and verifies the zero-result state.
Screenshots:
- `docs/mobile/screenshots/cycle-023-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-023-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-023-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-023-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-023-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-023-holiwyn-search-query.png`
Harness evidence:
- `docs/mobile/harness/cycle-023-holiwyn-home.xml`
- `docs/mobile/harness/cycle-023-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-023-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-023-holiwyn-live.xml`
- `docs/mobile/harness/cycle-023-holiwyn-search.xml`
- `docs/mobile/harness/cycle-023-holiwyn-search-query.xml`
Bugs fixed:
- Emulator stylus handwriting intercepted ADB text input; smoke now disables soft input for Search while preserving normal app keyboard behavior outside smoke.

### Cycle 024

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after recovery. Live tab shows freshness copy, refresh control, and a verified refreshed state.
Screenshots:
- `docs/mobile/screenshots/cycle-024-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-024-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-024-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-024-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-024-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-024-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-024-holiwyn-search-query.png`
Harness evidence:
- `docs/mobile/harness/cycle-024-holiwyn-home.xml`
- `docs/mobile/harness/cycle-024-holiwyn-ticket.xml`
- `docs/mobile/harness/cycle-024-holiwyn-portfolio.xml`
- `docs/mobile/harness/cycle-024-holiwyn-live.xml`
- `docs/mobile/harness/cycle-024-holiwyn-live-refresh.xml`
- `docs/mobile/harness/cycle-024-holiwyn-search.xml`
- `docs/mobile/harness/cycle-024-holiwyn-search-query.xml`
Bugs fixed:
- Initial Live refresh assertion could pass by matching the live count. The final harness checks the `refreshed` status text.

### Cycle 014

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through to normalized event detail.
Result: Passed. Generic backend fixture title is normalized to `World Cup futures` for futures bundles.
Screenshots:
- `docs/mobile/screenshots/cycle-014-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-014-holiwyn-normalized-event-detail.png`
Bugs:
- Fixed user-hostile generic `Fixture ...` title in mobile adapter for futures bundles.

### Cycle 015

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Added stable labels/test IDs to critical Home, Ticket, and Portfolio surfaces without breaking deep smoke.
Screenshots:
- `docs/mobile/screenshots/cycle-015-holiwyn-labeled-home.png`
- `docs/mobile/screenshots/cycle-015-holiwyn-labeled-ticket.png`
- `docs/mobile/screenshots/cycle-015-holiwyn-labeled-portfolio.png`
Bugs: None found.

### Cycle 013

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run smoke:deep`
Result: Passed. Deep smoke captured Home, Trade Ticket, and Portfolio after placing a mock order.
Screenshots:
- `docs/mobile/screenshots/cycle-013-holiwyn-deep-home.png`
- `docs/mobile/screenshots/cycle-013-holiwyn-deep-ticket.png`
- `docs/mobile/screenshots/cycle-013-holiwyn-deep-portfolio.png`
Bugs: None found.

### Cycle 012

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through to grouped event detail.
Result: Passed. Event Detail now renders grouped market headers and market cards with outcome buttons.
Screenshots:
- `docs/mobile/screenshots/cycle-012-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-012-holiwyn-grouped-event-detail.png`
Bugs: None found.

### Cycle 011

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through to first visible event detail.
Result: Passed. Extracted Event Detail component rendered event hero, market section, and outcome probability buttons.
Screenshots:
- `docs/mobile/screenshots/cycle-011-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-011-holiwyn-event-detail-component.png`
Bugs: None found.

### Cycle 009

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run smoke`
Result: Passed. Smoke harness force-stopped Expo Go before launch and captured a clean Home-state screenshot.
Screenshots:
- `docs/mobile/screenshots/cycle-009-holiwyn-smoke-reset-home.png`
Bugs:
- Fixed smoke screenshot state carryover from previous manual QA sessions.

### Cycle 010

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through to Futures tab.
Result: Passed. Extracted MarketList/FutureList components rendered both default Games/Home smoke and Futures tab.
Screenshots:
- `docs/mobile/screenshots/cycle-010-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-010-holiwyn-futures-list.png`
Bugs: None found.

### Cycle 008

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through: Home, featured future ticket, place mock order, Portfolio.
Result: Passed. Extracted Portfolio component rendered fake balance and mock positions after order placement.
Screenshots:
- `docs/mobile/screenshots/cycle-008-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-008-holiwyn-portfolio-component.png`
Bugs: None found.

### Cycle 007

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
- Manual emulator tap-through: Home, featured future ticket, place mock order, Portfolio.
Result: Passed. Extracted Trade Ticket component still opened, submitted a mock order, reduced fake balance, and displayed Portfolio positions.
Screenshots:
- `docs/mobile/screenshots/cycle-007-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-007-holiwyn-trade-ticket-portfolio.png`
Bugs: None found.
Notes:
- Default mobile order mode is mock. Server mode requires `EXPO_PUBLIC_ORDER_MODE=server` and authenticated backend readiness.

### Cycle 005

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
Result: Passed. Presentation helper extraction did not break launch/typecheck behavior.
Screenshots:
- `docs/mobile/screenshots/cycle-005-holiwyn-smoke.png`
Bugs: None found in runtime. Broad localization extraction was deferred to avoid encoding churn.

### Cycle 006

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke`
Result: Passed. Bottom navigation extraction did not break app launch or tab rendering.
Screenshots:
- `docs/mobile/screenshots/cycle-006-holiwyn-smoke.png`
Bugs: None found.

### Cycle 025

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after Recovery Harness. Live refresh now waits for the shared event reload path, falls back when the backend is unavailable, and preserves Home/Ticket/Portfolio/Live/Search coverage.
Screenshots:
- `docs/mobile/screenshots/cycle-025-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-025-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-025-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-025-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-025-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-025-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-025-holiwyn-search-query.png`
Bugs:
- Initial run failed because the unavailable backend request kept the refresh button disabled longer than the one-second smoke wait. Added a mobile API timeout and refresh-state hierarchy wait, then reran successfully.

### Cycle 026

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after Recovery Harness. Home renders the extracted featured futures card and the deep flow still opens a ticket, places a mock order, shows Portfolio, refreshes Live, and verifies Search.
Screenshots:
- `docs/mobile/screenshots/cycle-026-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-026-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-026-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-026-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-026-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-026-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-026-holiwyn-search-query.png`
Bugs:
- Initial cleanup approach created a noisy full-file diff in `App.tsx`; restored and used a narrow alias-based component extraction instead.

### Cycle 027

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Removed the stale inline featured futures function while preserving the extracted component's Home, ticket, portfolio, Live refresh, and Search behavior.
Screenshots:
- `docs/mobile/screenshots/cycle-027-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-027-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-027-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-027-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-027-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-027-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-027-holiwyn-search-query.png`
Bugs: None found.

### Cycle 028

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Extracted the Home sports navigation row and preserved the full deep-smoke flow.
Screenshots:
- `docs/mobile/screenshots/cycle-028-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-028-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-028-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-028-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-028-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-028-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-028-holiwyn-search-query.png`
Bugs: None found.

### Cycle 029

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after launch retry. Extracted the Home Games/Futures segmented control and preserved the full deep-smoke flow.
Screenshots:
- `docs/mobile/screenshots/cycle-029-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-029-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-029-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-029-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-029-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-029-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-029-holiwyn-search-query.png`
Bugs:
- First Home hierarchy dump was incomplete during launch; existing wait/retry recovered without code changes.

### Cycle 030

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Extracted Home screen composition into `HomeScreen.tsx` and preserved the full deep-smoke flow.
Screenshots:
- `docs/mobile/screenshots/cycle-030-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-030-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-030-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-030-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-030-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-030-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-030-holiwyn-search-query.png`
Bugs: None found.

### Cycle 031

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio now shows Entry, Current value, and Est. P/L after a mock trade.
Screenshots:
- `docs/mobile/screenshots/cycle-031-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-031-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-031-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-031-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-031-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-031-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-031-holiwyn-search-query.png`
Bugs: None found.

### Cycle 032

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Extracted Header component and preserved the full deep-smoke flow.
Screenshots:
- `docs/mobile/screenshots/cycle-032-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-032-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-032-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-032-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-032-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-032-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-032-holiwyn-search-query.png`
Bugs: None found.

### Cycle 033

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio now shows aggregate Invested, Current value, and Est. P/L summary cards after a mock trade.
Screenshots:
- `docs/mobile/screenshots/cycle-033-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-033-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-033-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-033-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-033-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-033-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-033-holiwyn-search-query.png`
Bugs: None found.

### Cycle 034

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio position cards now show `Close position` after a mock trade.
Screenshots:
- `docs/mobile/screenshots/cycle-034-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-034-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-034-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-034-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-034-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-034-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-034-holiwyn-search-query.png`
Bugs: None found.

### Cycle 035

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Deep smoke now taps `Close position` and verifies the fake balance is credited back with an empty Portfolio state.
Screenshots:
- `docs/mobile/screenshots/cycle-035-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-035-holiwyn-search-query.png`
Bugs: None found.

### Cycle 036

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Extracted app copy into a dedicated localization module while preserving the full deep-smoke flow.
Screenshots:
- `docs/mobile/screenshots/cycle-036-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-036-holiwyn-search-query.png`
Bugs: None found.

### Cycle 037

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio now shows Recent activity rows for Bought and Closed after the fake-token close flow.
Screenshots:
- `docs/mobile/screenshots/cycle-037-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-037-holiwyn-search-query.png`
Bugs: None found.

### Cycle 038

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Event detail now verifies expanded World Cup prop markets before the existing ticket, Portfolio, Live, and Search flow.
Screenshots:
- `docs/mobile/screenshots/cycle-038-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-038-holiwyn-search-query.png`
Bugs:
- Early Cycle 038 smoke attempts exposed event-detail below-fold and Android Back assumptions; harness was updated and final rerun passed.

### Cycle 039

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Android hardware Back now returns from Event Detail to Home, and the full event-detail/trade/Portfolio/Live/Search smoke path passes without forced Expo relaunch.
Screenshots:
- `docs/mobile/screenshots/cycle-039-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-039-holiwyn-search-query.png`
Bugs: None found in final verification.

### Cycle 040

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Added a server-mode Portfolio history adapter while preserving the full mock-mode event-detail/trade/Portfolio/Live/Search smoke path.
Screenshots:
- `docs/mobile/screenshots/cycle-040-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-040-holiwyn-search-query.png`
Bugs: None found.

### Cycle 041

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Added a server-mode Portfolio snapshot adapter while preserving the full mock-mode event-detail/trade/Portfolio/Live/Search smoke path.
Screenshots:
- `docs/mobile/screenshots/cycle-041-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-041-holiwyn-search-query.png`
Bugs: None found.

### Cycle 042

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio can now render server open orders while preserving the full mock-mode event-detail/trade/Portfolio/Live/Search smoke path.
Screenshots:
- `docs/mobile/screenshots/cycle-042-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-042-holiwyn-search-query.png`
Bugs: None found.

### Cycle 043

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio now shows an `Order placed` confirmation after a mock trade and the close/activity/Live/Search smoke path remains stable.
Screenshots:
- `docs/mobile/screenshots/cycle-043-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-043-holiwyn-search-query.png`
Bugs: None found.

### Cycle 044

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Trade Ticket now shows available fake balance before submission and the full event-detail/trade/Portfolio/Live/Search smoke path remains stable.
Screenshots:
- `docs/mobile/screenshots/cycle-044-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-044-holiwyn-search-query.png`
Bugs: None found.

### Cycle 045

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Trade Ticket now has a Max control that fills the ticket amount with available fake balance and updates estimated cost.
Screenshots:
- `docs/mobile/screenshots/cycle-045-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-045-holiwyn-search-query.png`
Bugs:
- Initial Max tap coordinate hit the wrong ticket control; adjusted the harness coordinate and final rerun passed.

### Cycle 046

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Trade Ticket now has 100, 500, and 1,000 USDT preset controls while preserving Max sizing and the full event-detail/trade/Portfolio/Live/Search smoke path.
Screenshots:
- `docs/mobile/screenshots/cycle-046-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-046-holiwyn-search-query.png`
Bugs:
- Initial Max tap coordinate hit the amount input after the preset row shifted layout; adjusted the harness coordinate and final rerun passed.

### Cycle 047

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. The deep smoke now taps the ticket Max and Place mock order controls by Android hierarchy id instead of fixed coordinates.
Screenshots:
- `docs/mobile/screenshots/cycle-047-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-047-holiwyn-search-query.png`
Bugs: None found.

### Cycle 048

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. The deep smoke now taps close-position, Live/Search tabs, Live refresh, and Search input through Android hierarchy ids or prefixes.
Screenshots:
- `docs/mobile/screenshots/cycle-048-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-048-holiwyn-search-query.png`
Bugs: None found.

### Cycle 049

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio now has server-mode sync/unavailable status wiring, and the normal mock Portfolio smoke remains unchanged.
Screenshots:
- `docs/mobile/screenshots/cycle-049-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-049-holiwyn-search-query.png`
Bugs: None found.
Server-mode note: Not server-smoked because backend health is unavailable and server trade submission would call the backend directly.

### Cycle 050

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Event Detail and the first event-market ticket now open through stable Android hierarchy ids, and the event-market trade/close path is verified.
Screenshots:
- `docs/mobile/screenshots/cycle-050-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-050-holiwyn-search-query.png`
Bugs:
- Initial event-outcome selector tap used clipped bounds under the bottom tab; added a small Home scroll before tapping and final rerun passed.

### Cycle 051

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Ticket order failure handling is wired and successful mock event-market trading remains stable.
Screenshots:
- `docs/mobile/screenshots/cycle-051-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-051-holiwyn-search-query.png`
Bugs: None found.
Failure-state note: The failure message is typechecked and component-wired; forced failure should get a dedicated harness cycle.

### Cycle 052

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
- `npm run smoke:order-failure`
Result: Passed. Normal event-market trading still passes, and forced order failure now verifies the ticket error card on emulator.
Screenshots:
- `docs/mobile/screenshots/cycle-052-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-search-query.png`
- `docs/mobile/screenshots/cycle-052-holiwyn-order-failure-ticket-order-error.png`
Bugs:
- Initial forced-failure smoke reused normal bundle/port and then hit an Expo URL error; fixed with a dedicated port and Expo `--/` deep-link launch URL.

### Cycle 053

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Portfolio open orders now have a localized Cancel affordance wired to canonical server cancellation, and normal mock trading/close/Live/Search paths remain stable.
Screenshots:
- `docs/mobile/screenshots/cycle-053-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-053-holiwyn-search-query.png`
Bugs: None found.
Server-mode note: Cancel calls `DELETE /api/orders/:id` in server mode, but the current emulator smoke stays on fake-token mock data and does not include an open-order fixture.

### Cycle 054

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:open-order-cancel`
- `npm run smoke:deep`
Result: Passed. A harness-only open order now verifies the Portfolio Cancel control and canceled activity feedback, while the normal deep smoke still passes.
Screenshots:
- `docs/mobile/screenshots/cycle-054-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-open-order.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-open-order-canceled.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-054-holiwyn-search-query.png`
Bugs: None found.
Harness note: The open-order fixture is driven by a launch URL flag and is intentionally limited to smoke coverage.

### Cycle 055

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Event Detail back navigation now uses the visible `event-detail-back` control in smoke instead of Android hardware Back, and the standard app flow still passes.
Screenshots:
- `docs/mobile/screenshots/cycle-055-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-055-holiwyn-search-query.png`
Bugs: None found.
Harness note: `docs/mobile/harness/cycle-055-holiwyn-event-detail-back.xml` captures the selector-visible back control before it is tapped.

### Cycle 056

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed after recovery. Event Detail Props are reached through the `event-detail-group-prop` selector, and the persistent `event-detail-back` control returns to Home.
Screenshots:
- `docs/mobile/screenshots/cycle-056-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-056-holiwyn-search-query.png`
Bugs:
- Initial run showed the selector jump could leave the back control offscreen; fixed by making Event Detail back persistent above the scroll area.

### Cycle 057

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:deep`
Result: Passed. Deep smoke opens the ticket from the visible featured France future and no longer uses a Home list swipe after Event Detail return.
Screenshots:
- `docs/mobile/screenshots/cycle-057-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-057-holiwyn-search-query.png`
Bugs: None found.
Harness note: The close-position balance expectation changed to `10,882.35 USDT` because the smoke now max-trades the 34% France futures outcome.

### Cycle 058

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:event-detail-trade`
- `npm run smoke:deep`
Result: Passed after assertion recovery. Focused smoke opens a Mexico match-winner ticket from Event Detail; normal deep smoke still passes.
Screenshots:
- `docs/mobile/screenshots/cycle-058-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-event-detail-ticket.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-058-holiwyn-search-query.png`
Bugs:
- Initial focused smoke expected probability copy that the ticket does not render; final pass asserts visible outcome, market, balance, and order controls.

### Cycle 059

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run smoke:search-query`
- `npm run smoke:deep`
- `npm run smoke:search-query`
Result: Passed. Focused Search smoke verifies `zzzz` zero-result state without keyboard input; normal deep smoke still passes.
Screenshots:
- `docs/mobile/screenshots/cycle-059-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-search-query.png`
- `docs/mobile/screenshots/cycle-059-holiwyn-search-query-focused.png`
Bugs: None found.
Harness note: Focused Search uses `forceSearchQuery=zzzz` through the Expo launch URL.

### Cycle 060

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck`
- `npm run check:server-auth`
- `npm run smoke:deep`
Result: Passed. Mobile server-mode auth config is wired and normal mock emulator smoke remains stable.
Screenshots:
- `docs/mobile/screenshots/cycle-060-holiwyn-smoke.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-event-detail-props.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-ticket.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-ticket-max.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-portfolio.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-portfolio-closed.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-live.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-live-refresh.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-search.png`
- `docs/mobile/screenshots/cycle-060-holiwyn-search-query.png`
Bugs:
- Initial `check:server-auth` run failed because of a PowerShell escaping error in the new harness; final rerun passed.
Server-mode note: This verifies configuration wiring, not live authenticated order placement.

### Cycle 061

Date: 2026-07-01
Device: Request-level unit harness
Build/run command:
- `npm run test:mobile-api`
- `npm run typecheck` in `mobile/`
Result: Passed. Mobile API client sends Bearer auth, canonical order idempotency/body, and encoded cancel requests.
Screenshots:
- None.
Bugs:
- Initial Vitest run used the backend-only config and found no mobile tests; fixed with `vitest.mobile.config.mts`.
- Initial typecheck rejected direct mock-call tuple casts; fixed by casting through `unknown`.
Server-mode note: This proves mobile request shape and auth headers with mocked fetch, not a live backend order.

### Cycle 062

Date: 2026-07-01
Device: Server-mode preflight harness
Build/run command:
- `npm run preflight:server-mode`
- `npm run typecheck` in `mobile/`
- `npm run test:mobile-api`
Result: Passed. Preflight verifies mobile auth wiring and reports current backend/API-key readiness before strict server-mode smoke.
Screenshots:
- None.
Bugs: None found.
Server-mode note: Current environment has no reachable backend at `http://127.0.0.1:3000` and no `EXPO_PUBLIC_API_KEY`, so live authenticated proof is still pending.

### Cycle 063

Date: 2026-07-01
Device: Server-mode preflight harness
Build/run command:
- `npm run preflight:server-mode`
- `npm run typecheck` in `mobile/`
- `npm run test:mobile-api`
- `npm run preflight:server-mode:strict` wrapped as an expected-failure gate check.
Result: Passed. Non-strict preflight honors launch defaults and passes; strict preflight correctly refuses to pass without a configured backend/API key.
Screenshots:
- None.
Bugs:
- Two initial nested PowerShell wrappers around the expected strict failure had quoting issues; final direct shell check passed.
Server-mode note: Strict live server-mode smoke now has a deterministic gate, but the environment still needs a reachable backend and `EXPO_PUBLIC_API_KEY` before live authenticated proof can pass.

### Cycle 064

Date: 2026-07-01
Device: Backend/mobile credential harness
Build/run command:
- `npm run mobile:dev-credential` attempted against local backend DB.
- `npm run mobile:dev-credential:dry-run`
- `npm run test:mobile-api`
- `npm run preflight:server-mode` in `mobile/`
- `npm run typecheck` in `mobile/`
Result: Passed with documented environment recovery. Dry-run credential proof, mobile API tests, mobile preflight, and mobile typecheck pass.
Screenshots:
- None.
Bugs:
- Real credential creation could not complete because local Postgres was unavailable at `localhost:5432`; this is an environment prerequisite, not a code failure.
Server-mode note: `mobile:dev-credential` is ready to create a fake-token mobile API key with 10,000 USDT target balance once local backend DB is running.

### Cycle 065

Date: 2026-07-01
Device: Backend readiness harness
Build/run command:
- `npm run mobile:backend-readiness`
- `npm run test:mobile-api`
- `npm run preflight:server-mode` in `mobile/`
- `npm run typecheck` in `mobile/`
Result: Passed with documented environment recovery. Backend readiness harness reports Docker CLI available, Docker daemon unavailable, DB URL aligned to local compose port, and DB TCP port closed.
Screenshots:
- None.
Bugs:
- None in code.
Server-mode note: The next live-backend step is to start Docker Desktop/local Postgres, then run `mobile:backend-readiness:start`, schema setup, `mobile:dev-credential`, and strict preflight.

### Cycle 066

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:server-unavailable`
- `npm run test:mobile-api`
Result: Passed. Server-mode emulator launch against a closed backend port shows the Portfolio fallback instead of crashing or pretending sync succeeded.
Screenshots:
- `docs/mobile/screenshots/cycle-066-holiwyn-server-unavailable-smoke.png`
- `docs/mobile/screenshots/cycle-066-holiwyn-server-unavailable.png`
Harness evidence:
- `docs/mobile/harness/cycle-066-holiwyn-server-unavailable-home.xml`
- `docs/mobile/harness/cycle-066-holiwyn-server-unavailable.xml`
Bugs:
- None found.
Server-mode note: This proves graceful offline handling, not live authenticated order execution.

### Cycle 067

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:server-order-failure`
- `npm run test:mobile-api`
Result: Passed. Server-mode order submission against a closed backend port keeps the ticket open and shows retry feedback.
Screenshots:
- `docs/mobile/screenshots/cycle-067-holiwyn-server-order-smoke.png`
- `docs/mobile/screenshots/cycle-067-holiwyn-server-order-ticket.png`
- `docs/mobile/screenshots/cycle-067-holiwyn-server-order-error.png`
Harness evidence:
- `docs/mobile/harness/cycle-067-holiwyn-server-order-home.xml`
- `docs/mobile/harness/cycle-067-holiwyn-server-order-ticket.xml`
- `docs/mobile/harness/cycle-067-holiwyn-server-order-error.xml`
Bugs:
- None found.
Server-mode note: This proves safe order failure handling while live authenticated backend proof remains blocked by local backend readiness.

### Cycle 068

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:event-detail-trade`
- `npm run test:mobile-api`
Result: Passed. Event Detail now shows localized Volume, Liquidity, and Traders context without blocking ticket opening.
Screenshots:
- `docs/mobile/screenshots/cycle-068-holiwyn-stats-smoke.png`
- `docs/mobile/screenshots/cycle-068-holiwyn-event-detail-stats.png`
- `docs/mobile/screenshots/cycle-068-holiwyn-event-detail-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-068-holiwyn-stats-home.xml`
- `docs/mobile/harness/cycle-068-holiwyn-event-detail-stats.xml`
- `docs/mobile/harness/cycle-068-holiwyn-event-detail-ticket.xml`
Bugs:
- None found.
Visual QA:
- Event Detail stats fit on emulator without overlap; market group controls and outcome buttons remain visible.

### Cycle 069

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:event-detail-trade`
- `npm run test:mobile-api`
Result: Passed. Trade Ticket now shows localized estimated shares and average price while preserving ticket submission controls.
Screenshots:
- `docs/mobile/screenshots/cycle-069-holiwyn-ticket-math-smoke.png`
- `docs/mobile/screenshots/cycle-069-holiwyn-ticket-math-event-detail.png`
- `docs/mobile/screenshots/cycle-069-holiwyn-ticket-math.png`
Harness evidence:
- `docs/mobile/harness/cycle-069-holiwyn-ticket-math-home.xml`
- `docs/mobile/harness/cycle-069-holiwyn-ticket-math-event-detail.xml`
- `docs/mobile/harness/cycle-069-holiwyn-ticket-math.xml`
Bugs:
- None found.
Visual QA:
- Ticket rows fit on emulator; the primary submit button remains visible.
