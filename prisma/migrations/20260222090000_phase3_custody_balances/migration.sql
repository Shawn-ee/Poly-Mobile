-- Add LedgerReason variants for custody transitions
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'LOCK';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'UNLOCK';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'FILL';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REQUEST';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_COMPLETE';

-- New enums for explicit operation typing and withdrawal state
CREATE TYPE "LedgerOperation" AS ENUM (
  'DEPOSIT',
  'LOCK',
  'UNLOCK',
  'FILL',
  'WITHDRAWAL_REQUEST',
  'WITHDRAWAL_COMPLETE',
  'FAUCET',
  'TRADE',
  'POOL_BET',
  'OTHER'
);

CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- Add immutable ledger metadata + per-bucket deltas
ALTER TABLE "LedgerEntry"
ADD COLUMN "operation" "LedgerOperation" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "deltaAvailableUSDC" DECIMAL(36, 6),
ADD COLUMN "deltaLockedUSDC" DECIMAL(36, 6),
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "chainId" INTEGER,
ADD COLUMN "txHash" TEXT,
ADD COLUMN "logIndex" INTEGER,
ADD COLUMN "tokenAddress" TEXT;

CREATE UNIQUE INDEX "LedgerEntry_idempotencyKey_key" ON "LedgerEntry"("idempotencyKey");
CREATE INDEX "LedgerEntry_operation_createdAt_idx" ON "LedgerEntry"("operation", "createdAt");

-- Materialized per-user custody counters
CREATE TABLE "UserBalance" (
  "userId" TEXT NOT NULL,
  "availableUSDC" DECIMAL(36, 6) NOT NULL DEFAULT 0,
  "lockedUSDC" DECIMAL(36, 6) NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserBalance"
ADD CONSTRAINT "UserBalance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBalance"
ADD CONSTRAINT "UserBalance_availableUSDC_nonnegative" CHECK ("availableUSDC" >= 0);
ALTER TABLE "UserBalance"
ADD CONSTRAINT "UserBalance_lockedUSDC_nonnegative" CHECK ("lockedUSDC" >= 0);

-- Backfill existing users from append-only ledger history (legacy model had no locked bucket)
INSERT INTO "UserBalance" ("userId", "availableUSDC", "lockedUSDC", "version", "createdAt", "updatedAt")
SELECT
  "userId",
  COALESCE(SUM("amountDelta"), 0)::DECIMAL(36, 6),
  0,
  0,
  NOW(),
  NOW()
FROM "LedgerEntry"
GROUP BY "userId"
ON CONFLICT ("userId") DO NOTHING;

-- Withdrawal requests with completion idempotency
CREATE TABLE "WithdrawalRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountUSDC" DECIMAL(36, 6) NOT NULL,
  "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "completedTxHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WithdrawalRequest_userId_createdAt_idx" ON "WithdrawalRequest"("userId", "createdAt");
CREATE UNIQUE INDEX "WithdrawalRequest_completedTxHash_key" ON "WithdrawalRequest"("completedTxHash");

ALTER TABLE "WithdrawalRequest"
ADD CONSTRAINT "WithdrawalRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
