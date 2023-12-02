import { json, error } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, expiresIn } from '$lib';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

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
