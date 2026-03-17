CREATE TYPE "ApiCredentialStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "ApiCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "secretSalt" TEXT NOT NULL,
    "status" "ApiCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiCredential_keyId_key" ON "ApiCredential"("keyId");
CREATE INDEX "ApiCredential_userId_createdAt_idx" ON "ApiCredential"("userId", "createdAt");
CREATE INDEX "ApiCredential_status_createdAt_idx" ON "ApiCredential"("status", "createdAt");

ALTER TABLE "ApiCredential" ADD CONSTRAINT "ApiCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
