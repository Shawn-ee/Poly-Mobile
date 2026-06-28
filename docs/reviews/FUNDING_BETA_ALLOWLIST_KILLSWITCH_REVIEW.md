# Funding Beta Allowlist And Kill-Switch Review

Date: 2026-06-19
Branch: `agent/beta-funding-allowlist-killswitch`
Scope: Phase 2B / 2C controlled internal funding gates

## Implementation Summary

This PR adds the first runtime safety gate for controlled internal funding beta:

- server-only env-backed funding feature flags
- canonical internal funding allowlist guard helpers
- global funding kill-switch guard
- deposit address route guard
- deposit history route guard
- withdrawal request route guard
- withdrawal history route guard
- deposit monitor / auto-credit entrypoint guard
- targeted Jest tests for guard behavior, route gating, private-key no-leak response shape, and monitor kill-switch blocking

No Prisma schema, migration, private-key generation, encrypted-key storage, ledger math, withdrawal hold/release/complete semantics, blockchain broadcast, admin auth, bot behavior, workflow, package script, deployment config, or secret file was changed.

## Files Changed

- `src/lib/config.ts`
- `src/lib/auth.ts`
- `src/lib/fundingBeta.ts`
- `src/app/api/deposits/address/route.ts`
- `src/app/api/deposits/route.ts`
- `src/app/api/withdrawals/request/route.ts`
- `src/app/api/withdrawals/route.ts`
- `src/lib/deposits/polygonDeposits.ts`
- `src/__tests__/funding-beta.guard.test.ts`
- `src/__tests__/funding-beta.routes.test.ts`
- `src/__tests__/funding-beta.deposit-monitor.test.ts`
- `docs/reviews/FUNDING_BETA_ALLOWLIST_KILLSWITCH_REVIEW.md`
- `docs/reviews/FUNDING_BETA_CONTINUATION_PROMPT.md`

## Allowlist Source

Temporary v1 source: server environment variable.

- `INTERNAL_FUNDING_BETA_ENABLED`
- `INTERNAL_FUNDING_ALLOWLIST_EMAILS`

Behavior:

- anonymous users are blocked
- authenticated users without an allowlisted email are blocked
- allowlisted users are allowed only when internal funding beta is enabled
- admins are allowed while internal funding beta is enabled

No env values are logged, committed, or exposed to the frontend.

## Kill-Switch Source

Temporary v1 source: server environment variable.

- `FUNDING_KILL_SWITCH`

Behavior:

- when true, deposit address lookup/create is blocked
- when true, withdrawal request creation is blocked
- when true, deposit monitor scan / auto-credit entrypoints are blocked before chain provider access

## Auto-Credit Source

Temporary v1 source: server environment variable.

- `ALLOW_AUTO_DEPOSIT_CREDIT`

Behavior:

- deposit monitor scan and deposit crediting are blocked unless internal funding beta is enabled, the kill switch is off, and auto-credit is explicitly enabled

## Funding APIs Guarded

Guarded:

- `GET /api/deposits/address`
- `GET /api/deposits`
- `POST /api/withdrawals/request`
- `GET /api/withdrawals`

Admin review routes remain admin-only through the existing admin guards and were not changed.

## Funding UIs Guarded

No UI code changed in this PR.

The wallet and transfer UI now depend on guarded funding APIs for deposit address and deposit history access. Non-allowlisted users cannot receive a deposit address from the guarded API.

## Deposit Monitor Guards

Guarded:

- `scanPolygonUsdcDeposits`
- `creditPolygonDepositIfEligible`

The monitor is blocked before chain provider access when funding beta is disabled, auto-credit is disabled, or kill switch is active.

## Withdrawal Request Guards

Guarded:

- `POST /api/withdrawals/request`
- `GET /api/withdrawals`

This PR does not implement automatic withdrawal broadcast. Withdrawal requests continue to use the existing hold/request service path.

## Tests Added

Added:

- `src/__tests__/funding-beta.guard.test.ts`
- `src/__tests__/funding-beta.routes.test.ts`
- `src/__tests__/funding-beta.deposit-monitor.test.ts`

Coverage:

- anonymous funding access is blocked
- authenticated non-allowlisted funding access is blocked
- allowlisted user is allowed when funding beta is enabled and kill switch is off
- kill switch blocks deposit address access
- kill switch blocks withdrawal request creation
- kill switch blocks deposit monitor execution before chain access
- deposit address response does not include `privateKey`
- deposit address response does not include `encryptedPrivateKey`
- withdrawal request response does not include broadcast transaction fields

## Tests Not Added

Not added in this PR:

- schema-backed funding profile tests, because no schema-backed funding profile exists yet
- admin deposit/withdrawal review tests, because admin routes remain admin-only and unchanged
- live chain/RPC deposit monitor tests, because the safe test lane must not use real chain RPC, credentials, production data, or real funds

## Remaining Blockers

- Phase 2D schema-backed funding profile / audit metadata may still be needed before durable internal funding beta operations.
- Admin funding review evidence remains human-reviewed.
- Public funding remains blocked.
- Automated withdrawal broadcast remains blocked.
- Production deployment remains blocked.

## Can Phase 3 Start After This?

Phase 3 can start only after human review of this PR confirms:

- env names and defaults are acceptable
- allowlist behavior is acceptable for internal beta
- kill-switch behavior is acceptable for deposit address, withdrawal request, and monitor paths
- validation and targeted tests pass
- no private-key, ledger, withdrawal broadcast, schema, migration, production, or secret behavior changed

Recommended classification after this PR: **Phase 3 may be planned after review, but should not start automatically in this run.**

## Exact Next Recommended Phase

Recommended next step:

**Human review of Phase 2B / 2C allowlist and kill-switch PR.**

After approval, choose one:

1. Phase 2D schema-backed funding profile and audit metadata, if env-backed allowlist is not durable enough.
2. Phase 2E broader access-control tests for funding UI/API boundaries.
3. Phase 3 controlled deposit wallet generation only for allowlisted internal users.
