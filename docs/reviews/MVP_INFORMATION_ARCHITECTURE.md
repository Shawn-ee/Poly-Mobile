# MVP Information Architecture

This proposal defines the target information architecture for a simple sports-first POLY MVP. It is planning-only and does not implement UI, API, trading, wallet, admin, bot, or deployment changes.

## 1. Product North Star

POLY MVP should feel like a clean retail trading app while preserving the core prediction-market model:

- Simple sports-first prediction-market app.
- Easy market browsing through sports, events, and clear market cards.
- Clear Yes/No trading that does not require orderbook knowledge.
- Clear portfolio and account state for positions, open orders, activity, and balances.
- Beta-safe wallet, deposit, and withdrawal handling with no implication that public real-money funding is ready.
- Internal/admin operations clearly separated from the normal user experience.

The default user story should be: browse a sports event, understand the question, choose Yes or No, review the trade, place the order when eligible, and track the position.

## 2. Primary User Navigation

### Anonymous Users

Visible navigation:

- `Sports`: primary discovery path.
- `Markets`: secondary all-market browser.
- `Login`: sign-in entry.

Anonymous users should be able to browse markets and events, inspect prices/probabilities, and understand that trading requires login and beta eligibility.

### Logged-In Users

Visible navigation:

- `Sports`: primary discovery path.
- `Markets`: secondary all-market browser.
- `Portfolio`: account home for positions, open orders, and activity.
- `Wallet`: beta-safe balance and funding state.
- Account menu: profile/session actions.

Logged-in users should see one obvious next action on each page: browse, trade, review portfolio, or inspect account state.

### Admin Users

Visible navigation:

- Normal logged-in user navigation.
- `Admin`: visible only to authorized admins.

Admin pages should remain internal. Finance, bot, agent, system, and invariant tools must not appear in normal user navigation.

## 3. Route Classification

| Route | Classification | MVP Role | Recommendation |
|---|---|---|---|
| `/` | Primary MVP | Simple entry and discovery hub. | Simplify around sports-first discovery, beta state, and one primary CTA. |
| `/sports` | Primary MVP | Sports home and default discovery surface. | Keep and promote as the primary browsing route. |
| `/sports/soccer` | Primary MVP | Soccer discovery page. | Keep as the first sport-specific path. |
| `/sports/soccer/world-cup` | Primary MVP | World Cup campaign/tournament page. | Keep as the sports-first MVP showcase; remove demo framing in later UI work. |
| `/events/[slug]` | Primary MVP | Event detail and grouped market surface. | Redesign later as the main sports event screen. |
| `/markets/[id]` | Primary MVP | Core market/trade screen. | Keep; later simplify trade ticket and position/open-order panels. |
| `/portfolio` | Primary MVP | Account home for positions, orders, PnL, and activity. | Redesign after IA approval and smoke coverage. |
| `/login` | Primary MVP | Sign-in path. | Keep and polish copy later. |
| `/markets` | Secondary MVP | Advanced/all-market browser. | Keep secondary; avoid competing with sports as the default route. |
| `/events` | Secondary MVP | General event browser. | Keep secondary or consolidate into sports/event discovery after later design work. |
| `/wallet` | Secondary MVP / internal beta | Beta-safe balance and account funding state. | Keep visible for logged-in users, but frame as beta-safe and hide production funding until approved. |
| `/admin` | Admin-only | Market/content operations console. | Keep internal; separate routine content work from high-risk actions later. |
| `/admin/deposits` | Admin-only high risk | Deposit operations and reconciliation. | Keep internal; requires LedgerWalletReviewerAgent and SecurityAgent review before real funding. |
| `/admin/withdrawals` | Admin-only critical risk | Withdrawal operations. | Keep internal; requires human-reviewed hardening before real withdrawals. |
| `/admin/reference-markets` | Admin-only high risk | Reference market curation and bot setup. | Keep internal; split curation from bot/risk controls later. |
| `/admin/bots` | Admin-only high risk | Bot and market-making monitor. | Keep internal; emphasize dry-run/live separation in later work. |
| `/admin/agents` | Admin-only internal ops | Agent/orchestrator monitoring. | Keep internal; must not imply agents can merge or deploy automatically. |
| `/admin/system` | Admin-only high risk | System health/readiness console. | Keep internal; later map signals to pass/warn/block readiness. |
| `/admin/markets/[marketId]/invariants` | Admin-only high risk | Per-market invariant and reconciliation view. | Keep internal and test before public beta. |
| `/create` | Delayed/post-MVP | Private pool creation. | Hide or delay for public MVP; it is a separate product track. |
| `/my-pools` | Delayed/post-MVP | Private pool management. | Hide or delay for public MVP. |
| `/pool/[id]` | Candidate consolidation/removal | Legacy pool redirect to market detail. | Keep hidden for compatibility; do not surface in MVP navigation. |

