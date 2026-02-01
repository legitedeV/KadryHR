import {
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export type AvatarEntityType = 'employees' | 'organisations' | 'users';

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class AvatarsService {
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), '..', 'uploads', 'avatars');
  }

  private getUploadDir(
    organisationId: string,
    entityType: AvatarEntityType,
    entityId: string,
  ): string {
    return path.join(this.baseUploadDir, organisationId, entityType, entityId);
  }

  async ensureUploadDir(
    organisationId: string,
    entityType: AvatarEntityType,
    entityId: string,
  ): Promise<void> {
    const uploadDir = this.getUploadDir(organisationId, entityType, entityId);
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(this.baseUploadDir, { recursive: true, mode: 0o750 });
      await fs.mkdir(uploadDir, { recursive: true, mode: 0o750 });
    }
  }

  validateFile(mimeType: string, size: number): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new UnsupportedMediaTypeException(
        `Niedozwolony typ pliku. Dozwolone: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `Plik jest za duży. Maksymalny rozmiar: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  generateFilename(originalName: string, entityId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    return `${entityId}-${timestamp}-${random}${ext}`;
  }

  async saveAvatar(
    buffer: Buffer,
    organisationId: string,
    entityType: AvatarEntityType,
    entityId: string,
    originalFilename: string,
  ): Promise<{ avatarPath: string; avatarUrl: string }> {
    await this.ensureUploadDir(organisationId, entityType, entityId);

    const filename = this.generateFilename(originalFilename, entityId);
    const uploadDir = this.getUploadDir(organisationId, entityType, entityId);
    const fullPath = path.join(uploadDir, filename);

    await fs.writeFile(fullPath, buffer, { mode: 0o640 });

    const avatarPath = path
      .join('avatars', organisationId, entityType, entityId, filename)
      .replace(/\\/g, '/');
    return {
      avatarPath,
      avatarUrl: `/static/${avatarPath}`,
    };
  }

  async deleteAvatar(avatarPath: string): Promise<void> {
    if (!avatarPath) return;

    // Skip deletion for data URLs (base64 encoded images)
    if (avatarPath.startsWith('data:')) {
      return;
    }

    const resolvedPath = this.resolveStoragePath(avatarPath);
    if (!resolvedPath) return;

    try {
      await fs.unlink(resolvedPath);
    } catch (err) {
      // Ignore error if file doesn't exist
      console.error('Failed to delete avatar file:', err);
    }
  }

  buildPublicUrl(
    avatarPath?: string | null,
    legacyUrl?: string | null,
  ): string | null {
    const pathValue = avatarPath || legacyUrl;
    if (!pathValue) return null;

    if (pathValue.startsWith('http')) return pathValue;
    if (pathValue.startsWith('/static/')) return pathValue;
    if (pathValue.startsWith('static/')) return `/${pathValue}`;
    if (pathValue.startsWith('avatars/')) return `/static/${pathValue}`;
    return pathValue;
  }

  private resolveStoragePath(avatarPath: string): string | null {
    let relativePath = avatarPath;

    if (relativePath.startsWith('http')) {
      return null;
    }

    if (relativePath.startsWith('/static/')) {
      relativePath = relativePath.replace('/static/', '');
    } else if (relativePath.startsWith('static/')) {
      relativePath = relativePath.replace('static/', '');
    }

    if (relativePath.startsWith('avatars/')) {
      relativePath = relativePath.replace(/^avatars\//, '');
    }

    const normalized = path
      .normalize(relativePath)
      .replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(this.baseUploadDir, normalized);

    if (!fullPath.startsWith(path.resolve(this.baseUploadDir))) {
      return null;
    }

    return fullPath;
  }
}
