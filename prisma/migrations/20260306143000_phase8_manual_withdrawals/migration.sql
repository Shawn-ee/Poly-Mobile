-- Phase 8: manual withdrawals workflow metadata + reject status

ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REJECT';
ALTER TYPE "LedgerOperation" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REJECT';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "WithdrawalRequest"
ADD COLUMN "processedByAdminId" TEXT,
ADD COLUMN "destinationAddress" TEXT,
ADD COLUMN "adminNotes" TEXT,
ADD COLUMN "rejectedAt" TIMESTAMP(3);

CREATE INDEX "WithdrawalRequest_status_requestedAt_idx"
ON "WithdrawalRequest"("status", "requestedAt");

ALTER TABLE "WithdrawalRequest"
ADD CONSTRAINT "WithdrawalRequest_processedByAdminId_fkey"
FOREIGN KEY ("processedByAdminId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

