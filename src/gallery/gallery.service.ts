import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Express } from 'express';
import { FileService } from 'src/file/file.service';
import { GalleryItem } from '@prisma/client';
@Injectable()
export class GalleryService {
  constructor(
    private prismaService: PrismaService,
    private fileService: FileService,
  ) {}

  async findAll(): Promise<GalleryItem[]> {
    const gallery = await this.prismaService.galleryItem.findMany();
    return gallery;
  }

  async createGalleryImage(file: Express.Multer.File) {
    const filePath = this.fileService.uploadFileToFolder(file, 'gallery');

    const image = await this.prismaService.galleryItem.create({
      data: {
        imageUrl: filePath,
        fileType: file.mimetype.includes('video') ? 'VIDEO' : 'IMAGE',
      },
    });

    return image;
  }

  async remove(id: number) {
    const galleryItem = await this.prismaService.galleryItem.findUnique({
      where: { id },
    });

    if (!galleryItem) {
      throw new NotFoundException('Фотография не найдена');
    }

    // Удаляем файл из папки
    this.fileService.deleteFile(galleryItem.imageUrl);

    await this.prismaService.galleryItem.delete({
      where: { id },
    });

    return true;
  }
}
