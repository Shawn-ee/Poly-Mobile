# Beta Readiness Evidence Tracker

Task id: DOC-004
Assigned subagents: DocsAgent, TestingAgent, SecurityAgent
Risk level: Low
Status: Evidence tracker, docs-only

## Purpose

This tracker maps POLY public-beta readiness claims to the evidence needed before a human can decide whether the product is ready for broader use.

It does not approve launch, deploy production, enable funding, change code, alter wallet or ledger behavior, change bot behavior, modify auth, or replace `docs/reviews/PUBLIC_BETA_READINESS_CHECKLIST.md`.

## Evidence Status Legend

- Missing: No committed evidence yet.
- Draft: Planning or inventory exists, but no validating test/runbook/sign-off exists.
- Partial: Some validation exists, but the claim is not complete.
- Ready for human review: Evidence exists and needs owner sign-off.
- Approved: Human-approved evidence exists.

## Evidence Rules

- Evidence must be committed to the repo or linked from a durable project record.
- Test evidence must name the exact command, date, branch, and result.
- Security, wallet, ledger, deposit, withdrawal, trading, bot, and deployment evidence requires human review before it can be marked Approved.
- Secret values, private keys, wallet seeds, credentials, and production environment contents must never be pasted into evidence.
- Public-beta readiness cannot be marked Approved by an autonomous agent.

## Product And UX Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Sports-first MVP information architecture is defined. | `docs/reviews/MVP_INFORMATION_ARCHITECTURE.md` and route priority decisions. | Partial | PlannerAgent | No |
| Public sports homepage is implementation-ready. | `docs/reviews/SPORTS_HOMEPAGE_READINESS_CHECKLIST.md` plus future screenshots/tests. | Draft | FrontendAgent, TestingAgent | No |
| Market/event discovery is understandable. | Page review, copy glossary, public smoke tests, and mobile screenshots. | Draft | FrontendAgent, TestingAgent | No |
| Trade ticket states are specified. | `docs/reviews/ORDER_TICKET_ERROR_EMPTY_STATE_SPEC.md` and future UI/test evidence. | Draft | PlannerAgent, TestingAgent | No |
| Portfolio/account empty states are specified. | `docs/reviews/PORTFOLIO_EMPTY_STATE_TEST_PLAN.md` and future UI/test evidence. | Draft | TestingAgent | No |

## Public API And No-Leak Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Public taxonomy routes avoid sensitive fields. | `src/__tests__/public.taxonomy.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public event routes avoid sensitive fields. | `src/__tests__/public.events.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public sports routes avoid sensitive fields. | `src/__tests__/public.sports.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public market list/detail routes avoid sensitive fields. | Mocked or fixture-backed tests for `/api/markets` and `/api/markets/[id]`. | Missing | TestingAgent, SecurityAgent | Maybe, only if low-risk and mocked |
| Public quote/orderbook/trade-tape routes avoid sensitive fields. | Mocked read-only no-leak tests with no money movement. | Missing | TestingAgent, SecurityAgent | Maybe, only if low-risk and mocked |

## Admin And Security Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Admin route ownership is known. | `docs/reviews/API_ROUTE_OWNERSHIP_INVENTORY.md`. | Draft | SecurityAgent | No |
| Admin auth tests are scoped. | `docs/reviews/ADMIN_AUTH_TEST_MATRIX.md`. | Draft | SecurityAgent, TestingAgent | No |
| Admin auth behavior is tested. | Focused 401/403/admin-positive tests. | Missing | SecurityAgent, TestingAgent | No |
| Secret artifact risks are documented. | `docs/SECRET_ARTIFACT_AUDIT.md` and any follow-up audit notes. | Draft | SecurityAgent | No |
| Public responses avoid secrets. | No-leak tests for taxonomy, event, sports, market, quote, orderbook, and trade-tape routes. | Partial | SecurityAgent, TestingAgent | No |

## Wallet, Ledger, Deposit, And Withdrawal Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Canonical deposit architecture is decided. | Human-approved architecture decision. | Missing | LedgerWalletReviewerAgent, SecurityAgent | No |
| Funding gates are safe for beta. | Human-reviewed tests and runbook proving disabled/default-safe behavior. | Missing | LedgerWalletReviewerAgent, SecurityAgent | No |
| Balance changes are auditable. | Ledger invariant tests and reconciliation evidence. | Missing | LedgerWalletReviewerAgent, TestingAgent | No |
| Withdrawal states are safe. | Request, approval/rejection, lock/unlock, completion, and tx-hash evidence. | Missing | LedgerWalletReviewerAgent, SecurityAgent | No |
| Production private keys are protected. | Human-reviewed custody runbook and secret-handling evidence. | Missing | SecurityAgent, LedgerWalletReviewerAgent | No |

## Bot And Liquidity Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Bot dry-run/live separation is clear. | `docs/reviews/BOT_DRY_RUN_SAFETY_TEST_PLAN.md` and future tests. | Draft | BotAgent, SecurityAgent | No |
| Bot credentials are handled safely. | `docs/reviews/BOT_CREDENTIAL_HANDLING_REVIEW.md` and human-reviewed remediation evidence. | Draft | BotAgent, SecurityAgent | No |
| Bot operations have a runbook. | `docs/reviews/BOT_OPERATIONS_RUNBOOK_OUTLINE.md` and future completed runbook. | Draft | BotAgent, DeploymentAgent | No |
| Live bot launch controls are tested. | Kill switch, caps, allowlists, and dry-run tests. | Missing | BotAgent, TestingAgent | No |

## Deployment And Operations Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Required CI passes for dev/main. | Latest CI run and local validation command record. | Partial | TestingAgent | No |
| Deployment runbook is complete. | Human-reviewed production checklist and rollback plan. | Missing | DeploymentAgent | No |
| Production deployment remains human-only. | Agent operating rules and deployment docs. | Partial | LeadAgent, DeploymentAgent | No |
| Incident response is defined. | Funding, trading, admin, bot, and deployment incident runbooks. | Missing | SecurityAgent, DeploymentAgent | No |

## Recommended Evidence Collection Sequence

1. Add remaining low-risk public read no-leak tests using mocks.
2. Decide whether targeted public no-leak tests should be promoted into `npm run test:ci`.
3. Add public route/page smoke evidence for sports-first browsing.
4. Complete admin auth implementation scope before adding admin auth tests.
5. Complete bot dry-run implementation scope before adding bot behavior tests.
6. Keep wallet, ledger, deposit, withdrawal, matching, settlement, custody, and production deployment evidence human-reviewed.

## Non-Goals

This tracker does not:

- Implement tests or product features.
- Modify API contracts.
- Change UI.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, Prisma, migration, deployment, or production behavior.
- Authorize public beta.

## Validation For This Tracker

This tracker is docs-only. Validation for this PR should be:

```bash
git diff --check
```
