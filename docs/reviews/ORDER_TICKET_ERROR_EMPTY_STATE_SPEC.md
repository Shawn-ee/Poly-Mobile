# Order Ticket Error And Empty State Spec

Task id: TRD-003
Assigned subagents: PlannerAgent, TestingAgent, LedgerWalletReviewerAgent
Risk level: High by topic
Status: Docs-only UX/test spec

## Purpose

The order ticket must explain unavailable, empty, and error states without causing users to misunderstand risk, locked funds, or execution. This spec defines future display states and test expectations without changing UI code, trading APIs, matching, ledger, balances, fills, positions, or settlement.

## Required States

### Signed Out

- Show sign-in requirement.
- Disable submit.
- Do not display actionable funding prompts.

### Market Unavailable

- Show market unavailable status.
- Disable submit.
- Explain whether market is paused, closed, resolved, canceled, or loading.

### No Liquidity

- Explain that liquidity may be limited.
- Do not promise execution.
- Advanced controls may remain hidden for MVP.

### Quote Unavailable

- Show stale/unavailable quote state.
- Disable submit or require refresh before submit.
- Do not reuse stale quote as executable price.

### Insufficient Available Balance

- Explain available balance is insufficient.
- Show locked balance separately if available.
- Do not imply deposits are public-ready unless funding is approved.

### Invalid Quantity Or Price

- Show inline validation.
- Disable submit.
- Preserve user input where safe.

### Submit Pending

- Disable duplicate submit.
- Show pending state.
- Do not imply fill until confirmed.

### Submit Failed

- Show safe failure message.
- Explain whether user should retry or refresh.
- Do not change displayed balances unless backend state confirms.

### Partially Filled Or Resting

- Explain remaining order may stay open.
- Explain funds may remain locked.
- Link to open orders/portfolio state.

## Copy Rules

Use:

- Plain `Yes`/`No` outcome language.
- Estimated cost.
- Maximum loss.
- Potential payout if resolved favorably.
- "May be locked" for open orders.

Avoid:

- Guaranteed execution language.
- Instant deposit/withdrawal claims.
- Internal matching/orderbook jargon as primary copy.
- Any claim that stale quotes are executable.

## Future Test Expectations

Future UI or logic tests should cover:

- Signed-out disabled ticket.
- Market paused/closed/resolved disabled ticket.
- Quote unavailable state.
- No-liquidity state.
- Insufficient available balance state.
- Invalid quantity state.
- Submit pending disables duplicate submit.
- Submit failure leaves user in safe state.
- Resting order explains locked funds.

## Forbidden Implementation Scope

Agents must not automatically change:

- Order placement or cancel APIs.
- Matching.
- Fills/trades.
- Ledger entries.
- Balance locking.
- Positions.
- Settlement.
- Wallet/funding behavior.
- Prisma schema or migrations.

## Validation For Future Implementation

Future implementation should run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Validation For This Spec

This spec is docs-only. Validation for this PR should be:

```bash
git diff --check
```
