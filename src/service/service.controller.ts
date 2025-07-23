import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll() {
    return this.serviceService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(+id, updateServiceDto);
  }
}
