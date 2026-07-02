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

### Cycle 070

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:event-detail-trade`
- `npm run test:mobile-api`
Result: Passed after assertion recovery. Event Detail market cards now show localized Best bid, Best ask, and Spread context while ticket opening still works.
Screenshots:
- `docs/mobile/screenshots/cycle-070-holiwyn-depth-smoke.png`
- `docs/mobile/screenshots/cycle-070-holiwyn-event-detail-depth.png`
- `docs/mobile/screenshots/cycle-070-holiwyn-depth-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-070-holiwyn-depth-home.xml`
- `docs/mobile/harness/cycle-070-holiwyn-event-detail-depth.xml`
- `docs/mobile/harness/cycle-070-holiwyn-depth-ticket.xml`
Bugs:
- Initial smoke expected `Total goals over 2.5` in the first viewport; the new depth row pushed that prop title below the fold. The assertion was corrected to check visible first-viewport content.
Visual QA:
- Depth row fits cleanly in the first market card; outcome buttons remain visible.

### Cycle 071

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:sell-ticket`
- `npm run test:mobile-api`
Result: Passed. Trade Ticket now switches to side-specific copy for Buy/Sell, and the sell side shows estimated proceeds plus a `Place sell order` CTA.
Screenshots:
- `docs/mobile/screenshots/cycle-071-holiwyn-sell-ticket-smoke.png`
- `docs/mobile/screenshots/cycle-071-holiwyn-buy-ticket.png`
- `docs/mobile/screenshots/cycle-071-holiwyn-sell-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-071-holiwyn-sell-ticket-home.xml`
- `docs/mobile/harness/cycle-071-holiwyn-buy-ticket.xml`
- `docs/mobile/harness/cycle-071-holiwyn-sell-ticket.xml`
Bugs:
- None found.
Visual QA:
- Sell ticket copy fits on emulator and the primary CTA remains visible.

### Cycle 072

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account`
- `npm run test:mobile-api`
Result: Passed after recovery. Holiwyn now has a localized Account tab with signed-out state, mock login methods, demo balance context, and disabled deposit/withdraw messaging.
Screenshots:
- `docs/mobile/screenshots/cycle-072-holiwyn-account-smoke.png`
- `docs/mobile/screenshots/cycle-072-holiwyn-account.png`
Harness evidence:
- `docs/mobile/harness/cycle-072-holiwyn-account-home.xml`
- `docs/mobile/harness/cycle-072-holiwyn-account.xml`
Bugs:
- First smoke run hit a cold Metro startup before the packager was ready.
- Second smoke proved app render but asserted a below-fold fake-token row; the assertion was narrowed to first-viewport Account content.
Visual QA:
- Account screen and five-tab bottom navigation fit on emulator without overlap.

### Cycle 073

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-login`
- `npm run test:mobile-api`
Result: Passed. Account now supports local mock sign-in from the phone/email actions, shows a Holiwyn Demo profile, and signs out back to the signed-out login state.
Screenshots:
- `docs/mobile/screenshots/cycle-073-holiwyn-account-login-smoke.png`
- `docs/mobile/screenshots/cycle-073-holiwyn-account-signed-out-start.png`
- `docs/mobile/screenshots/cycle-073-holiwyn-account-signed-in.png`
- `docs/mobile/screenshots/cycle-073-holiwyn-account-signed-out.png`
Harness evidence:
- `docs/mobile/harness/cycle-073-holiwyn-account-login-home.xml`
- `docs/mobile/harness/cycle-073-holiwyn-account-signed-out-start.xml`
- `docs/mobile/harness/cycle-073-holiwyn-account-signed-in.xml`
- `docs/mobile/harness/cycle-073-holiwyn-account-signed-out.xml`
Bugs:
- None found.
Visual QA:
- Signed-in profile card, demo balance, sign-out action, and mock-auth warning fit on emulator without overlap.

### Cycle 074

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:home-filter`
- `npm run test:mobile-api`
Result: Passed. Home now has All/Live/Today filter chips for World Cup market discovery, and the smoke verifies Live and Today filtered results by selector.
Screenshots:
- `docs/mobile/screenshots/cycle-074-holiwyn-home-filter-smoke.png`
- `docs/mobile/screenshots/cycle-074-holiwyn-home-filter-live.png`
- `docs/mobile/screenshots/cycle-074-holiwyn-home-filter-today.png`
Harness evidence:
- `docs/mobile/harness/cycle-074-holiwyn-home-filter-home.xml`
- `docs/mobile/harness/cycle-074-holiwyn-home-filter-live.xml`
- `docs/mobile/harness/cycle-074-holiwyn-home-filter-today.xml`
Bugs:
- None found.
Visual QA:
- Filter chips fit under search and above Games/Futures without overlapping the bottom navigation.

### Cycle 075

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:home-saved`
- `npm run test:mobile-api`
Result: Passed after recovery. Home now supports local saved-event stars and a Saved filter for World Cup market discovery.
Screenshots:
- `docs/mobile/screenshots/cycle-075-holiwyn-home-saved-smoke.png`
- `docs/mobile/screenshots/cycle-075-holiwyn-home-saved-star.png`
- `docs/mobile/screenshots/cycle-075-holiwyn-home-saved-filter.png`
Harness evidence:
- `docs/mobile/harness/cycle-075-holiwyn-home-saved-home.xml`
- `docs/mobile/harness/cycle-075-holiwyn-home-saved-ready.xml`
- `docs/mobile/harness/cycle-075-holiwyn-home-saved-star.xml`
- `docs/mobile/harness/cycle-075-holiwyn-home-saved-filter.xml`
Bugs:
- Initial smoke tapped a clipped star selector at the bottom of the viewport and landed on bottom navigation. Harness recovered by scrolling the Home list before tapping the save control.
Visual QA:
- Saved chip, active star, and saved event card fit cleanly and remain usable above the bottom navigation.

### Cycle 076

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:home-card-stats`
- `npm run test:mobile-api`
Result: Passed after cold-launch rerun. Home event cards now show localized Volume and Liquidity context before opening Event Detail.
Screenshots:
- `docs/mobile/screenshots/cycle-076-holiwyn-home-card-stats-smoke.png`
- `docs/mobile/screenshots/cycle-076-holiwyn-home-card-stats.png`
Harness evidence:
- `docs/mobile/harness/cycle-076-holiwyn-home-card-stats-home.xml`
- `docs/mobile/harness/cycle-076-holiwyn-home-card-stats.xml`
Bugs:
- First smoke run hit Expo cold Metro rebuild before app content appeared; rerun passed.
Visual QA:
- Volume/Liquidity row fits inside the event card and the first outcome button remains reachable.

### Cycle 077

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:saved-search`
- `npm run test:mobile-api`
Result: Passed. Saved events now persist across Home and Search within the app session, and Search has a Saved filter.
Screenshots:
- `docs/mobile/screenshots/cycle-077-holiwyn-saved-search-smoke.png`
- `docs/mobile/screenshots/cycle-077-holiwyn-saved-search-star.png`
- `docs/mobile/screenshots/cycle-077-holiwyn-saved-search-filter.png`
Harness evidence:
- `docs/mobile/harness/cycle-077-holiwyn-saved-search-home.xml`
- `docs/mobile/harness/cycle-077-holiwyn-saved-search-home-ready.xml`
- `docs/mobile/harness/cycle-077-holiwyn-saved-search-star.xml`
- `docs/mobile/harness/cycle-077-holiwyn-saved-search-screen.xml`
- `docs/mobile/harness/cycle-077-holiwyn-saved-search-filter.xml`
Bugs:
- None found.
Visual QA:
- Search Saved filter shows one saved market with active star, correct result count, and visible trade buttons.

### Cycle 078

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:search-card-stats`
- `npm run test:mobile-api`
Result: Passed. Search result cards now show localized Volume and Liquidity context.
Screenshots:
- `docs/mobile/screenshots/cycle-078-holiwyn-search-card-stats-smoke.png`
- `docs/mobile/screenshots/cycle-078-holiwyn-search-card-stats.png`
Harness evidence:
- `docs/mobile/harness/cycle-078-holiwyn-search-card-stats-home.xml`
- `docs/mobile/harness/cycle-078-holiwyn-search-card-stats.xml`
Bugs:
- None found.
Visual QA:
- Search card stats fit without crowding outcome buttons or bottom navigation.

### Cycle 079

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:search-saved-empty`
- `npm run test:mobile-api`
Result: Passed. Search Saved now has a localized empty state when no markets are saved.
Screenshots:
- `docs/mobile/screenshots/cycle-079-holiwyn-search-saved-empty-smoke.png`
- `docs/mobile/screenshots/cycle-079-holiwyn-search-saved-empty.png`
Harness evidence:
- `docs/mobile/harness/cycle-079-holiwyn-search-saved-empty-home.xml`
- `docs/mobile/harness/cycle-079-holiwyn-search-saved-empty-screen.xml`
- `docs/mobile/harness/cycle-079-holiwyn-search-saved-empty.xml`
Bugs:
- None found.
Visual QA:
- Saved empty state is centered and does not conflict with filter chips or bottom navigation.

### Cycle 080

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:event-detail-save`
- `npm run test:mobile-api`
Result: Passed. Event Detail now supports saving a market page and the saved state carries into Search Saved.
Screenshots:
- `docs/mobile/screenshots/cycle-080-holiwyn-event-detail-save-smoke.png`
- `docs/mobile/screenshots/cycle-080-holiwyn-event-detail-save-detail.png`
- `docs/mobile/screenshots/cycle-080-holiwyn-event-detail-save-star.png`
- `docs/mobile/screenshots/cycle-080-holiwyn-event-detail-save-search-saved.png`
Harness evidence:
- `docs/mobile/harness/cycle-080-holiwyn-event-detail-save-home-start.xml`
- `docs/mobile/harness/cycle-080-holiwyn-event-detail-save-detail.xml`
- `docs/mobile/harness/cycle-080-holiwyn-event-detail-save-star.xml`
- `docs/mobile/harness/cycle-080-holiwyn-event-detail-save-home.xml`
- `docs/mobile/harness/cycle-080-holiwyn-event-detail-save-search.xml`
- `docs/mobile/harness/cycle-080-holiwyn-event-detail-save-search-saved.xml`
Bugs:
- None found.
Visual QA:
- Event Detail star fits in the hero and saved Search result keeps active star plus trade controls visible.

### Cycle 081

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:search-sort`
- `npm run test:mobile-api`
Result: Passed. Search now supports Popular and Live first result ordering.
Screenshots:
- `docs/mobile/screenshots/cycle-081-holiwyn-search-sort-smoke.png`
- `docs/mobile/screenshots/cycle-081-holiwyn-search-sort-live.png`
Harness evidence:
- `docs/mobile/harness/cycle-081-holiwyn-search-sort-home.xml`
- `docs/mobile/harness/cycle-081-holiwyn-search-sort-screen.xml`
- `docs/mobile/harness/cycle-081-holiwyn-search-sort-live.xml`
Bugs:
- None found.
Visual QA:
- Live first sorting promotes the live France vs. Argentina market without crowding the Search filter row or bottom navigation.

