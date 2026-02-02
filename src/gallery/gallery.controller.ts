import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { EnumFileType } from '@prisma/client';

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

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 200 * 1024 * 1024, // 200MB
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only image and video files are allowed'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileType = file.mimetype.startsWith('video/')
      ? EnumFileType.VIDEO
      : EnumFileType.IMAGE;
    return await this.galleryService.saveFile(file, fileType);
  }

  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: {
        fileSize: 200 * 1024 * 1024, // 200MB
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only image and video files are allowed'), false);
        }
      },
    }),
  )
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const results: Awaited<ReturnType<typeof this.galleryService.saveFile>>[] =
      [];
    for (const file of files) {
      const fileType = file.mimetype.startsWith('video/')
        ? EnumFileType.VIDEO
        : EnumFileType.IMAGE;
      const item = await this.galleryService.saveFile(file, fileType);
      results.push(item);
    }
    return results;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.galleryService.deleteFile(+id);
    return { success: true, message: 'File deleted successfully' };
  }
}
