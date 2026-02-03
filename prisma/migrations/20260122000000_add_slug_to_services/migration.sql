-- AlterTable
ALTER TABLE "services" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

