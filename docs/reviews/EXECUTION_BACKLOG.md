# Execution Backlog

This backlog converts the full platform review into scoped subagent tasks. It is planning-only. High-risk financial, wallet, ledger, matching, settlement, admin-auth, bot-live-trading, deployment, and production-secret tasks require human review and are not eligible for automatic implementation.

## Risk And Automation Rules

- Low: Docs, planning, display-only UI, or read-only audits outside high-risk areas. Automation may be allowed.
- Medium: CI, tests, non-money API docs, portfolio/trading display planning, or UI work near trading/account surfaces. Human review may be required.
- High: Admin auth, wallet UX, funding gates, bot risk, reconciliation, trading-flow planning, or financial-invariant test design. Human review required.
- Critical: Wallet private keys, real deposits, withdrawals, ledger/balance mutation, matching, settlement, production config, or bot live trading. Planning/review only unless a human explicitly approves implementation.

Automation eligibility values:

- Automated: suitable for a subagent to implement from an approved issue.
- Assisted: subagent may implement, but PR requires human review before merge.
- Planning only: subagent may write docs/tests plans/inventories, not product logic.
- Blocked: do not execute until a human creates a specific approved issue.

## Product/UX

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| UX-001 | MVP information architecture proposal | `/`, `/markets`, `/events`, and sports routes overlap. | One recommended route hierarchy for sports-first MVP. | PlannerAgent | `agent/<issue>-mvp-information-architecture` | `docs/reviews/*`, product IA docs | Product code, API routes, wallet/trading logic | Low | No | Automated | Proposal names primary nav, hidden routes, delayed surfaces, and route ownership. | `git diff --check` | None | Yes | P0 |
| UX-002 | Homepage simplification spec | Homepage duplicates market board and mixes wallet/admin hints. | A concise homepage spec with logged-out/logged-in states. | PlannerAgent + FrontendAgent | `agent/<issue>-homepage-simplification-spec` | `docs/reviews/*`, UX docs | `src/app/page.tsx` unless later approved | Low | No | Automated | Spec defines purpose, CTA hierarchy, empty/loading/error states, and mobile layout. | `git diff --check` | UX-001 | Yes | P1 |
| UX-003 | Hide/delay private pools decision | Pool markets are a separate product track from sports orderbook MVP. | Decision note for whether `/create`, `/my-pools`, and pool routes stay internal/delayed. | PlannerAgent | `agent/<issue>-pool-surface-decision` | docs | Pool business logic, pool settlement, Prisma schema | Medium | Yes | Planning only | Decision lists user-visible changes, dependencies, and required future PRs. | `git diff --check` | UX-001 | Yes | P1 |
| UX-004 | Beta copy and terminology map | U credits, dollars, USDC, cents, Base, and Polygon are inconsistent. | Product copy glossary for test credits, prices, balances, and funding state. | DocsAgent + FrontendAgent | `agent/<issue>-beta-copy-terminology-map` | docs, copy inventory | Product code unless later approved; wallet APIs | Low | No | Automated | Glossary and page-by-page copy guidance exist. | `git diff --check` | UX-001 | Yes | P1 |

## Frontend/UI

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FE-001 | Sports discovery display polish | Sports pages are strongest MVP path but need cleaner hierarchy. | Display-only sports route improvements after IA is approved. | FrontendAgent | `agent/<issue>-sports-discovery-display-polish` | `src/app/sports/**`, `src/components/sports/**` | Trading APIs, wallet, ledger, matching, admin auth | Low | No unless trading UI changes | Assisted | `/sports`, soccer, and World Cup pages have clearer event hierarchy and states. | `npx tsc --noEmit --pretty false --incremental false`, `npm run test:ci`, screenshots | UX-001, TST-002 | Yes | P1 |
| FE-002 | Event page component split plan | `events/[slug]` handles generic, sports, and grouped views in one large component. | Implementation-ready plan to split views safely. | FrontendAgent + PlannerAgent | `agent/<issue>-event-page-split-plan` | docs, component plan | `src/app/events/[slug]/page.tsx` unless approved | Medium | Yes | Planning only | Plan defines target components, props, no behavior changes, and tests. | `git diff --check` | UX-001 | Yes | P1 |
| FE-003 | Portfolio mobile card spec | Portfolio tables need clearer empty and mobile states. | Display spec for positions, open orders, activity, and resolved state. | FrontendAgent | `agent/<issue>-portfolio-mobile-card-spec` | docs/reviews, UX docs | Portfolio API, ledger, position logic | Medium | Yes | Planning only | Spec covers empty, loading, error, populated, and mobile states. | `git diff --check` | UX-001 | Yes | P2 |
| FE-004 | Encoding artifact inventory | Mojibake appears in wallet/trade strings. | Inventory of visible encoding artifacts with exact strings and pages. | DocsAgent | `agent/<issue>-encoding-artifact-inventory` | docs/reviews, issue report | Product code edits | Low | No | Automated | Inventory lists affected pages/components and proposed replacements. | `git diff --check` | None | Yes | P1 |

