-- CreateTable
CREATE TABLE "ProviderRefreshRun" (
    "id" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "providerSource" TEXT NOT NULL,
    "referenceSource" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "eventSlug" TEXT,
    "providerEventId" TEXT,
    "sportKey" TEXT,
    "selectedMarketId" TEXT,
    "selectedOutcomeId" TEXT,
    "refreshIterations" INTEGER NOT NULL DEFAULT 0,
    "providerCallCount" INTEGER NOT NULL DEFAULT 0,
    "quotaCost" INTEGER NOT NULL DEFAULT 0,
    "requestsRemaining" TEXT,
    "maxCredits" INTEGER,
    "minRemaining" INTEGER,
    "marketCount" INTEGER NOT NULL DEFAULT 0,
    "outcomeCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotCount" INTEGER NOT NULL DEFAULT 0,
    "staleBeforeRefresh" BOOLEAN NOT NULL DEFAULT false,
    "readyAfterRefresh" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderRefreshRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderRefreshRun_runKey_key" ON "ProviderRefreshRun"("runKey");

-- CreateIndex
CREATE INDEX "ProviderRefreshRun_providerSource_startedAt_idx" ON "ProviderRefreshRun"("providerSource", "startedAt");

-- CreateIndex
CREATE INDEX "ProviderRefreshRun_referenceSource_startedAt_idx" ON "ProviderRefreshRun"("referenceSource", "startedAt");

-- CreateIndex
CREATE INDEX "ProviderRefreshRun_eventSlug_startedAt_idx" ON "ProviderRefreshRun"("eventSlug", "startedAt");

-- CreateIndex
CREATE INDEX "ProviderRefreshRun_status_startedAt_idx" ON "ProviderRefreshRun"("status", "startedAt");