### Cycle 082

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:home-saved-empty`
- `npm run test:mobile-api`
Result: Passed. Home Saved now shows a specific empty state when no markets are saved.
Screenshots:
- `docs/mobile/screenshots/cycle-082-holiwyn-home-saved-empty-smoke.png`
- `docs/mobile/screenshots/cycle-082-holiwyn-home-saved-empty.png`
Harness evidence:
- `docs/mobile/harness/cycle-082-holiwyn-home-saved-empty-home.xml`
- `docs/mobile/harness/cycle-082-holiwyn-home-saved-empty.xml`
Bugs:
- None found.
Visual QA:
- Saved empty copy is visible in the first viewport between the filter chips and Games/Futures control.

### Cycle 083

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:home-search-query`
- `npm run test:mobile-api`
Result: Passed. Home/Search discovery now matches market and outcome labels, not only event/team names.
Screenshots:
- `docs/mobile/screenshots/cycle-083-holiwyn-home-search-query-smoke.png`
- `docs/mobile/screenshots/cycle-083-holiwyn-home-search-query.png`
Harness evidence:
- `docs/mobile/harness/cycle-083-holiwyn-home-search-query-home.xml`
- `docs/mobile/harness/cycle-083-holiwyn-home-search-query.xml`
Bugs:
- None found.
Visual QA:
- The `clean` query surfaces England vs. Congo DR with Volume/Liquidity visible and without layout overlap.

### Cycle 084

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:home-clear-search`
- `npm run test:mobile-api`
Result: Passed. Home search now exposes a Clear action when a query is active.
Screenshots:
- `docs/mobile/screenshots/cycle-084-holiwyn-home-clear-search-smoke.png`
- `docs/mobile/screenshots/cycle-084-holiwyn-home-clear-search.png`
Harness evidence:
- `docs/mobile/harness/cycle-084-holiwyn-home-clear-search-home.xml`
- `docs/mobile/harness/cycle-084-holiwyn-home-clear-search-ready.xml`
- `docs/mobile/harness/cycle-084-holiwyn-home-clear-search.xml`
Bugs:
- None found.
Visual QA:
- Clearing the `clean` query restores the placeholder and full Home list with Mexico vs. Ecuador visible.

### Cycle 085

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:search-clear-query`
- `npm run test:mobile-api`
Result: Passed after recovery rerun. Search clear now uses the same accessible close-icon pattern as Home and restores Top results.
Screenshots:
- `docs/mobile/screenshots/cycle-085-holiwyn-search-clear-query-smoke.png`
- `docs/mobile/screenshots/cycle-085-holiwyn-search-clear-query-before.png`
- `docs/mobile/screenshots/cycle-085-holiwyn-search-clear-query-after.png`
Harness evidence:
- `docs/mobile/harness/cycle-085-holiwyn-search-clear-query-home.xml`
- `docs/mobile/harness/cycle-085-holiwyn-search-clear-query-ready.xml`
- `docs/mobile/harness/cycle-085-holiwyn-search-clear-query-after.xml`
Bugs:
- None found in app code. First smoke attempt hit Expo Go's generic error screen while Metro rebuilt cache; rerun passed without code changes.
Visual QA:
- After clearing `zzzz`, Search returns to Top results with Mexico vs. Ecuador and sort controls visible.

### Cycle 086

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:search-clear-query`
- `npm run test:mobile-api`
Result: Passed. Smoke launch readiness now tolerates cold Metro/Expo generic error screens with additional attempts and URL restart recovery.
Screenshots:
- `docs/mobile/screenshots/cycle-086-holiwyn-smoke-launch-hardening.png`
- `docs/mobile/screenshots/cycle-086-holiwyn-search-clear-query-before.png`
- `docs/mobile/screenshots/cycle-086-holiwyn-search-clear-query-after.png`
Harness evidence:
- `docs/mobile/harness/cycle-086-holiwyn-smoke-launch-hardening-home.xml`
- `docs/mobile/harness/cycle-086-holiwyn-search-clear-query-ready.xml`
- `docs/mobile/harness/cycle-086-holiwyn-search-clear-query-after.xml`
Bugs:
- None found.
Visual QA:
- Search clear-query flow still returns to Top results after harness hardening.

### Cycle 087

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:future-card-stats`
- `npm run test:mobile-api`
Result: Passed. Home Futures cards now show localized Volume and Liquidity context.
Screenshots:
- `docs/mobile/screenshots/cycle-087-holiwyn-future-card-stats-smoke.png`
- `docs/mobile/screenshots/cycle-087-holiwyn-future-card-stats.png`
Harness evidence:
- `docs/mobile/harness/cycle-087-holiwyn-future-card-stats-home.xml`
- `docs/mobile/harness/cycle-087-holiwyn-future-card-stats.xml`
Bugs:
- None found.
Visual QA:
- World Cup winner futures card shows Volume/Liquidity without crowding the first outcome row or bottom navigation.

### Cycle 088

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:future-list-trade`
- `npm run test:mobile-api`
Result: Passed. Futures list outcomes now have focused emulator proof that they open the buy ticket.
Screenshots:
- `docs/mobile/screenshots/cycle-088-holiwyn-future-list-trade-smoke.png`
- `docs/mobile/screenshots/cycle-088-holiwyn-future-list-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-088-holiwyn-future-list-trade-home.xml`
- `docs/mobile/harness/cycle-088-holiwyn-future-list-trade-list.xml`
- `docs/mobile/harness/cycle-088-holiwyn-future-list-ticket.xml`
Bugs:
- None found.
Visual QA:
- France / World Cup winner ticket shows Buy, fake balance, estimated shares, average price, payout, and Place buy order.

### Cycle 089

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:future-list-order`
- `npm run test:mobile-api`
Result: Passed. A Futures list ticket can now place a mock order and create a Portfolio position.
Screenshots:
- `docs/mobile/screenshots/cycle-089-holiwyn-future-list-order-smoke.png`
- `docs/mobile/screenshots/cycle-089-holiwyn-future-list-order-portfolio.png`
Harness evidence:
- `docs/mobile/harness/cycle-089-holiwyn-future-list-order-home.xml`
- `docs/mobile/harness/cycle-089-holiwyn-future-list-order-list.xml`
- `docs/mobile/harness/cycle-089-holiwyn-future-list-order-ticket.xml`
- `docs/mobile/harness/cycle-089-holiwyn-future-list-order-portfolio.xml`
Bugs:
- None found.
Visual QA:
- Portfolio shows 9,900 USDT balance, World Cup winner / France position, P/L details, close action, and mock order confirmation.

### Cycle 090

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:future-list-sell`
- `npm run test:mobile-api`
Result: Passed. Futures list ticket can switch to Sell and show sell-side proceeds/CTA copy.
Screenshots:
- `docs/mobile/screenshots/cycle-090-holiwyn-future-list-sell-smoke.png`
- `docs/mobile/screenshots/cycle-090-holiwyn-future-list-sell-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-090-holiwyn-future-list-sell-home.xml`
- `docs/mobile/harness/cycle-090-holiwyn-future-list-sell-list.xml`
- `docs/mobile/harness/cycle-090-holiwyn-future-list-sell-ticket.xml`
- `docs/mobile/harness/cycle-090-holiwyn-future-list-sell-active.xml`
Bugs:
- None found.
Visual QA:
- France / World Cup winner ticket shows Sell selected, Estimated proceeds, estimate rows, and Place sell order.

### Cycle 091

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:future-list-close`
- `npm run test:mobile-api`
Result: Passed. Futures list mock order positions can be closed and recorded in recent activity.
Screenshots:
- `docs/mobile/screenshots/cycle-091-holiwyn-future-list-close-smoke.png`
- `docs/mobile/screenshots/cycle-091-holiwyn-future-list-close-closed.png`
Harness evidence:
- `docs/mobile/harness/cycle-091-holiwyn-future-list-close-home.xml`
- `docs/mobile/harness/cycle-091-holiwyn-future-list-close-list.xml`
- `docs/mobile/harness/cycle-091-holiwyn-future-list-close-ticket.xml`
- `docs/mobile/harness/cycle-091-holiwyn-future-list-close-portfolio.xml`
- `docs/mobile/harness/cycle-091-holiwyn-future-list-close-closed.xml`
Bugs:
- None found.
Visual QA:
- Closed state shows 10,008.82 USDT balance, no open positions, recent Closed activity, and previous mock order confirmation.

### Cycle 092

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:portfolio-position-count`
- `npm run test:mobile-api`
Result: Passed. Portfolio now shows a localized Open positions count that reflects current position state.
Screenshots:
- `docs/mobile/screenshots/cycle-092-holiwyn-portfolio-position-count-smoke.png`
- `docs/mobile/screenshots/cycle-092-holiwyn-portfolio-position-count-open.png`
Harness evidence:
- `docs/mobile/harness/cycle-092-holiwyn-portfolio-position-count-home-start.xml`
- `docs/mobile/harness/cycle-092-holiwyn-portfolio-position-count-empty.xml`
- `docs/mobile/harness/cycle-092-holiwyn-portfolio-position-count-home.xml`
- `docs/mobile/harness/cycle-092-holiwyn-portfolio-position-count-list.xml`
- `docs/mobile/harness/cycle-092-holiwyn-portfolio-position-count-ticket.xml`
- `docs/mobile/harness/cycle-092-holiwyn-portfolio-position-count-open.xml`
Bugs:
- None found.
Visual QA:
- Open positions count is visible above the summary grid and shows `1` after a Futures mock order.

### Cycle 093

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:portfolio-activity-count`
- `npm run test:mobile-api`
Result: Passed. Portfolio now shows a localized Recent activity count that reflects order activity state.
Screenshots:
- `docs/mobile/screenshots/cycle-093-holiwyn-portfolio-activity-count-smoke.png`
- `docs/mobile/screenshots/cycle-093-holiwyn-portfolio-activity-count-open.png`
Harness evidence:
- `docs/mobile/harness/cycle-093-holiwyn-portfolio-activity-count-home-start.xml`
- `docs/mobile/harness/cycle-093-holiwyn-portfolio-activity-count-empty.xml`
- `docs/mobile/harness/cycle-093-holiwyn-portfolio-activity-count-home.xml`
- `docs/mobile/harness/cycle-093-holiwyn-portfolio-activity-count-list.xml`
- `docs/mobile/harness/cycle-093-holiwyn-portfolio-activity-count-ticket.xml`
- `docs/mobile/harness/cycle-093-holiwyn-portfolio-activity-count-open.xml`
Bugs:
- None found. The first harness assertion reached for below-fold confirmation text, then recovered by asserting the visible Portfolio count/activity proof.
Visual QA:
- Recent activity count is visible above the summary grid and shows `1` after a Futures mock order.

