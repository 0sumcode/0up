import { json, error } from '@sveltejs/kit';
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { s3Client } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

const isValidPart = (part: any) => {
  return part && typeof part === 'object' && Number(part.PartNumber) && typeof part.ETag === 'string';
};

export const POST = async ({ params, url, request }) => {
  const key = url.searchParams.get('key') || '';
  const parts = await request.json();

  if (!Array.isArray(parts) || !parts.every(isValidPart)) {
    throw error(400, 'Invalid request');
  }

  const data = await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
      UploadId: params.id,
      MultipartUpload: {
        Parts: parts || null,
      },
    })
  );

  return json({ location: data.Location });
};
