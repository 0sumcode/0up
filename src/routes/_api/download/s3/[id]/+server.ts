import { json, error } from '@sveltejs/kit';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, expiresIn } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

// Get presigned URL for download
export const GET = async ({ params }) => {
  /**
   * TODO
   * - Log download
   * - remove hardcoded prefix ('1/') from both up/download apis?
   */
  const key = `1/${params.id}`;

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
    }),
    { expiresIn }
  );
  return json({ url });
};
