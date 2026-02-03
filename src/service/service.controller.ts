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

  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.serviceService.findOne(idOrSlug);
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
          fileSize: 200 * 1024 * 1024, // 200MB
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

  @Patch(':idOrSlug')
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
          fileSize: 200 * 1024 * 1024, // 200MB
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
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: UpdateServiceWithFilesDto,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[];
      headerImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.serviceService.update(idOrSlug, dto, files);
  }

  @Delete(':idOrSlug')
  async delete(@Param('idOrSlug') idOrSlug: string) {
    return this.serviceService.delete(idOrSlug);
  }
}
