-- Add sports/event prediction-market metadata without changing orderbook custody logic.

ALTER TYPE "MarketStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "MarketStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "sportKey" TEXT,
  ADD COLUMN IF NOT EXISTS "leagueKey" TEXT,
  ADD COLUMN IF NOT EXISTS "eventType" TEXT,
  ADD COLUMN IF NOT EXISTS "homeTeamName" TEXT,
  ADD COLUMN IF NOT EXISTS "awayTeamName" TEXT,
  ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

ALTER TABLE "Market"
  ADD COLUMN IF NOT EXISTS "marketType" TEXT NOT NULL DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS "rules" JSONB,
  ADD COLUMN IF NOT EXISTS "closeTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resolutionTime" TIMESTAMP(3);

ALTER TABLE "Outcome"
  ADD COLUMN IF NOT EXISTS "label" TEXT,
  ADD COLUMN IF NOT EXISTS "code" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

UPDATE "Outcome"
SET "label" = "name"
WHERE "label" IS NULL;

CREATE INDEX IF NOT EXISTS "Event_category_status_idx" ON "Event"("category", "status");
CREATE INDEX IF NOT EXISTS "Event_sportKey_leagueKey_status_idx" ON "Event"("sportKey", "leagueKey", "status");
CREATE INDEX IF NOT EXISTS "Market_marketType_status_idx" ON "Market"("marketType", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Outcome_marketId_code_key" ON "Outcome"("marketId", "code") WHERE "code" IS NOT NULL;

INSERT INTO "Event" (
  "id",
  "slug",
  "title",
  "description",
  "category",
  "eventType",
  "status",
  "metadata",
  "createdAt",
  "updatedAt"
)
VALUES (
  'evt_general_prediction_markets',
  'general-prediction-markets',
  'General Prediction Markets',
  'Default event grouping for legacy standalone markets.',
  'general',
  'general',
  'scheduled',
  '{}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "eventType" = EXCLUDED."eventType",
  "updatedAt" = NOW();

UPDATE "Market"
SET "eventId" = (SELECT "id" FROM "Event" WHERE "slug" = 'general-prediction-markets')
WHERE "eventId" IS NULL;
