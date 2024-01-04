import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Exclude certain paths from routing
  const pathname = event.url.pathname;
  if (pathname.startsWith('/layouts')) {
    throw error(404, 'Not found');
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range';
    },
  });
};
