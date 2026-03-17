DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'market_visibility_mechanism_check'
  ) THEN
    ALTER TABLE "Market"
    ADD CONSTRAINT market_visibility_mechanism_check
    CHECK (NOT ("mechanism" = 'POOL' AND "visibility" = 'PUBLIC'));
  END IF;
END $$;
