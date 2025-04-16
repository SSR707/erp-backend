import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly uploadDir = 'uploads';

  constructor() {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    subDirectory: string = '',
  ): Promise<{ path: string }> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('No file provided or file is empty');
      }

      const targetDir = path.join(this.uploadDir, subDirectory);

      // Create subdirectory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Generate unique filename
      const fileExt = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

      if (!allowedExtensions.includes(fileExt)) {
        throw new BadRequestException(
          'Only image files (jpg, jpeg, png, gif) are allowed',
        );
      }

      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(targetDir, fileName);

      // Write file
      await fs.promises.writeFile(filePath, file.buffer);

      return {
        path: filePath.replace(/\\/g, '/'), // Normalize path for different OS
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (await this.existFile(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async existFile(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getAllFiles(subDirectory: string = ''): Promise<string[]> {
    try {
      const targetDir = path.join(this.uploadDir, subDirectory);

      if (!fs.existsSync(targetDir)) {
        throw new BadRequestException(
          `Directory "${targetDir}" does not exist`,
        );
      }

      const files = await fs.promises.readdir(targetDir);

      // To‘liq path qaytarish uchun:
      return files.map((file) =>
        path.join(targetDir, file).replace(/\\/g, '/'),
      );
    } catch (error) {
      throw new BadRequestException(`Failed to get files: ${error.message}`);
    }
  }
}
