# Subagent Improvement Plan

This plan follows `docs/SUBAGENT_OPERATING_MODEL.md`, `docs/SUBAGENT_ROLES.md`, `docs/SUBAGENT_TASK_ROUTING.md`, and `docs/AGENT_TASK_BOARD.md`.

## Task Plan

| Order | Task | Goal | Subagent | Branch | Files Likely Affected | Forbidden Files/Areas | Risk | Human Review | Validation | Acceptance Criteria | Parallel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Update testing docs for dev/main CI | Fix stale CI documentation. | DocsAgent | `agent/<issue>-testing-docs-ci-dev-main` | `docs/TESTING.md` | Product code, finance logic | Low | No | `git diff --check` | Docs match current workflow triggers and commands. | Yes |
| 2 | Product IA proposal | Define final MVP nav: sports, events, market detail, portfolio, wallet. | PlannerAgent + FrontendAgent | `agent/<issue>-mvp-information-architecture` | `docs/reviews`, UX docs | Product code, wallet/ledger logic | Low | No | `git diff --check` | Clear proposed route hierarchy and hide/delay list. | Yes |
| 3 | Playwright public smoke baseline | Stabilize public smoke tests before UI redesign. | TestingAgent | `agent/<issue>-playwright-public-smoke` | `tests/e2e`, test docs | Product behavior, secrets, live services | Medium | Yes | selected Playwright, `npm run test:ci` | Public routes pass locally with documented env. | Partly |
| 4 | Sports page UX simplification | Make sports/World Cup discovery cleaner without trading logic changes. | FrontendAgent | `agent/<issue>-sports-discovery-simplification` | `src/app/sports/**`, `src/components/sports/**` | Trading APIs, wallet, ledger, admin auth | Low | No unless trading UI changes | `npx tsc`, screenshots, `npm run test:ci` | Sports routes are clearer, responsive, and tested. | After task 2 |
| 5 | Market detail retail trade-ticket plan | Plan simpler default trade flow. | PlannerAgent + FrontendAgent | `agent/<issue>-retail-trade-ticket-plan` | docs, maybe UI design notes | Matching, order APIs, ledger | Medium | Yes | `git diff --check` | Plan separates display changes from trading behavior changes. | Yes |
| 6 | Wallet beta-state UX plan | Define what wallet shows while funding is disabled. | SecurityAgent + FrontendAgent | `agent/<issue>-wallet-beta-state-plan` | docs/reviews, wallet UX doc | Wallet APIs, deposits, withdrawals, private keys | High | Yes | `git diff --check` | Plan lists hidden/enabled wallet sections and gates. | Yes |
| 7 | Canonical deposit decision | Decide Polygon per-user address vs legacy Base flow. | LedgerWalletReviewerAgent + SecurityAgent | `agent/<issue>-canonical-deposit-decision` | docs, deposit architecture docs | Production code unless approved, private keys | High | Yes | `git diff --check` | One canonical flow, legacy status, migration risks. | No |
| 8 | Admin auth route inventory | Inventory all admin routes and missing tests. | SecurityAgent + TestingAgent | `agent/<issue>-admin-auth-route-inventory` | docs, tests if approved | Admin auth implementation unless approved | High | Yes | `git diff --check`, focused Jest if tests added | Route matrix with expected 401/403/200 coverage. | Yes |
| 9 | Balance reconciliation CI smoke design | Design safe seeded reconciliation smoke. | LedgerWalletReviewerAgent + TestingAgent | `agent/<issue>-balance-reconciliation-smoke-design` | docs, tests if approved | Production DB, repair scripts | High | Yes | `git diff --check`, test command if added | Smoke plan is deterministic and non-destructive. | No |
| 10 | Wallet/deposit/withdrawal exposure gates | Add or plan explicit gates for money movement APIs and UI. | SecurityAgent + LedgerWalletReviewerAgent | `agent/<issue>-funding-exposure-gates` | config, wallet/deposit/withdraw routes/tests if approved | Private keys, matching, settlement | Critical | Yes | focused Jest, `npm run test:ci`, Prisma validate | Funding disabled by default in beta and tested. | No |
| 11 | Admin withdrawal hardening plan | Define two-step review, confirmations, and reconciliation for manual withdrawals. | LedgerWalletReviewerAgent + SecurityAgent | `agent/<issue>-withdrawal-admin-hardening-plan` | docs, admin tests if approved | Production money movement | Critical | Yes | `git diff --check`, focused Jest if tests added | Human ops checklist and test plan exist. | After task 7 |
| 12 | Bot dry-run risk controls inventory | Inventory bot live/dry-run, caps, allowlists, and kill switches. | BotAgent + SecurityAgent | `agent/<issue>-bot-risk-control-inventory` | docs, bot tests if package exists | Live trading, credentials | High | Yes | `git diff --check` | Bot controls are documented and gaps listed. | Yes |
| 13 | Portfolio/account simplification | Improve account home for positions and activity without financial logic changes. | FrontendAgent | `agent/<issue>-portfolio-account-simplification` | `src/app/portfolio`, UI components | Ledger/trading APIs | Medium | Yes | `npx tsc`, `npm run test:ci`, screenshots | Empty and populated states are clearer. | After task 2 |
| 14 | Admin operations IA | Split admin by content, finance, bots, system risk. | PlannerAgent + FrontendAgent | `agent/<issue>-admin-operations-ia` | docs, admin UI if approved | Financial operation logic | High | Yes | `git diff --check`, screenshots if UI | Admin risk areas are visually separated. | After task 8 |
| 15 | Secret artifact follow-up | Confirm tracked secret-looking files by filename only and plan cleanup. | SecurityAgent | `agent/<issue>-secret-artifact-followup` | docs, `.gitignore` if approved | Secret contents, deletion without approval | Critical | Yes | `git ls-files`, `git diff --check` | No secret contents printed; actions require human approval. | Yes |

## First Recommended Real Subagent Tasks

Start with low-risk, review-friendly work:

1. Update testing docs for dev/main CI.
2. Product IA proposal.
3. Playwright public smoke baseline.
4. Sports page UX simplification.

Do not start funding, ledger, matching, settlement, withdrawal, or bot live-trading implementation without explicit human-approved issue scope.
