import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib';
import { PRIVATE_CRON_SECRET } from '$env/static/private';

// Delete expired upload/file data from database
export const GET = async ({ request }) => {
  if (request.headers.get('authorization') !== PRIVATE_CRON_SECRET) throw error(401, 'Not authorized');

  const res = await prisma.upload.deleteMany({
    where: { expire_at: { lt: new Date() } },
  });

  return json(res);
};
