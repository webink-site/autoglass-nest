-- CreateEnum
CREATE TYPE "EnumFileType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('ALL', 'SEDAN', 'BUSINESS', 'SUV', 'MINIBUS');

-- CreateTable
CREATE TABLE "Globals" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "social1" TEXT,
    "social2" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Globals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "advantages" TEXT[],
    "long_description" TEXT NOT NULL,
    "card_image_id" INTEGER,
    "header_image_id" INTEGER,
    "video_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePrice" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "transportType" "TransportType" NOT NULL,

    CONSTRAINT "ServicePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variation" (
    "id" SERIAL NOT NULL,
    "servicePriceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "Variation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrap_elementsservices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "wrap_elementsservices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrapPrice" (
    "id" SERIAL NOT NULL,
    "transportType" "TransportType" NOT NULL,
    "price" INTEGER NOT NULL,
    "wrapElementId" INTEGER,

    CONSTRAINT "WrapPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrap_packages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "element_ids" INTEGER[],

    CONSTRAINT "wrap_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "file_type" "EnumFileType" NOT NULL DEFAULT 'IMAGE',
    "service_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WrapPrice_wrapElementId_transportType_key" ON "WrapPrice"("wrapElementId", "transportType");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_card_image_id_fkey" FOREIGN KEY ("card_image_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_header_image_id_fkey" FOREIGN KEY ("header_image_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variation" ADD CONSTRAINT "Variation_servicePriceId_fkey" FOREIGN KEY ("servicePriceId") REFERENCES "ServicePrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrapPrice" ADD CONSTRAINT "WrapPrice_wrapElementId_fkey" FOREIGN KEY ("wrapElementId") REFERENCES "wrap_elementsservices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
