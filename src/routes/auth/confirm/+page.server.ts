import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  default: async ({ locals: { supabase }, request }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const token = data.get('token') as string;
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      return fail(error.status as number, { error: 'Token has expired or is invalid' });
    }
    //throw redirect(303, '/');
  },
};
