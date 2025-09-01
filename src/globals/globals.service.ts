import { Injectable } from '@nestjs/common';
import { Globals } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateGlobalDto } from './dto/update-globals.dto';

@Injectable()
export class GlobalsService {
  constructor(private prismaService: PrismaService) {}

  async getGlobals(): Promise<Globals | string> {
    const globals = await this.prismaService.globals.findFirst();
    return globals ? globals : 'Ошибка';
  }

  async createGlobals(dto: UpdateGlobalDto): Promise<Globals> {
    const globals = await this.prismaService.globals.create({
      data: {
        ...dto,
      },
    });

    return globals;
  }

  async updateGlobals(data: UpdateGlobalDto): Promise<Globals> {
    const current = await this.prismaService.globals.findFirst();
    if (!current) {
      return this.prismaService.globals.create({
        data: data,
      });
    }

    return this.prismaService.globals.update({
      where: { id: current.id },
      data,
    });
  }
}
