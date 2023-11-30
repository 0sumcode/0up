import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals: { getSession } }) => {
  const session = await getSession();

  return {
    session,
  };
};
