# Cycle LZ Portfolio Account Entry

Date: 2026-07-08

## Scope

Close the manual-feedback gap that the Portfolio top-left profile/avatar area was display-only. Account/profile entry belongs in Portfolio for the Local MVP, not Home.

Out of scope: deposit/withdraw, login implementation, orderbook UI, chat, live stats, social features, backend schema changes, and order logic.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Portfolio top-left profile/avatar is clickable | P0 | Pass |
| Tap opens the existing Account/Profile screen | P0 | Pass |
| No duplicate local-only settings sheet is introduced | P0 | Pass |
| Bottom navigation remains usable after landing on Account | P0 | Pass |
| No backend/order route is changed | P0 | Pass |

## Implementation

Changed:

- `mobile/src/components/Portfolio.tsx`
- `mobile/App.tsx`
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`

Behavior:

- `Portfolio` now accepts `openAccount`.
- The top-left Portfolio profile row is a `Pressable` with marker `portfolio-account-entry-opens-account`.
- `App.tsx` wires that action to the existing `account` tab/screen.

## Device Proof

Device:

- Samsung S23, `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Screen: `1080x2340`

Evidence:

- `docs/mobile/screenshots/cycle-LZ-portfolio-account-entry/before-navigation.png`
- `docs/mobile/harness/cycle-LZ-portfolio-account-entry/before-navigation.xml`
- `docs/mobile/screenshots/cycle-LZ-portfolio-account-entry/account-screen-after-tap.png`
- `docs/mobile/harness/cycle-LZ-portfolio-account-entry/account-screen-after-tap.xml`

XML markers:

- Before tap: `portfolio-account-entry-top-left portfolio-account-entry-opens-account`
- After tap: `account-screen`, `account-more-menu`, `account-language-row`

## Validation

- `npm run -s typecheck` from `mobile/`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/portfolioSettingsContract.test.ts`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Account screen itself still contains disabled/non-MVP menu items | P1 | Existing account-screen limitation |
| Real login/session model | P1 | Outside Local MVP fake-token cycle |
| Deposit/withdraw behavior | P2 | Explicitly skipped for now |
