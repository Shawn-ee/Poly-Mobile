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
