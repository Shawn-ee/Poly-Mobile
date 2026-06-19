# Human Decision Required

Last updated: 2026-06-18

This document tracks decisions the autonomous LeadAgent must not make alone.

## Production And Custody Decisions

- Enable real deposits.
- Enable real withdrawals.
- Decide custody model and production private-key handling.
- Approve real chain RPC/provider credentials.
- Approve payment/custody provider choices.

## Financial Engine Decisions

- Change ledger/balance invariants.
- Change `UserBalance`, `LedgerEntry`, or `LedgerTransaction` behavior.
- Change matching, settlement, order placement, order cancellation, fills, trades, or positions.
- Approve reconciliation strategy before public beta.

## Auth And Admin Decisions

- Change admin auth behavior.
- Change admin permission model.
- Approve admin production operating procedures.

## Bot And Liquidity Decisions

- Enable bot live trading.
- Change market-maker risk limits.
- Change liquidity runtime behavior.
- Approve bot account custody and credential handling.

## Deployment Decisions

- Deploy to production.
- Merge to `main`.
- Enable production autonomous execution.
- Change deployment secrets, Nginx/systemd production behavior, or public beta release gates.

## Product And Legal Decisions

- Public beta go/no-go.
- Real-money launch readiness.
- Jurisdiction/compliance decisions.
- Risk disclosure approval.

## Current Human-Review Items

- PR #25: broad UI/product-code draft touching wallet, admin deposit/withdrawal, private pool, and pool detail surfaces. Requires human review or splitting before merge.
- Public no-leak CI promotion: requires package/workflow decision before implementation.
- Market detail cleanup: requires target contract approval before route implementation.
- Reference/liquidity public/admin split: requires implementation approval before route changes.