### Cycle 094

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:portfolio-closed-count`
- `npm run test:mobile-api`
Result: Passed. Portfolio now shows a localized Closed trades count that reflects closed-position activity.
Screenshots:
- `docs/mobile/screenshots/cycle-094-holiwyn-portfolio-closed-count-smoke.png`
- `docs/mobile/screenshots/cycle-094-holiwyn-portfolio-closed-count-closed.png`
Harness evidence:
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-home-start.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-empty.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-home.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-list.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-ticket.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-open.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-ready.xml`
- `docs/mobile/harness/cycle-094-holiwyn-portfolio-closed-count-closed.xml`
Bugs:
- None found. The first harness pass needed recovery because the new count card pushed the Close position button lower; the harness now scrolls to visible close proof before tapping.
Visual QA:
- Closed state shows Recent activity `2`, Closed trades `1`, no open positions, latest order confirmation, and a visible Closed row.

### Cycle 095

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:portfolio-closed-count`
- `npm run test:mobile-api`
Result: Passed. Portfolio count cards are now a compact three-tile grid while preserving closed-flow behavior.
Screenshots:
- `docs/mobile/screenshots/cycle-095-holiwyn-portfolio-count-grid-smoke.png`
- `docs/mobile/screenshots/cycle-095-holiwyn-portfolio-count-grid-closed.png`
Harness evidence:
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-home-start.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-empty.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-home.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-list.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-ticket.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-open.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-ready.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-activity.xml`
- `docs/mobile/harness/cycle-095-holiwyn-portfolio-count-grid-closed.xml`
Bugs:
- None found. Harness now captures activity proof and top-of-Portfolio count-grid proof separately after close.
Visual QA:
- Compact grid shows Open positions `0`, Recent activity `2`, and Closed trades `1` in one row without overlap.

### Cycle 096

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:saved-persistence`
- `npm run test:mobile-api`
Result: Passed. Saved market ids now persist locally and restore after app restart.
Screenshots:
- `docs/mobile/screenshots/cycle-096-holiwyn-saved-persistence-smoke.png`
- `docs/mobile/screenshots/cycle-096-holiwyn-saved-persistence-seeded.png`
- `docs/mobile/screenshots/cycle-096-holiwyn-saved-persistence-restored.png`
Harness evidence:
- `docs/mobile/harness/cycle-096-holiwyn-saved-persistence-home-start.xml`
- `docs/mobile/harness/cycle-096-holiwyn-saved-persistence-seeded.xml`
- `docs/mobile/harness/cycle-096-holiwyn-saved-persistence-search.xml`
- `docs/mobile/harness/cycle-096-holiwyn-saved-persistence-restored.xml`
Bugs:
- None found in product code. Harness recovered from an off-screen Home save tap, shell `&` URL splitting, and unreliable star-glyph XML assertions by using a deterministic storage seed plus visual screenshot proof.
Visual QA:
- Restored Search screen shows Mexico vs. Ecuador with a filled saved star after app restart.

### Cycle 097

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-persistence`
- `npm run test:mobile-api`
Result: Passed. Mock account sign-in now persists locally and restores after app restart.
Screenshots:
- `docs/mobile/screenshots/cycle-097-holiwyn-account-persistence-smoke.png`
- `docs/mobile/screenshots/cycle-097-holiwyn-account-persistence-seeded.png`
- `docs/mobile/screenshots/cycle-097-holiwyn-account-persistence-signed-in.png`
- `docs/mobile/screenshots/cycle-097-holiwyn-account-persistence-restored.png`
Harness evidence:
- `docs/mobile/harness/cycle-097-holiwyn-account-persistence-home-start.xml`
- `docs/mobile/harness/cycle-097-holiwyn-account-persistence-seeded.xml`
- `docs/mobile/harness/cycle-097-holiwyn-account-persistence-signed-in.xml`
- `docs/mobile/harness/cycle-097-holiwyn-account-persistence-restored.xml`
Bugs:
- Fixed an account hydration race where an empty storage read could overwrite a fresh sign-in.
Visual QA:
- Restored Account screen shows Signed in, Holiwyn Demo, Demo balance, and Sign out after app restart.

### Cycle 098

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:language-persistence`
- `npm run test:mobile-api`
Result: Passed. Language preference now persists locally and restores after app restart.
Screenshots:
- `docs/mobile/screenshots/cycle-098-holiwyn-language-persistence-smoke.png`
- `docs/mobile/screenshots/cycle-098-holiwyn-language-persistence-seeded.png`
- `docs/mobile/screenshots/cycle-098-holiwyn-language-persistence-restored.png`
Harness evidence:
- `docs/mobile/harness/cycle-098-holiwyn-language-persistence-home-start.xml`
- `docs/mobile/harness/cycle-098-holiwyn-language-persistence-seeded.xml`
- `docs/mobile/harness/cycle-098-holiwyn-language-persistence-restored.xml`
Bugs:
- None found in product code. Harness recovered from PowerShell Unicode parsing by using ASCII-safe assertions plus visual screenshot proof.
Visual QA:
- Restored Home shows Chinese copy after restart, including the `EN` language toggle, Chinese navigation labels, Chinese market title copy, and Chinese filter labels.

### Cycle 099

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:portfolio-persistence`
- `npm run test:mobile-api`
Result: Passed. Mock Portfolio state now persists locally and restores after app restart.
Screenshots:
- `docs/mobile/screenshots/cycle-099-holiwyn-portfolio-persistence-ticket.png`
- `docs/mobile/screenshots/cycle-099-holiwyn-portfolio-persistence-open.png`
- `docs/mobile/screenshots/cycle-099-holiwyn-portfolio-persistence-restored.png`
Harness evidence:
- `docs/mobile/harness/cycle-099-holiwyn-portfolio-persistence-home-start.xml`
- `docs/mobile/harness/cycle-099-holiwyn-portfolio-persistence-ticket.xml`
- `docs/mobile/harness/cycle-099-holiwyn-portfolio-persistence-open.xml`
- `docs/mobile/harness/cycle-099-holiwyn-portfolio-persistence-restored.xml`
Bugs:
- None found in product code. Harness recovered from a cleared-start tap interception by opening the focused ticket through a harness-only deep link while still placing the order through the real ticket CTA.
Visual QA:
- Restored Portfolio shows 9,900 USDT balance, Open positions `1`, Recent activity `1`, Closed trades `0`, and the World Cup winner / France position after restart.

### Cycle 100

Date: 2026-07-01
Device: Backend readiness harness and Android mobile checks
Build/run command:
- `npm run mobile:backend-readiness`
- `npm run typecheck` in `mobile/`
- `npm run test:mobile-api`
Result: Passed as a readiness audit. Docker CLI, compose file, and local DATABASE_URL alignment are present; Docker daemon and local Postgres TCP readiness are still unavailable, so live backend proof remains gated.
Harness evidence:
- `docs/mobile/harness/cycle-100-mobile-backend-readiness.txt`
Bugs:
- None found in product code. Backend environment still needs Docker Desktop/local Postgres before server-mode emulator smoke can become live-backend proof.
Visual QA:
- Not applicable; this was an environment/backend readiness retry cycle.

### Cycle 101

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:ticket-defaults-persistence`
- `npm run test:mobile-api`
Result: Passed. Ticket amount and buy/sell side now persist locally and restore after app restart.
Screenshots:
- `docs/mobile/screenshots/cycle-101-holiwyn-ticket-defaults-smoke.png`
- `docs/mobile/screenshots/cycle-101-holiwyn-ticket-defaults-seeded.png`
- `docs/mobile/screenshots/cycle-101-holiwyn-ticket-defaults-restored.png`
Harness evidence:
- `docs/mobile/harness/cycle-101-holiwyn-ticket-defaults-home-start.xml`
- `docs/mobile/harness/cycle-101-holiwyn-ticket-defaults-seeded.xml`
- `docs/mobile/harness/cycle-101-holiwyn-ticket-defaults-restored.xml`
Bugs:
- None found in product code. Harness recovered from a brittle two-parameter deep link by using one focused harness flag that both seeds defaults and opens the reference ticket.
Visual QA:
- Restored ticket shows France / World Cup winner, Sell selected, amount `500`, Estimated proceeds, and `Place sell order`.

### Cycle 102

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-preferences`
- `npm run test:mobile-api`
Result: Passed. Account now shows the saved ticket default preference in the first viewport.
Screenshots:
- `docs/mobile/screenshots/cycle-102-holiwyn-account-preferences-smoke.png`
- `docs/mobile/screenshots/cycle-102-holiwyn-account-preferences.png`
Harness evidence:
- `docs/mobile/harness/cycle-102-holiwyn-account-preferences-home-start.xml`
- `docs/mobile/harness/cycle-102-holiwyn-account-preferences.xml`
Bugs:
- None found in product code. Harness first tried to assert a below-fold row, then the layout was improved so preferences appear before login methods and the focused smoke verifies visible preference proof.
Visual QA:
- Account shows Preferences in the first viewport, including `Ticket default: Sell 500 USDT`.

### Cycle 103

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-language-summary`
- `npm run test:mobile-api`
Result: Passed. Account now shows the current language value in Preferences.
Screenshots:
- `docs/mobile/screenshots/cycle-103-holiwyn-account-language-summary-smoke.png`
- `docs/mobile/screenshots/cycle-103-holiwyn-account-language-summary.png`
Harness evidence:
- `docs/mobile/harness/cycle-103-holiwyn-account-language-summary-home-start.xml`
- `docs/mobile/harness/cycle-103-holiwyn-account-language-summary.xml`
Bugs:
- None found.
Visual QA:
- Account Preferences shows `Language: English` and `Ticket default: Sell 500 USDT` in the first viewport.

### Cycle 104

Date: 2026-07-01
Device: Mobile API/typecheck harness
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run test:mobile-api`
Result: Passed. Mobile now has a typed profile-preferences API seam and local/server mapper for eventual authenticated preference sync.
Screenshots:
- None; this was a backend adapter seam with no intended UI change.
Harness evidence:
- `npm run test:mobile-api` passed with 4 tests, including authenticated `PUT /api/profile/preferences` request shape.
Bugs:
- None found.
Visual QA:
- Not applicable; no UI changed in this cycle.

### Cycle 105

