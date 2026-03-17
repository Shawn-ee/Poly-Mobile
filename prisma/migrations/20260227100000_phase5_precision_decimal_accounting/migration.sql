-- Normalize nullable float snapshot fields before conversion.
UPDATE "MarketOutcomeSnapshot"
SET
  "sharesOutstanding" = COALESCE("sharesOutstanding", 0),
  "volumeDelta" = COALESCE("volumeDelta", 0)
WHERE "sharesOutstanding" IS NULL
   OR "volumeDelta" IS NULL;

-- Convert Float-based accounting/quantity columns to Decimal(36,6) with explicit rounding.
ALTER TABLE "MarketOutcomeSnapshot"
  ALTER COLUMN "price" TYPE DECIMAL(36,6) USING ROUND(COALESCE("price", 0)::numeric, 6),
  ALTER COLUMN "sharesOutstanding" TYPE DECIMAL(36,6) USING ROUND(COALESCE("sharesOutstanding", 0)::numeric, 6),
  ALTER COLUMN "volumeDelta" TYPE DECIMAL(36,6) USING ROUND(COALESCE("volumeDelta", 0)::numeric, 6);

ALTER TABLE "PoolBet"
  ALTER COLUMN "amount" TYPE DECIMAL(36,6) USING ROUND(COALESCE("amount", 0)::numeric, 6);

ALTER TABLE "PoolStakePreset"
  ALTER COLUMN "amount" TYPE DECIMAL(36,6) USING ROUND(COALESCE("amount", 0)::numeric, 6);

ALTER TABLE "Position"
  ALTER COLUMN "shares" TYPE DECIMAL(36,6) USING ROUND(COALESCE("shares", 0)::numeric, 6),
  ALTER COLUMN "avgCost" TYPE DECIMAL(36,6) USING ROUND(COALESCE("avgCost", 0)::numeric, 6);

ALTER TABLE "Trade"
  ALTER COLUMN "shares" TYPE DECIMAL(36,6) USING ROUND(COALESCE("shares", 0)::numeric, 6),
  ALTER COLUMN "cost" TYPE DECIMAL(36,6) USING ROUND(COALESCE("cost", 0)::numeric, 6),
  ALTER COLUMN "fee" TYPE DECIMAL(36,6) USING ROUND(COALESCE("fee", 0)::numeric, 6);
