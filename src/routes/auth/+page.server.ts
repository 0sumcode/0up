import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  return { url: url.origin };
};

export const actions: Actions = {
  default: async ({ locals: { supabase }, request }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    if (!email) return fail(400, { error: 'Email address is required' });
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

    //throw redirect(303, `/auth/confirm/${encodeURIComponent(email)}`);
  },
};