## Backend/API

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| API-001 | API route ownership inventory | API surface is large and ownership boundaries are unclear. | Route inventory grouped by public, account, trading, wallet, admin, bot, agent, legacy. | RepoInspectorAgent + DocsAgent | `agent/<issue>-api-route-ownership-inventory` | docs/reviews, API inventory docs | API implementation, auth logic | Medium | Yes | Automated | Inventory identifies canonical, legacy, high-risk, and test-required routes. | `git diff --check` | None | Yes | P0 |
| API-002 | Canonical trading API decision note | Multiple order/trading endpoints exist. | Decision note naming canonical order endpoints and legacy candidates. | BackendAgent + LedgerWalletReviewerAgent | `agent/<issue>-canonical-trading-api-decision` | docs | Order APIs, matching, ledger | High | Yes | Planning only | Decision is read-only and does not change routes. | `git diff --check` | API-001 | Yes | P2 |
| API-003 | Non-financial read API cleanup plan | Some read-only routes need ownership and response-shape docs. | Plan for stable market/event/sports read APIs. | BackendAgent | `agent/<issue>-market-read-api-cleanup-plan` | docs | Money routes, admin auth, matching | Medium | Yes | Planning only | Plan lists read APIs and no financial mutations. | `git diff --check` | API-001 | Yes | P2 |

## Trading Flow

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TRD-001 | Retail trade ticket design plan | Current ticket exposes advanced market/limit and bid/ask concepts. | Plan for simple default Yes/No trade review with advanced controls hidden. | PlannerAgent + FrontendAgent | `agent/<issue>-retail-trade-ticket-plan` | docs/reviews, UI design docs | Order APIs, matching, ledger, `orderTicketLogic` implementation | Medium | Yes | Planning only | Plan separates display-only changes from trading behavior changes. | `git diff --check` | UX-001, TST-002 | Yes | P1 |
| TRD-002 | Order cancel UX/test plan | Cancel flow lacks clear pending/error/partial-fill states. | Plan for cancel UX and test cases without changing matching. | TestingAgent + LedgerWalletReviewerAgent | `agent/<issue>-order-cancel-ux-test-plan` | docs, test plan | Matching implementation, ledger, order cancel API | High | Yes | Planning only | Plan covers cancel pending, partial fill, unlock, and failure states. | `git diff --check` | TST-003 | Yes | P2 |
| TRD-003 | Settlement transparency plan | Users need clearer resolution/settlement state. | Plan user-facing resolved/settled market states and admin preview needs. | LedgerWalletReviewerAgent + FrontendAgent | `agent/<issue>-settlement-transparency-plan` | docs | Settlement code, Prisma schema, payouts | High | Yes | Planning only | Plan defines states and required invariant tests. | `git diff --check` | API-001 | No | P3 |

## Portfolio/Account

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ACC-001 | Portfolio/account IA spec | Portfolio should be the account home but lacks hierarchy. | Spec for positions, open orders, activity, PnL, and resolved markets. | PlannerAgent + FrontendAgent | `agent/<issue>-portfolio-account-ia-spec` | docs/reviews | Portfolio API, ledger, positions logic | Medium | Yes | Planning only | Spec includes empty, loading, error, desktop, and mobile states. | `git diff --check` | UX-001 | Yes | P1 |
| ACC-002 | Wallet beta-state UX plan | Wallet mixes disabled copy with funding controls. | Plan exact internal-beta wallet display and disabled states. | SecurityAgent + FrontendAgent | `agent/<issue>-wallet-beta-state-plan` | docs/reviews | Wallet APIs, deposits, withdrawals, private keys | High | Yes | Planning only | Plan lists visible/hidden sections and required exposure gates. | `git diff --check` | UX-004 | Yes | P1 |
| ACC-003 | Account risk disclosure spec | Test-credit and prediction-risk disclosures are inconsistent. | Consistent disclosure spec for wallet, trade, portfolio, and login. | DocsAgent + SecurityAgent | `agent/<issue>-account-risk-disclosure-spec` | docs | Product code, legal/compliance claims beyond repo | Medium | Yes | Automated | Spec gives concise copy and placement guidance. | `git diff --check` | UX-004 | Yes | P2 |

