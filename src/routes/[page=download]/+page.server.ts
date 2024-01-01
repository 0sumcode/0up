import { prisma } from '$lib';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const upload = await prisma.upload.findUnique({ where: { id: params.page, expire_at: { gte: new Date() }, deleted_at: null } });

  if (!upload) throw error(404, 'Not found');

  const files = await prisma.file.findMany({
    where: { upload: upload.id, downloads: { lt: upload.expire_downloads } },
    orderBy: { created_at: 'asc' },
  });

  if (!files.length) throw error(404, 'Not found');

  return {
    upload,
    files,
  };
}
