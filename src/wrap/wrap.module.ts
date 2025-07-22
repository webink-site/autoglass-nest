import { Module } from '@nestjs/common';
import { WrapService } from './wrap.service';
import { WrapController } from './wrap.controller';

@Module({
  controllers: [WrapController],
  providers: [WrapService],
})
export class WrapModule {}
