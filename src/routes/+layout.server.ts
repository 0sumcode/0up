export const load = async ({ url, locals: { getSession } }) => {
  const session = await getSession();

  return {
    session,
  };
};
