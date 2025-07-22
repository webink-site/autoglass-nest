import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum TransportType {
  SEDAN = 'SEDAN',
  BUSINESS = 'BUSINESS',
  SUV = 'SUV',
  MINIBUS = 'MINIBUS',
}

class VariationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  price: number;
}

class ServicePriceDto {
  @IsEnum(TransportType)
  transportType: TransportType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationDto)
  @ArrayNotEmpty()
  variations: VariationDto[];
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  advantages: string[];

  @IsString()
  @IsNotEmpty()
  longDescription: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsOptional()
  video?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePriceDto)
  prices: ServicePriceDto[];
}
