-- AlterTable
ALTER TABLE "services" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- Note: Slugs will be filled by fill-slugs.ts script after migration

