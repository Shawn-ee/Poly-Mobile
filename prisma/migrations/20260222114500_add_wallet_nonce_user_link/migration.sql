-- AlterTable
ALTER TABLE "WalletNonce" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "WalletNonce_userId_idx" ON "WalletNonce"("userId");

-- AddForeignKey
ALTER TABLE "WalletNonce" ADD CONSTRAINT "WalletNonce_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
