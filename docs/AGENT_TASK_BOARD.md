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
