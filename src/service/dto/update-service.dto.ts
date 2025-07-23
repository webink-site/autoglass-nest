import { TransportType } from '@prisma/client';

export class UpdateServiceDto {
  name?: string;
  description?: string;
  advantages?: string[];
  longDescription?: string;
  image?: string;
  video?: string;
  prices?: {
    transportType: TransportType;
    variations: {
      name: string;
      price: number;
    }[];
  }[];
}
