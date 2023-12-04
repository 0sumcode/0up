import { json, error } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, expiresIn } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

// Get presigned URL for non-multipart upload
export const POST = async ({ params }) => {
  const key = `1/${crypto.randomUUID()}`;

  const url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
      ContentType: 'application/octet-stream',
    }),
    { expiresIn }
  );
  return json({ url, method: 'PUT' });
};
