---
name: Financial risk change
about: Required for any task touching balances, ledger, trading, custody, deposits, withdrawals, or live bots.
title: "[Financial Risk]: "
labels: ["financial-risk", "human-review-required"]
assignees: ""
---

Use this template for any task touching:

- Prisma schema
- `UserBalance`
- `LedgerEntry`
- `LedgerTransaction`
- matching
- settlement
- orders
- fills
- trades
- positions
- deposits
- withdrawals
- wallet private keys
- bot live trading

## Goal


## Risk Area

- [ ] Prisma schema / migrations
- [ ] UserBalance
- [ ] LedgerEntry / LedgerTransaction
- [ ] matching / orderbook
- [ ] settlement / resolution
- [ ] orders / fills / trades / positions
- [ ] deposits
- [ ] withdrawals
- [ ] wallet private keys
- [ ] bot live trading

## Proposed Change


## Out Of Scope


## Financial Invariants That Must Hold

- [ ] User balances cannot become negative.
- [ ] Every balance change has an auditable ledger entry.
- [ ] Every balance change runs inside a database transaction.
- [ ] Deposits and withdrawals remain idempotent.
- [ ] Settlement conserves collateral.

## Validation Plan

```sh

```

## Migration / Backfill Plan


## Rollback Plan


## Human Review

Human review is required before merge.
