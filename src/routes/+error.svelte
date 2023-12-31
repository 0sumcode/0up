<script lang="ts">
  import { page } from '$app/stores';
  import { Error } from '$lib/components';
  import { NewUploadStore } from '$lib/stores';

  $NewUploadStore.showButton = true;

  const title = $page.status === 404 ? 'Page not found' : 'Unexpected error';
  const msg = $page.status === 404 ? 'Sorry, we couldn’t find the page you’re looking for.' : 'An unexpected error occurred.';
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Error {title}>{msg}</Error>
