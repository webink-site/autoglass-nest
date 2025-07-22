import { Body, Controller, Get, Put } from '@nestjs/common';
import { GlobalsService } from './globals.service';
import { UpdateGlobalDto } from './dto/update-globals.dto';

@Controller('globals')
export class GlobalsController {
  constructor(private readonly globalsService: GlobalsService) {}

  @Get()
  getGlobalsData() {
    return this.globalsService.getGlobals();
  }

  @Put()
  updateGlobalsData(@Body() dto: UpdateGlobalDto) {
    return this.globalsService.updateGlobals(dto);
  }
}