## Wallet/Deposit/Withdrawal

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WDW-001 | Canonical deposit architecture decision | Legacy Base verification and Polygon per-user addresses coexist. | Human-reviewed decision naming canonical flow and legacy status. | LedgerWalletReviewerAgent + SecurityAgent | `agent/<issue>-canonical-deposit-decision` | docs | Deposit code, wallet private keys, Prisma schema | High | Yes | Planning only | Decision covers chain/token, QR/address flow, legacy treatment, and launch blockers. | `git diff --check` | API-001 | No | P0 |
| WDW-002 | Funding exposure gates plan | Funding APIs/UI need explicit beta/public gates. | Plan for gate names, default disabled state, tests, and rollout. | SecurityAgent + LedgerWalletReviewerAgent | `agent/<issue>-funding-exposure-gates-plan` | docs | Config implementation, wallet/deposit/withdrawal routes | Critical | Yes | Planning only | Plan blocks automatic implementation and defines future test matrix. | `git diff --check` | WDW-001 | No | P0 |
| WDW-003 | Withdrawal ops hardening plan | Manual withdrawal completion needs stronger operational controls. | Runbook/test plan for request, approval, reject, complete, reconciliation. | LedgerWalletReviewerAgent + SecurityAgent | `agent/<issue>-withdrawal-ops-hardening-plan` | docs | Withdrawal services/routes/admin UI | Critical | Yes | Planning only | Plan requires tx hash, audit notes, rejection unlock, and human approval. | `git diff --check` | WDW-001 | No | P1 |
| WDW-004 | Deposit custody runbook outline | Generated deposit private keys need custody and rotation rules. | Runbook outline for encryption, sweep, access, rotation, incident response. | SecurityAgent + LedgerWalletReviewerAgent | `agent/<issue>-deposit-custody-runbook-outline` | docs | Private key handling code, secrets | Critical | Yes | Planning only | No secrets printed; runbook lists required human decisions. | `git diff --check` | WDW-001 | No | P1 |

## Admin/Operations

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ADM-001 | Admin auth route inventory | Large admin route surface lacks complete auth matrix. | Route inventory with expected 401/403/admin behavior and missing tests. | SecurityAgent + TestingAgent | `agent/<issue>-admin-auth-route-inventory` | docs, optional test plan | Admin auth implementation, admin mutation code | High | Yes | Planning only | Matrix covers all `/api/admin/**` routes and page access. | `git diff --check` | API-001 | Yes | P0 |
| ADM-002 | Admin operations IA plan | High-risk admin actions sit near routine market editing. | Plan to separate content, finance, bots, system, and agents. | PlannerAgent + SecurityAgent | `agent/<issue>-admin-operations-ia-plan` | docs | Admin UI implementation, financial operations | High | Yes | Planning only | Plan defines admin sections and risk labels. | `git diff --check` | ADM-001 | Yes | P1 |
| ADM-003 | System monitor readiness checklist | `/admin/system` should express launch-blocking status. | Checklist for health, config, reconciliation, funding, bots, and deployment readiness. | DeploymentAgent + SecurityAgent | `agent/<issue>-system-monitor-readiness-checklist` | docs | Deployment config, production services | High | Yes | Planning only | Checklist maps each signal to pass/warn/block. | `git diff --check` | WDW-001, TST-003 | Yes | P2 |

## Bot/Risk Controls

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BOT-001 | Bot package/location inventory | Task board references `poly-bot`, but checkout did not show that package. | Inventory actual bot code, scripts, services, tests, and missing package assumptions. | BotAgent + RepoInspectorAgent | `agent/<issue>-bot-package-location-inventory` | docs | Live bot trading, credentials | Medium | Yes | Automated read-only | Inventory names current bot assets and stale references. | `git diff --check`, `rg --files` | None | Yes | P1 |
| BOT-002 | Bot live/dry-run risk-control plan | Live/dry-run and risk limits need launch-blocking proof. | Plan for allowlists, caps, kill switch, stale-data checks, and CI dry-run tests. | BotAgent + SecurityAgent | `agent/<issue>-bot-risk-control-plan` | docs | Live trading code, credentials, liquidity changes | High | Yes | Planning only | Plan forbids live execution and defines future safe tests. | `git diff --check` | BOT-001 | Yes | P1 |
| BOT-003 | Reference liquidity UX boundary plan | User pages can leak bot/reference internals. | Plan for what stays admin-only vs user-visible liquidity summary. | BotAgent + FrontendAgent | `agent/<issue>-reference-liquidity-ux-boundary` | docs | User trading behavior, bot live orders | Medium | Yes | Planning only | Plan defines public/admin display boundaries. | `git diff --check` | UX-001, BOT-001 | Yes | P2 |

