-- CreateTable
CREATE TABLE "RuntimeServiceRun" (
    "id" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceKind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "iterationCount" INTEGER NOT NULL DEFAULT 0,
    "providerQuotaUsed" BOOLEAN NOT NULL DEFAULT false,
    "activeSettlementExecuted" BOOLEAN NOT NULL DEFAULT false,
    "installedOsService" BOOLEAN NOT NULL DEFAULT false,
    "eventSlug" TEXT,
    "selectedMarketId" TEXT,
    "resultAction" TEXT,
    "summaryPath" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeServiceRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeServiceRun_runKey_key" ON "RuntimeServiceRun"("runKey");

-- CreateIndex
CREATE INDEX "RuntimeServiceRun_serviceKey_startedAt_idx" ON "RuntimeServiceRun"("serviceKey", "startedAt");

-- CreateIndex
CREATE INDEX "RuntimeServiceRun_serviceKind_startedAt_idx" ON "RuntimeServiceRun"("serviceKind", "startedAt");

-- CreateIndex
CREATE INDEX "RuntimeServiceRun_status_startedAt_idx" ON "RuntimeServiceRun"("status", "startedAt");
