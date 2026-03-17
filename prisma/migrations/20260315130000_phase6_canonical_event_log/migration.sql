CREATE TYPE "CanonicalEventStream" AS ENUM ('MARKET', 'ACCOUNT');

CREATE TABLE "CanonicalEvent" (
  "id" BIGSERIAL NOT NULL,
  "stream" "CanonicalEventStream" NOT NULL,
  "topicKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "marketId" TEXT,
  "outcomeId" TEXT,
  "userId" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CanonicalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CanonicalEvent_stream_topicKey_id_idx"
ON "CanonicalEvent"("stream", "topicKey", "id");

CREATE INDEX "CanonicalEvent_marketId_id_idx"
ON "CanonicalEvent"("marketId", "id");

CREATE INDEX "CanonicalEvent_userId_id_idx"
ON "CanonicalEvent"("userId", "id");

CREATE INDEX "CanonicalEvent_createdAt_idx"
ON "CanonicalEvent"("createdAt");
