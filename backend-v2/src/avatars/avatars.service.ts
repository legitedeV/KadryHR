import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export type AvatarEntityType = 'employees' | 'organisations';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class AvatarsService {
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), '..', 'uploads', 'avatars');
  }

  private getUploadDir(entityType: AvatarEntityType): string {
    return path.join(this.baseUploadDir, entityType);
  }

  async ensureUploadDir(entityType: AvatarEntityType): Promise<void> {
    const uploadDir = this.getUploadDir(entityType);
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
  }

  validateFile(mimeType: string, size: number): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Niedozwolony typ pliku. Dozwolone: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Plik jest za duży. Maksymalny rozmiar: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  generateFilename(originalName: string, entityId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    return `${entityId}-${timestamp}-${random}${ext}`;
  }

  async saveAvatar(
    buffer: Buffer,
    entityType: AvatarEntityType,
    entityId: string,
    originalFilename: string,
  ): Promise<string> {
    await this.ensureUploadDir(entityType);

    const filename = this.generateFilename(originalFilename, entityId);
    const uploadDir = this.getUploadDir(entityType);
    const fullPath = path.join(uploadDir, filename);

    await fs.writeFile(fullPath, buffer);

    // Return relative URL path for static serving
    return `/static/avatars/${entityType}/${filename}`;
  }

  async deleteAvatar(avatarPath: string): Promise<void> {
    if (!avatarPath) return;

    // Convert URL path to filesystem path
    // avatarPath format: /static/avatars/employees/xxx.jpg
    const relativePath = avatarPath.replace('/static/avatars/', '');
    const fullPath = path.join(this.baseUploadDir, relativePath);

    try {
      await fs.unlink(fullPath);
    } catch (err) {
      // Ignore error if file doesn't exist
      console.error('Failed to delete avatar file:', err);
    }
  }
}
