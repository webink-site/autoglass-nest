import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { Express } from 'express';

@Injectable()
export class FileService {
  uploadFileToFolder(file: Express.Multer.File, folder: string): string {
    if (!file || !file.originalname || !file.buffer) {
      throw new BadRequestException('Некорректный файл');
    }

    const uploadDir = path.join(__dirname, '..', '..', 'uploads', folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return `uploads/${folder}/${fileName}`;
  }

  deleteFile(relativePath: string): void {
    const fullPath = path.join(__dirname, '..', '..', relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    } else {
      console.warn(`Файл не найден: ${fullPath}`);
    }
  }
}
