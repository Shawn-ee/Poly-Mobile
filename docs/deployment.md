# Deployment Guide (Phase 9)

## Required Environment Variables
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (or `SESSION_SECRET`)
- `NEXTAUTH_URL` (required in staging/production)
- `ADMIN_EMAILS` (required in staging/production, comma-separated)
- `APP_ENV` (`development` | `staging` | `production`)

Withdrawal controls:
- `WITHDRAWAL_MIN_USDC`
- `WITHDRAWAL_USER_DAILY_LIMIT_USDC`
- `WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC`
- `WITHDRAWAL_MAX_PENDING_PER_USER`

Optional:
- `APP_URL`
- `LOG_LEVEL`
- deposit-chain vars already used by wallet/deposit flows

## Deploy Steps
1. Install dependencies: `npm ci`
2. Generate Prisma client: `npx prisma generate`
3. Apply migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm run start`

## Post-Deploy Checks
1. Health endpoint:
   - `curl -sS https://<host>/api/health`
2. Admin system page:
   - `/admin/system`
3. Reconciliation:
   - `npm run reconcile:balances`
   - `npm run reconcile:markets`
   - `npm run reconcile:withdrawals`
4. Optional smoke:
   - `npm run smoke:phase9`

## Staging Smoke Checklist
1. `npx prisma migrate deploy`
2. `curl -sS https://<staging-host>/api/health`
3. Run all 3 reconciliation scripts
4. Open `/admin/system` and `/admin/withdrawals`
5. Run short simulation:
   - `npm run simulate:phase85 -- --seed=staging-smoke --users=6 --actions=40 --checkEvery=5 --quiet`
6. Verify one market can be minted/traded/resolved through existing admin flow

