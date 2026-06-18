# Order Cancel State Model Spec

Task id: TRD-002
Assigned subagents: PlannerAgent, TestingAgent, LedgerWalletReviewerAgent
Risk level: High
Status: Docs-only state model and test plan

## Purpose

Canceling orders is financially sensitive because it can involve open orders, partial fills, locked funds, reserved shares, and user trust. This spec defines the user-visible state model and future test expectations for cancel flows without changing order, matching, fill, ledger, balance, position, settlement, or API behavior.

## Core Product Rule

Users should always know whether an order is:

- Open and still fillable.
- Cancel requested.
- Partially filled.
- Fully filled.
- Canceled.
- Failed to cancel.
- No longer cancelable.

The UI must not imply that funds or shares are unlocked until backend state confirms it.

## Target User States

### Open

Meaning:

- The order can still fill.
- Funds or shares may be locked.

User copy:

- "Open order"
- "Funds may be reserved until filled or canceled."

Primary action:

- Cancel order, if allowed.

### Cancel Requested

Meaning:

- User has requested cancel.
- Final state is not confirmed yet.

User copy:

- "Canceling..."
- "This order may still update while cancellation is processed."

Primary action:

- Disable duplicate cancel action.

### Partially Filled

Meaning:

- Some quantity filled before final cancellation or while order remains open.

User copy:

- "Partially filled"
- "Only the remaining open amount can be canceled."

Primary action:

- Cancel remaining quantity, if allowed.

### Canceled

Meaning:

- Remaining open quantity is no longer fillable.
- Locked funds/shares should be released only after backend state confirms it.

User copy:

- "Canceled"
- "Reserved funds were released if applicable."

Primary action:

- View details.

### Filled

Meaning:

- Order fully filled before cancellation.
- No remaining quantity can be canceled.

User copy:

- "Filled"
- "This order can no longer be canceled."

Primary action:

- View position.

### Cancel Failed

Meaning:

- Cancel request did not complete.
- Order may still be open or state may need refresh.

User copy:

- "Cancel failed"
- "Refresh order status before trying again."

Primary action:

- Retry only if backend says the order is still cancelable.

### Not Cancelable

Meaning:

- Market or order state prevents cancellation.

Examples:

- Order already filled.
- Order already canceled.
- Market closed/resolved.
- User is not owner.
- Auth/session unavailable.

User copy:

- "This order cannot be canceled."

## Required UI Context

Future UI should show:

- Market title.
- Outcome side.
- Order side.
- Original quantity.
- Filled quantity.
- Remaining quantity.
- Limit price if applicable.
- Locked amount if known.
- Created time.
- Last updated time.
- Current status.

## Required Confirmation Behavior

Future implementation should require confirmation before canceling if:

- The order is large.
- The order is partially filled.
- The market is volatile or state is stale.
- Canceling could affect a visible position or reserved balance.

Confirmation copy should not promise unlock timing.

## Future API And Backend Test Expectations

Future tests should cover:

- Cancel open order.
- Cancel partially filled order.
- Cancel already filled order.
- Cancel already canceled order.
- Cancel non-owned order.
- Cancel when unauthenticated.
- Cancel when market is closed/resolved.
- Duplicate cancel request.
- Cancel failure does not unlock funds incorrectly.
- Successful cancel unlocks only remaining locked funds/shares.

These tests require LedgerWalletReviewerAgent review before implementation.

## Future UI Test Expectations

Future display tests should cover:

- Open order card.
- Cancel pending state.
- Partial fill state.
- Filled state.
- Canceled state.
- Cancel failed state.
- Empty open-orders state.
- Mobile layout and disabled duplicate cancel action.

## Forbidden Automatic Implementation

Agents must not automatically change:

- Order placement.
- Order cancellation.
- Matching.
- Fills.
- Trades.
- Positions.
- Locked balance logic.
- Ledger entries.
- Settlement.
- Prisma schema or migrations.
- Trading API routes.

Any implementation in those areas requires LedgerWalletReviewerAgent and human review.

## Validation For Future Implementation

Future implementation PRs should run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Focused order/cancel tests should be included where safe.

## Non-Goals

This spec does not:

- Change UI code.
- Change API routes.
- Change order, matching, fill, trade, position, ledger, balance, settlement, wallet, deposit, withdrawal, Prisma, migration, bot, auth, deployment, or production behavior.
- Approve automatic trading implementation.

## Validation For This Spec

This spec is docs-only. Validation for this PR should be:

```bash
git diff --check
```
