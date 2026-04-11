import { NextResponse, type NextRequest } from 'next/server';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { bucket, s3Client } from '@/lib/s3';
import { maxDownloads, maxExpires } from '@/lib/env';
import { createUploadWithFiles } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface IncomingFile {
  path: string;
  data: {
    hash: string;
    salt: string;
    header: string;
    meta: { header: string; data: string };
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    expires?: number;
    downloads?: number;
    files?: IncomingFile[];
  };

  const files = body.files ?? [];
  if (!files.length) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const expireHours = !body.expires || body.expires > maxExpires ? maxExpires : body.expires;
  const expireDownloads = !body.downloads || body.downloads > maxDownloads ? maxDownloads : body.downloads;
  const expireAt = new Date(Date.now() + expireHours * 60 * 60 * 1000);

  const fileRows: Array<{
    id: string;
    salt: string;
    header: string;
    size: number;
    metaHeader: string;
    metaData: string;
  }> = [];

  for (const file of files) {
    try {
      const response = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: file.path,
        }),
      );

      if (!response || typeof response.ContentLength !== 'number') {
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
      }

      fileRows.push({
        id: file.path.split('/')[1],
        salt: file.data.salt,
        header: file.data.header,
        size: response.ContentLength,
        metaHeader: file.data.meta.header,
        metaData: file.data.meta.data,
      });
    } catch {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
  }

  const upload = await createUploadWithFiles({
    hash: files[0].data.hash,
    expireAt,
    expireDownloads,
    files: fileRows,
  });

  return NextResponse.json({ upload: upload.id });
}
