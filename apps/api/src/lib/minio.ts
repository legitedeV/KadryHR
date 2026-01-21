import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucket = process.env.MINIO_BUCKET || 'kadryhr-files';

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket, 'us-east-1');
    console.log(`Bucket ${bucket} created`);
  }
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await minioClient.putObject(bucket, key, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
}

export async function getPresignedUrl(key: string, expiry = 3600): Promise<string> {
  return minioClient.presignedGetObject(bucket, key, expiry);
}

export async function deleteFile(key: string): Promise<void> {
  await minioClient.removeObject(bucket, key);
}

export { bucket };
