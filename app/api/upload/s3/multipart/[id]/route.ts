import { NextResponse, type NextRequest } from 'next/server';
import { AbortMultipartUploadCommand, ListPartsCommand, ListPartsCommandOutput, type Part } from '@aws-sdk/client-s3';
import { bucket, s3Client } from '@/lib/s3';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const key = request.nextUrl.searchParams.get('key');
  if (typeof key !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parts: Part[] = [];
  let marker: string | undefined = '0';
  while (true) {
    const data: ListPartsCommandOutput = await s3Client.send(
      new ListPartsCommand({
        Bucket: bucket,
        Key: key,
        UploadId: params.id,
        PartNumberMarker: marker,
      }),
    );
    if (data.Parts) parts.push(...data.Parts);
    if (data.IsTruncated && data.NextPartNumberMarker) {
      marker = data.NextPartNumberMarker;
    } else {
      break;
    }
  }

  return NextResponse.json(parts);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const key = request.nextUrl.searchParams.get('key') ?? '';

  await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: params.id,
    }),
  );

  return NextResponse.json({});
}
