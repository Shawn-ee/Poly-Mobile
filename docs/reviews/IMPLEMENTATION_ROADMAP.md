# Implementation Roadmap

## Phase 0: Safety And Review Foundation

Goal: Keep agent work controlled and reviewable.

Tasks:

- Keep PR #23, #24, and #26 foundations active on `dev`.
- Update stale testing docs.
- Convert this review into GitHub issues.
- Classify scripts as safe, read-only, test-only, repair, or production-dangerous.

Subagents: LeadAgent, DocsAgent, SecurityAgent.

Risks: Agents acting on unclear tasks or running unsafe scripts.

Validation: `git diff --check`, `npm run test:ci`.

Exit criteria: Issues exist with risk labels, branch names, validation commands, and human-review flags.

## Phase 1: UI Simplification And Information Architecture

Goal: Make the product simple and coherent before changing flows.

Tasks:

- Define primary nav and route hierarchy.
- Decide homepage vs markets vs sports responsibilities.
- Hide/delay pool-market surfaces for MVP.
- Standardize beta/test-credit copy.
- Fix encoding artifacts.

Subagents: PlannerAgent, FrontendAgent, DocsAgent.

Risks: Accidentally touching trading or wallet behavior.

Validation: Typecheck, screenshots, public Playwright smoke.

Exit criteria: Clear route hierarchy and no product behavior changes.

## Phase 2: Sports-First Market Experience

Goal: Make sports, soccer, and World Cup event discovery feel like the MVP.

Tasks:

- Improve `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup`.
- Improve event cards and empty states.
- Add league/tournament/event hierarchy.
- Add stable Playwright coverage.

Subagents: FrontendAgent, TestingAgent.

Risks: Market routing or event API changes.

Validation: Typecheck, `npm run test:ci`, focused Playwright, screenshots.

Exit criteria: Sports routes are clear, responsive, and covered by smoke tests.

## Phase 3: Trading Flow Polish

Goal: Make Yes/No trading understandable without weakening matching safety.

Tasks:

- Simplify trade ticket default mode.
- Collapse advanced order controls.
- Improve order confirmation, partial-fill, cancel, and disabled states.
- Improve market detail position/open-order panels.

Subagents: FrontendAgent, TestingAgent, LedgerWalletReviewerAgent for review.

Risks: Any trading API or order-ticket logic changes can affect real financial behavior.

Validation: Typecheck, `npm run test:ci`, order ticket tests, Playwright market smoke.

Exit criteria: UI changes are display-only or explicitly reviewed; trading tests pass.

## Phase 4: Portfolio/Account/Wallet Clarity

Goal: Give users a trustworthy account home.

Tasks:

- Redesign portfolio empty/populated states.
- Simplify wallet beta state.
- Hide disabled real-funding flows.
- Clarify available vs locked balances.

Subagents: FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent.

Risks: Wallet and balance display can mislead users.

Validation: Typecheck, `npm run test:ci`, wallet balance route tests, Playwright wallet/portfolio smoke.

Exit criteria: Funding disabled state is clear; no money movement changes without review.

## Phase 5: Admin And Operations Hardening

Goal: Make admin tools safer and more auditable.

Tasks:

- Inventory admin routes.
- Add unauthorized/forbidden tests.
- Separate admin content operations from financial operations.
- Add resolution preview design.
- Improve system monitor launch-blocking status.

Subagents: SecurityAgent, TestingAgent, FrontendAgent, DeploymentAgent.

Risks: Admin routes can mutate markets, settlement, deposits, and withdrawals.

Validation: Focused Jest, `npm run test:ci`, admin Playwright smoke.

Exit criteria: High-risk admin routes have auth tests and clear UI boundaries.

## Phase 6: Ledger/Wallet/Deposit/Withdrawal Safety Hardening

Goal: Prepare funding and financial state for real-money review.

Tasks:

- Choose canonical deposit architecture.
- Gate funding APIs and UI.
- Add deposit monitor reconciliation.
- Add withdrawal request/reject/complete tests.
- Add balance reconciliation CI smoke.
- Write custody/private-key runbook.

Subagents: LedgerWalletReviewerAgent, SecurityAgent, TestingAgent.

Risks: Critical real-money and custody risk.

Validation: Prisma validate/generate, focused integration tests, reconciliation smoke, human review.

Exit criteria: Human-approved funding architecture, passing reconciliation, no ambiguous legacy flow.

## Phase 7: Bot/Risk-Control Hardening

Goal: Keep automated liquidity safe and observable.

Tasks:

- Inventory bot package/location.
- Verify dry-run/live separation.
- Add market allowlist, caps, kill switch, and stale-data checks.
- Add bot CI without live trading.
- Improve admin bot monitor risk summary.

Subagents: BotAgent, SecurityAgent, TestingAgent.

Risks: Live bots can consume funds or create market risk.

Validation: Bot dry-run tests, `npm run test:ci`, risk-limit tests, no production credentials.

Exit criteria: Live trading disabled by default, controls tested, human ops approval required.

## Phase 8: Public Beta Readiness

Goal: Decide whether POLY can safely leave internal beta.

Tasks:

- Run full CI and Playwright smoke.
- Run reconciliation checks.
- Complete security and secret audit.
- Confirm funding gates and launch flags.
- Confirm admin runbooks.
- Confirm incident rollback plan.

Subagents: LeadAgent, SecurityAgent, TestingAgent, DeploymentAgent, LedgerWalletReviewerAgent.

Risks: Public launch risk across product, financial state, custody, operations, and compliance.

Validation: Required CI, reconciliation, admin smoke, deployment smoke on staging, human sign-off.

Exit criteria: Human-approved public beta checklist; no critical/high unmitigated financial or security risks.
