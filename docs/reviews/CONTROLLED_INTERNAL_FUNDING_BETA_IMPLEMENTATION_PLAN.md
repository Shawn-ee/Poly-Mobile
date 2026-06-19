# Controlled Internal Funding Beta Implementation Plan

Date: 2026-06-19

This plan converts the owner-approved controlled internal funding beta target into narrow PRs. It deliberately avoids broad mixed PRs and does not approve public beta, production launch, automated withdrawals, anonymous funding, or live bots.

## PR 1: Docs Architecture

Title:

`docs(beta): define controlled internal funding beta architecture`

Branch:

`agent/beta-funding-architecture-plan`

Scope:

- Phase 0 repo inspection.
- Controlled funding beta architecture.
- Owner human decision record.
- Implementation plan.
- Continuation prompt.

Forbidden changes:

- product code.
- Prisma schema or migrations.
- wallet generation behavior.
- private key handling.
- deposit monitor behavior.
- ledger mutation behavior.
- withdrawal behavior.
- admin auth behavior.
- package/workflow/deployment config.
- secrets.

Validation:

- `git diff --check`
- `git diff --cached --check`
- verify docs distinguish existing implementation from proposed work.
- verify no secrets or key material.

Human review:

- Auto-merge allowed if docs-only and validation passes, but GitHub CLI auth may require manual PR handling in this environment.

Rollback:

- Revert the docs-only PR.

## PR 2: Schema Support

Title:

`funding(beta): add schema support for internal funding beta`

Suggested branch:

`agent/beta-funding-schema-review`

Scope:

- Decide and implement only the minimum schema required for controlled funding beta.
- Likely additions may include `UserFundingProfile`, audit log, direct ledger references, wallet provider, encryption version, chain/asset fields, or expanded statuses.

Forbidden changes:

- wallet generation.
- monitor logic.
- deposit address API.
- withdrawal API behavior.
- admin UI behavior.
- matching, settlement, order, fill, trade, position behavior.
- live bot behavior.
- production deployment.

Validation:

- `git diff --check`
- `git diff --cached --check`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci` if practical.

Human review:

- Required. Do not auto-merge migrations unless the owner explicitly approves.

Rollback:

- Revert migration and generated schema changes before production or shared DB use.

## PR 3: Encrypted Self-Managed EVM Deposit Wallets

Title:

`funding(beta): add internal deposit wallet address generation`

Suggested branch:

`agent/beta-internal-deposit-wallets`

Scope:

- Add funding allowlist guard.
- Add funding kill-switch guard.
- Wire guards into existing `GET /api/deposits/address` and wallet get-or-create service.
- Add no-leak and idempotency tests.

Forbidden changes:

- monitor auto-credit.
- withdrawal behavior.
- private key exposure.
- frontend private key access.
- new dependency without review.
- production wallet generation.

Validation:

- targeted deposit address tests.
- Prisma generate/validate.
- TypeScript.
- `npm run test:ci`.
- diff checks.

Human review:

- Required unless changes are only tests/docs. Private-key behavior is high risk.

Rollback:

- Disable funding flags and revert PR.

## PR 4: Deposit Address API And UI

Title:

`funding(beta): add internal deposit address API and UI`

Suggested branch:

`agent/beta-deposit-address-ui`

Scope:

- Allowlisted users can view deposit address.
- Non-allowlisted and anonymous users are blocked.
- Wallet UI clearly says controlled internal funding beta only.
- Public users cannot access usable funding path.

Forbidden changes:

- private key response.
- encrypted private key response.
- monitor crediting.
- withdrawal behavior.
- ledger mutation behavior.

Validation:

- route tests for anonymous, non-allowlisted, allowlisted.
- no-leak tests.
- focused UI validation.
- full required validation for code changes.

Human review:

- Required if UI enables real deposit instructions. Do not auto-merge funding behavior.

Rollback:

- Disable funding flags or revert UI/API PR.

## PR 5: Confirmed Deposit Auto-Credit Monitor

Title:

`funding(beta): add confirmed deposit auto-credit flow`

Suggested branch:

`agent/beta-auto-deposit-credit`

Scope:

- Add kill-switch and auto-credit enabled guard to existing monitor.
- Add tests for confirmed credit, duplicate tx/logIndex, unsupported token, insufficient confirmations, and disabled auto-credit.
- Keep credit path ledger-based and idempotent.

Forbidden changes:

- private key use in monitor.
- withdrawal broadcast.
- treasury signing.
- matching/settlement/trading behavior.

Validation:

- targeted monitor tests.
- ledger/idempotency tests.
- Prisma generate/validate.
- TypeScript.
- `npm run test:ci`.

Human review:

- Required. Auto-credit changes are high risk by topic.

Rollback:

- Turn off auto-credit flag and revert PR if needed.

## PR 6: Withdrawal Request Hold Workflow

Title:

`funding(beta): add withdrawal request hold workflow`

Suggested branch:

`agent/beta-withdrawal-hold`

Scope:

- Add allowlist guard.
- Add kill-switch guard.
- Ensure user route requires internal funding beta permission.
- Preserve existing available-to-locked hold.
- Preserve no automatic broadcast.

Forbidden changes:

- blockchain signing.
- treasury private key use.
- automated payout.
- unrelated ledger/trading changes.

Validation:

- anonymous blocked.
- non-allowlisted blocked.
- invalid address blocked.
- insufficient funds blocked.
- valid request creates hold.
- reject releases hold.
- complete finalizes hold.
- no broadcast assertion.

Human review:

- Required. Withdrawal hold is money-movement-adjacent.

Rollback:

- Turn off funding flags, reject pending test requests where operationally appropriate, and revert PR.

## PR 7: Admin Manual Withdrawal Review

Title:

`funding(beta): add admin manual withdrawal review`

Suggested branch:

`agent/beta-admin-manual-withdrawals`

Scope:

- Strengthen admin list/reject/complete tests.
- Improve manual payout copy/evidence if needed.
- Require tx hash before complete.
- Confirm no automatic signing/broadcast.

Forbidden changes:

- admin auth behavior without review.
- automatic withdrawal broadcast.
- treasury private key handling.
- deployment config.

Validation:

- admin unauthorized/forbidden/positive tests.
- withdrawal service tests.
- full validation.

Human review:

- Required. Admin funding operations are high risk.

Rollback:

- Disable admin funding routes by flag or revert PR if needed.

## PR 8: Evidence And Go/No-Go

Title:

`docs(beta): add internal funding beta evidence and go-no-go`

Suggested branch:

`agent/beta-funding-evidence-go-no-go`

Scope:

- `docs/reviews/INTERNAL_FUNDING_BETA_TEST_EVIDENCE.md`
- `docs/reviews/INTERNAL_FUNDING_BETA_GO_NO_GO.md`
- update `docs/reviews/INTERNAL_BETA_GO_NO_GO.md`
- document what was run, not run, blocked, and manually required.

Forbidden changes:

- code behavior.
- schema.
- production deployment.
- public beta approval.

Validation:

- `git diff --check`
- verify docs do not contain secrets, private keys, production data, or misleading readiness claims.

Human review:

- Required for final go/no-go.

Rollback:

- Revert evidence docs if inaccurate.

## Recommended Immediate Next Phase

After PR 1, proceed to Phase 2 with a schema and ledger readiness PR. The likely first implementation decision is whether to add `UserFundingProfile` and canonical funding guards before touching deposit address generation or withdrawal request behavior.

## Anti-Churn Rule

Do not create repeated checkpoint-only PRs. Every PR must advance one of the controlled internal funding beta phases or document a concrete blocker.
