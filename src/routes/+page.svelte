<script lang="ts">
  import { onMount } from 'svelte';
  import Dashboard from '@uppy/dashboard';
  import Uppy from '@uppy/core';
  import Webcam from '@uppy/webcam';
  import { UppyEncrypt } from '$lib';

  import '@uppy/core/dist/style.css';
  import '@uppy/dashboard/dist/style.css';
  import '@uppy/webcam/dist/style.css';

  let sodiumWorker: Worker;
  let uppy: Uppy;
  onMount(async () => {
    // setTimeout(() => {
    //   const message: SodiumMessage = {
    //     msg: 'generatePassword',
    //   };
    //   sodiumWorker.postMessage(message);
    // }, 2500);

    const uppy = new Uppy().use(Webcam).use(UppyEncrypt).use(Dashboard, {
      theme: 'dark',
      inline: true,
      target: '#uppy-dashboard',
    });
  });

  let tmp = 'red';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<button
  style="background-color: {tmp};"
  on:click={() => {
    tmp = tmp == 'red' ? 'blue' : 'red';
  }}>click</button>
<div id="uppy-dashboard"></div>
