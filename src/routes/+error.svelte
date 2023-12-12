<script lang="ts">
  import { page } from '$app/stores';

  const title = $page.status === 404 ? 'Page not found' : 'Unexpected error';
  const msg = $page.status === 404 ? 'Sorry, we couldn’t find the page you’re looking for.' : 'An unexpected error occurred.';
</script>

<svelte:head>
  <title>{$page.status === 404 ? 'Page not found' : 'Unexpected error'}</title>
</svelte:head>

<div class="mt-24 text-center">
  <p class="text-base font-semibold text-blue-600">{$page.status}</p>
  <h1 class="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
  <p class="mt-6 text-base leading-7 text-zinc-400">{msg}</p>
  <div class="mt-10 flex items-center justify-center gap-x-6">
    <a
      href="/"
      class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
      </svg>
      New Upload
    </a>
  </div>
</div>
