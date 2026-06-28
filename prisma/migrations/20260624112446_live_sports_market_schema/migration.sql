-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "awayScore" INTEGER,
ADD COLUMN     "clock" TEXT,
ADD COLUMN     "homeScore" INTEGER,
ADD COLUMN     "liveStatus" TEXT,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "venue" TEXT;

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "line" DECIMAL(18,4),
ADD COLUMN     "marketGroupKey" TEXT,
ADD COLUMN     "marketGroupTitle" TEXT,
ADD COLUMN     "participantId" TEXT,
ADD COLUMN     "participantName" TEXT,
ADD COLUMN     "participantType" TEXT,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "propCategory" TEXT,
ADD COLUMN     "resolutionEvidenceText" TEXT,
ADD COLUMN     "resolutionEvidenceUrl" TEXT,
ADD COLUMN     "rulesText" TEXT,
ADD COLUMN     "settlementStatus" TEXT,
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "voidReason" TEXT;

-- AlterTable
ALTER TABLE "Outcome" ADD COLUMN     "resolvedResult" TEXT,
ADD COLUMN     "side" TEXT;

-- CreateIndex
CREATE INDEX "Event_sportKey_leagueKey_liveStatus_idx" ON "Event"("sportKey", "leagueKey", "liveStatus");

-- CreateIndex
CREATE INDEX "Event_startTime_idx" ON "Event"("startTime");

-- CreateIndex
CREATE INDEX "Market_eventId_marketGroupKey_displayOrder_idx" ON "Market"("eventId", "marketGroupKey", "displayOrder");

-- CreateIndex
CREATE INDEX "Market_eventId_status_displayOrder_idx" ON "Market"("eventId", "status", "displayOrder");

-- CreateIndex
CREATE INDEX "Market_marketType_propCategory_idx" ON "Market"("marketType", "propCategory");

-- CreateIndex
CREATE INDEX "Outcome_marketId_side_idx" ON "Outcome"("marketId", "side");

-- CreateIndex
CREATE INDEX "Outcome_marketId_resolvedResult_idx" ON "Outcome"("marketId", "resolvedResult");
