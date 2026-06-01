-- Extend existing ledger enums.
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'ORDER_LOCK';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'ORDER_RELEASE';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'TRADE_FILL';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'MARKET_SETTLEMENT';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'ADMIN_ADJUSTMENT';

ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'WITHDRAWAL';
ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'ORDER_LOCK';
ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'ORDER_RELEASE';
ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'TRADE_FILL';
ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'MARKET_SETTLEMENT';
ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'ADMIN_ADJUSTMENT';

-- New deposit enums.
CREATE TYPE "SupportedChain" AS ENUM ('POLYGON');
CREATE TYPE "SupportedToken" AS ENUM ('USDC');
CREATE TYPE "DepositAddressStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');
CREATE TYPE "DepositStatus" AS ENUM ('DETECTED', 'CONFIRMING', 'CREDITED', 'FAILED', 'IGNORED');
CREATE TYPE "LedgerAsset" AS ENUM ('USDC');
CREATE TYPE "LedgerEntryStatus" AS ENUM ('APPLIED', 'FAILED');

-- Extend ledger entries for richer custody accounting metadata.
ALTER TABLE "LedgerEntry"
  ADD COLUMN "asset" "LedgerAsset" NOT NULL DEFAULT 'USDC',
  ADD COLUMN "status" "LedgerEntryStatus" NOT NULL DEFAULT 'APPLIED',
  ADD COLUMN "balanceBefore" DECIMAL(36,6),
  ADD COLUMN "balanceAfter" DECIMAL(36,6);

-- Per-user Polygon USDC deposit addresses.
CREATE TABLE "UserDepositAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "chain" "SupportedChain" NOT NULL,
  "token" "SupportedToken" NOT NULL,
  "address" TEXT NOT NULL,
  "encryptedPrivateKey" TEXT NOT NULL,
  "status" "DepositAddressStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastScannedBlock" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserDepositAddress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserDepositAddress_address_key" ON "UserDepositAddress"("address");
CREATE UNIQUE INDEX "UserDepositAddress_userId_chain_token_key" ON "UserDepositAddress"("userId", "chain", "token");
CREATE INDEX "UserDepositAddress_status_updatedAt_idx" ON "UserDepositAddress"("status", "updatedAt");

ALTER TABLE "UserDepositAddress"
  ADD CONSTRAINT "UserDepositAddress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- On-chain deposits detected and credited from Polygon USDC transfers.
CREATE TABLE "Deposit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "depositAddressId" TEXT NOT NULL,
  "chain" "SupportedChain" NOT NULL,
  "token" "SupportedToken" NOT NULL,
  "txHash" TEXT NOT NULL,
  "logIndex" INTEGER NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT NOT NULL,
  "amount" DECIMAL(36,6) NOT NULL,
  "blockNumber" INTEGER NOT NULL,
  "confirmations" INTEGER NOT NULL DEFAULT 0,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creditedAt" TIMESTAMP(3),
  "status" "DepositStatus" NOT NULL DEFAULT 'DETECTED',
  "rawEventJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Deposit_chain_txHash_logIndex_key" ON "Deposit"("chain", "txHash", "logIndex");
CREATE INDEX "Deposit_userId_createdAt_idx" ON "Deposit"("userId", "createdAt");
CREATE INDEX "Deposit_status_updatedAt_idx" ON "Deposit"("status", "updatedAt");
CREATE INDEX "Deposit_depositAddressId_createdAt_idx" ON "Deposit"("depositAddressId", "createdAt");

ALTER TABLE "Deposit"
  ADD CONSTRAINT "Deposit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Deposit"
  ADD CONSTRAINT "Deposit_depositAddressId_fkey"
  FOREIGN KEY ("depositAddressId") REFERENCES "UserDepositAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
