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