## 4. Recommended User Journeys

### Anonymous Visitor

Target path: `/` or `/sports` -> sport/tournament page -> event detail -> market detail -> login prompt.

The visitor should understand what can be traded, what Yes/No prices mean, and why login is required. The product should not expose admin, bot, funding, or pool concepts.

### Logged-In Trader

Target path: `Sports` -> event -> market -> choose Yes/No -> review order -> submit -> see position/open order.

The default trade flow should be retail-first. Advanced orderbook concepts may exist, but they should not be required to understand the main action.

### Sports-First User

Target path: `/sports` -> `/sports/soccer` -> `/sports/soccer/world-cup` -> event detail.

Sports pages should favor event-first grouping: tournament, match/event, related markets, market status, and simple probability display.

### Portfolio-Checking User

Target path: `Portfolio` -> positions/open orders/activity -> market detail if needed.

Portfolio should become the account home. It should explain empty states, open orders, resolved markets, and current exposure without forcing the user into wallet or admin concepts.

### Beta Wallet User

Target path: `Wallet` -> available/locked/total balance -> test-credit state -> disabled or gated funding status.

Wallet must not imply public real-money launch readiness. Deposits and withdrawals should remain clearly disabled, gated, or request-only until human-approved funding architecture and reconciliation controls exist.

### Admin Operator

Target path: `Admin` -> content/market operations, finance operations, bot operations, system readiness.

Admin IA should separate routine content work from high-risk finance, settlement, bot, and system actions. High-risk admin actions require explicit confirmation, auditability, tests, and human review before public beta.

## 5. Simplification Rules

- Each normal user page should have one primary CTA.
- Yes/No trading must be understandable without orderbook knowledge.
- Wallet, deposit, and withdrawal pages must not imply real-money launch readiness during beta.
- Hide advanced, admin, bot, agent, and internal tools from normal users.
- Reduce duplicated market browsing paths; make sports/event discovery primary.
- Favor event-first sports grouping over isolated market lists.
- Use consistent terminology for test credits, dollars, probabilities, prices, available balance, locked balance, and total balance.
- Keep admin and high-risk operational surfaces visibly internal.

## 6. Page Priority Matrix

