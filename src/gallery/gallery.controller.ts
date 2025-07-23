import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  async findAll() {
    return this.galleryService.findAll();
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /\/(jpg|jpeg|png|webp|gif|mp4)$/i,
          }),
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024, // 2.5 MB
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    {
      console.log(file);
      return this.galleryService.createGalleryImage(file);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.galleryService.remove(+id);
  }
}
