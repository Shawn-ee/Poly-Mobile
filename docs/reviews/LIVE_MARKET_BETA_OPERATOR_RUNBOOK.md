# Live Market Beta Operator Runbook

Date: 2026-06-24

## Operating Rule

Start with every money-moving or order-moving gate disabled. Open only one gate at a time for a short allowlisted drill.

## First Boot

1. Deploy current `dev`.
2. Apply Prisma migrations with `npx prisma migrate deploy --schema=prisma/schema.prisma`.
3. Start service.
4. Confirm:
   - `/api/health` passes
   - `/sports`, `/events`, `/markets`, `/portfolio`, `/wallet` load or auth-gate correctly
   - market detail ticket says trading disabled
   - anonymous order/funding/admin APIs are blocked

Required first-boot flags:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
SYSTEM_LIQUIDITY_DRY_RUN=true
```

## Controlled Internal Trading Drill

1. Add one or two exact tester emails to `INTERNAL_TRADING_ALLOWLIST_EMAILS`.
2. Restart with:

```text
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true
```

3. Admin creates one sports event.
4. Admin creates:
   - moneyline market
   - spread market
   - total market
   - one player prop
5. Confirm event detail grouping and search.
6. Confirm non-allowlisted user is blocked from order placement.
7. Allowlisted user opens market detail and places one small order.
8. Confirm portfolio:
   - available balance
   - locked funds
   - open order
   - position if matched
9. Admin runs settlement preview.
10. Save evidence.
11. Restore safe trading defaults immediately.

## Settlement Rule

Use settlement preview first.

Do not run routine final settlement until:

- the operator has reviewed the preview
- the market type has no void/push/refund ambiguity
- the owner accepts ledger/balance/position mutation risk
- rollback and reconciliation plan is ready

## Emergency Disable

Set:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
SYSTEM_LIQUIDITY_DRY_RUN=true
```

Restart service and confirm:

- order placement is blocked
- ticket says trading disabled
- funding routes are blocked
- live bot flags remain disabled

## Never Do

- do not remove trading allowlist
- do not enable public trading
- do not enable anonymous trading
- do not enable public funding
- do not enable anonymous funding
- do not enable auto-withdrawal
- do not start live bots
- do not scrape sports websites
- do not use unapproved provider data
- do not print secrets
- do not delete ledger/order/position rows as rollback
