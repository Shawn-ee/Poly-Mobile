ALTER TABLE "ApiCredential"
ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "readOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maxOrderSize" DECIMAL(36,6),
ADD COLUMN "maxOrderNotional" DECIMAL(36,6),
ADD COLUMN "maxOpenOrders" INTEGER,
ADD COLUMN "maxDailySubmittedNotional" DECIMAL(36,6),
ADD COLUMN "allowedMarketIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "ApiOrderRequest"
ADD COLUMN "apiCredentialId" TEXT,
ADD COLUMN "submittedNotional" DECIMAL(36,6);

ALTER TABLE "ApiOrderRequest"
ADD CONSTRAINT "ApiOrderRequest_apiCredentialId_fkey"
FOREIGN KEY ("apiCredentialId") REFERENCES "ApiCredential"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ApiOrderRequest_apiCredentialId_createdAt_idx"
ON "ApiOrderRequest"("apiCredentialId", "createdAt");

CREATE TABLE "ApiCredentialUsageLog" (
  "id" TEXT NOT NULL,
  "apiCredentialId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "responseStatus" INTEGER NOT NULL,
  "resultCode" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApiCredentialUsageLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ApiCredentialUsageLog"
ADD CONSTRAINT "ApiCredentialUsageLog_apiCredentialId_fkey"
FOREIGN KEY ("apiCredentialId") REFERENCES "ApiCredential"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiCredentialUsageLog"
ADD CONSTRAINT "ApiCredentialUsageLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ApiCredentialUsageLog_apiCredentialId_createdAt_idx"
ON "ApiCredentialUsageLog"("apiCredentialId", "createdAt");

CREATE INDEX "ApiCredentialUsageLog_userId_createdAt_idx"
ON "ApiCredentialUsageLog"("userId", "createdAt");

CREATE INDEX "ApiCredentialUsageLog_routeId_createdAt_idx"
ON "ApiCredentialUsageLog"("routeId", "createdAt");
