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
