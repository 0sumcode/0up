import { NextResponse, type NextRequest } from 'next/server';
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { bucket, s3Client } from '@/lib/s3';

export const runtime = 'nodejs';

function isValidPart(part: unknown): part is { PartNumber: number; ETag: string } {
  if (!part || typeof part !== 'object') return false;
  const p = part as { PartNumber?: unknown; ETag?: unknown };
  return Number.isFinite(Number(p.PartNumber)) && typeof p.ETag === 'string';
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const key = request.nextUrl.searchParams.get('key') ?? '';
  const parts = await request.json();

  if (!Array.isArray(parts) || !parts.every(isValidPart)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const data = await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: params.id,
      MultipartUpload: { Parts: parts },
    }),
  );

  return NextResponse.json({ location: data.Location });
}
