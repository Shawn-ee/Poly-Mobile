-- Durable local runtime heartbeat mirror for internal tester services.
-- These rows summarize local process-state checks; they do not imply an
-- installed production OS service.
CREATE TABLE "RuntimeServiceHeartbeat" (
    "id" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceKind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pid" INTEGER,
    "running" BOOLEAN NOT NULL DEFAULT false,
    "continuous" BOOLEAN,
    "usesProviderQuota" BOOLEAN NOT NULL DEFAULT false,
    "installedOsService" BOOLEAN NOT NULL DEFAULT false,
    "statePath" TEXT,
    "startedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeServiceHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RuntimeServiceHeartbeat_serviceKey_key" ON "RuntimeServiceHeartbeat"("serviceKey");
CREATE INDEX "RuntimeServiceHeartbeat_serviceKind_updatedAt_idx" ON "RuntimeServiceHeartbeat"("serviceKind", "updatedAt");
CREATE INDEX "RuntimeServiceHeartbeat_status_updatedAt_idx" ON "RuntimeServiceHeartbeat"("status", "updatedAt");
CREATE INDEX "RuntimeServiceHeartbeat_heartbeatAt_idx" ON "RuntimeServiceHeartbeat"("heartbeatAt");
