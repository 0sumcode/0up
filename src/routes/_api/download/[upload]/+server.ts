import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib';

export const DELETE = async ({ params }) => {
  await prisma.upload.update({ where: { id: params.upload }, data: { deleted_at: new Date() } });

  return json({});
};
