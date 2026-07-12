-- First-class local official-result review records for the one-event runtime.
-- These records mirror canonical provider/result/approval evidence without
-- storing exact settlement confirmation strings.
CREATE TABLE "OfficialResultReview" (
    "id" TEXT NOT NULL,
    "reviewKey" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "eventId" TEXT,
    "marketId" TEXT,
    "outcomeId" TEXT,
    "providerSource" TEXT,
    "providerEventId" TEXT,
    "resultStatus" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "advanceTeam" TEXT,
    "trustedResultDigest" TEXT,
    "resultDigest" TEXT,
    "settlementPreflightCanonicalId" BIGINT,
    "settlementApprovalCanonicalId" BIGINT,
    "settlementExecutedCanonicalId" BIGINT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'missing',
    "executionDecision" TEXT NOT NULL,
    "executionEligibleNow" BOOLEAN NOT NULL DEFAULT false,
    "confirmationRequiredKnown" BOOLEAN NOT NULL DEFAULT false,
    "exactConfirmationStored" BOOLEAN NOT NULL DEFAULT false,
    "activeMarketExecutionAttempted" BOOLEAN NOT NULL DEFAULT false,
    "providerQuotaUsed" BOOLEAN NOT NULL DEFAULT false,
    "reviewSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialResultReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfficialResultReview_reviewKey_key" ON "OfficialResultReview"("reviewKey");
CREATE INDEX "OfficialResultReview_eventSlug_updatedAt_idx" ON "OfficialResultReview"("eventSlug", "updatedAt");
CREATE INDEX "OfficialResultReview_marketId_updatedAt_idx" ON "OfficialResultReview"("marketId", "updatedAt");
CREATE INDEX "OfficialResultReview_resultDigest_idx" ON "OfficialResultReview"("resultDigest");
CREATE INDEX "OfficialResultReview_trustedResultDigest_idx" ON "OfficialResultReview"("trustedResultDigest");
