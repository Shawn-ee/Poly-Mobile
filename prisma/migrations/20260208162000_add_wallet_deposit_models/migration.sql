-- AlterEnum
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'DEPOSIT';
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'WITHDRAW';

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT');

-- CreateEnum
CREATE TYPE "LedgerTransactionStatus" AS ENUM ('CREATED', 'SUBMITTED', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "WalletNonce" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'login';

-- CreateTable
CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "chainId" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "LedgerTransactionType" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "LedgerTransactionStatus" NOT NULL DEFAULT 'CREATED',
  "referenceType" TEXT,
  "referenceId" TEXT,
  "txHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositIntent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "chainId" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "LedgerTransactionStatus" NOT NULL DEFAULT 'CREATED',
  "txHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  CONSTRAINT "DepositIntent_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");
CREATE INDEX "LedgerTransaction_userId_createdAt_idx" ON "LedgerTransaction"("userId", "createdAt");
CREATE INDEX "LedgerTransaction_status_idx" ON "LedgerTransaction"("status");
CREATE INDEX "DepositIntent_userId_createdAt_idx" ON "DepositIntent"("userId", "createdAt");
CREATE INDEX "DepositIntent_txHash_idx" ON "DepositIntent"("txHash");

-- FKs
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepositIntent" ADD CONSTRAINT "DepositIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
