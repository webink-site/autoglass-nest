import { TransportType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ElementPriceDto {
  @IsEnum(TransportType)
  transportType: TransportType;

  @IsInt()
  @Min(0)
  price: number;
}

export class CreateWrapElementDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElementPriceDto)
  prices: ElementPriceDto[];
}
