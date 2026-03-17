-- CreateEnum
CREATE TYPE "WalletLinkMethod" AS ENUM ('SIGNATURE', 'MANUAL');

-- AlterTable
ALTER TABLE "Wallet"
ADD COLUMN "linkMethod" "WalletLinkMethod" NOT NULL DEFAULT 'SIGNATURE',
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT true;
