-- CreateTable
CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "slug" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "status" TEXT,
  "source" TEXT,
  "externalEventId" TEXT,
  "externalSlug" TEXT,
  "image" TEXT,
  "icon" TEXT,
  "metadata" JSONB,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Market"
ADD COLUMN "eventId" TEXT,
ADD COLUMN "externalMarketId" TEXT,
ADD COLUMN "conditionId" TEXT,
ADD COLUMN "referenceSource" TEXT,
ADD COLUMN "externalSlug" TEXT,
ADD COLUMN "referenceMetadata" JSONB;

-- AlterTable
ALTER TABLE "Outcome"
ADD COLUMN "isTradable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "referenceTokenId" TEXT,
ADD COLUMN "referenceOutcomeLabel" TEXT,
ADD COLUMN "referenceMetadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_source_externalEventId_idx" ON "Event"("source", "externalEventId");

-- CreateIndex
CREATE INDEX "Event_externalSlug_idx" ON "Event"("externalSlug");

-- CreateIndex
CREATE INDEX "Market_eventId_idx" ON "Market"("eventId");

-- CreateIndex
CREATE INDEX "Market_referenceSource_externalMarketId_idx" ON "Market"("referenceSource", "externalMarketId");

-- CreateIndex
CREATE INDEX "Market_conditionId_idx" ON "Market"("conditionId");

-- CreateIndex
CREATE INDEX "Market_externalSlug_idx" ON "Market"("externalSlug");

-- CreateIndex
CREATE INDEX "Outcome_referenceTokenId_idx" ON "Outcome"("referenceTokenId");

-- AddForeignKey
ALTER TABLE "Event"
ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market"
ADD CONSTRAINT "Market_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
