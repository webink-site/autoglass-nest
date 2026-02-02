import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnumFileType, GalleryItem } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GalleryService {
  constructor(private prismaService: PrismaService) {}

  async saveFile(
    file: Express.Multer.File,
    fileType: EnumFileType,
    serviceId?: number,
  ) {
    // Создаем папку uploads если не существует
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadsDir, fileName);

    // Сохраняем файл
    fs.writeFileSync(filePath, file.buffer);

    // Создаем запись в базе данных
    const galleryItem = await this.prismaService.galleryItem.create({
      data: {
        imageUrl: `/uploads/${fileName}`,
        fileType,
        serviceId, // Связываем с сервисом если передан serviceId
      },
    });

    return galleryItem;
  }

  async saveMultipleFiles(
    files: Express.Multer.File[],
    fileType: EnumFileType,
    serviceId?: number,
  ) {
    const galleryItems: GalleryItem[] = [];

    for (const file of files) {
      const item = await this.saveFile(file, fileType, serviceId);
      galleryItems.push(item);
    }

    return galleryItems;
  }

  async deleteFile(id: number) {
    const galleryItem = await this.prismaService.galleryItem.findUnique({
      where: { id },
    });

    if (galleryItem) {
      // Удаляем файл с диска
      const filePath = path.join(process.cwd(), galleryItem.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Удаляем запись из базы
      await this.prismaService.galleryItem.delete({
        where: { id },
      });
    }
  }

  async deleteServiceGallery(serviceId: number) {
    // Получаем все элементы галереи сервиса
    const galleryItems = await this.prismaService.galleryItem.findMany({
      where: { serviceId },
    });

    // Удаляем файлы с диска
    for (const item of galleryItems) {
      const filePath = path.join(process.cwd(), item.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Удаляем записи из базы
    await this.prismaService.galleryItem.deleteMany({
      where: { serviceId },
    });
  }

  async updateFile(
    oldId: number | null,
    file: Express.Multer.File,
    fileType: EnumFileType,
  ) {
    // Удаляем старый файл если существует
    if (oldId) {
      await this.deleteFile(oldId);
    }

    // Сохраняем новый файл
    return await this.saveFile(file, fileType);
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prismaService.galleryItem.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          imageUrl: true,
          fileType: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prismaService.galleryItem.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