Date: 2026-07-01
Device: Mobile API/typecheck harness
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run test:mobile-api`
Result: Passed. Runtime profile preference sync is now wired behind server-mode and API-key guards, while mock mode remains local-only.
Screenshots:
- None; this was a guarded runtime/backend seam with no intended UI change.
Harness evidence:
- `npm run test:mobile-api` passed with 6 tests across API request shape and profile-preference mapper coverage.
Bugs:
- None found.
Visual QA:
- Not applicable; no UI changed in this cycle.

### Cycle 106

Date: 2026-07-01
Device: Backend readiness harness and Android mobile checks
Build/run command:
- `npm run mobile:backend-readiness`
- `npm run typecheck` in `mobile/`
- `npm run test:mobile-api`
Result: Passed as a readiness audit. Docker CLI, compose file, and DATABASE_URL alignment are still present; Docker daemon and local Postgres TCP readiness are still unavailable.
Harness evidence:
- `docs/mobile/harness/cycle-106-mobile-backend-readiness.txt`
Bugs:
- None found in product code. Live backend/profile proof remains gated by Docker Desktop/local Postgres availability.
Visual QA:
- Not applicable; this was an environment/backend readiness retry cycle.

### Cycle 107

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-profile-sync-error`
- `npm run test:mobile-api`
Result: Passed. Account now shows profile preference sync status for server-mode/API-key builds, including the unavailable-backend fallback state.
Screenshots:
- `docs/mobile/screenshots/cycle-107-holiwyn-account-profile-sync-error-smoke.png`
- `docs/mobile/screenshots/cycle-107-holiwyn-account-profile-sync-error.png`
Harness evidence:
- `docs/mobile/harness/cycle-107-holiwyn-account-profile-sync-error-home-start.xml`
- `docs/mobile/harness/cycle-107-holiwyn-account-profile-sync-error.xml`
Bugs:
- Initial visual review showed the fallback sentence too close to the bottom tab. The row was moved higher in Preferences and the focused smoke was rerun successfully.
Visual QA:
- Account Preferences shows `Profile sync unavailable` and `Using local preferences on this device.` clearly above the language and ticket defaults rows.

### Cycle 108

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-saved-summary`
- `npm run test:mobile-api`
Result: Passed. Account Preferences now summarizes the user's saved World Cup markets count.
Screenshots:
- `docs/mobile/screenshots/cycle-108-holiwyn-account-saved-summary-smoke.png`
- `docs/mobile/screenshots/cycle-108-holiwyn-account-saved-summary.png`
Harness evidence:
- `docs/mobile/harness/cycle-108-holiwyn-account-saved-summary-home-start.xml`
- `docs/mobile/harness/cycle-108-holiwyn-account-saved-summary.xml`
Bugs:
- None found.
Visual QA:
- Account Preferences shows `Saved markets: 1 saved` between Language and Ticket default after the harness seeds Mexico vs. Ecuador as saved.

### Cycle 109

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-position-summary`
- `npm run test:mobile-api`
Result: Passed. Account Preferences now summarizes open World Cup positions count.
Screenshots:
- `docs/mobile/screenshots/cycle-109-holiwyn-account-position-summary-smoke.png`
- `docs/mobile/screenshots/cycle-109-holiwyn-account-position-summary.png`
Harness evidence:
- `docs/mobile/harness/cycle-109-holiwyn-account-position-summary-home-start.xml`
- `docs/mobile/harness/cycle-109-holiwyn-account-position-summary.xml`
Bugs:
- None found.
Visual QA:
- Account Preferences shows `Open positions: 1` after the harness seeds a mock World Cup winner position.

### Cycle 110

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:account-portfolio-value`
- `npm run test:mobile-api`
Result: Passed. Account Preferences now shows estimated portfolio value from fake balance plus current open-position value.
Screenshots:
- `docs/mobile/screenshots/cycle-110-holiwyn-account-portfolio-value-smoke.png`
- `docs/mobile/screenshots/cycle-110-holiwyn-account-portfolio-value.png`
Harness evidence:
- `docs/mobile/harness/cycle-110-holiwyn-account-portfolio-value-home-start.xml`
- `docs/mobile/harness/cycle-110-holiwyn-account-portfolio-value.xml`
Bugs:
- Initial visual evidence did not show the new value row. The row was moved above Open positions and the focused smoke was rerun successfully.
Visual QA:
- Account Preferences shows `Portfolio value: 10,281.25 USDT` in the first viewport after the harness seeds a mock World Cup winner position.

### Cycle 111

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:event-detail-summary`
- `npm run test:mobile-api`
Result: Passed. Event Detail now shows market and outcome counts in the hero.
Screenshots:
- `docs/mobile/screenshots/cycle-111-holiwyn-event-detail-summary-smoke.png`
- `docs/mobile/screenshots/cycle-111-holiwyn-event-detail-summary.png`
Harness evidence:
- `docs/mobile/harness/cycle-111-holiwyn-event-detail-summary-home-start.xml`
- `docs/mobile/harness/cycle-111-holiwyn-event-detail-summary.xml`
Bugs:
- The first smoke attempt tried to tap a below-fold event card and failed to open Event Detail. The harness was hardened with a direct Mexico vs. Ecuador detail route and rerun successfully.
Visual QA:
- Mexico vs. Ecuador detail shows `4 markets` and `8 outcomes` in the first hero card while keeping the first Match winner market visible below.

### Cycle 112

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:event-detail-market-outcome-count`
- `npm run test:mobile-api`
Result: Passed. Event Detail market cards now show their own outcome count.
Screenshots:
- `docs/mobile/screenshots/cycle-112-holiwyn-event-detail-market-outcome-count-smoke.png`
- `docs/mobile/screenshots/cycle-112-holiwyn-event-detail-market-outcome-count.png`
Harness evidence:
- `docs/mobile/harness/cycle-112-holiwyn-event-detail-market-outcome-count-home-start.xml`
- `docs/mobile/harness/cycle-112-holiwyn-event-detail-market-outcome-count.xml`
Bugs:
- First run failed because ADB reset and the emulator went offline. The emulator was restarted, boot readiness was confirmed, and the same smoke passed on rerun.
Visual QA:
- Match winner card shows `2 outcomes` next to the market title while preserving Best bid, Best ask, Spread, and outcome action buttons.

### Cycle 113

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm run typecheck` in `mobile/`
- `npm run smoke:live-summary`
- `npm run test:mobile-api`
Result: Passed. Live screen now summarizes live market and outcome breadth.
Screenshots:
- `docs/mobile/screenshots/cycle-113-holiwyn-live-summary-smoke.png`
- `docs/mobile/screenshots/cycle-113-holiwyn-live-summary.png`
Harness evidence:
- `docs/mobile/harness/cycle-113-holiwyn-live-summary-home-start.xml`
- `docs/mobile/harness/cycle-113-holiwyn-live-summary.xml`
Bugs:
- First smoke run asserted a hidden market title. The harness was tightened to verify visible live-card text and rerun successfully.
Visual QA:
- Live screen shows `2 markets` and `6 outcomes` above the France vs. Argentina live trading card.

### Cycle 114

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm.cmd run typecheck` in `mobile/`
- `npm.cmd run smoke:live-ticket`
- `npm.cmd run test:mobile-api`
Result: Passed. Live screen outcome buttons now have focused proof that they open the trade ticket.
Screenshots:
- `docs/mobile/screenshots/cycle-114-holiwyn-live-ticket-smoke.png`
- `docs/mobile/screenshots/cycle-114-holiwyn-live-ticket-ready.png`
- `docs/mobile/screenshots/cycle-114-holiwyn-live-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-114-holiwyn-live-ticket-home-start.xml`
- `docs/mobile/harness/cycle-114-holiwyn-live-ticket-ready.xml`
- `docs/mobile/harness/cycle-114-holiwyn-live-ticket.xml`
Bugs:
- ADB initially reported the emulator offline, then recovered during the same smoke run. The focused smoke completed successfully.
Visual QA:
- Live France outcome opens a buy ticket showing `France`, `France vs. Argentina`, fake balance, estimates, and `Place buy order`.

### Cycle 115

Date: 2026-07-01
Device: Android emulator `emulator-5554`
Build/run command:
- `npm.cmd run typecheck` in `mobile/`
- `npm.cmd run smoke:live-ticket`
- `npm.cmd run test:mobile-api`
Result: Passed. Trade tickets opened from live events now show an in-play badge.
Screenshots:
- `docs/mobile/screenshots/cycle-115-holiwyn-live-ticket-badge-smoke.png`
- `docs/mobile/screenshots/cycle-115-holiwyn-live-ticket-badge-ready.png`
- `docs/mobile/screenshots/cycle-115-holiwyn-live-ticket-badge.png`
Harness evidence:
- `docs/mobile/harness/cycle-115-holiwyn-live-ticket-badge-home-start.xml`
- `docs/mobile/harness/cycle-115-holiwyn-live-ticket-badge-ready.xml`
- `docs/mobile/harness/cycle-115-holiwyn-live-ticket-badge.xml`
Bugs:
- ADB initially reported the emulator offline, then recovered during the same focused smoke run.
Visual QA:
- Live France ticket shows a `LIVE WORLD CUP` badge above the Buy/Sell controls.

### Cycle 116

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/`
- `npm.cmd run smoke:live-order`
- `npm.cmd run test:mobile-api`
Result: Passed. Expo Go can support the current Holiwyn development loop, including live market opening, live ticket creation, fake-token order placement, and Portfolio proof.
Screenshots:
- `docs/mobile/screenshots/cycle-116-holiwyn-live-order-smoke.png`
- `docs/mobile/screenshots/cycle-116-holiwyn-live-order-ticket-ready.png`
- `docs/mobile/screenshots/cycle-116-holiwyn-live-order-ticket.png`
- `docs/mobile/screenshots/cycle-116-holiwyn-live-order-portfolio.png`
Harness evidence:
- `docs/mobile/harness/cycle-116-holiwyn-expo-menu-recovered.xml`
- `docs/mobile/harness/cycle-116-holiwyn-live-order-home.xml`
- `docs/mobile/harness/cycle-116-holiwyn-live-order-ticket-ready.xml`
- `docs/mobile/harness/cycle-116-holiwyn-live-order-ticket.xml`
- `docs/mobile/harness/cycle-116-holiwyn-live-order-portfolio.xml`
Bugs:
- Expo Go can show its developer menu after a clean data reset or after a live outcome tap. The smoke harness now dismisses both first-run and regular Expo developer sheets, relaunches the Live deep link when needed, and retries the ticket tap before failing.
- Initial Portfolio assertion expected a transient `Order placed` message, but the durable proof is the reduced fake balance plus the open France vs. Argentina position row. The assertion now checks the durable Portfolio state.
Visual QA:
- Portfolio shows `9,900 USDT`, `Open positions` count `1`, `Recent activity` count `1`, and a `France vs. Argentina` position with `MOCK - Buy - France - 41%`.

