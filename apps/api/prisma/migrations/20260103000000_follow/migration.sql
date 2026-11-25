-- Follow relationships
CREATE TABLE IF NOT EXISTS "Follow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");
DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followerId_fkey') THEN
    ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followingId_fkey') THEN
    ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $do$;
-- Align the reconstructed schema with the current Prisma models.
-- Public handles for profile routes.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "handle" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_handle_key" ON "User"("handle");
-- Hashed refresh-token sessions (no raw refresh tokens, no revocation/audit columns).
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "refreshHash" TEXT;
UPDATE "Session" SET "refreshHash" = "refreshToken" WHERE "refreshHash" IS NULL;
ALTER TABLE "Session" ALTER COLUMN "refreshHash" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Session_refreshHash_key" ON "Session"("refreshHash");
DROP INDEX IF EXISTS "Session_refreshToken_key";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "refreshToken";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "userAgent";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "ipAddress";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "revokedAt";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "updatedAt";
-- Simplified verification records.
ALTER TABLE "VerificationRecord" DROP COLUMN IF EXISTS "state";
ALTER TABLE "VerificationRecord" DROP COLUMN IF EXISTS "method";
ALTER TABLE "VerificationRecord" DROP COLUMN IF EXISTS "evidenceRef";
ALTER TABLE "VerificationRecord" DROP COLUMN IF EXISTS "reviewedBy";
ALTER TABLE "VerificationRecord" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "VerificationRecord" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "VerificationRecord" ADD COLUMN IF NOT EXISTS "trustLabel" "TrustLabel" NOT NULL DEFAULT 'STUDENT_CREATED';
-- Simplified academic/social taxonomy and resources.
ALTER TABLE "University" DROP COLUMN IF EXISTS "domain";
DROP INDEX IF EXISTS "University_domain_key";
ALTER TABLE "Faculty" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "Department" DROP COLUMN IF EXISTS "createdAt";
DROP INDEX IF EXISTS "Department_facultyId_name_key";
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "universityId" TEXT;
ALTER TABLE "Programme" DROP COLUMN IF EXISTS "createdAt";
DROP INDEX IF EXISTS "Programme_departmentId_name_key";
ALTER TABLE "Programme" ADD COLUMN IF NOT EXISTS "universityId" TEXT;
ALTER TABLE "RoleAssignment" DROP COLUMN IF EXISTS "scopeType";
ALTER TABLE "RoleAssignment" DROP COLUMN IF EXISTS "scopeId";
DROP INDEX IF EXISTS "RoleAssignment_userId_role_scopeType_scopeId_key";
ALTER TABLE "RoleAssignment" ADD COLUMN IF NOT EXISTS "scope" TEXT;
ALTER TABLE "CourseResource" DROP COLUMN IF EXISTS "url";
ALTER TABLE "CourseResource" DROP COLUMN IF EXISTS "createdAt";
CREATE INDEX IF NOT EXISTS "CourseResource_courseCode_idx" ON "CourseResource"("courseCode");
ALTER TABLE "Post" DROP COLUMN IF EXISTS "typeLabel";
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "typeLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Post" DROP COLUMN IF EXISTS "hashtags";
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hashtags" TEXT[];
DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'PostType' AND e.enumlabel = 'OFFICIAL') THEN
    ALTER TYPE "PostType" ADD VALUE 'OFFICIAL';
  END IF;
END $do$;