-- AlterTable
ALTER TABLE "LedgerTransaction" ADD COLUMN     "amountRaw" TEXT,
ADD COLUMN     "chainId" INTEGER,
ADD COLUMN     "logIndex" INTEGER,
ADD COLUMN     "tokenAddress" TEXT;

-- CreateTable
CREATE TABLE "ChainDepositEvent" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amountRaw" TEXT NOT NULL,
    "amountDecimal" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChainDepositEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChainDepositEvent_userId_createdAt_idx" ON "ChainDepositEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChainDepositEvent_chainId_txHash_logIndex_key" ON "ChainDepositEvent"("chainId", "txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "ChainDepositEvent" ADD CONSTRAINT "ChainDepositEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
