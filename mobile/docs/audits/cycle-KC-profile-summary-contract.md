# Cycle KC - Profile Summary Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Backend `/api/profile/summary` contract for visible Account/settings summary data.
- Canonical `account:read` auth and route usage logging/rate-limit identity.
- Mobile client and service mapper for Account screen values.
- No Account visual redesign and no deposit/withdraw work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Account summary route uses canonical account auth | Pass | `src/__tests__/profile.summary.route.test.ts` verifies `account:read` scope and `account:summary` route id. |
| Route returns profile identity and preference defaults | Pass | `scripts/prove_mobile_profile_summary_contract.ts` seeds a profile, preferences, and reads `/api/profile/summary` with a canonical API key. |
| Route returns visible Account numeric summary fields | Pass | Proof verifies wallet balance, portfolio value, open position count, open order count, open order value, total exposure, and `tradingMode=server`. |
| Mobile service maps route data into Account screen values | Pass | `mobile/src/__tests__/profileSummaryService.test.ts` covers display name fallback, numeric conversion, saved count, side mapping, and locale. |
| Cycle avoids unrelated UI/funding churn | Pass | No edits to `mobile/App.tsx`, `AccountScreen`, deposit, withdraw, or wallet funding flows. |

## Change Notes

- Added `/api/profile/summary` as a narrow read-only Account shell route.
- Added mobile `PolyApi.getProfileSummary()` and `loadProfileSummary()` service mapper.
- Summary uses existing `User`, `UserBalance`, `Position`, `Order`, and `UserProfilePreference` data. No schema migration was added.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/profileSummaryService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/profile.summary.route.test.ts` - pass.
- `npx tsx scripts/prove_mobile_profile_summary_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KC"` - pass.

## Remaining P1

- Wire dirty Account UI files to `loadProfileSummary()` in server mode after unrelated mobile UI churn is reconciled.
- Full account/security/session/funding settings remain outside this focused MVP Account summary contract.
