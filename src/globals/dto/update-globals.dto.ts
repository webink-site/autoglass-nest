import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateGlobalDto {
  @IsString()
  phone: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  social1?: string;

  @IsOptional()
  @IsString()
  social2?: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
