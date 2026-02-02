import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  //   Delete,
  //   FileTypeValidator,
  //   MaxFileSizeValidator,
  //   Param,
  //   ParseFilePipe,
  //   Post,
  //   UploadedFile,
  //   UseInterceptors,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
// import { FileInterceptor } from '@nestjs/platform-express';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return await this.galleryService.findAll(page, limit);
  }

  // @UseInterceptors(FileInterceptor('file'))
  // @Post('upload')
  // upload(
  //   @UploadedFile(
  //     new ParseFilePipe({
  //       validators: [
  //         new FileTypeValidator({
  //           fileType: /\/(jpg|jpeg|png|webp|gif|mp4)$/i,
  //         }),
  //         new MaxFileSizeValidator({
  //           maxSize: 5 * 1024 * 1024, // 2.5 MB
  //         }),
  //       ],
  //       fileIsRequired: true,
  //     }),
  //   )
  //   file: Express.Multer.File,
  // ) {
  //   {
  //     console.log(file);
  //     return this.galleryService.createGalleryImage(file);
  //   }
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.galleryService.remove(+id);
  // }
}
