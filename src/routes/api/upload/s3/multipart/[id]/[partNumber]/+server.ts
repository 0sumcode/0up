import { json, error } from '@sveltejs/kit';
import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, expiresIn } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

// Sign part of multipart upload
export const GET = async ({ params, url }) => {
  const key = url.searchParams.get('key');
  const partNumber = Number(params.partNumber);

  if (typeof key !== 'string' || partNumber < 1 || partNumber > 10_000) {
    throw error(400, 'Invalid request');
  }

  const signedUrl = await getSignedUrl(
    s3Client,
    new UploadPartCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
      UploadId: params.id,
      PartNumber: partNumber,
      Body: '',
    }),
    { expiresIn }
  );

  return json({ url: signedUrl, expires: expiresIn });
};
