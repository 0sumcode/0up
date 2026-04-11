import { NextResponse } from 'next/server';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { bucket, prefix, s3Client } from '@/lib/s3';

export const runtime = 'nodejs';

export async function POST() {
  const key = `${prefix}${crypto.randomUUID()}`;

  const data = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: 'application/octet-stream',
    }),
  );

  return NextResponse.json({ key: data.Key, uploadId: data.UploadId });
}
