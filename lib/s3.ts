import { S3Client } from '@aws-sdk/client-s3';

export const bucket = process.env.S3_BUCKET ?? '';
export const prefix = process.env.S3_PREFIX ?? '';
export const expiresIn = parseInt(process.env.S3_URL_EXPIRE_TIME ?? '900', 10);

export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
  },
});
