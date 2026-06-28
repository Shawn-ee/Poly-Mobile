# Portfolio And Account IA Spec

This ACC-001 spec defines the target information architecture for `/portfolio` as the logged-in account home. It is docs-only and does not change portfolio APIs, ledger, balances, positions, or UI code.

## Goal

Make `Portfolio` the clear account home for logged-in beta users:

- Current positions.
- Open orders.
- Recent activity.
- Resolved markets.
- Test-credit account state.
- Clear empty states for first-time users.

The page should help users understand what they own and what needs attention without exposing ledger internals or real-money funding concepts.

## Current Friction

The current portfolio page already exposes useful account data, but it is dense:

- Many summary cards appear at once.
- Available, locked, total, position value, cost basis, realized PnL, and unrealized PnL compete for attention.
- Tables are likely hard to scan on mobile.
- Empty states should guide first-time users back to sports/event discovery.
- `U` terminology should eventually align with the beta copy map.

## Recommended Page Hierarchy

### 1. Account Summary

Top priority:

- Total portfolio value.
- Available test credits.
- Locked test credits.
- Unrealized PnL.

Secondary:

- Cost basis.
- Realized PnL.
- Total test credits.

Avoid making accounting details the first thing a new user sees.

### 2. Primary Action

One primary CTA:

```text
Browse sports markets
```

Secondary CTA:

```text
View all markets
```

Do not show deposit or withdrawal CTAs on the portfolio page during internal beta.

### 3. Positions

Default tab or section:

- Open positions.
- Outcome held.
- Shares.
- Current value.
- Unrealized PnL.
- Link to market detail.

Future mobile layout should use cards instead of dense tables.

### 4. Open Orders

Show:

- Market.
- Outcome.
- Side.
- Amount/shares.
- Status.
- Link to market detail.

Cancel actions are trading-adjacent and must be tested separately. A display-only portfolio redesign should not change cancel behavior.

### 5. Activity

Show recent:

- Trades.
- Order placements.
- Cancellations.
- Faucet/test-credit grants.
- Resolved market payouts when available.

Do not expose raw ledger terminology in primary user-facing copy unless a later LedgerWalletReviewerAgent-approved design calls for it.

### 6. Resolved Markets

Show:

- Market title.
- Outcome.
- Result.
- Realized PnL or payout.
- Link to market detail.

Resolved state should be understandable without settlement jargon.

## Empty States

Use plain-language empty states:

```text
No positions yet. Browse sports markets to get started.
```

```text
No open orders.
```

```text
No resolved markets yet.
```

Avoid:

- Admin-oriented language.
- Ledger/accounting terms.
- Real-money funding prompts.

## Loading And Error States

Future implementation should include:

- Summary skeleton.
- Positions loading state.
- Activity loading state.
- Auth-required redirect or message.
- API failure state with retry affordance.
- Partial failure state if history loads but positions fail, or vice versa.

## Mobile Requirements

- Summary should collapse into 2-4 high-priority cards.
- Positions and history should use stacked cards.
- Filters should not wrap into confusing multi-row chip groups.
- Market titles should wrap cleanly.
- PnL color should not be the only signal.

## Copy And Terminology

Use the beta copy map:

- Prefer `test credits` in user-facing explanatory text.
- Keep `Available`, `Locked`, and `Total` only when paired with clear context.
- Avoid mixing `U`, `USDC`, dollars, and credits on the same screen.
- Do not imply deposits or withdrawals are active.

## Safe Future Implementation Scope

A future FrontendAgent PR may:

- Reorder sections.
- Improve labels.
- Add empty/loading/error states.
- Add mobile card layouts.
- Add display-only links to sports, markets, or market detail.

It must not:

- Change `/api/portfolio` or `/api/portfolio/history`.
- Change balance calculations.
- Change PnL calculations.
- Change order cancellation behavior.
- Change ledger, matching, settlement, positions, or wallet behavior.
- Add funding actions.

## Validation For Future UI PR

Future implementation should run:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Add route smoke or screenshots for:

- Empty portfolio.
- Portfolio with positions.
- Mobile portfolio.
- Auth-required state.

## Review Routing

- FrontendAgent may implement display-only IA changes.
- TestingAgent should add smoke coverage before or alongside UI changes.
- LedgerWalletReviewerAgent must review any balance, PnL, position, open-order, settlement, or ledger interpretation changes.
- SecurityAgent must review any auth or funding claims.

## Non-Goals

This spec does not:

- Change product code.
- Change portfolio APIs.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, or position behavior.
- Change admin auth.
- Change tests, CI, Prisma, deployment, or bot behavior.
