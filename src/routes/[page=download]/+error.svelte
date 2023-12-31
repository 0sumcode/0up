<script lang="ts">
  import { page } from '$app/stores';
  import { Error } from '$lib/components';
  import { NewUploadStore } from '$lib/stores';

  $NewUploadStore.showButton = true;

  const title = $page.status === 404 ? 'Upload not found' : 'Unexpected error';
  const msg = $page.status === 404 ? 'This upload has expired, been deleted, or never existed.' : 'An unexpected error occurred.';
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Error {title}>{msg}</Error>
