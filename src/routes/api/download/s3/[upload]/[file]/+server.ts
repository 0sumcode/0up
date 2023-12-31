import { json, error } from '@sveltejs/kit';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, expiresIn } from '$lib/S3';
import { PRIVATE_S3_BUCKET, PRIVATE_S3_PREFIX } from '$env/static/private';
import { prisma } from '$lib';

// Get presigned URL for download
export const GET = async ({ params }) => {
  const upload = await prisma.upload.findUnique({ where: { id: params.upload, expire_at: { gte: new Date() }, deleted_at: null } });
  if (!upload) throw error(404, 'Not found');
  const file = await prisma.file.findUnique({ where: { id: params.file, downloads: { lt: upload.expire_downloads } } });
  if (!file) throw error(404, 'Not found');

  const key = `${PRIVATE_S3_PREFIX}${file.id}`;

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: key,
    }),
    { expiresIn }
  );

  await prisma.file.update({ where: { id: params.file }, data: { downloads: { increment: 1 } } });

  return json({ url });
};
