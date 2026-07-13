-- Dedicated operator audit rows for local settlement review controls.
-- These rows preserve operator identity and role snapshots without storing
-- exact settlement confirmation strings.
CREATE TABLE "OperatorAuditEvent" (
    "id" TEXT NOT NULL,
    "operatorUserId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roleSnapshot" JSONB NOT NULL,
    "requestId" TEXT NOT NULL,
    "canonicalEventId" BIGINT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperatorAuditEvent_operatorUserId_createdAt_idx" ON "OperatorAuditEvent"("operatorUserId", "createdAt");
CREATE INDEX "OperatorAuditEvent_reviewId_createdAt_idx" ON "OperatorAuditEvent"("reviewId", "createdAt");
CREATE INDEX "OperatorAuditEvent_action_createdAt_idx" ON "OperatorAuditEvent"("action", "createdAt");
CREATE INDEX "OperatorAuditEvent_canonicalEventId_idx" ON "OperatorAuditEvent"("canonicalEventId");
CREATE INDEX "OperatorAuditEvent_requestId_idx" ON "OperatorAuditEvent"("requestId");

ALTER TABLE "OperatorAuditEvent" ADD CONSTRAINT "OperatorAuditEvent_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperatorAuditEvent" ADD CONSTRAINT "OperatorAuditEvent_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "OfficialResultReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
