import { Injectable } from '@nestjs/common';
import { Globals } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateGlobalDto } from './dto/update-globals.dto';

@Injectable()
export class GlobalsService {
  constructor(private prisma: PrismaService) {}

  async getGlobals(): Promise<Globals | string> {
    const globals = await this.prisma.globals.findFirst();
    return globals ? globals : 'Ошибка';
  }

  async updateGlobals(data: UpdateGlobalDto): Promise<Globals> {
    const current = await this.prisma.globals.findFirst();
    if (!current) {
      return this.prisma.globals.create({
        data: data,
      });
    }

    return this.prisma.globals.update({
      where: { id: current.id },
      data,
    });
  }
}
