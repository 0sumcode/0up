import { writable } from 'svelte/store';

export const NewUploadStore = writable({
  showButton: true,
  handler: () => {},
});
