CREATE TABLE "UserProfilePreference" (
  "userId" TEXT NOT NULL,
  "preferences" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserProfilePreference_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserProfilePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
