# Cycle KW - Profile Preferences UI Sync Wiring

Gate status: Pass

Scope: Backend/data-contract gate for the visible Account/preference fields syncing with canonical profile preferences in server mode. This does not add account visual redesign, deposit, withdraw, KYC, notification settings, or broader security settings.

## P0 Checklist

- Server-mode app loads `/api/profile/preferences` through `loadProfilePreferences()` only after local locale, saved market, and ticket default hydration is complete.
- Successful route preferences update visible app state for locale, ticket default amount, ticket side, slippage, and saved market ids.
- Local changes to those visible preference states save back through `saveProfilePreferences()` and canonical `/api/profile/preferences`.
- Account screen receives route-backed preference values and visible sync status props.
- Mock/offline mode keeps local AsyncStorage preference behavior and hides route sync status.
- No order book, chat, live stats, deposit, withdraw, Portfolio redesign, or broad account/settings expansion is included.

## Evidence

- Proof: `docs/mobile/harness/cycle-KW-profile-preferences-ui-sync-wiring/cycle-KW-profile-preferences-ui-sync-wiring.json`.
- Proof script: `scripts/prove_mobile_profile_preferences_ui_sync_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/profilePreferencesService.test.ts`
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/profileSummaryService.test.ts`
- Focused backend tests:
  - `src/__tests__/profile.preferences.route.test.ts`
  - `src/server/services/__tests__/profilePreferences.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Account/preference UI sync wiring.
- Remaining P1: broader account/security/session/funding settings only if visible MVP scope expands; optional Android proof if visual proof becomes required again.
