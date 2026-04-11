import { NextResponse, type NextRequest } from 'next/server';
import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bucket, expiresIn, s3Client } from '@/lib/s3';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string; partNumber: string } }) {
  const key = request.nextUrl.searchParams.get('key');
  const partNumber = Number(params.partNumber);

  if (typeof key !== 'string' || !Number.isFinite(partNumber) || partNumber < 1 || partNumber > 10_000) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const signedUrl = await getSignedUrl(
    s3Client,
    new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: params.id,
      PartNumber: partNumber,
      Body: '',
    }),
    { expiresIn },
  );

  return NextResponse.json({ url: signedUrl, expires: expiresIn });
}