### Cycle 117

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/`
- `npm.cmd run smoke:live-order-close`
- `npm.cmd run test:mobile-api`
Result: Passed. Live World Cup order placement now has focused close-position lifecycle proof on Android emulator.
Screenshots:
- `docs/mobile/screenshots/cycle-117-holiwyn-live-order-close-smoke.png`
- `docs/mobile/screenshots/cycle-117-holiwyn-live-order-close-ticket-ready.png`
- `docs/mobile/screenshots/cycle-117-holiwyn-live-order-close-ticket.png`
- `docs/mobile/screenshots/cycle-117-holiwyn-live-order-close-portfolio.png`
- `docs/mobile/screenshots/cycle-117-holiwyn-live-order-close-closed.png`
Harness evidence:
- `docs/mobile/harness/cycle-117-holiwyn-expo-menu-recovered.xml`
- `docs/mobile/harness/cycle-117-holiwyn-live-order-close-home.xml`
- `docs/mobile/harness/cycle-117-holiwyn-live-order-close-ticket-ready.xml`
- `docs/mobile/harness/cycle-117-holiwyn-live-order-close-ticket.xml`
- `docs/mobile/harness/cycle-117-holiwyn-live-order-close-portfolio.xml`
- `docs/mobile/harness/cycle-117-holiwyn-live-order-close-closed.xml`
Bugs:
- Expo Go can leave a transparent touch layer after development-menu interruption. The live-ticket retry now clears the layer, relaunches the Live deep link, and retries instead of repeatedly tapping a swallowed target.
Visual QA:
- Closed-state Portfolio shows `10,007.32 USDT`, Open positions `0`, Recent activity `2`, Closed trades `1`, and the closed live France activity below the first viewport.

### Cycle 118

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/`
- `npm.cmd run smoke:live-portfolio-badge`
- `npm.cmd run test:mobile-api`
Result: Passed. Live-origin trades now carry live metadata into Portfolio and show a visible Live World Cup badge on the open position.
Screenshots:
- `docs/mobile/screenshots/cycle-118-holiwyn-live-portfolio-badge-smoke.png`
- `docs/mobile/screenshots/cycle-118-holiwyn-live-portfolio-badge-ticket-ready.png`
- `docs/mobile/screenshots/cycle-118-holiwyn-live-portfolio-badge-ticket.png`
- `docs/mobile/screenshots/cycle-118-holiwyn-live-portfolio-badge-portfolio.png`
Harness evidence:
- `docs/mobile/harness/cycle-118-holiwyn-expo-menu-recovered.xml`
- `docs/mobile/harness/cycle-118-holiwyn-live-portfolio-badge-home.xml`
- `docs/mobile/harness/cycle-118-holiwyn-live-portfolio-badge-ticket-ready.xml`
- `docs/mobile/harness/cycle-118-holiwyn-live-portfolio-badge-ticket.xml`
- `docs/mobile/harness/cycle-118-holiwyn-live-portfolio-badge-portfolio.xml`
Bugs:
- First badge smoke attempt asserted the latest-order badge, which sits below the visible Android hierarchy after the position card. The focused proof was tightened to the visible open-position badge.
- Expo Go blank startup sometimes exceeded the default live-order wait. Heavy live-order smokes now use a longer first-screen wait.
Visual QA:
- Portfolio position card shows a red `LIVE WORLD CUP` badge above `France vs. Argentina` while preserving fake balance, counts, current value, and P/L.

### Cycle 119

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:live-portfolio-badge-deep`
- `npm.cmd run test:mobile-api`
Result: Passed. Live-origin Portfolio metadata now has deep-scroll proof for the latest-order confirmation card and Recent activity row.
Screenshots:
- `docs/mobile/screenshots/cycle-119-holiwyn-live-portfolio-badge-deep-smoke.png`
- `docs/mobile/screenshots/cycle-119-holiwyn-live-portfolio-badge-deep-ticket-ready.png`
- `docs/mobile/screenshots/cycle-119-holiwyn-live-portfolio-badge-deep-ticket.png`
- `docs/mobile/screenshots/cycle-119-holiwyn-live-portfolio-badge-deep-portfolio.png`
- `docs/mobile/screenshots/cycle-119-holiwyn-live-portfolio-badge-deep-latest-order.png`
- `docs/mobile/screenshots/cycle-119-holiwyn-live-portfolio-badge-deep-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-119-holiwyn-expo-menu-recovered.xml`
- `docs/mobile/harness/cycle-119-holiwyn-live-portfolio-badge-deep-home.xml`
- `docs/mobile/harness/cycle-119-holiwyn-live-portfolio-badge-deep-ticket-ready.xml`
- `docs/mobile/harness/cycle-119-holiwyn-live-portfolio-badge-deep-ticket.xml`
- `docs/mobile/harness/cycle-119-holiwyn-live-portfolio-badge-deep-portfolio.xml`
- `docs/mobile/harness/cycle-119-holiwyn-live-portfolio-badge-deep-latest-order.xml`
- `docs/mobile/harness/cycle-119-holiwyn-live-portfolio-badge-deep-activity.xml`
Bugs:
- Backend health was unavailable during the focused smoke, so the app used its documented mock fallback. This is acceptable for this mock-mode Portfolio proof.
- The latest-order card and Recent activity row require deeper scrolling than the Cycle 118 first-viewport proof. The new smoke uses staged scroll captures and assertions.
Visual QA:
- The latest-order card shows `LIVE WORLD CUP`, `Mock order placed`, `100 USDT`, `MOCK - Buy - France`, and `France vs. Argentina`.
- The Recent activity row shows `Bought`, `LIVE WORLD CUP`, `100 USDT`, and `France vs. Argentina - France`.

### Cycle 120

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:live-ticket`
- `npm.cmd run test:mobile-api`
Result: Passed. Live trade tickets now show the in-play clock under the Live World Cup badge.
Screenshots:
- `docs/mobile/screenshots/cycle-120-holiwyn-live-ticket-clock-smoke.png`
- `docs/mobile/screenshots/cycle-120-holiwyn-live-ticket-clock-ready.png`
- `docs/mobile/screenshots/cycle-120-holiwyn-live-ticket-clock-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-120-holiwyn-expo-menu-recovered.xml`
- `docs/mobile/harness/cycle-120-holiwyn-live-ticket-clock-ready.xml`
- `docs/mobile/harness/cycle-120-holiwyn-live-ticket-clock-ticket.xml`
Bugs:
- First run exposed stale Expo Go Portfolio state in live-ticket-only smoke, with fake balance already reduced from a prior order. The harness now clears Expo Go for `LiveTicket` runs, not just live order runs.
- Expo Go hierarchy was slow immediately after the clear/reload and recovered through existing retries.
Visual QA:
- Ticket modal shows `France`, `France vs. Argentina`, `LIVE WORLD CUP`, `Live - 63'`, clean `10,000 USDT` fake balance, estimates, and `Place buy order`.

### Cycle 121

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:live-portfolio-badge-deep`
- `npm.cmd run test:mobile-api`
Result: Passed. Live clock context now survives order placement and appears in Portfolio position, latest-order, and Recent activity evidence.
Screenshots:
- `docs/mobile/screenshots/cycle-121-holiwyn-live-portfolio-clock-smoke.png`
- `docs/mobile/screenshots/cycle-121-holiwyn-live-portfolio-clock-ticket-ready.png`
- `docs/mobile/screenshots/cycle-121-holiwyn-live-portfolio-clock-ticket.png`
- `docs/mobile/screenshots/cycle-121-holiwyn-live-portfolio-clock-portfolio.png`
- `docs/mobile/screenshots/cycle-121-holiwyn-live-portfolio-clock-latest-order.png`
- `docs/mobile/screenshots/cycle-121-holiwyn-live-portfolio-clock-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-121-holiwyn-expo-menu-recovered.xml`
- `docs/mobile/harness/cycle-121-holiwyn-live-portfolio-clock-home.xml`
- `docs/mobile/harness/cycle-121-holiwyn-live-portfolio-clock-ticket-ready.xml`
- `docs/mobile/harness/cycle-121-holiwyn-live-portfolio-clock-ticket.xml`
- `docs/mobile/harness/cycle-121-holiwyn-live-portfolio-clock-portfolio.xml`
- `docs/mobile/harness/cycle-121-holiwyn-live-portfolio-clock-latest-order.xml`
- `docs/mobile/harness/cycle-121-holiwyn-live-portfolio-clock-activity.xml`
Bugs:
- First run showed the activity clock below the second-scroll viewport even though position and latest-order clocks were present. The proof now scrolls one extra step before asserting activity clock evidence.
- Expo Go clean reload again spent multiple retries returning blank UI hierarchy before recovering.
Visual QA:
- Portfolio position, latest-order card, and Recent activity row all show live context with `LIVE WORLD CUP` and `Live - 63'`.

### Cycle 122

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:live-ticket`
- `npm.cmd run test:mobile-api`
Result: Passed. Live-ticket smoke now uses app-level reset state instead of clearing the Expo Go package for live flows.
Screenshots:
- `docs/mobile/screenshots/cycle-122-holiwyn-fast-live-reset-smoke.png`
- `docs/mobile/screenshots/cycle-122-holiwyn-fast-live-reset-ready.png`
- `docs/mobile/screenshots/cycle-122-holiwyn-fast-live-reset-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-122-holiwyn-fast-live-reset-expo-menu.xml`
- `docs/mobile/harness/cycle-122-holiwyn-fast-live-reset-home.xml`
- `docs/mobile/harness/cycle-122-holiwyn-fast-live-reset-ready.xml`
- `docs/mobile/harness/cycle-122-holiwyn-fast-live-reset-ticket.xml`
Bugs:
- First fast-reset attempt still showed stale `9,900 USDT` because the reset deep link was only handled as an initial URL and then raced AsyncStorage hydration.
- Fixed by handling warm URL events, using a shell-safe reset flag separator, and reapplying runtime reset shortly after launch.
Visual QA:
- Ticket modal shows `LIVE WORLD CUP`, `Live - 63'`, and clean `10,000 USDT` fake balance without an Expo Go package clear.

