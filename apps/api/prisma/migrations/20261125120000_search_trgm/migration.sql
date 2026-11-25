CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "User_displayName_trgm" ON "User" USING gin ("displayName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm" ON "User" USING gin ("email" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Opportunity_title_trgm" ON "Opportunity" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Opportunity_organization_trgm" ON "Opportunity" USING gin ("organization" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "CourseResource_title_trgm" ON "CourseResource" USING gin ("title" gin_trgm_ops);
