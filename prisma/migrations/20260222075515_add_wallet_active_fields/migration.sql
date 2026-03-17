DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Wallet'
      AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;