### Cycle 123

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:live-portfolio-badge-deep`
- `npm.cmd run test:mobile-api`
Result: Passed. The fast app-level reset path now supports the heavier live order to Portfolio deep-scroll proof.
Screenshots:
- `docs/mobile/screenshots/cycle-123-holiwyn-fast-live-portfolio-reset-smoke.png`
- `docs/mobile/screenshots/cycle-123-holiwyn-fast-live-portfolio-reset-ticket-ready.png`
- `docs/mobile/screenshots/cycle-123-holiwyn-fast-live-portfolio-reset-ticket.png`
- `docs/mobile/screenshots/cycle-123-holiwyn-fast-live-portfolio-reset-portfolio.png`
- `docs/mobile/screenshots/cycle-123-holiwyn-fast-live-portfolio-reset-latest-order.png`
- `docs/mobile/screenshots/cycle-123-holiwyn-fast-live-portfolio-reset-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-expo-menu.xml`
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-home.xml`
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-ticket-ready.xml`
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-ticket.xml`
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-portfolio.xml`
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-latest-order.xml`
- `docs/mobile/harness/cycle-123-holiwyn-fast-live-portfolio-reset-activity.xml`
Bugs:
- Warm reset could leave a stale ticket modal open from the previous smoke. The reset path now also clears ticket, ticket error, selected event, and query state.
Visual QA:
- Deep Portfolio proof shows the live latest-order card and Recent activity row with `LIVE WORLD CUP`, `Live - 63'`, and France vs. Argentina context after a fresh live order.

### Cycle 124

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:live-portfolio-badge-deep`
- `npm.cmd run test:mobile-api`
Result: Passed. The heavy live Portfolio smoke now runs without Metro `--clear` for the proven live reset flows and still verifies live ticket, order, latest-order, and activity evidence.
Screenshots:
- `docs/mobile/screenshots/cycle-124-holiwyn-no-clear-live-portfolio-smoke.png`
- `docs/mobile/screenshots/cycle-124-holiwyn-no-clear-live-portfolio-ticket-ready.png`
- `docs/mobile/screenshots/cycle-124-holiwyn-no-clear-live-portfolio-ticket.png`
- `docs/mobile/screenshots/cycle-124-holiwyn-no-clear-live-portfolio-portfolio.png`
- `docs/mobile/screenshots/cycle-124-holiwyn-no-clear-live-portfolio-latest-order.png`
- `docs/mobile/screenshots/cycle-124-holiwyn-no-clear-live-portfolio-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-expo-menu.xml`
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-home.xml`
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-ticket-ready.xml`
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-ticket.xml`
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-portfolio.xml`
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-latest-order.xml`
- `docs/mobile/harness/cycle-124-holiwyn-no-clear-live-portfolio-activity.xml`
Bugs:
- The first no-clear run exposed a fragile latest-order badge assertion: Android exported the visible badge text but not the container accessibility label. The harness now asserts durable visible live evidence plus the live clock.
- A retry run initially read stale Expo/home hierarchy after relaunch. The harness now waits briefly after each retry deep link before dumping the UI tree.
Visual QA:
- Latest-order and Recent activity screenshots show `LIVE WORLD CUP`, `Live - 63'`, `Mock order placed`, `Bought`, and France vs. Argentina after a live fake-token order.

### Cycle 125

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:event-detail-summary`
- `npm.cmd run test:mobile-api`
Result: Passed. Event Detail now surfaces market counts on group tabs and group headers so World Cup users can scan game-line and prop depth before opening individual outcomes.
Screenshots:
- `docs/mobile/screenshots/cycle-125-holiwyn-event-detail-group-counts-smoke.png`
- `docs/mobile/screenshots/cycle-125-holiwyn-event-detail-group-counts.png`
Harness evidence:
- `docs/mobile/harness/cycle-125-holiwyn-event-detail-group-counts-expo-menu.xml`
- `docs/mobile/harness/cycle-125-holiwyn-event-detail-group-counts-home.xml`
- `docs/mobile/harness/cycle-125-holiwyn-event-detail-group-counts.xml`
Bugs:
- None found after focused verification.
Visual QA:
- Mexico vs. Ecuador Event Detail shows `Game lines` with `1 market`, `Props` with `3 markets`, plus the existing `4 markets`, `8 outcomes`, best bid/ask/spread, and Match winner context.

### Cycle 126

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:event-detail-trade`
- `npm.cmd run test:mobile-api`
Result: Passed. Trade tickets now show implied decimal odds next to cost, shares, average price, and payout so users can scan the payout multiple before placing a fake-token order.
Screenshots:
- `docs/mobile/screenshots/cycle-126-holiwyn-ticket-implied-odds-smoke.png`
- `docs/mobile/screenshots/cycle-126-holiwyn-ticket-implied-odds-event-detail.png`
- `docs/mobile/screenshots/cycle-126-holiwyn-ticket-implied-odds-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-126-holiwyn-ticket-implied-odds-expo-menu.xml`
- `docs/mobile/harness/cycle-126-holiwyn-ticket-implied-odds-home.xml`
- `docs/mobile/harness/cycle-126-holiwyn-ticket-implied-odds-event-detail.xml`
- `docs/mobile/harness/cycle-126-holiwyn-ticket-implied-odds-ticket.xml`
Bugs:
- The first focused smoke inherited stale fake-token balance; the harness now clears Expo Go data for `EventDetailTrade`.
- A later run captured the Expo developer menu over the app; the event-detail trade path now dismisses the menu, recaptures detail, and taps the outcome again.
Visual QA:
- Mexico buy ticket shows clean `10,000 USDT` fake balance, `Implied odds`, `1.6x`, estimated payout, and a visible `Place buy order` CTA.

### Cycle 127

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:event-detail-market-outcome-count`
- `npm.cmd run test:mobile-api`
Result: Passed. Event Detail outcome buttons now show decimal odds beneath the probability, giving users the same payout-multiple cue before they open a ticket.
Screenshots:
- `docs/mobile/screenshots/cycle-127-holiwyn-event-detail-outcome-odds-smoke.png`
- `docs/mobile/screenshots/cycle-127-holiwyn-event-detail-outcome-odds.png`
Harness evidence:
- `docs/mobile/harness/cycle-127-holiwyn-event-detail-outcome-odds-expo-menu.xml`
- `docs/mobile/harness/cycle-127-holiwyn-event-detail-outcome-odds-home.xml`
- `docs/mobile/harness/cycle-127-holiwyn-event-detail-outcome-odds.xml`
Bugs:
- First assertion expected the second outcome odds below the viewport; the harness now asserts the visible Mexico outcome odds proof.
Visual QA:
- Mexico outcome button shows `64%` with `1.6x` below it, and the market card still fits with bid/ask/spread and group-count context visible.

### Cycle 128

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:event-detail-trade`
- `npm.cmd run test:mobile-api`
Result: Passed. Trade tickets now show a potential-profit estimate in USDT so users can see upside before placing a fake-token order.
Screenshots:
- `docs/mobile/screenshots/cycle-128-holiwyn-ticket-potential-profit-smoke.png`
- `docs/mobile/screenshots/cycle-128-holiwyn-ticket-potential-profit-event-detail.png`
- `docs/mobile/screenshots/cycle-128-holiwyn-ticket-potential-profit-ticket.png`
Harness evidence:
- `docs/mobile/harness/cycle-128-holiwyn-ticket-potential-profit-expo-menu.xml`
- `docs/mobile/harness/cycle-128-holiwyn-ticket-potential-profit-home.xml`
- `docs/mobile/harness/cycle-128-holiwyn-ticket-potential-profit-event-detail.xml`
- `docs/mobile/harness/cycle-128-holiwyn-ticket-potential-profit-ticket.xml`
Bugs:
- None after focused verification.
Visual QA:
- Mexico buy ticket shows `Potential profit` with `56.25 USDT`; the payout, odds, and primary buy CTA remain visible.

### Cycle 129

Date: 2026-07-01
Device: Documentation-only cycle; no device launch required.
Build/run command:
- Reviewed device/build policy text in mobile docs and README.
Result: Passed. The agreed setup is now codified: Samsung S23 is for Polymarket reference and later explicit Holiwyn real-device QA, the emulator remains the repeatable Holiwyn automation target, and a proper Android development build/APK is the next stability milestone once core flows are ready or Expo Go becomes the main bottleneck.
Screenshots:
- None; documentation policy cycle.
Harness evidence:
- `docs/mobile/MOBILE_APP_AUTONOMOUS_DEVELOPMENT_LOOP.md`
- `docs/mobile/MOBILE_HARNESS_SPEC.md`
- `mobile/README.md`
Bugs:
- None.
Visual QA:
- Not applicable.

### Cycle 130

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:open-order-cancel`
- `npm.cmd run test:mobile-api`
Result: Passed. Portfolio Open orders now appear above the empty-position card, show limit price, implied odds, order value, and remaining amount, and still cancel into Recent activity.
Screenshots:
- `docs/mobile/screenshots/cycle-130-holiwyn-open-order-economics-smoke.png`
- `docs/mobile/screenshots/cycle-130-holiwyn-open-order-economics.png`
- `docs/mobile/screenshots/cycle-130-holiwyn-open-order-economics-canceled.png`
Harness evidence:
- `docs/mobile/harness/cycle-130-holiwyn-open-order-economics-expo-menu.xml`
- `docs/mobile/harness/cycle-130-holiwyn-open-order-economics-home.xml`
- `docs/mobile/harness/cycle-130-holiwyn-open-order-economics.xml`
- `docs/mobile/harness/cycle-130-holiwyn-open-order-economics-canceled.xml`
Bugs:
- Initial metric stack pushed Cancel/metrics too close to the bottom nav; fixed by moving Open orders higher and using a compact metric grid.
- Repeated smoke runs could create duplicate canceled activity warning; fixed by making the open-order harness seed clean portfolio state and making cancel idempotent.
Visual QA:
- Open orders card shows `Limit 47%`, `Implied odds 2.1x`, `Order value 250 USDT`, `Remaining: 250 USDT`, and a visible Cancel button. Canceled state shows one clean Recent activity row.

### Cycle 131

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck` in `mobile/` through the focused smoke script
- `npm.cmd run smoke:future-list-order`
- `npm.cmd run test:mobile-api`
Result: Passed. Latest order confirmation now appears above positions and shows filled shares, execution price, and implied odds after a France World Cup winner order.
Screenshots:
- `docs/mobile/screenshots/cycle-131-holiwyn-latest-order-execution-smoke.png`
- `docs/mobile/screenshots/cycle-131-holiwyn-latest-order-execution-ticket.png`
- `docs/mobile/screenshots/cycle-131-holiwyn-latest-order-execution-portfolio.png`
Harness evidence:
- `docs/mobile/harness/cycle-131-holiwyn-latest-order-execution-expo-menu.xml`
- `docs/mobile/harness/cycle-131-holiwyn-latest-order-execution-home.xml`
- `docs/mobile/harness/cycle-131-holiwyn-latest-order-execution-ticket.xml`
- `docs/mobile/harness/cycle-131-holiwyn-latest-order-execution-portfolio.xml`
Bugs:
- The first proof showed latest order details below the first viewport; fixed by moving the confirmation above positions.
- The old futures tab tap path was flaky under emulator reset; the focused proof now opens the same France World Cup winner ticket through a deterministic harness deep link.
- `forceResetState=1` could clear a forced ticket after launch; fixed by skipping the delayed reset when forcing the France ticket.
Visual QA:
- Portfolio shows `Mock order placed`, `Filled shares 294.12`, `Exec price 34%`, and `Implied odds 2.9x` before the position summary.