## Testing/CI

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TST-001 | Update testing docs for dev/main CI | `docs/TESTING.md` is stale about CI branch triggers. | Testing docs match actual CI workflow. | DocsAgent | `agent/<issue>-testing-docs-ci-dev-main` | `docs/TESTING.md` | Product code, workflow changes unless requested | Low | No | Automated | Docs mention PR/push to dev/main and current `test:ci`. | `git diff --check` | None | Yes | P0 |
| TST-002 | Playwright public smoke baseline | UI redesign needs stable public route smoke tests first. | Safe smoke spec or tests for public routes without production credentials. | TestingAgent | `agent/<issue>-playwright-public-smoke` | `tests/e2e/**`, docs | Product logic, secrets, live services | Medium | Yes | Assisted | Public pages render or expected empty states are documented/tested. | selected Playwright, `npm run test:ci` | UX-001 | Yes | P0 |
| TST-003 | Reconciliation smoke design | Balance/market/withdrawal reconciliation is not launch-blocking. | Non-destructive seeded reconciliation smoke design. | TestingAgent + LedgerWalletReviewerAgent | `agent/<issue>-reconciliation-smoke-design` | docs | Production DB, repair scripts, ledger code | High | Yes | Planning only | Design names fixtures, commands, failure behavior, and CI criteria. | `git diff --check` | WDW-001 | No | P1 |
| TST-004 | Admin auth test matrix | Admin route auth coverage is incomplete. | Test matrix and first low-risk unauthorized/forbidden test scope. | TestingAgent + SecurityAgent | `agent/<issue>-admin-auth-test-matrix` | docs, tests if approved | Admin auth implementation, financial operations | High | Yes | Planning only | Matrix maps routes to existing/missing coverage. | `git diff --check`, focused Jest if tests added | ADM-001 | Yes | P1 |
| TST-005 | Broad suite stabilization plan | Broad Jest/Vitest suites are not CI-safe. | Plan to split CI-safe tests from known unstable suites. | TestingAgent | `agent/<issue>-broad-suite-stabilization-plan` | docs, test docs | Product logic | Medium | Yes | Automated | Plan lists suites, blockers, and required commands. | `git diff --check` | TST-001 | Yes | P2 |

## Documentation

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DOC-001 | Script safety classification | Scripts include reconcile, repair, seed, simulation, monitor, and deployment commands. | Docs classify scripts as safe read-only, test-only, mutating local, repair, production-dangerous. | DocsAgent + SecurityAgent | `agent/<issue>-script-safety-classification` | docs | Running scripts, production data, secrets | High | Yes | Planning only | Classification forbids destructive agent use without human approval. | `git diff --check` | API-001 | Yes | P0 |
| DOC-002 | Review-to-issues conversion guide | Review findings need GitHub issue shape. | Guide for turning backlog tasks into issues with labels, branch names, validation. | DocsAgent | `agent/<issue>-review-to-issues-guide` | docs | Product code | Low | No | Automated | Guide includes issue template usage and risk labels. | `git diff --check` | None | Yes | P1 |
| DOC-003 | Stale task board cleanup proposal | Some foundation tasks are already completed by PRs #23, #24, #26. | Proposed stale/completed annotations without deleting history. | DocsAgent | `agent/<issue>-task-board-stale-annotations` | `docs/AGENT_TASK_BOARD.md` | Product code | Low | No | Automated | Board links to review backlog and marks stale candidates. | `git diff --check` | None | Yes | P0 |

## Deployment/Readiness

| Task ID | Title | Problem | Desired Outcome | Assigned Subagent | Suggested Branch | Affected Files | Forbidden Files | Risk | Human Review | Automation | Acceptance Criteria | Validation | Dependencies | Parallel | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DEP-001 | Public beta readiness checklist | Launch readiness spans product, safety, CI, funding, bots, and deployment. | Human-approved checklist for internal beta exit and public beta entry. | DeploymentAgent + SecurityAgent | `agent/<issue>-public-beta-readiness-checklist` | docs | Deployment execution, production config, secrets | High | Yes | Planning only | Checklist has pass/warn/block criteria and owner per item. | `git diff --check` | ADM-003, TST-003, WDW-001 | No | P2 |
| DEP-002 | Production runbook gap inventory | Deployment docs exist but operational gaps remain. | Inventory runbook gaps for Windows local vs Linux production, rollback, logs, service ownership. | DeploymentAgent | `agent/<issue>-production-runbook-gap-inventory` | docs | Production service changes, systemd enable/start | High | Yes | Planning only | Inventory does not deploy and lists human-only operations. | `git diff --check` | DOC-001 | Yes | P2 |
| DEP-003 | Incident response outline | No unified incident response checklist for funding/trading/admin/bot issues. | Draft incident response outline with escalation paths. | SecurityAgent + DeploymentAgent | `agent/<issue>-incident-response-outline` | docs | Production changes, secrets | High | Yes | Planning only | Outline covers halt, communicate, reconcile, recover, postmortem. | `git diff --check` | DEP-001 | Yes | P3 |
