import { json, error } from '@sveltejs/kit';
import { AbortMultipartUploadCommand, ListPartsCommand, type Part } from '@aws-sdk/client-s3';
import { s3Client } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

// Get uploaded parts
export const GET = async ({ params, url }) => {
  const key = url.searchParams.get('key');

  if (typeof key !== 'string') {
    throw error(400, 'Invalid request');
  }

  const parts: Part[] = [];
  const listPartsPage = async (startAt: string) => {
    const data = await s3Client.send(
      new ListPartsCommand({
        Bucket: PRIVATE_S3_BUCKET,
        Key: key,
        UploadId: params.id,
        PartNumberMarker: startAt,
      })
    );

    if (data.Parts) parts.push(...data.Parts);
    if (data.IsTruncated && data.NextPartNumberMarker) listPartsPage(data.NextPartNumberMarker);
  };
  await listPartsPage('0');

  return json(parts);
};

// Abort multipart upload
export const DELETE = async ({ params, url }) => {
  const key = url.searchParams.get('key') || '';

  await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
      UploadId: params.id,
    })
  );

  return json({});
};
