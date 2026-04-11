import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { db } from './index';
import { files, uploads, type FileRow, type Upload } from './schema';

export async function getUploadWithFiles(uploadId: string): Promise<{ upload: Upload; files: FileRow[] } | null> {
  const uploadRow = await db.query.uploads.findFirst({
    where: and(eq(uploads.id, uploadId), gte(uploads.expireAt, new Date()), isNull(uploads.deletedAt)),
  });

  if (!uploadRow) return null;

  const fileRows = await db
    .select()
    .from(files)
    .where(and(eq(files.uploadId, uploadRow.id), lt(files.downloads, uploadRow.expireDownloads)))
    .orderBy(files.createdAt);

  return { upload: uploadRow, files: fileRows };
}

export interface CreateUploadInput {
  hash: string;
  expireAt: Date;
  expireDownloads: number;
  files: Array<{
    id: string;
    salt: string;
    header: string;
    size: number;
    metaHeader: string;
    metaData: string;
  }>;
}

export async function createUploadWithFiles(input: CreateUploadInput): Promise<{ id: string }> {
  const [upload] = await db
    .insert(uploads)
    .values({
      hash: input.hash,
      expireAt: input.expireAt,
      expireDownloads: input.expireDownloads,
    })
    .returning({ id: uploads.id });

  if (!upload) {
    throw new Error('Failed to create upload');
  }

  if (input.files.length > 0) {
    await db.insert(files).values(
      input.files.map((f) => ({
        id: f.id,
        uploadId: upload.id,
        salt: f.salt,
        header: f.header,
        size: f.size,
        metaHeader: f.metaHeader,
        metaData: f.metaData,
      })),
    );
  }

  return upload;
}

export async function incrementFileDownload(fileId: string): Promise<void> {
  await db
    .update(files)
    .set({ downloads: sql`${files.downloads} + 1` })
    .where(eq(files.id, fileId));
}

export async function softDeleteUpload(uploadId: string): Promise<void> {
  await db.update(uploads).set({ deletedAt: new Date() }).where(eq(uploads.id, uploadId));
}

export async function reportUpload(uploadId: string, reason: string): Promise<void> {
  await db.update(uploads).set({ deletedAt: new Date(), report: reason }).where(eq(uploads.id, uploadId));
}

export async function deleteExpiredUploads(): Promise<{ fileKeys: string[] }> {
  const now = new Date();
  const expired = await db
    .select({ id: uploads.id })
    .from(uploads)
    .where(sql`${uploads.expireAt} < ${now} OR ${uploads.deletedAt} IS NOT NULL`);

  if (expired.length === 0) {
    return { fileKeys: [] };
  }

  const expiredIds = expired.map((u) => u.id);
  const expiredFiles = await db
    .select({ id: files.id })
    .from(files)
    .where(sql`${files.uploadId} IN ${expiredIds}`);

  const fileKeys = expiredFiles.map((f) => f.id);

  await db.delete(uploads).where(sql`${uploads.id} IN ${expiredIds}`);

  return { fileKeys };
}
