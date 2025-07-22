import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { Service } from '@prisma/client';

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
      image,
      video,
      prices,
    } = dto;

    return await this.prismaService.service.create({
      data: {
        name,
        description,
        advantages,
        longDescription,
        image,
        video,
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
}
