import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bucket, expiresIn, prefix, s3Client } from '@/lib/s3';

export const runtime = 'nodejs';

export async function POST() {
  const key = `${prefix}${crypto.randomUUID()}`;

  const url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: 'application/octet-stream',
    }),
    { expiresIn },
  );

  return NextResponse.json({ url, method: 'PUT' });
}
