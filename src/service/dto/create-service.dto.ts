/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TransportType } from '@prisma/client';

export class CreateVariationDto {
  @IsString()
  @IsNotEmpty({ message: 'Название вариации обязательно' })
  name: string;

  @Transform(({ value }) => parseInt(value))
  @IsNotEmpty({ message: 'Цена обязательна' })
  price: number;
}

export class CreateServicePriceDto {
  @IsString()
  @IsNotEmpty({ message: 'Тип транспорта обязателен' })
  transportType: TransportType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariationDto)
  @ArrayMinSize(1, { message: 'Должна быть хотя бы одна вариация' })
  variations: CreateVariationDto[];
}

// В create-service.dto.ts
export class CreateServiceWithFilesDto {
  @IsString()
  @IsNotEmpty({ message: 'Название сервиса обязательно' })
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty({ message: 'Описание сервиса обязательно' })
  description: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsString({ each: true })
  advantages: string[];

  @IsString()
  @IsNotEmpty({ message: 'Подробное описание обязательно' })
  longDescription: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServicePriceDto)
  @ArrayMinSize(1, { message: 'Должна быть хотя бы одна цена' })
  prices: CreateServicePriceDto[];
}
