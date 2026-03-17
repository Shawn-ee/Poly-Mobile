CREATE TYPE "ApiOrderRequestStatus" AS ENUM ('PROCESSING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "ApiOrderRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "clientOrderId" TEXT,
    "requestFingerprint" TEXT NOT NULL,
    "requestBody" JSONB NOT NULL,
    "status" "ApiOrderRequestStatus" NOT NULL DEFAULT 'PROCESSING',
    "orderId" TEXT,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiOrderRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiOrderRequest_orderId_key" ON "ApiOrderRequest"("orderId");
CREATE UNIQUE INDEX "ApiOrderRequest_userId_idempotencyKey_key" ON "ApiOrderRequest"("userId", "idempotencyKey");
CREATE UNIQUE INDEX "ApiOrderRequest_userId_clientOrderId_key" ON "ApiOrderRequest"("userId", "clientOrderId");
CREATE INDEX "ApiOrderRequest_userId_createdAt_idx" ON "ApiOrderRequest"("userId", "createdAt");

ALTER TABLE "ApiOrderRequest" ADD CONSTRAINT "ApiOrderRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiOrderRequest" ADD CONSTRAINT "ApiOrderRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
