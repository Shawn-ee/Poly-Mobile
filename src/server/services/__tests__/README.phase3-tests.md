# Phase 3 Ledger Tests

## Required env vars
- `DATABASE_URL` (Postgres connection string; this suite runs against PostgreSQL, not SQLite)

## Setup
1. `npx prisma migrate deploy`
2. `npx prisma generate`

## Run
- `npm run test:phase3`

## Notes
- Tests truncate all public tables (except `_prisma_migrations`) before each test for deterministic runs.
- The suite uses a test-only fault-injection hook in `src/server/services/ledger.ts` for transaction atomicity validation.
