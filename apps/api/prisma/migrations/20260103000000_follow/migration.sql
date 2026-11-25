-- Follow relationships
CREATE TABLE "Follow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Align the reconstructed schema with the current Prisma models.
-- Public handles for profile routes.
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "handle" TEXT;
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
-- Hashed refresh-token sessions (no raw refresh tokens, no revocation/audit columns).
ALTER TABLE "Session" ADD COLUMN "refreshHash" TEXT;
UPDATE "Session" SET "refreshHash" = "refreshToken" WHERE "refreshHash" IS NULL;
ALTER TABLE "Session" ALTER COLUMN "refreshHash" SET NOT NULL;
CREATE UNIQUE INDEX "Session_refreshHash_key" ON "Session"("refreshHash");
DROP INDEX "Session_refreshToken_key";
ALTER TABLE "Session" DROP COLUMN "refreshToken";
ALTER TABLE "Session" DROP COLUMN "userAgent";
ALTER TABLE "Session" DROP COLUMN "ipAddress";
ALTER TABLE "Session" DROP COLUMN "revokedAt";
ALTER TABLE "Session" DROP COLUMN "updatedAt";
-- Simplified verification records.
ALTER TABLE "VerificationRecord" DROP COLUMN "state";
ALTER TABLE "VerificationRecord" DROP COLUMN "method";
ALTER TABLE "VerificationRecord" DROP COLUMN "evidenceRef";
ALTER TABLE "VerificationRecord" DROP COLUMN "reviewedBy";
ALTER TABLE "VerificationRecord" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "VerificationRecord" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "VerificationRecord" ADD COLUMN "trustLabel" "TrustLabel" NOT NULL DEFAULT 'STUDENT_CREATED';
-- Simplified academic/social taxonomy and resources.
ALTER TABLE "University" DROP COLUMN "domain";
DROP INDEX "University_domain_key";
ALTER TABLE "Faculty" DROP COLUMN "createdAt";
ALTER TABLE "Department" DROP COLUMN "createdAt";
DROP INDEX "Department_facultyId_name_key";
ALTER TABLE "Department" ADD COLUMN "universityId" TEXT;
ALTER TABLE "Programme" DROP COLUMN "createdAt";
DROP INDEX "Programme_departmentId_name_key";
ALTER TABLE "Programme" ADD COLUMN "universityId" TEXT;
ALTER TABLE "RoleAssignment" DROP COLUMN "scopeType";
ALTER TABLE "RoleAssignment" DROP COLUMN "scopeId";
DROP INDEX "RoleAssignment_userId_role_scopeType_scopeId_key";
ALTER TABLE "RoleAssignment" ADD COLUMN "scope" TEXT;
ALTER TABLE "CourseResource" DROP COLUMN "url";
ALTER TABLE "CourseResource" DROP COLUMN "createdAt";
CREATE INDEX "CourseResource_courseCode_idx" ON "CourseResource"("courseCode");
ALTER TABLE "Post" DROP COLUMN "typeLabel";
ALTER TABLE "Post" ADD COLUMN "typeLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Post" DROP COLUMN "hashtags";
ALTER TABLE "Post" ADD COLUMN "hashtags" TEXT[];
ALTER TABLE "Department" ADD CONSTRAINT "Department_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Drop enum value removed from PostType.
ALTER TYPE "PostType" RENAME TO "PostType_old";
CREATE TYPE "PostType" AS ENUM ('GENERAL', 'ACADEMIC', 'PROJECT', 'CAMPUS', 'FORUM');
ALTER TABLE "Post" ALTER COLUMN "type" TYPE "PostType" USING ("type"::text::"PostType");
DROP TYPE "PostType_old";
