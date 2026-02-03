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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          а: 'a',
          б: 'b',
          в: 'v',
          г: 'g',
          д: 'd',
          е: 'e',
          ё: 'e',
          ж: 'zh',
          з: 'z',
          и: 'i',
          й: 'y',
          к: 'k',
          л: 'l',
          м: 'm',
          н: 'n',
          о: 'o',
          п: 'p',
          р: 'r',
          с: 's',
          т: 't',
          у: 'u',
          ф: 'f',
          х: 'h',
          ц: 'ts',
          ч: 'ch',
          ш: 'sh',
          щ: 'sch',
          ъ: '',
          ы: 'y',
          ь: '',
          э: 'e',
          ю: 'yu',
          я: 'ya',
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(): Promise<Service[]> {
    const services = await this.prismaService.service.findMany({
      include: {
        cardImage: true,
      },
    });
    return services.map((i) => ({ ...i, cardImage: i.cardImage?.imageUrl }));
  }

  async findOne(idOrSlug: number | string) {
    const isNumeric = !isNaN(Number(idOrSlug));
    const where = isNumeric
      ? ({ id: Number(idOrSlug) } as { id: number })
      : ({ slug: idOrSlug as string } as { slug: string });

    const service = await this.prismaService.service.findUnique({
      where: where as any,
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
      throw new NotFoundException(
        `Service with ${isNumeric ? 'ID' : 'slug'} ${idOrSlug} not found`,
      );
    }

    return {
      ...service,
      video: (service as any).video?.imageUrl || null,
      galleryItems: ((service as any).galleryItems || []).map(
        (item: any) => item.imageUrl,
      ),
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
    const { name, description, advantages, longDescription, prices, slug } =
      dto;

    // Простая проверка и парсинг для prices
    const pricesArray = Array.isArray(prices)
      ? prices
      : JSON.parse(prices as string);

    // Простая проверка и парсинг для advantages
    const advantagesArray = Array.isArray(advantages)
      ? advantages
      : JSON.parse(advantages as string);

    // Генерируем slug если не передан
    const baseSlug = slug || this.generateSlug(name);

    // Проверяем уникальность slug
    let counter = 1;
    let uniqueSlug = baseSlug;
    while (
      await this.prismaService.service.findUnique({
        where: { slug: uniqueSlug } as { slug: string },
      })
    ) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Создаем сервис сначала
    const service = await this.prismaService.service.create({
      data: {
        name,
        slug: uniqueSlug,
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
      } as any,
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
    idOrSlug: number | string,
    dto: UpdateServiceWithFilesDto,
    files: {
      cardImage?: Express.Multer.File[];
      headerImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    const isNumeric = !isNaN(Number(idOrSlug));
    const where = isNumeric
      ? ({ id: Number(idOrSlug) } as { id: number })
      : ({ slug: idOrSlug as string } as { slug: string });

    const existing = await this.prismaService.service.findUnique({
      where: where as any,
      include: { prices: { include: { variations: true } } },
    });

    if (!existing) {
      throw new NotFoundException(
        `Service with ${isNumeric ? 'ID' : 'slug'} ${idOrSlug} not found`,
      );
    }

    const id = existing.id;

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

    // Обрабатываем slug если передан
    let finalSlug = dto.slug;
    if (dto.slug) {
      // Проверяем уникальность slug (исключая текущий сервис)
      let counter = 1;
      let uniqueSlug = dto.slug;
      while (
        await this.prismaService.service.findFirst({
          where: {
            slug: uniqueSlug,
            id: { not: id },
          } as any,
        })
      ) {
        uniqueSlug = `${dto.slug}-${counter}`;
        counter++;
      }
      finalSlug = uniqueSlug;
    } else if (dto.name && dto.name !== existing.name) {
      // Генерируем slug если изменилось имя
      const baseSlug = this.generateSlug(dto.name);
      let counter = 1;
      let uniqueSlug = baseSlug;
      while (
        await this.prismaService.service.findFirst({
          where: {
            slug: uniqueSlug,
            id: { not: id },
          } as any,
        })
      ) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      finalSlug = uniqueSlug;
    }

    // Обновляем услугу
    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      advantages?: string[];
      longDescription?: string;
      cardImageId?: number | null;
      headerImageId?: number | null;
      videoId?: number | null;
    } = {
      name: dto.name,
      description: dto.description,
      advantages: advantagesArray,
      longDescription: dto.longDescription,
      cardImageId,
      headerImageId,
      videoId,
    };

    if (finalSlug) {
      updateData.slug = finalSlug;
    }

    await this.prismaService.service.update({
      where: { id },
      data: updateData,
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

  async delete(idOrSlug: number | string) {
    const isNumeric = !isNaN(Number(idOrSlug));
    const where = isNumeric
      ? ({ id: Number(idOrSlug) } as { id: number })
      : ({ slug: idOrSlug as string } as { slug: string });

    const existing = await this.prismaService.service.findUnique({
      where: where as any,
    });

    if (!existing) {
      throw new NotFoundException(
        `Service with ${isNumeric ? 'ID' : 'slug'} ${idOrSlug} not found`,
      );
    }

    const id = existing.id;

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
