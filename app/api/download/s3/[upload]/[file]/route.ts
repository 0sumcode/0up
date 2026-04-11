import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bucket, expiresIn, prefix, s3Client } from '@/lib/s3';
import { getUploadWithFiles, incrementFileDownload } from '@/lib/db/queries';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { upload: string; file: string } }) {
  const result = await getUploadWithFiles(params.upload);
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const file = result.files.find((f) => f.id === params.file);
  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const key = `${prefix}${file.id}`;

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn },
  );

  await incrementFileDownload(file.id);

  return NextResponse.json({ url });
}
