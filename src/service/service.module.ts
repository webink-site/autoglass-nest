import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { GalleryService } from 'src/gallery/gallery.service';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService, GalleryService],
})
export class ServiceModule {}
