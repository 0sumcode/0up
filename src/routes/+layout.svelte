<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { PUBLIC_ORGANIZATION_NAME } from '$env/static/public';
  import { NewUploadStore } from '$lib/stores';
  import '../app.css';

  const year = new Date().getFullYear();

  // New upload nav button handler
  const newUpload = () => {
    if ($page.url.pathname !== '/') goto('/');
    else $NewUploadStore.handler();
  };
</script>

<svelte:head>
  <meta name="description" content="0up is a free, open-source, encrypted file sharing service." />
  <meta name="application-name" content="0up" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <meta property="og:title" content="0up - encrypted file sharing" />
  <meta property="og:description" content="0up is a free, open-source, encrypted file sharing service." />
  <meta property="og:image" content={`${$page.url.protocol}//${$page.url.host}/social-share-home.jpg`} />
  <meta property="og:site_name" content="0up" />
  <meta property="og:type" content="website" />
  <meta name="twitter:title" content="0up - encrypted file sharing" />
  <meta name="twitter:image" content={`${$page.url.protocol}//${$page.url.host}/social-share-home.jpg`} />
  <meta name="twitter:site" content="0up_App" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<nav class="bg-zinc-800 opacity-80">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 justify-between">
      <div class="flex">
        <div class="flex flex-shrink-0 items-center">
          <div class="font-audiowide text-3xl text-white"><a href="/">0up</a></div>
        </div>
      </div>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          {#if $NewUploadStore.showButton}
            <button
              type="button"
              on:click|preventDefault={newUpload}
              transition:fade={{ duration: 300, easing: linear }}
              class="relative inline-flex items-center gap-x-1.5 rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              <svg class="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              New Upload
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</nav>
<main>
  <slot />
</main>

<footer aria-labelledby="footer-heading">
  <h2 id="footer-heading" class="sr-only">Footer</h2>
  <div class="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-8">
    <div class="mt-16 border-t border-white/10 pt-8 sm:mt-20 md:flex md:items-center md:justify-between lg:mt-24">
      <div class="flex space-x-6 md:order-2">
        <a href="https://github.com/0sumcode/0up" target="_blank" class="text-zinc-500 hover:text-zinc-400">
          <span class="sr-only">GitHub</span>
          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clip-rule="evenodd" />
          </svg>
        </a>
      </div>
      <p class="mt-8 text-xs leading-5 text-zinc-400 md:order-1 md:mt-0">
        &copy; {year}
        {PUBLIC_ORGANIZATION_NAME}. All rights reserved. |
        <a href="/privacy" class="font-semibold text-white">Privacy Policy</a> |
        <a href="/terms" class="font-semibold text-white">Terms of Service</a>
      </p>
    </div>
  </div>
</footer>
