-- AlterTable
ALTER TABLE "services" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- Fill slugs for existing services (temporary values, will be updated by script)
UPDATE "services" SET "slug" = 'service-' || id::text WHERE "slug" IS NULL;

