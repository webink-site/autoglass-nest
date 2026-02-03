/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TransportType } from '@prisma/client';

export class UpdateVariationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsOptional()
  price?: number;
}

export class UpdateServicePriceDto {
  @IsString()
  @IsOptional()
  transportType?: TransportType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariationDto)
  @IsOptional()
  variations?: UpdateVariationDto[];
}

export class UpdateServiceWithFilesDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  advantages?: string[];

  @IsString()
  @IsOptional()
  longDescription?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateServicePriceDto)
  @IsOptional()
  prices?: UpdateServicePriceDto[];
}