| Route | Action | Reason | Future Owner | Risk | Phase |
|---|---|---|---|---|---|
| `/` | Simplify | It duplicates discovery and should become a clean entry point. | FrontendAgent | Low | Phase 1 |
| `/markets` | Redesign | It should be secondary all-market browsing, not the main sports path. | FrontendAgent | Low | Phase 1 |
| `/markets/[id]` | Redesign | It is the core trade screen and needs a simpler retail trade hierarchy. | FrontendAgent + TestingAgent | Medium | Phase 3 |
| `/events` | Simplify/consolidate | It overlaps with sports discovery. | FrontendAgent | Low | Phase 1 |
| `/events/[slug]` | Redesign | It should become the main event-level sports trading surface. | FrontendAgent + TestingAgent | Medium | Phase 2 |
| `/sports` | Keep/promote | It is the clearest sports-first MVP entry. | FrontendAgent | Low | Phase 2 |
| `/sports/soccer` | Keep | It supports soccer-first discovery. | FrontendAgent | Low | Phase 2 |
| `/sports/soccer/world-cup` | Keep/redesign copy | It can anchor the World Cup MVP story. | FrontendAgent | Low | Phase 2 |
| `/wallet` | Simplify/harden | It mixes beta and real-funding concepts. | SecurityAgent + FrontendAgent | High | Phase 4 |
| `/portfolio` | Redesign | It should become the logged-in account home. | FrontendAgent | Medium | Phase 4 |
| `/login` | Keep/polish | It is necessary but needs clearer beta/account expectations. | FrontendAgent + SecurityAgent | Medium | Phase 1 |
| `/create` | Hide/delay | Private pools distract from sports orderbook MVP. | PlannerAgent | Medium | Phase 1 |
| `/my-pools` | Hide/delay | Private pool management is not MVP core. | PlannerAgent | Medium | Phase 1 |
| `/pool/[id]` | Keep hidden/consolidate | Legacy compatibility only. | DocsAgent | Low | Phase 1 |
| `/admin` | Keep internal/reorganize | Admin market actions are powerful and dense. | SecurityAgent + FrontendAgent | High | Phase 5 |
| `/admin/deposits` | Keep internal/harden | Deposit operations are critical financial infrastructure. | LedgerWalletReviewerAgent + SecurityAgent | Critical | Phase 6 |
| `/admin/withdrawals` | Keep internal/harden | Withdrawal operations are critical custody infrastructure. | LedgerWalletReviewerAgent + SecurityAgent | Critical | Phase 6 |
| `/admin/reference-markets` | Keep internal/split | Reference curation and bot controls should be separated. | BotAgent + SecurityAgent | High | Phase 7 |
| `/admin/bots` | Keep internal/harden | Bot live/dry-run and risk state must be explicit. | BotAgent + SecurityAgent | High | Phase 7 |
| `/admin/agents` | Keep internal | Agent monitoring should stay operational only. | DocsAgent + SecurityAgent | Medium | Phase 5 |
| `/admin/system` | Keep internal/harden | It should become launch-readiness status. | DeploymentAgent + SecurityAgent | High | Phase 5 |
| `/admin/markets/[marketId]/invariants` | Keep internal/test | Invariant checks are central to financial confidence. | LedgerWalletReviewerAgent | High | Phase 6 |

## 7. Future Subagent Tasks

### FrontendAgent

- Homepage simplification spec and implementation after IA approval.
- Sports discovery display polish for `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup`.
- Event detail redesign plan before touching `events/[slug]`.
- Portfolio/account mobile display spec before implementation.

### DocsAgent

- Beta copy and terminology map for test credits, probabilities, cents, dollars, USDC, deposits, withdrawals, available balance, and locked balance.
- Encoding artifact inventory for visible mojibake before copy fixes.
- Stale task board annotations after merged foundation tasks.

### TestingAgent

- Public Playwright smoke baseline for `/`, `/markets`, `/events`, `/sports`, `/sports/soccer/world-cup`, `/login`, `/portfolio`, and `/wallet`.
- Market detail smoke coverage before trade screen redesign.
- Portfolio/wallet smoke coverage before account UI changes.

### SecurityAgent

- Wallet beta-state review before any funding UI implementation.
- Admin route exposure review before admin IA changes.
- Account risk disclosure review before public beta copy changes.

### LedgerWalletReviewerAgent

- Canonical deposit architecture decision before any funding exposure gate implementation.
- Wallet/deposit/withdrawal review for any future UI that might imply real funds are enabled.
- Reconciliation and balance-state review before portfolio or wallet claims are made launch-blocking.

## 8. Acceptance Criteria For Future UI Redesign

Before FrontendAgent starts real UI implementation:

- This IA is accepted or superseded by a human-approved product decision.
- Public route smoke coverage is planned or available for the affected routes.
- Each UI task names the exact routes/components it may touch and the high-risk files it may not touch.
- Wallet/deposit/withdrawal work is limited to display-only beta-state changes unless human-reviewed funding architecture exists.
- Trade UI work is explicitly display-only or reviewed by LedgerWalletReviewerAgent if it can affect order behavior, balances, matching, settlement, or position state.
- Admin UI work is routed through SecurityAgent when it affects permissions, high-risk actions, finance operations, bot controls, or system readiness.
- PRs include screenshots or route-level evidence when UI changes are eventually implemented.

## 9. Non-Goals

This document does not implement:

- UI changes.
- Product code changes.
- API changes.
- Wallet, deposit, or withdrawal logic.
- Ledger, balance, matching, settlement, order, fill, trade, or position logic.
- Admin auth changes.
- Bot or live-trading changes.
- Deployment changes.
- Autonomous execution.
