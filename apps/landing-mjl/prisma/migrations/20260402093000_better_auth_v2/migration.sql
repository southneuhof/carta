-- Better Auth user/session tables plus legacy admin user backfill.

ALTER TABLE "User"
  ALTER COLUMN "password" DROP NOT NULL,
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "image" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User"
SET "emailVerified" = true
WHERE "password" IS NOT NULL;

CREATE TABLE "AuthSession" (
  "id" SERIAL NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" INTEGER NOT NULL,

  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthAccount" (
  "id" SERIAL NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthVerification" (
  "id" SERIAL NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");
CREATE INDEX "AuthVerification_identifier_idx" ON "AuthVerification"("identifier");

ALTER TABLE "AuthSession"
  ADD CONSTRAINT "AuthSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthAccount"
  ADD CONSTRAINT "AuthAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AuthAccount" (
  "id",
  "accountId",
  "providerId",
  "userId",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  CAST("id" AS TEXT),
  'credential',
  "id",
  "password",
  "createdAt",
  "updatedAt"
FROM "User"
WHERE "password" IS NOT NULL;

SELECT setval(
  pg_get_serial_sequence('"AuthAccount"', 'id'),
  COALESCE((SELECT MAX("id") FROM "AuthAccount"), 1),
  true
);
