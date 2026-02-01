import { UnsupportedMediaTypeException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  ALLOWED_MIME_TYPES,
  AvatarsService,
  MAX_FILE_SIZE,
} from './avatars.service';

describe('AvatarsService', () => {
  let service: AvatarsService;
  let tempRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avatars-test-'));
    const backendDir = path.join(tempRoot, 'backend-v2');
    await fs.mkdir(backendDir, { recursive: true });
    process.chdir(backendDir);
    service = new AvatarsService();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('validates allowed mime types and sizes', () => {
    expect(() =>
      service.validateFile(ALLOWED_MIME_TYPES[0], MAX_FILE_SIZE),
    ).not.toThrow();

    expect(() => service.validateFile('image/gif', 1024)).toThrow(
      UnsupportedMediaTypeException,
    );

    expect(() => service.validateFile('image/png', MAX_FILE_SIZE + 1)).toThrow(
      /Plik jest za duży/,
    );
  });

  it('saves avatar and returns public url', async () => {
    const buffer = Buffer.from('avatar-data');
    const result = await service.saveAvatar(
      buffer,
      'org-1',
      'users',
      'user-1',
      'photo.png',
    );

    expect(result.avatarPath).toContain('avatars/org-1/users/user-1/');
    expect(result.avatarUrl).toMatch(/^\/static\/avatars\/org-1\/users\/user-1\//);

    const filename = path.basename(result.avatarPath);
    const storedPath = path.join(
      process.cwd(),
      '..',
      'uploads',
      'avatars',
      'org-1',
      'users',
      'user-1',
      filename,
    );
    const stored = await fs.readFile(storedPath);
    expect(stored).toEqual(buffer);
  });

  it('deletes avatar path with static prefix', async () => {
    const buffer = Buffer.from('avatar-data');
    const result = await service.saveAvatar(
      buffer,
      'org-2',
      'employees',
      'emp-1',
      'photo.jpg',
    );

    await service.deleteAvatar(`/static/${result.avatarPath}`);

    const filename = path.basename(result.avatarPath);
    const storedPath = path.join(
      process.cwd(),
      '..',
      'uploads',
      'avatars',
      'org-2',
      'employees',
      'emp-1',
      filename,
    );
    await expect(fs.stat(storedPath)).rejects.toThrow();
  });

  it('builds public url for known inputs', () => {
    expect(service.buildPublicUrl('avatars/org/u/1.png')).toBe(
      '/static/avatars/org/u/1.png',
    );
    expect(service.buildPublicUrl('/static/avatars/org/u/1.png')).toBe(
      '/static/avatars/org/u/1.png',
    );
    expect(service.buildPublicUrl('https://example.com/a.png')).toBe(
      'https://example.com/a.png',
    );
    expect(service.buildPublicUrl(null, null)).toBeNull();
  });
});