### Cycle 132

Date: 2026-07-01
Device: Android emulator `emulator-5554` with Expo Go
Build/run command:
- `npm.cmd run typecheck`
- `npm.cmd run smoke:future-list-order`
- `npm.cmd run test:mobile-api`
Result: Passed. Recent activity now carries execution-style details for bought positions after a France World Cup winner order.
Screenshots:
- `docs/mobile/screenshots/cycle-132-holiwyn-activity-execution-smoke.png`
- `docs/mobile/screenshots/cycle-132-holiwyn-activity-execution-ticket.png`
- `docs/mobile/screenshots/cycle-132-holiwyn-activity-execution-portfolio.png`
- `docs/mobile/screenshots/cycle-132-holiwyn-activity-execution-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-132-holiwyn-activity-execution-expo-menu.xml`
- `docs/mobile/harness/cycle-132-holiwyn-activity-execution-home.xml`
- `docs/mobile/harness/cycle-132-holiwyn-activity-execution-ticket.xml`
- `docs/mobile/harness/cycle-132-holiwyn-activity-execution-portfolio.xml`
- `docs/mobile/harness/cycle-132-holiwyn-activity-execution-activity.xml`
Bugs:
- First rerun asserted old copy `Opened position`; corrected to the actual visible `Bought` label.
- One scroll left Recent activity below the viewport; the harness now performs a second scroll before capturing the activity proof.
Visual QA:
- Recent activity shows `Bought`, `World Cup winner - France`, `100 USDT`, `Filled shares 294.12`, `Exec price 34%`, and `Implied odds 2.9x` without overlap.

### Cycle 133

Date: 2026-07-01
Device: Samsung S23 attempted through Expo Go; Expo Go install was blocked by the Play Store purchase-verification setup prompt. No emulator proof was used for the final gate because the user requested Samsung-first testing.
Build/run command:
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed for static/unit gates. Closed Recent activity rows now support entry price, close value, and estimated P/L details, and activity metric math is covered by focused tests.
Screenshots:
- `docs/mobile/screenshots/cycle-133-samsung-expo-install-blocker.png`
Harness evidence:
- `docs/mobile/harness/cycle-133-samsung-expo-install-blocker.xml`
Bugs:
- Emulator/Expo Go close-position proof remained stale around long-scroll tap targets; Cycle 133 switched to deterministic closed-trade state plus pure metric tests.
- Samsung Expo Go proof could not run because Expo Go was not installed and Google Play displayed a purchase-verification setup prompt requiring user action.
Visual QA:
- Samsung visual QA is pending Expo Go installation or a dev build/APK. The captured Samsung screen proves the current blocker.

### Cycle 134

Date: 2026-07-01
Device: Configuration/readiness cycle; no phone launch required.
Build/run command:
- `npm.cmd run check:android-dev-build`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. Holiwyn now has Android APK/dev-build readiness artifacts, including `eas.json`, an npm readiness check, and README guidance.
Screenshots:
- None; configuration readiness cycle.
Harness evidence:
- `mobile/eas.json`
- `mobile/scripts/check-android-dev-build-readiness.ps1`
Bugs:
- None.
Visual QA:
- Not applicable. The readiness checker confirms preview APK configuration is ready and warns that `expo-dev-client` is still needed before using the development-client profile.

### Cycle 135

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke.ps1 -Deep -FutureListClose -Port 8108 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -ExpoHost 172.16.200.14 -SkipPackageClear`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. Expo Go is installed on the Samsung S23, and Holiwyn's closed World Cup winner history state now runs through the real phone using the PC LAN Expo host.
Screenshots:
- `docs/mobile/screenshots/cycle-135-samsung-closed-history-smoke.png`
- `docs/mobile/screenshots/cycle-135-samsung-closed-history.png`
Harness evidence:
- `docs/mobile/harness/cycle-135-samsung-closed-history-home.xml`
- `docs/mobile/harness/cycle-135-samsung-closed-history.xml`
Bugs:
- Physical-device runs should not clear Expo Go package data by default because that can re-trigger first-run/onboarding state. The smoke harness now supports `-SkipPackageClear` for Samsung runs.
Visual QA:
- Samsung proof shows the closed-history Portfolio state with fake balance, no open positions, Recent activity, Closed, Bought, World Cup winner, entry price, close value, and estimated P/L without overlap.

### Cycle 136

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:closed-history`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The one-command Samsung wrapper detected `172.16.200.14`, launched Expo Go on the phone, and verified the closed-history UI hierarchy.
Screenshots:
- `docs/mobile/screenshots/cycle-136-samsung-wrapper-smoke.png`
- `docs/mobile/screenshots/cycle-136-samsung-wrapper-closed-history.png`
Harness evidence:
- `docs/mobile/harness/cycle-136-samsung-wrapper-home.xml`
- `docs/mobile/harness/cycle-136-samsung-wrapper-closed-history.xml`
Bugs:
- The first wrapper attempt passed `-FutureListClose` through a string array and PowerShell treated it like a positional output path; fixed by passing the closed-history switch directly.
Visual QA:
- Samsung proof again shows the closed Portfolio history state with the expected fake balance, closed activity row, entry price, close value, and estimated P/L.

### Cycle 137

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:closed-history`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. Portfolio Recent activity rows now show timestamp context, and the Samsung smoke proof verifies `Today 2:04 PM` in the closed World Cup winner history row.
Screenshots:
- `docs/mobile/screenshots/cycle-137-samsung-activity-time-smoke.png`
- `docs/mobile/screenshots/cycle-137-samsung-activity-time-closed-history.png`
Harness evidence:
- `docs/mobile/harness/cycle-137-samsung-activity-time-home.xml`
- `docs/mobile/harness/cycle-137-samsung-activity-time-closed-history.xml`
Bugs:
- Forced deep-link state could be overwritten by stale portfolio storage hydration during startup; fixed by skipping portfolio hydration after forced reset links.
- The first timestamp proof failed until the forced-state hydration race was fixed.
Visual QA:
- Samsung proof shows the closed activity row with `Closed`, `Today 2:04 PM`, `World Cup winner - France`, entry/current value/P/L details, and the close amount.

### Cycle 138

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
- `npm run smoke:samsung:closed-history`
Result: Passed. Backend portfolio history now maps `resolveTime` or fallback `createdAt` into mobile activity timestamps, and the Samsung timestamp smoke remains green.
Screenshots:
- `docs/mobile/screenshots/cycle-138-samsung-backend-history-time-smoke.png`
- `docs/mobile/screenshots/cycle-138-samsung-backend-history-time-closed-history.png`
Harness evidence:
- `docs/mobile/harness/cycle-138-samsung-backend-history-time-home.xml`
- `docs/mobile/harness/cycle-138-samsung-backend-history-time-closed-history.xml`
Bugs:
- Initial adapter test expected UTC display values; corrected expectations to the app's explicit `America/Chicago` display timezone.
Visual QA:
- Samsung proof still shows the closed Portfolio history row with timestamp context and no regression in fake balance, closed activity, entry/current value, or P/L rows.

### Cycle 139

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
- `npm run smoke:samsung:closed-history`
Result: Passed. Backend portfolio history now maps net invested value into `entryAmount`, letting server-backed closed history show entry/current value/P/L details even without probability data.
Screenshots:
- `docs/mobile/screenshots/cycle-139-samsung-backend-history-economics-smoke.png`
- `docs/mobile/screenshots/cycle-139-samsung-backend-history-economics-closed-history.png`
Harness evidence:
- `docs/mobile/harness/cycle-139-samsung-backend-history-economics-home.xml`
- `docs/mobile/harness/cycle-139-samsung-backend-history-economics-closed-history.xml`
Bugs:
- Typecheck initially caught a probability narrowing issue in the shared activity execution row; fixed by making the non-closed branch use a fallback probability value.
Visual QA:
- Samsung proof keeps the closed Portfolio history row visible with timestamp, entry/current value/P/L details, fake balance, and closed activity labels intact.

### Cycle 140

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:future-list-order`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves the order-placement path from the France World Cup winner ticket through Portfolio confirmation and Recent activity.
Screenshots:
- `docs/mobile/screenshots/cycle-140-samsung-order-placement-smoke.png`
- `docs/mobile/screenshots/cycle-140-samsung-order-placement-ticket.png`
- `docs/mobile/screenshots/cycle-140-samsung-order-placement-portfolio.png`
- `docs/mobile/screenshots/cycle-140-samsung-order-placement-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-140-samsung-order-placement-home.xml`
- `docs/mobile/harness/cycle-140-samsung-order-placement-ticket.xml`
- `docs/mobile/harness/cycle-140-samsung-order-placement-portfolio.xml`
- `docs/mobile/harness/cycle-140-samsung-order-placement-activity.xml`
Bugs:
- None in the final run.
Visual QA:
- Samsung proof shows the ticket, fake balance, place-order CTA, Portfolio confirmation, execution details, and bought activity row for the France World Cup winner flow.

### Cycle 141

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:future-list-sell`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves the sell-ticket path from the World Cup winner futures list through the active sell-side ticket.
Screenshots:
- `docs/mobile/screenshots/cycle-141-samsung-sell-ticket-smoke.png`
- `docs/mobile/screenshots/cycle-141-samsung-sell-ticket-active.png`
Harness evidence:
- `docs/mobile/harness/cycle-141-samsung-sell-ticket-home.xml`
- `docs/mobile/harness/cycle-141-samsung-sell-ticket-list.xml`
- `docs/mobile/harness/cycle-141-samsung-sell-ticket-ticket.xml`
- `docs/mobile/harness/cycle-141-samsung-sell-ticket-active.xml`
Bugs:
- None in the final run.
Visual QA:
- Samsung proof shows the France World Cup winner ticket switched to Sell, with estimated proceeds, estimated shares, average price, and `Place sell order`.

### Cycle 142

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:portfolio-close-position`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves placing and closing a World Cup winner position, including Portfolio counters and closed-history state.
Screenshots:
- `docs/mobile/screenshots/cycle-142-samsung-close-position-smoke.png`
- `docs/mobile/screenshots/cycle-142-samsung-close-position-closed.png`
Harness evidence:
- `docs/mobile/harness/cycle-142-samsung-close-position-empty.xml`
- `docs/mobile/harness/cycle-142-samsung-close-position-open.xml`
- `docs/mobile/harness/cycle-142-samsung-close-position-ready.xml`
- `docs/mobile/harness/cycle-142-samsung-close-position-activity.xml`
- `docs/mobile/harness/cycle-142-samsung-close-position-closed.xml`
Bugs:
- Initial Samsung run inherited stale Portfolio state; fixed by launching the close-position smoke with `forceResetState=1`.
Visual QA:
- Samsung proof shows a clean Portfolio, an opened World Cup winner position, the close-position action, and final counters with no open positions, two activities, and one closed trade.

