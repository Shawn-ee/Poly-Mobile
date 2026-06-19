# PR #25 UI Review Checklist

Date: 2026-06-18

PR: https://github.com/Shawn-ee/POLY/pull/25

Branch: `agent/ui-admin-subpages-wallet-pools-light`

Status: Draft and not auto-mergeable.

## Purpose

This checklist records a docs-only review of PR #25 before any UI/product-code merge decision. It does not modify PR #25, does not push to the PR branch, and does not approve merging the PR.

## Changed Files Observed

- `docs/CURRENT_STATE.md`
- `docs/agent-reports/2026-06-18-ui-admin-subpages-wallet-pools-light.md`
- `src/app/admin/deposits/page.tsx`
- `src/app/admin/withdrawals/page.tsx`
- `src/app/my-pools/page.tsx`
- `src/app/wallet/page.tsx`
- `src/components/PoolMarketDetail.tsx`

## Scope Classification

| Area | Observed in PR #25 | Review classification |
| --- | --- | --- |
| `src/` changes | Yes | Product-code/UI changes; never auto-merge. |
| `src/app` pages | Yes | UI route surfaces changed. |
| `src/components` | Yes | Shared/route component changed. |
| Order ticket / trade ticket | No direct order ticket file observed | Still requires regression check because pool detail includes action surfaces. |
| Wallet / balances / portfolio logic | Wallet page touched | Human review required even if claimed display-only. |
| Deposit / withdrawal surfaces | Admin deposit and withdrawal pages touched | Human review required because these are funding-adjacent operator screens. |
| API calls | Existing page-level API usage may remain | Verify no payloads, endpoints, or state transitions changed before merge. |
| Auth/admin | Admin pages touched | Human review required because admin surfaces are sensitive even for display-only UI. |
| Bot/live trading | Not observed | No bot-specific review required from this checklist. |
| Deployment/config | Not observed | No deployment review required from this checklist. |
| Prisma/migrations | Not observed | No schema review required from this checklist. |

## Display-Only Assessment

PR #25 appears intended as a display/presentation pass, based on the PR body and changed files. It imports shared UI primitives, restyles wallet/admin/private-pool surfaces, and documents that wallet/deposit/withdrawal/custody/payment behavior is intentionally unchanged.

This intent is not enough for automatic merge. The changed pages include buttons, inputs, owner actions, wallet linking, faucet access, admin withdrawal completion/rejection controls, admin deposit rescans, and private pool actions. A human reviewer must confirm that event handlers, fetch calls, request payloads, disabled states, and dangerous action flows are unchanged.

## Required Human Review Checks

- Confirm PR #25 remains draft until reviewed.
- Confirm no wallet, deposit, withdrawal, ledger, matching, settlement, or custody behavior changed.
- Confirm no admin deposit or withdrawal operation semantics changed.
- Confirm no API endpoint paths, HTTP methods, payload shapes, or mutation triggers changed.
- Confirm wallet faucet, link wallet, manual wallet link, transaction history, and withdrawal request displays remain semantically unchanged.
- Confirm admin rescan, complete, and reject actions still require the same inputs and call the same functions.
- Confirm private pool bet, cancel, resolve, and invite actions remain semantically unchanged.
- Confirm loading, error, empty, disabled, and busy states still prevent accidental duplicate or unsafe actions.
- Confirm no secrets, addresses, hashes, or internal notes are newly exposed.
- Confirm responsive layout on `/wallet`, `/admin/deposits`, `/admin/withdrawals`, `/my-pools`, and pool detail.
- Confirm the PR is rebased onto current `dev` before any final review.

## Split Recommendation

PR #25 should be split before merge unless a human explicitly accepts the combined scope. Recommended split:

1. Wallet page display-only polish.
2. Admin deposits page display-only polish.
3. Admin withdrawals page display-only polish.
4. Private pool listing display-only polish.
5. Pool detail display-only polish.
6. Documentation/current-state update.

Splitting reduces review risk because wallet/admin funding surfaces and private pool action surfaces can be checked independently.

## Safe Future FrontendAgent Scope

FrontendAgent may safely continue only with display-only work that:

- Changes layout, typography, spacing, colors, and component composition.
- Does not alter API calls, handler behavior, auth checks, request payloads, or business state.
- Does not change wallet/deposit/withdrawal availability or wording that implies public real-money readiness.
- Keeps admin actions gated and clearly separated from normal user flows.
- Leaves all validation and screenshots in the PR body.

## Human-Review Required Areas

- `/wallet`
- `/admin/deposits`
- `/admin/withdrawals`
- `/my-pools`
- `src/components/PoolMarketDetail.tsx`

These areas involve funding-adjacent, admin, private pool, or action-heavy UI. They may be display-only but still require careful human review.

## Auto-Merge Decision

PR #25 itself is not eligible for auto-merge.

Reasons:

- It changes `src/` product-code files.
- It changes wallet and admin funding-adjacent screens.
- It changes action-heavy private pool surfaces.
- It is draft.
- The autonomous LeadAgent policy forbids auto-merging UI code and funding/admin-adjacent product-code changes.

## Recommended Next Step

Keep PR #25 open as draft. Either split it into smaller display-only PRs or perform a human review with the checklist above before merging any part of it into `dev`.
