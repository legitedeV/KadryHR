import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const buckets = {
  avatars: process.env.MINIO_BUCKET_AVATARS || 'kadryhr-avatars',
  files: process.env.MINIO_BUCKET_FILES || 'kadryhr-files',
};

export type StorageBucket = keyof typeof buckets;

async function ensureBucket(bucketName: string): Promise<void> {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
  }
}

export async function uploadFile(
  bucketKey: StorageBucket,
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const bucketName = buckets[bucketKey];
  await ensureBucket(bucketName);
  await minioClient.putObject(bucketName, key, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
}

export async function getPresignedUrl(
  bucketKey: StorageBucket,
  key: string,
  expirySeconds = 3600
): Promise<string> {
  const bucketName = buckets[bucketKey];
  return minioClient.presignedGetObject(bucketName, key, expirySeconds);
}

export async function deleteFile(bucketKey: StorageBucket, key: string): Promise<void> {
  const bucketName = buckets[bucketKey];
  await minioClient.removeObject(bucketName, key);
}

export { buckets };
