import { NextResponse, type NextRequest } from 'next/server';
import { reportUpload, softDeleteUpload } from '@/lib/db/queries';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(_request: NextRequest, { params }: { params: { upload: string } }) {
  if (!UUID_RE.test(params.upload)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await softDeleteUpload(params.upload);
  return NextResponse.json({});
}

export async function PUT(request: NextRequest, { params }: { params: { upload: string } }) {
  if (!UUID_RE.test(params.upload)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const body = (await request.json()) as { report?: string };
  await reportUpload(params.upload, body.report ?? 'Reported');
  return NextResponse.json({});
}
