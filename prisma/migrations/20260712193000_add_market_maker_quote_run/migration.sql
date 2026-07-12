-- CreateTable
CREATE TABLE "MarketMakerQuoteRun" (
    "id" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "eventSlug" TEXT,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "makerUserId" TEXT,
    "bidOrderId" TEXT,
    "askOrderId" TEXT,
    "providerSource" TEXT NOT NULL,
    "referenceBid" DECIMAL(20,8),
    "referenceAsk" DECIMAL(20,8),
    "outcomePrice" DECIMAL(20,8),
    "plannedBid" DECIMAL(20,8),
    "plannedAsk" DECIMAL(20,8),
    "quoteOffsetTicks" INTEGER NOT NULL DEFAULT 0,
    "size" DECIMAL(36,6),
    "mintQuantity" DECIMAL(36,6),
    "canceledOrderCount" INTEGER NOT NULL DEFAULT 0,
    "restingOrderCount" INTEGER NOT NULL DEFAULT 0,
    "quoteRouteStatus" INTEGER,
    "shiftedBidWorseThanProvider" BOOLEAN NOT NULL DEFAULT false,
    "shiftedAskWorseThanProvider" BOOLEAN NOT NULL DEFAULT false,
    "quoteRouteShowsBid" BOOLEAN NOT NULL DEFAULT false,
    "quoteRouteShowsAsk" BOOLEAN NOT NULL DEFAULT false,
    "snapshotFresh" BOOLEAN NOT NULL DEFAULT false,
    "installedOsService" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMakerQuoteRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketMakerQuoteRun_runKey_key" ON "MarketMakerQuoteRun"("runKey");

-- CreateIndex
CREATE INDEX "MarketMakerQuoteRun_marketId_startedAt_idx" ON "MarketMakerQuoteRun"("marketId", "startedAt");

-- CreateIndex
CREATE INDEX "MarketMakerQuoteRun_outcomeId_startedAt_idx" ON "MarketMakerQuoteRun"("outcomeId", "startedAt");

-- CreateIndex
CREATE INDEX "MarketMakerQuoteRun_eventSlug_startedAt_idx" ON "MarketMakerQuoteRun"("eventSlug", "startedAt");

-- CreateIndex
CREATE INDEX "MarketMakerQuoteRun_status_startedAt_idx" ON "MarketMakerQuoteRun"("status", "startedAt");
