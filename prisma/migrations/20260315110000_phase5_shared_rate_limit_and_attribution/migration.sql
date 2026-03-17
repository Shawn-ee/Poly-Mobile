ALTER TABLE "Order"
ADD COLUMN "createdApiCredentialId" TEXT,
ADD COLUMN "canceledByApiCredentialId" TEXT;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_createdApiCredentialId_fkey"
FOREIGN KEY ("createdApiCredentialId") REFERENCES "ApiCredential"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_canceledByApiCredentialId_fkey"
FOREIGN KEY ("canceledByApiCredentialId") REFERENCES "ApiCredential"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_createdApiCredentialId_createdAt_idx"
ON "Order"("createdApiCredentialId", "createdAt");

CREATE INDEX "Order_canceledByApiCredentialId_updatedAt_idx"
ON "Order"("canceledByApiCredentialId", "updatedAt");

CREATE TABLE "ApiCredentialRateLimitBucket" (
  "id" TEXT NOT NULL,
  "apiCredentialId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApiCredentialRateLimitBucket_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ApiCredentialRateLimitBucket"
ADD CONSTRAINT "ApiCredentialRateLimitBucket_apiCredentialId_fkey"
FOREIGN KEY ("apiCredentialId") REFERENCES "ApiCredential"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ApiCredentialRateLimitBucket_apiCredentialId_routeId_windowStart_key"
ON "ApiCredentialRateLimitBucket"("apiCredentialId", "routeId", "windowStart");

CREATE INDEX "ApiCredentialRateLimitBucket_windowStart_idx"
ON "ApiCredentialRateLimitBucket"("windowStart");
