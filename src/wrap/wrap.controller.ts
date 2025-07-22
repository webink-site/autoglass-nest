import { Body, Controller, Get, Post } from '@nestjs/common';
import { WrapService } from './wrap.service';
import { CreateWrapElementDto } from './dto/create-wrap-element.dto';
import { CreateWrapPackageDto } from './dto/create-wrap-package.dto';

@Controller('wrap')
export class WrapController {
  constructor(private readonly wrapService: WrapService) {}

  @Get('calc')
  getAllCalc() {
    return this.wrapService.getAllCalc();
  }

  @Post('element')
  createElement(@Body() dto: CreateWrapElementDto) {
    return this.wrapService.createElement(dto);
  }

  @Post('package')
  createPackage(@Body() dto: CreateWrapPackageDto) {
    return this.wrapService.createPackage(dto);
  }
}
