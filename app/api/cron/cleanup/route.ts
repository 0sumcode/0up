import { NextResponse, type NextRequest } from 'next/server';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { bucket, prefix, s3Client } from '@/lib/s3';
import { deleteExpiredUploads } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileKeys } = await deleteExpiredUploads();

  if (fileKeys.length > 0) {
    const Objects = fileKeys.map((id) => ({ Key: `${prefix}${id}` }));
    for (let i = 0; i < Objects.length; i += 1000) {
      const batch = Objects.slice(i, i + 1000);
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch },
        }),
      );
    }
  }

  return NextResponse.json({ deleted: fileKeys.length });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
