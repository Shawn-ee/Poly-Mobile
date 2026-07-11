ALTER TABLE "Trade" ADD COLUMN "orderId" TEXT;
ALTER TABLE "Trade" ADD COLUMN "selectionSnapshot" JSONB;

ALTER TABLE "Trade"
  ADD CONSTRAINT "Trade_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Trade_orderId_idx" ON "Trade"("orderId");
