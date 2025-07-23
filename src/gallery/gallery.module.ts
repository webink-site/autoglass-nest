import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [FileModule],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
