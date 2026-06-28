# Portfolio Mobile Card Spec

Task id: FE-003
Assigned subagents: FrontendAgent, PlannerAgent, LedgerWalletReviewerAgent
Risk level: Medium
Status: Planning only

## Purpose

The portfolio page should become the user's clear account home for positions, open orders, activity, and resolved market history. This spec defines a future mobile-first card structure without changing UI code, portfolio APIs, ledger logic, order logic, positions, balances, settlement, or wallet behavior.

## Product Principle

Portfolio should answer four questions quickly:

1. What do I own?
2. What is still open or locked?
3. What changed recently?
4. What can I safely do next?

The mobile experience should not require users to read dense tables, understand orderbook internals, or infer account state from ambiguous balances.

## Information Hierarchy

Future portfolio UI should prioritize:

1. Account summary.
2. Active positions.
3. Open orders.
4. Recent activity.
5. Resolved positions/history.

Advanced details can be available through expandable rows or secondary pages, but the default mobile view should stay compact and readable.

## Account Summary Card

Purpose:

- Give a fast, plain-language account snapshot.

Recommended fields:

- Available balance.
- Locked balance.
- Total position exposure.
- Open order count.
- Beta wallet/funding status if relevant.

Required states:

- Loading.
- Signed out.
- Empty account.
- Loaded account.
- Error/unavailable.
- Beta funding disabled.

Rules:

- Available and locked balances must be clearly separated.
- If a value is unavailable, show an unavailable state rather than a misleading zero.
- Do not imply withdrawal availability unless the withdrawal flow is approved.

## Active Position Cards

Purpose:

- Show current Yes/No exposure in unresolved markets.

Recommended fields:

- Market title.
- Event/sport context if available.
- Selected outcome.
- Shares/contracts or equivalent exposure.
- Average price if available.
- Current displayed price/probability if available.
- Estimated current value if reliable.
- Market status.
- Link to market or event detail.

Required states:

- No active positions.
- Active market.
- Paused market.
- Resolved but unpaid/pending state if represented.
- Data unavailable.

Rules:

- Do not show estimated value if the value is not reliable.
- Label estimates clearly.
- Avoid implying settlement has completed before it has.

## Open Order Cards

Purpose:

- Help users understand funds reserved for unfilled or partially filled orders.

Recommended fields:

- Market title.
- Outcome side.
- Order side and type in plain language.
- Remaining quantity.
- Limit price if applicable.
- Locked amount.
- Created time.
- Cancel availability/status.

Required states:

- No open orders.
- Pending cancel.
- Partially filled.
- Filled.
- Canceled.
- Cancel failed or unavailable.

Rules:

- Locked funds must be visible when an order is open.
- Cancel actions need a future confirmation/error design before implementation.
- This spec does not change cancel behavior.

## Recent Activity Cards

Purpose:

- Show recent account events in a readable feed.

Potential activity types:

- Order placed.
- Order filled.
- Order canceled.
- Position opened.
- Position changed.
- Market resolved.
- Deposit or withdrawal state, only if beta-safe and approved.

Rules:

- Financial activity labels must match actual ledger or order state in future implementation.
- Deposit/withdrawal activity should remain hidden or beta-safe until funding architecture is approved.
- Activity should not expose internal ids by default.

## Resolved Position Cards

Purpose:

- Let users review settled or closed exposure without mixing it into active positions.

Recommended fields:

- Market title.
- Outcome held.
- Result.
- Settlement state.
- Realized result if reliable.
- Resolution date.

Required states:

- No resolved positions.
- Resolved won.
- Resolved lost.
- Pending payout/settlement if represented.
- Canceled/voided market.

Rules:

- Do not show realized profit/loss unless it is backed by approved accounting semantics.
- Settlement wording must match backend state.

## Empty States

### Signed-Out User

Message goal:

- Explain that portfolio appears after login.
- Primary action: sign in.
- Secondary action: browse markets.

### New User With No Positions

Message goal:

- Explain that positions appear after trades.
- Primary action: browse sports markets.
- Avoid funding prompts if wallet/funding is not approved.

### No Open Orders

Message goal:

- Confirm no funds are currently reserved by open orders.
- Avoid clutter.

### Data Unavailable

Message goal:

- State that account data could not be loaded.
- Provide retry action in future implementation.
- Do not show stale account totals as fresh.

## Mobile Layout Rules

- Cards should be scan-friendly with one primary line and supporting metadata.
- Avoid nested cards.
- Use compact status labels.
- Keep one primary action per card.
- Use expandable details for secondary metadata.
- Preserve consistent terminology from `docs/reviews/ACCOUNT_RISK_DISCLOSURE_SPEC.md`.
- Keep admin, bot, and internal operational terms out of user portfolio cards.

## Desktop Layout Rules

Desktop may use denser layouts, but should preserve the same conceptual sections:

- Summary.
- Active positions.
- Open orders.
- Activity.
- Resolved history.

Tables can be used on desktop only if mobile cards remain first-class.

## Forbidden Future Implementation Scope Without Human Review

Future implementation is not auto-merge eligible if it changes:

- Portfolio API calculations.
- Account balance calculations.
- Locked balance logic.
- Ledger entries or ledger transactions.
- Order placement, cancellation, fills, or matching.
- Position updates.
- Settlement or resolution behavior.
- Deposit or withdrawal state.
- Prisma schema or migrations.
- Admin auth or production configuration.

## Future Validation Expectations

Display-only implementation should run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

If tests are added, include focused portfolio/account display tests and mobile smoke coverage.

## Acceptance Criteria For Future UI PR

A future FrontendAgent implementation PR should:

- Keep account sections clearly separated.
- Provide empty, loading, error, and populated states.
- Avoid misleading zeroes for unavailable values.
- Show locked funds separately from available balance.
- Avoid modifying API, ledger, order, position, settlement, or wallet behavior.
- Include screenshots or browser verification for mobile and desktop.

## Non-Goals

This spec does not:

- Modify product code.
- Modify portfolio UI.
- Modify API routes.
- Modify financial state or trading behavior.
- Modify wallet/deposit/withdrawal behavior.
- Approve public funding launch.

## Validation For This Spec

This spec is docs-only. Validation for this PR should be:

```bash
git diff --check
```
