/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GalleryService } from 'src/gallery/gallery.service';
import { Service, EnumFileType } from '@prisma/client';
import { CreateServiceWithFilesDto } from './dto/create-service.dto';
import { UpdateServiceWithFilesDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(
    private prismaService: PrismaService,
    private galleryService: GalleryService,
  ) {}

  async findAll(): Promise<Service[]> {
    const services = await this.prismaService.service.findMany({
      include: {
        cardImage: true,
      },
    });
    return services.map((i) => ({ ...i, cardImage: i.cardImage?.imageUrl }));
  }

  async findOne(id: number) {
    const service = await this.prismaService.service.findUnique({
      where: { id },
      include: {
        cardImage: true,
        headerImage: true,
        video: {
          select: {
            imageUrl: true,
          },
        },
        galleryItems: {
          select: {
            imageUrl: true,
          },
        }, // Добавляем галерею
        prices: {
          include: {
            variations: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return {
      ...service,
      video: service.video?.imageUrl || null,
      galleryItems: service.galleryItems.map((item) => item.imageUrl),
    };
  }

  async create(
    dto: CreateServiceWithFilesDto,
    files: {
      cardImage?: Express.Multer.File[];
      headerImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    const { name, description, advantages, longDescription, prices } = dto;

    // Простая проверка и парсинг для prices
    const pricesArray = Array.isArray(prices)
      ? prices
      : JSON.parse(prices as string);

    // Простая проверка и парсинг для advantages
    const advantagesArray = Array.isArray(advantages)
      ? advantages
      : JSON.parse(advantages as string);

    // Создаем сервис сначала
    const service = await this.prismaService.service.create({
      data: {
        name,
        description,
        advantages: advantagesArray, // Используем распарсенный массив
        longDescription,
        prices: {
          create: pricesArray.map((price) => ({
            transportType: price.transportType,
            variations: {
              create: price.variations.map((variation) => ({
                name: variation.name,
                price: variation.price,
              })),
            },
          })),
        },
      },
    });

    // Остальной код без изменений...
    let cardImageId: number | undefined;
    let headerImageId: number | undefined;
    let videoId: number | undefined;

    if (files.cardImage?.[0]) {
      const cardImageItem = await this.galleryService.saveFile(
        files.cardImage[0],
        EnumFileType.IMAGE,
      );
      cardImageId = cardImageItem.id;
    }

    if (files.headerImage?.[0]) {
      const headerImageItem = await this.galleryService.saveFile(
        files.headerImage[0],
        EnumFileType.IMAGE,
      );
      headerImageId = headerImageItem.id;
    }

    if (files.video?.[0]) {
      const videoItem = await this.galleryService.saveFile(
        files.video[0],
        EnumFileType.VIDEO,
      );
      videoId = videoItem.id;
    }

    if (files.gallery?.length) {
      await this.galleryService.saveMultipleFiles(
        files.gallery,
        EnumFileType.IMAGE,
        service.id,
      );
    }

    const updatedService = await this.prismaService.service.update({
      where: { id: service.id },
      data: {
        cardImageId,
        headerImageId,
        videoId,
      },
      include: {
        cardImage: true,
        headerImage: true,
        video: true,
        galleryItems: true,
        prices: {
          include: {
            variations: true,
          },
        },
      },
    });

    return updatedService;
  }

  async update(
    id: number,
    dto: UpdateServiceWithFilesDto,
    files: {
      cardImage?: Express.Multer.File[];
      headerImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    const existing = await this.prismaService.service.findUnique({
      where: { id },
      include: { prices: { include: { variations: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Парсим advantages и prices если они переданы
    let advantagesArray;
    if (dto.advantages !== undefined) {
      advantagesArray = Array.isArray(dto.advantages)
        ? dto.advantages
        : JSON.parse(dto.advantages as string);
    }

    let pricesArray;
    if (dto.prices !== undefined) {
      pricesArray = Array.isArray(dto.prices)
        ? dto.prices
        : JSON.parse(dto.prices as string);
    }

    // Обновляем отдельные файлы если они переданы
    let cardImageId = existing.cardImageId;
    let headerImageId = existing.headerImageId;
    let videoId = existing.videoId;

    if (files.cardImage?.[0]) {
      const cardImageItem = await this.galleryService.updateFile(
        existing.cardImageId,
        files.cardImage[0],
        EnumFileType.IMAGE,
      );
      cardImageId = cardImageItem.id;
    }

    if (files.headerImage?.[0]) {
      const headerImageItem = await this.galleryService.updateFile(
        existing.headerImageId,
        files.headerImage[0],
        EnumFileType.IMAGE,
      );
      headerImageId = headerImageItem.id;
    }

    if (files.video?.[0]) {
      const videoItem = await this.galleryService.updateFile(
        existing.videoId,
        files.video[0],
        EnumFileType.VIDEO,
      );
      videoId = videoItem.id;
    }

    // Обновляем галерею если переданы новые файлы
    if (files.gallery?.length) {
      // Удаляем старую галерею
      await this.galleryService.deleteServiceGallery(id);

      // Добавляем новую галерею
      await this.galleryService.saveMultipleFiles(
        files.gallery,
        EnumFileType.IMAGE,
        id,
      );
    }

    // Удаляем старые вариации и цены если передаются новые
    if (pricesArray) {
      await this.prismaService.variation.deleteMany({
        where: {
          servicePrice: {
            serviceId: id,
          },
        },
      });

      await this.prismaService.servicePrice.deleteMany({
        where: { serviceId: id },
      });
    }

    // Обновляем услугу
    await this.prismaService.service.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        advantages: advantagesArray, // Используем распарсенный массив
        longDescription: dto.longDescription,
        cardImageId,
        headerImageId,
        videoId,
      },
    });

    // Добавляем новые prices и variations если они переданы
    if (pricesArray && pricesArray.length > 0) {
      for (const price of pricesArray) {
        // Добавляем проверку на обязательные поля
        if (!price.transportType) {
          throw new Error('Transport type is required');
        }

        const createdPrice = await this.prismaService.servicePrice.create({
          data: {
            serviceId: id,
            transportType: price.transportType,
          },
        });

        if (price.variations?.length) {
          // Фильтруем только валидные вариации
          const validVariations = price.variations.filter(
            (variation) => variation.name && variation.price !== undefined,
          );

          if (validVariations.length > 0) {
            await this.prismaService.variation.createMany({
              data: validVariations.map((variation) => ({
                servicePriceId: createdPrice.id,
                name: variation.name!,
                price: variation.price!,
              })),
            });
          }
        }
      }
    }

    return this.prismaService.service.findUnique({
      where: { id },
      include: {
        cardImage: true,
        headerImage: true,
        video: true,
        galleryItems: true,
        prices: {
          include: {
            variations: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    const existing = await this.prismaService.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Удаляем связанные файлы
    if (existing.cardImageId) {
      await this.galleryService.deleteFile(existing.cardImageId);
    }
    if (existing.headerImageId) {
      await this.galleryService.deleteFile(existing.headerImageId);
    }
    if (existing.videoId) {
      await this.galleryService.deleteFile(existing.videoId);
    }

    // Удаляем галерею (автоматически через onDelete: Cascade в схеме)
    await this.galleryService.deleteServiceGallery(id);

    return await this.prismaService.service.delete({
      where: { id },
    });
  }
}
