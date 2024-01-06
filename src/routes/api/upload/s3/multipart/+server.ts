import { json, error } from '@sveltejs/kit';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { s3Client } from '$lib/S3';
import { PRIVATE_S3_BUCKET, PRIVATE_S3_PREFIX } from '$env/static/private';

export const POST = async ({ params, url }) => {
  const key = `${PRIVATE_S3_PREFIX}${crypto.randomUUID()}`;

  const data = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
      ContentType: 'application/octet-stream',
    })
  );
  return json({ key: data.Key, uploadId: data.UploadId });
};
