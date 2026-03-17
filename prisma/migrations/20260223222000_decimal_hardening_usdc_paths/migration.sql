-- Harden money columns to Decimal(36,6)
ALTER TABLE "LedgerEntry"
ALTER COLUMN "amountDelta" TYPE DECIMAL(36, 6)
USING "amountDelta"::DECIMAL(36, 6);

ALTER TABLE "LedgerTransaction"
ALTER COLUMN "amount" TYPE DECIMAL(36, 6)
USING "amount"::DECIMAL(36, 6);

ALTER TABLE "DepositIntent"
ALTER COLUMN "amount" TYPE DECIMAL(36, 6)
USING "amount"::DECIMAL(36, 6);