### Cycle 143

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:live-order`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves the live-market trading path from Live World Cup through ticket opening, mock buy, and Portfolio confirmation with live metadata.
Screenshots:
- `docs/mobile/screenshots/cycle-143-samsung-live-order-smoke.png`
- `docs/mobile/screenshots/cycle-143-samsung-live-order-ready.png`
- `docs/mobile/screenshots/cycle-143-samsung-live-order-ticket.png`
- `docs/mobile/screenshots/cycle-143-samsung-live-order-portfolio.png`
Harness evidence:
- `docs/mobile/harness/cycle-143-samsung-live-order-home.xml`
- `docs/mobile/harness/cycle-143-samsung-live-order-ready.xml`
- `docs/mobile/harness/cycle-143-samsung-live-order-ticket.xml`
- `docs/mobile/harness/cycle-143-samsung-live-order-portfolio.xml`
Bugs:
- Initial Samsung live-order run reached Portfolio but failed the older harness expectation for a combined `MOCK - Buy - France - 41%` label. The current UI separates order title and execution price, so the harness now checks `MOCK - Buy - France`, `Exec price`, and `41%`.
- The first retry exposed that forced live reset could return the app to Home after launch; fixed by preserving `forceLive=1` during the delayed reset guard.
Visual QA:
- Samsung proof shows Live World Cup, the France vs. Argentina ticket, fake-balance order placement, Portfolio confirmation, live badge/clock, execution price, invested value, current value, and estimated P/L.

### Cycle 144

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:live-order-close`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves the full live mock trading loop through ticket opening, order placement, close-position action, and live closed-history rows.
Screenshots:
- `docs/mobile/screenshots/cycle-144-samsung-live-close-smoke.png`
- `docs/mobile/screenshots/cycle-144-samsung-live-close-ready.png`
- `docs/mobile/screenshots/cycle-144-samsung-live-close-ticket.png`
- `docs/mobile/screenshots/cycle-144-samsung-live-close-portfolio.png`
- `docs/mobile/screenshots/cycle-144-samsung-live-close-action.png`
- `docs/mobile/screenshots/cycle-144-samsung-live-close-closed.png`
Harness evidence:
- `docs/mobile/harness/cycle-144-samsung-live-close-home.xml`
- `docs/mobile/harness/cycle-144-samsung-live-close-ready.xml`
- `docs/mobile/harness/cycle-144-samsung-live-close-ticket.xml`
- `docs/mobile/harness/cycle-144-samsung-live-close-portfolio.xml`
- `docs/mobile/harness/cycle-144-samsung-live-close-action.xml`
- `docs/mobile/harness/cycle-144-samsung-live-close-closed.xml`
Bugs:
- Initial Samsung live-close run reached Portfolio but the close button was below the first visible hierarchy. The harness now scrolls the Portfolio card before tapping `close-position-`.
- The first scrolled close run captured the correct closed state lower on the page, but the final assertion still expected top-of-Portfolio balance/counter text. The assertion now checks visible closed-state evidence instead.
Visual QA:
- Samsung proof shows live ticket opening, order placement, the scrolled Close position action, no open positions after close, live closed activity, live bought activity, close value, and P/L text.

### Cycle 145

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:live-portfolio-badge-deep`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves deep live metadata propagation from ticket/order into latest order, open position, and activity rows.
Screenshots:
- `docs/mobile/screenshots/cycle-145-samsung-live-metadata-smoke.png`
- `docs/mobile/screenshots/cycle-145-samsung-live-metadata-ready.png`
- `docs/mobile/screenshots/cycle-145-samsung-live-metadata-ticket.png`
- `docs/mobile/screenshots/cycle-145-samsung-live-metadata-portfolio.png`
- `docs/mobile/screenshots/cycle-145-samsung-live-metadata-position.png`
- `docs/mobile/screenshots/cycle-145-samsung-live-metadata-activity.png`
Harness evidence:
- `docs/mobile/harness/cycle-145-samsung-live-metadata-home.xml`
- `docs/mobile/harness/cycle-145-samsung-live-metadata-ready.xml`
- `docs/mobile/harness/cycle-145-samsung-live-metadata-ticket.xml`
- `docs/mobile/harness/cycle-145-samsung-live-metadata-portfolio.xml`
- `docs/mobile/harness/cycle-145-samsung-live-metadata-position.xml`
- `docs/mobile/harness/cycle-145-samsung-live-metadata-activity.xml`
Bugs:
- Initial Samsung run scrolled past the latest-order clock before asserting it. The harness now checks latest-order live clock before scrolling and checks position/activity clocks after scrolling.
Visual QA:
- Samsung proof shows live ticket opening, mock order placement, latest-order live clock, open-position live badge/clock, and Recent activity live badge/clock on the real phone.

### Cycle 146

Date: 2026-07-01
Device: Samsung S23 through Expo Go (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run smoke:samsung:server-order-failure`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung wrapper now proves server-mode order failure recovery on the real phone when backend order submission is unavailable.
Screenshots:
- `docs/mobile/screenshots/cycle-146-samsung-server-order-failure-smoke.png`
- `docs/mobile/screenshots/cycle-146-samsung-server-order-failure-ticket.png`
- `docs/mobile/screenshots/cycle-146-samsung-server-order-failure-error.png`
Harness evidence:
- `docs/mobile/harness/cycle-146-samsung-server-order-failure-ticket.xml`
- `docs/mobile/harness/cycle-146-samsung-server-order-failure-error.xml`
Bugs:
- Initial Samsung run inherited stale balance; fixed by launching `ServerOrderFailure` through the forced reset/ticket deep link.
- The server-order-failure path still tried to tap the futures row after forced ticket launch; fixed by treating the launch hierarchy as the ticket.
- The phone needed longer than the old one-second wait for unavailable-backend order failure; fixed by waiting for the retry error text.
Visual QA:
- Samsung proof shows the forced World Cup winner ticket with clean balance and then keeps the ticket open with `Order failed. Try again.` and retry CTA after failed server submission.

### Cycle 147

Date: 2026-07-01
Device: Samsung S23 ADB target (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`)
Build/run command:
- `npm run preflight:samsung:server-mode`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The Samsung server-mode preflight now resolves the PC LAN API base URL for physical-device launches and verifies the Samsung ADB target before server-mode auth/backend checks.
Preflight evidence:
- Device API base URL resolved to `http://172.16.200.14:3000`.
- Samsung ADB target was reachable.
- Server auth config checks passed.
- Backend health was unavailable at `http://127.0.0.1:3000`, so live server request proof remains pending.
- `EXPO_PUBLIC_API_KEY` was missing, so authenticated account preflight remains pending.
Bugs:
- Initial preflight used `Get-NetIPConfiguration`, which failed in this environment with CIM access denied. Replaced it with the proven `ipconfig` parsing resolver used by the Samsung smoke wrapper.
Visual QA:
- No app screenshot cycle; this is a device/server launch preflight cycle.

### Cycle 148

Date: 2026-07-01
Device: Backend readiness harness
Build/run command:
- `npm run mobile:backend-readiness:summary`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. Backend readiness now writes a structured JSON summary while preserving the existing human-readable output.
Harness evidence:
- `docs/mobile/harness/cycle-148-mobile-backend-readiness.json`
Structured findings:
- `dockerCliAvailable`: true
- `dockerDaemonReachable`: false
- `composeFileFound`: true
- `databaseTcpReachable`: false
- `usesDefaultLocalComposePort`: true
- `canStartLocalDb`: false
Bugs:
- None in final run.
Visual QA:
- No app screenshot cycle; this is a backend-readiness harness cycle.

### Cycle 149

Date: 2026-07-01
Device: Server success readiness gate
Build/run command:
- `npm run gate:server-success:expect-blocked`
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The server success gate blocks successful Samsung server-backed order proof attempts when readiness evidence is incomplete, and can verify expected blocked state without failing the harness.
Gate evidence:
- Docker daemon was not reachable.
- Database TCP was not reachable at `localhost:5432`.
- `EXPO_PUBLIC_API_KEY` was missing.
- Expected-blocked mode returned success after confirming these blockers.
Bugs:
- Initial gate command correctly blocked but returned a failing npm exit for expected-blocked harness use. Added `-ExpectBlocked` and `gate:server-success:expect-blocked`.
Visual QA:
- No app screenshot cycle; this is a server-readiness gate cycle.

### Cycle 150

Date: 2026-07-01
Device: Mobile order service unit harness
Build/run command:
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The mobile order service now has focused server-mode mapping coverage.
Unit evidence:
- `mobile/src/__tests__/orderService.test.ts`
- Mobile API suite: 5 files, 14 tests passed.
Covered behavior:
- Server-mode buy tickets submit canonical `BUY` side, probability-derived price, fixed-size string, market id, and outcome id.
- Server responses map nested order ids and top-level id fallbacks into Portfolio-ready order results.
- Non-positive order amounts are rejected before calling the API.
Bugs:
- Typecheck caught incomplete test fixtures; fixed by matching the full `Market` and `Outcome` shapes and using the `future` market literal.
Visual QA:
- No app screenshot cycle; this is backend-facing service coverage.

### Cycle 151

Date: 2026-07-01
Device: Mobile portfolio snapshot service unit harness
Build/run command:
- `npm.cmd run typecheck`
- `npm.cmd run test:mobile-api`
Result: Passed. The mobile portfolio snapshot service now has focused backend-to-Portfolio mapping coverage.
Unit evidence:
- `mobile/src/__tests__/portfolioSnapshotService.test.ts`
- Mobile API/service suite: 6 files, 16 tests passed.
Covered behavior:
- Server wallet available balance maps to the app Portfolio balance.
- Backend positions map into server-mode Portfolio positions with stable ids, title, outcome, cost basis, and implied probability.
- Backend BUY and SELL open orders map into mobile open-order rows with side, status, price, and remaining amount.
- Empty server portfolios stay renderable for new Holiwyn accounts with the default 10,000 USDT fake-token state.
Bugs:
- None in final run.
Visual QA:
- No app screenshot cycle; this is backend-facing service coverage.
