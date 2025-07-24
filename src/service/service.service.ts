import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { Service } from '@prisma/client';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private prismaService: PrismaService) {}

  async findAll(): Promise<Service[]> {
    const services = await this.prismaService.service.findMany();
    return services;
  }

  async create(dto: CreateServiceDto) {
    const {
      name,
      description,
      advantages,
      longDescription,
      // image,
      // video,
      prices,
    } = dto;

    return await this.prismaService.service.create({
      data: {
        name,
        description,
        advantages,
        longDescription,
        // image,
        // video,
        prices: {
          create: prices.map((price) => ({
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
      include: {
        prices: {
          include: {
            variations: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateServiceDto) {
    const existing = await this.prismaService.service.findUnique({
      where: { id },
      include: { prices: { include: { variations: true } } },
    });

    if (!existing) {
      throw new Error(`Service with ID ${id} not found`);
    }

    // Удаляем старые вариации и цены
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

    // Обновляем услугу
    await this.prismaService.service.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        advantages: dto.advantages,
        longDescription: dto.longDescription,
        // image: dto.image,
        // video: dto.video,
      },
    });

    // Добавляем новые prices и variations
    if (dto.prices && dto.prices.length > 0) {
      for (const price of dto.prices) {
        const createdPrice = await this.prismaService.servicePrice.create({
          data: {
            serviceId: id,
            transportType: price.transportType,
          },
        });

        if (price.variations?.length) {
          await this.prismaService.variation.createMany({
            data: price.variations.map((variation) => ({
              servicePriceId: createdPrice.id,
              name: variation.name,
              price: variation.price,
            })),
          });
        }
      }
    }

    // Возвращаем обновлённую услугу с ценами и вариациями
    return this.prismaService.service.findUnique({
      where: { id },
      include: {
        prices: {
          include: {
            variations: true,
          },
        },
      },
    });
  }
}
