# Account Risk Disclosure Spec

Task id: ACC-003
Assigned subagents: PlannerAgent, DocsAgent, SecurityAgent
Risk level: Medium
Status: Review and planning only

## Purpose

POLY needs account, portfolio, wallet, and trading copy that is clear enough for a simple retail experience while still being honest about prediction-market risk and beta limitations. This spec defines disclosure requirements for future UI work. It does not implement UI, wallet, deposit, withdrawal, ledger, matching, settlement, or trading changes.

## Product Principle

Risk copy should be visible, plain, and contextual. Users should understand that prediction-market positions can lose value, prices are probabilities rather than guarantees, and beta funding flows may be restricted before public launch.

The product should avoid legalistic clutter in primary screens, but it must not hide material risk behind advanced menus or admin-only language.

## Required Disclosure Themes

Future user-facing copy should consistently cover:

- Prediction-market positions can lose value.
- A `Yes` or `No` price is an implied market probability, not a promise.
- Liquidity may be limited, especially in beta or sports-first launch markets.
- Open orders may reserve funds until filled or canceled.
- Settled outcomes depend on market resolution rules.
- Beta wallet/funding flows may be manual, restricted, mocked, or unavailable until explicitly launched.
- Deposits and withdrawals must not imply public real-money readiness until the funding architecture is approved.
- Admin, bot, reference market, and invariant tooling is internal and should not be presented as normal user functionality.

## Route-Level Disclosure Guidance

### `/`

- Keep the primary message simple: browse markets, make a prediction, track positions.
- Avoid implying public real-money launch readiness.
- If funding is restricted, use beta-safe language such as "internal beta" or "limited access" near account actions.

### `/markets` and `/events`

- Show market status clearly: open, paused, resolved, canceled, or beta-only.
- Avoid advanced exchange terms as the first explanation for new users.
- Price/probability language should be consistent across cards.

### `/markets/[id]` and `/events/[slug]`

- The trade area should explain the selected side, estimated cost, potential payout, and maximum loss before submission.
- Open-order behavior should state that funds may be locked while an order is open.
- Settlement state should be explicit if the market is resolved or pending resolution.

### `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup`

- Favor event-first grouping and clear match/tournament status.
- If odds or reference data are shown, avoid implying that external reference prices guarantee POLY liquidity or outcomes.

### `/portfolio`

- Separate available balance, locked balance, open orders, positions, and realized/unrealized outcomes.
- The page should not require orderbook knowledge to understand account state.
- Empty states should explain the next safe action, such as browsing markets.

### `/wallet`

- Funding copy must remain beta-safe until the canonical deposit and withdrawal architecture is approved.
- Do not present mock, manual, legacy, or test flows as production-ready money movement.
- Withdrawal states should be understandable before implementation: requested, under review, approved/rejected, submitted, completed, or failed.

### `/login`

- Keep sign-in copy direct and minimal.
- Avoid implying account funding is available before wallet policy is approved.

## Trade Ticket Disclosure Requirements

Before a future trade ticket redesign ships, the ticket should make these fields clear:

- Selected market and outcome.
- Side: `Yes` or `No`.
- Estimated cost.
- Estimated shares/contracts.
- Maximum loss.
- Potential payout if the outcome resolves favorably.
- Whether the order is immediate or may rest open.
- Whether funds will become locked.
- Confirmation step before submission.

Advanced order controls may exist, but they should not be required for a simple first trade.

## Portfolio And Balance Disclosure Requirements

Future account surfaces should clearly distinguish:

- Available balance: usable for new orders or withdrawals if withdrawals are enabled.
- Locked balance: reserved for open orders, withdrawals under review, or other pending operations.
- Positions: current exposure by market and outcome.
- Open orders: orders that can still fill or be canceled.
- Settlement state: unresolved, pending resolution, resolved, paid, or disputed if such states exist.

If any of these values are unavailable or not production-ready, the UI should say so explicitly rather than showing ambiguous placeholders.

## Beta Wallet Language Rules

Until funding architecture is approved:

- Use "beta funding" or "internal beta wallet" rather than production launch language.
- Do not claim deposits are instant unless the production monitor and reconciliation policy are approved.
- Do not claim withdrawals are automatic unless the production withdrawal flow is approved.
- Do not show private keys, raw secret identifiers, or privileged custody details.
- Mark legacy deposit flows as legacy, internal, or disabled if they remain visible.

## Admin And Internal Tool Boundaries

Risk copy for admins should be operational rather than promotional:

- Mutating admin actions should state the action, target, expected state change, and rollback limitations.
- Bot or liquidity actions should state whether they are dry-run, simulation, local-only, or production-affecting.
- Financial admin actions should require explicit human approval and audit trail before implementation.

Normal users should not see admin, bot, reference-market, invariant, or agent-supervisor concepts as part of the main product flow.

## Copy Tone Guidelines

Use:

- Short sentences.
- Direct labels.
- Consistent terms for balance, positions, orders, and outcomes.
- Beta-safe wording where funding is not public-ready.

Avoid:

- Overpromising liquidity, payout timing, or deposit speed.
- Exchange jargon without explanation.
- Legal-only warnings that do not explain user impact.
- Copy that makes mock, manual, or legacy flows look production-ready.

## Future Subagent Tasks

1. `ACC-004 - Account Copy Inventory`
   - Inventory existing wallet, portfolio, market, and trade copy.
   - Docs-only.
   - Risk: Low.

2. `FE-005 - Display-Only Risk Copy Placement Plan`
   - Propose where risk copy should appear in the future UI.
   - Docs-only.
   - Risk: Medium.

3. `SEC-002 - Funding Claim Review`
   - Review wallet and funding text for claims that imply production readiness.
   - Docs-only review first.
   - Risk: Medium.

4. `TRD-002 - Trade Confirmation Copy Spec`
   - Define exact confirmation language for Yes/No order review.
   - Docs-only before implementation.
   - Risk: Medium.

## Non-Goals

This document does not:

- Change UI code.
- Change account, wallet, deposit, withdrawal, ledger, matching, settlement, or trading logic.
- Change auth, admin permissions, bot behavior, deployment, CI, package scripts, Prisma schema, or migrations.
- Approve public real-money launch.
- Replace legal review.

## Validation For This Spec

This spec is docs-only. Validation for this PR should be:

```bash
git diff --check
```
