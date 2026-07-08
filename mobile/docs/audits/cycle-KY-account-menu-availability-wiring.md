# Cycle KY - Account Menu Availability Wiring

Gate status: Pass

Scope: Backend/data-contract gate for visible Account More-menu rows. This cycle does not implement leaderboard, rewards, API management, accuracy, public status, documentation, help center, terms pages, deposits, withdrawals, auth/session expansion, or visual redesign.

## P0 Checklist

- `/api/profile/summary` returns explicit `menuItems[]` availability metadata for every visible Account More-menu row.
- Menu rows currently outside MVP scope are marked `status=unavailable`, `reason=outside-mvp-scope`, and `route=null`.
- Mobile `ProfileSummary` types and `loadProfileSummary()` preserve backend menu metadata.
- `App` passes route-backed menu metadata into `AccountScreen` in server mode.
- `AccountScreen` renders unavailable menu rows as non-actionable rows with visible disabled copy, not as tappable dead buttons.
- Mock/offline mode uses the same unavailable metadata fallback and does not invent active destinations.

## Evidence

- Proof: `docs/mobile/harness/cycle-KY-account-menu-availability-wiring/cycle-KY-account-menu-availability-wiring.json`.
- Proof script: `scripts/prove_mobile_account_menu_availability_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/profileSummaryService.test.ts`
  - `mobile/src/__tests__/api.test.ts`
- Focused backend tests:
  - `src/__tests__/profile.summary.route.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Account menu availability wiring.
- Remaining P1: implement real backend routes for these menu items only if MVP scope expands.
