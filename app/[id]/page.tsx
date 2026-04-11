import { notFound } from 'next/navigation';
import { getUploadWithFiles } from '@/lib/db/queries';
import { DownloadClient } from '@/components/DownloadClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '0up - encrypted file sharing',
};

export const dynamic = 'force-dynamic';

function toUuid(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default async function DownloadPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f]{32}$/.test(params.id)) {
    notFound();
  }

  const uuid = toUuid(params.id);
  const result = await getUploadWithFiles(uuid);
  if (!result || result.files.length === 0) {
    notFound();
  }

  const uploadPayload = {
    id: result.upload.id,
    hash: result.upload.hash,
    expireAt: result.upload.expireAt.toISOString(),
    expireDownloads: result.upload.expireDownloads,
  };

  const filesPayload = result.files.map((f) => ({
    id: f.id,
    size: f.size,
    salt: f.salt,
    header: f.header,
    metaHeader: f.metaHeader,
    metaData: f.metaData,
  }));

  return <DownloadClient upload={uploadPayload} files={filesPayload} />;
}
