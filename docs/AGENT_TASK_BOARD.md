# Agent Task Board

This board is seeded from the architecture inspection and should be converted into GitHub issues before agents begin implementation.

| Task | Risk | Branch | Goal | Files Likely Affected | Validation Commands | Human Review |
|---|---|---|---|---|---|---|
| Align CI with dev branch | Medium | `agent/<issue>-ci-dev-targets` | Run required CI for PRs and pushes to both `dev` and `main`. | `.github/workflows/ci.yml` | `git diff --check`, `npm run test:ci` | Yes |
| Add GitHub PR/issue templates | Low | `agent/<issue>-github-templates` | Standardize issue intake and PR risk reporting. | `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*` | `git diff --check` | No |
| Secret artifact audit | Critical | `agent/<issue>-secret-artifact-audit` | Identify tracked secret-looking artifacts by filename and propose safe handling. | docs, `.gitignore` if approved | `git ls-files`, secret scan | Yes |
| Canonical deposit architecture decision | High | `agent/<issue>-canonical-deposit-decision` | Decide whether Polygon per-user addresses are canonical and mark legacy Base flows. | docs, deposit route comments if approved | docs review, focused route tests if code changes | Yes |
| Wallet/deposit/withdrawal API exposure gates | Critical | `agent/<issue>-wallet-api-exposure-gates` | Add explicit environment gates for money-movement APIs while beta UI is disabled. | `src/lib/config.ts`, wallet/deposit/withdrawal routes, tests | `npx tsc --noEmit`, focused Jest | Yes |
| Ledger ownership map | High | `agent/<issue>-ledger-ownership-map` | Document every balance-changing path and its ledger operation. | docs, service inventory | `git diff --check` | Yes |
| Balance reconciliation CI smoke test | High | `agent/<issue>-balance-reconciliation-ci` | Add safe seeded reconciliation smoke coverage. | scripts, tests, CI | Prisma test DB, reconciliation command, `npm run test:ci` | Yes |
| Bot package CI | Medium | `agent/<issue>-poly-bot-ci` | Add CI checks for `poly-bot` typecheck/build without live trading. | `.github/workflows/*`, `poly-bot/package.json` | `npm run typecheck`, `npm run build` in `poly-bot` | Yes |
| Admin auth test coverage | High | `agent/<issue>-admin-auth-tests` | Expand unauthorized/forbidden/admin-positive route tests. | `src/__tests__`, admin routes if needed | focused Jest, `npm run test:ci` | Yes |
| Playwright smoke stabilization | Medium | `agent/<issue>-playwright-smoke-baseline` | Make public/admin/sports smoke tests repeatable before CI inclusion. | `tests/e2e`, Playwright docs | selected Playwright commands | Yes |
| Sports UI redesign | Low | `agent/<issue>-sports-ui-redesign` | Continue UI polish for sports event pages without trading logic changes. | `src/app/sports`, `src/components/sports`, CSS | `npx tsc --noEmit`, screenshots, focused Playwright | No, unless trading UI changes |
| Withdrawal admin flow hardening | Critical | `agent/<issue>-withdrawal-admin-hardening` | Harden admin review, completion, rejection, and audit reporting. | withdrawal services/routes/admin UI/tests | focused Jest, reconciliation, auth tests | Yes |
| Deposit monitor reconciliation hardening | Critical | `agent/<issue>-deposit-monitor-reconciliation` | Improve monitor observability and reconciliation for Polygon deposits. | deposit monitor, deposit services, scripts/tests | deposit harness, reconciliation, Prisma validate | Yes |

## Review-Derived Backlog Candidates

The full platform review has been converted into:

- `docs/reviews/EXECUTION_BACKLOG.md`
- `docs/reviews/NEXT_10_SUBAGENT_TASKS.md`

The table above is retained for history. Some foundation tasks are now stale because they were addressed by merged workflow PRs:

- `Align CI with dev branch`: stale/completed by the agentic workflow foundation.
- `Add GitHub PR/issue templates`: stale/completed by the agentic workflow foundation.
- `Sports UI redesign`: superseded by more specific review-derived IA, smoke, and sports-discovery tasks below.

### Automation-Safe Or Low-Risk Candidates

| Task | Risk | Branch | Goal | Files Likely Affected | Validation Commands | Human Review |
|---|---|---|---|---|---|---|
| Update testing docs for dev/main CI | Low | `agent/<issue>-testing-docs-ci-dev-main` | Align `docs/TESTING.md` with current CI triggers and commands. | `docs/TESTING.md` | `git diff --check` | No |
| MVP information architecture proposal | Low | `agent/<issue>-mvp-information-architecture` | Define the sports-first route hierarchy and hidden/delayed surfaces before UI implementation. | docs/reviews, UX docs | `git diff --check` | No |
| Task board stale annotations | Low | `agent/<issue>-task-board-stale-annotations` | Mark stale foundation tasks without deleting history and link to review-derived backlog docs. | `docs/AGENT_TASK_BOARD.md` | `git diff --check` | No |
| Encoding artifact inventory | Low | `agent/<issue>-encoding-artifact-inventory` | Inventory mojibake and inconsistent visible strings before copy fixes. | docs/reviews, issue report | `git diff --check` | No |
| Playwright public smoke baseline | Medium | `agent/<issue>-playwright-public-smoke` | Stabilize safe public-route smoke coverage before UI redesign. | `tests/e2e`, test docs | selected Playwright, `npm run test:ci`, `git diff --check` | Yes |

### Human-Review-Required Candidates

| Task | Risk | Branch | Goal | Files Likely Affected | Validation Commands | Human Review |
|---|---|---|---|---|---|---|
| API route ownership inventory | Medium | `agent/<issue>-api-route-ownership-inventory` | Classify public, account, trading, wallet, admin, bot, agent, canonical, and legacy routes. | docs/reviews, API inventory docs | `git diff --check` | Yes |
| Script safety classification | High | `agent/<issue>-script-safety-classification` | Classify scripts as read-only, test-only, local-mutating, repair, deployment, monitor, or production-dangerous. | docs | `git diff --check` | Yes |
| Retail trade ticket design plan | Medium | `agent/<issue>-retail-trade-ticket-plan` | Plan a simple default Yes/No trade review without touching matching or order APIs. | docs/reviews, UI design docs | `git diff --check` | Yes |
| Canonical deposit architecture decision | High | `agent/<issue>-canonical-deposit-decision` | Decide canonical funding architecture and legacy deposit handling. | docs | `git diff --check` | Yes |
| Admin auth route inventory | High | `agent/<issue>-admin-auth-route-inventory` | Map all admin routes to required unauthorized, forbidden, and admin-positive coverage. | docs, optional test plan | `git diff --check` | Yes |
| Funding exposure gates plan | Critical | `agent/<issue>-funding-exposure-gates-plan` | Plan explicit wallet/deposit/withdrawal UI and API gates; implementation requires later human approval. | docs | `git diff --check` | Yes |
