# Live Market Beta Server Deployment Update

Date: 2026-06-24

## Summary

This update documents how to deploy current `dev` with the live sports market roadmap work present while keeping public trading, public funding, auto-withdrawal, live bots, provider sync, and automatic settlement disabled.

This document does not deploy production, does not include secret values, and does not approve public beta.

Current classification:

```text
Limited Internal Market Beta Only
Ready with Warnings for controlled operator drills
Not Ready for full internal live market beta
Public Beta Not Ready
```

## Deploy Target

Deploy from `dev` only after pulling a commit that includes:

- grouped live sports market schema
- grouped sports event UI
- market detail ticket gating
- guarded internal trading beta order path
- portfolio open order/position display
- admin event market management
- admin settlement preview
- live sports provider readiness docs
- live sports UX polish
- internal live market e2e evidence

## Required Migration

The live sports market schema migration must be applied on the server database:

```text
prisma/migrations/20260624112446_live_sports_market_schema/migration.sql
```

Before applying migrations:

1. Confirm the database target is the owner-controlled beta database.
2. Confirm a database backup exists.
3. Confirm the server checkout is on `dev`.
4. Confirm no `.env` values are printed.

Run:

```bash
git fetch origin
git checkout dev
git pull origin dev
git log -1 --oneline
npm ci
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run build
```

Do not run `prisma migrate reset`.

## First Deployment Mode

First boot must keep live-market trading disabled:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
```

Funding must remain in the existing safe first-boot mode:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Live bots must remain disabled:

```text
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
SYSTEM_LIQUIDITY_DRY_RUN=true
```

Do not configure provider live sync for first boot:

```text
SPORTS_PROVIDER_ENABLE_LIVE_SYNC=false
SPORTS_PROVIDER_ENABLE_RESULT_SYNC=false
SPORTS_PROVIDER_DRY_RUN=true
```

If these provider env names are not implemented yet, leave them unset and keep provider sync disabled by procedure.

## Trading Beta Env Names

Server-side order placement gate:

- `INTERNAL_TRADING_BETA_ENABLED`
- `TRADING_KILL_SWITCH`
- `INTERNAL_TRADING_ALLOWLIST_EMAILS`

Client-side submit visibility gate:

- `NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED`

Safe default:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
```

Controlled drill mode only:

```text
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true
```

Only use drill mode with a small allowlist in `INTERNAL_TRADING_ALLOWLIST_EMAILS`, then restore safe defaults immediately after the drill.

## Service Restart

If using systemd:

```bash
sudo systemctl daemon-reload
sudo systemctl restart "$POLY_SERVICE"
sudo systemctl status "$POLY_SERVICE" --no-pager
journalctl -u "$POLY_SERVICE" -n 100 --no-pager
```

If using pm2:

```bash
pm2 restart "$POLY_SERVICE" --update-env
pm2 status "$POLY_SERVICE"
pm2 logs "$POLY_SERVICE" --lines 100
```

Do not paste env values from logs into docs or chat.

## Post-Deploy Smoke

Run public route smoke:

```bash
curl -i http://127.0.0.1:3001/api/health
curl -I https://holiwyn.online/
curl -I https://holiwyn.online/login
curl -I https://holiwyn.online/sports
curl -I https://holiwyn.online/events
curl -I https://holiwyn.online/markets
curl -I https://holiwyn.online/portfolio
curl -I https://holiwyn.online/wallet
```

Expected:

- health endpoint succeeds
- public pages load
- event and market pages do not expose admin/private fields
- market detail ticket remains disabled while trading flags are off
- portfolio requires auth

Run blocked API smoke:

```bash
curl -i https://holiwyn.online/api/orders
curl -i https://holiwyn.online/api/portfolio
curl -i https://holiwyn.online/api/admin/markets
curl -i https://holiwyn.online/api/admin/markets/example/settlement-preview
curl -i https://holiwyn.online/api/deposits/address
curl -i https://holiwyn.online/api/withdrawals
```

Expected:

- anonymous order/portfolio/admin/funding/withdrawal APIs return `401`, `403`, or route-specific not-found/error without leaking internals
- no anonymous trading
- no anonymous funding
- no admin mutation access

## Controlled Internal Live Market Drill

Only after first-boot smoke passes:

1. Add one or two exact emails to `INTERNAL_TRADING_ALLOWLIST_EMAILS`.
2. Set `INTERNAL_TRADING_BETA_ENABLED=true`.
3. Set `TRADING_KILL_SWITCH=false`.
4. Set `NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true`.
5. Restart the app service.
6. Confirm a non-allowlisted user cannot submit orders.
7. Admin creates one sports event and markets for moneyline, spread, total, and one player prop.
8. Confirm grouped event UI and search show the markets.
9. Allowlisted user opens market detail and submits one small order.
10. Confirm portfolio shows locked funds and open order.
11. Admin runs settlement preview.
12. Save drill evidence.
13. Immediately restore safe trading defaults and restart.

Do not use automatic settlement in the drill.

## Emergency Disable

Set:

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

Restart the app service.

Verify:

- market detail ticket says trading disabled
- `POST /api/orders` is blocked
- funding routes are blocked
- live bot flags remain disabled

## Rollback

Code rollback:

```bash
cd "$POLY_DIR"
git fetch origin
git log --oneline --decorate -n 20
git checkout <last-known-good-commit>
npm ci
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npm run build
sudo systemctl restart "$POLY_SERVICE"
```

Database rollback:

- do not delete orders, fills, positions, ledger entries, deposit rows, withdrawal rows, or balances manually
- restore from the reviewed database backup only if the owner explicitly chooses database rollback
- preserve logs without printing secrets

## What Prevents Public Beta

- no deployed full live-market drill evidence
- final settlement remains high-risk mutating behavior
- no sports void/push/refund settlement path
- no provider-approved live sports data integration
- no settlement-grade official result source
- public trading and public funding remain disabled
- live bots are not approved
