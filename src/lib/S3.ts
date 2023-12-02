import { S3Client } from '@aws-sdk/client-s3';
import { PRIVATE_S3_ENDPOINT, PRIVATE_S3_KEY_ID, PRIVATE_S3_REGION, PRIVATE_S3_SECRET_KEY, PRIVATE_S3_URL_EXPIRE_TIME } from '$env/static/private';

export const expiresIn = parseInt(PRIVATE_S3_URL_EXPIRE_TIME);

export const s3Client = new S3Client({
  endpoint: PRIVATE_S3_ENDPOINT,
  region: PRIVATE_S3_REGION,
  credentials: {
    accessKeyId: PRIVATE_S3_KEY_ID,
    secretAccessKey: PRIVATE_S3_SECRET_KEY,
  },
});
