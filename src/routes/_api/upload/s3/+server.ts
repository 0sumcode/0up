import { json, error } from '@sveltejs/kit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PRIVATE_S3_BUCKET, PRIVATE_S3_ENDPOINT, PRIVATE_S3_KEY_ID, PRIVATE_S3_REGION, PRIVATE_S3_SECRET_KEY } from '$env/static/private';

const expiresIn = 900;
const s3Client = new S3Client({
  endpoint: PRIVATE_S3_ENDPOINT,
  region: PRIVATE_S3_REGION,
  credentials: {
    accessKeyId: PRIVATE_S3_KEY_ID,
    secretAccessKey: PRIVATE_S3_SECRET_KEY,
  },
});

export const POST = async ({ params }) => {
  const key = `1/${crypto.randomUUID()}`;
  const contentType = 'application/octet-stream';
  const url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );

  return json({ url, method: 'PUT' });
};
