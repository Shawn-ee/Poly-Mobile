-- AlterTable
ALTER TABLE "Market"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AlterTable
ALTER TABLE "Outcome" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Outcome_slug_key" ON "Outcome"("slug");
