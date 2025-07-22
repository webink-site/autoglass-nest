import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWrapElementDto } from './dto/create-wrap-element.dto';
import { CreateWrapPackageDto } from './dto/create-wrap-package.dto';

@Injectable()
export class WrapService {
  constructor(private prismaService: PrismaService) {}

  async getAllCalc() {
    const elements = await this.prismaService.wrapElement.findMany({
      include: {
        prices: {
          select: {
            transportType: true,
            price: true,
          },
        },
      },
    });
    const packages = await this.prismaService.wrapPackage.findMany();

    return {
      elements,
      packages,
    };
  }

  async createElement(dto: CreateWrapElementDto) {
    const { name, prices } = dto;
    const element = await this.prismaService.wrapElement.create({
      data: {
        name,
        prices: {
          create: prices.map((p) => ({
            transportType: p.transportType,
            price: p.price,
          })),
        },
      },
      include: {
        prices: true,
      },
    });

    return element;
  }

  async createPackage(dto: CreateWrapPackageDto) {
    return this.prismaService.wrapPackage.create({
      data: {
        name: dto.name,
        elementIds: dto.elementIds,
      },
    });
  }
}
