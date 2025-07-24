import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServiceService } from './service.service';
import { CreateServiceWithFilesDto } from './dto/create-service.dto';
import { UpdateServiceWithFilesDto } from './dto/update-service.dto';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cardImage', maxCount: 1 },
        { name: 'headerImage', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'gallery', maxCount: 20 }, // Добавляем галерею до 20 изображений
      ],
      {
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB
        },
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'video') {
            if (file.mimetype.startsWith('video/')) {
              cb(null, true);
            } else {
              cb(
                new Error('Only video files are allowed for video field'),
                false,
              );
            }
          } else {
            if (file.mimetype.startsWith('image/')) {
              cb(null, true);
            } else {
              cb(new Error('Only image files are allowed'), false);
            }
          }
        },
      },
    ),
  )
  async create(
    @Body() dto: CreateServiceWithFilesDto,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[];
      headerImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.serviceService.create(dto, files);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cardImage', maxCount: 1 },
        { name: 'headerImage', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'gallery', maxCount: 20 },
      ],
      {
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB
        },
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'video') {
            if (file.mimetype.startsWith('video/')) {
              cb(null, true);
            } else {
              cb(
                new Error('Only video files are allowed for video field'),
                false,
              );
            }
          } else {
            if (file.mimetype.startsWith('image/')) {
              cb(null, true);
            } else {
              cb(new Error('Only image files are allowed'), false);
            }
          }
        },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceWithFilesDto,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[];
      headerImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.serviceService.update(+id, dto, files);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.serviceService.delete(+id);
  }
}
