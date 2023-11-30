<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import Dashboard from '@uppy/dashboard';
  import Uppy from '@uppy/core';
  import Webcam from '@uppy/webcam';
  import { UppyEncryptPlugin } from '$lib';

  import '@uppy/core/dist/style.css';
  import '@uppy/dashboard/dist/style.css';
  import '@uppy/webcam/dist/style.css';

  export let data;
  const supabase = data.supabase;

  let uppy: Uppy;
  onMount(async () => {
    //await supabase.from('upload').insert({ hash: 'test' });
    const { data, error } = await supabase.from('upload').select();
    console.log(data, error);

    const uppy = new Uppy().use(Webcam).use(UppyEncryptPlugin).use(Dashboard, {
      theme: 'dark',
      inline: true,
      target: '#uppy-dashboard',
    });
  });

  let tmp = 'red';
</script>

<form class="space-y-6" method="POST" action="/auth" use:enhance>
  <input type="email" name="email" value="" />
  <button type="submit">log in</button>
</form>

<form class="space-y-6" method="POST" action="/auth/confirm" use:enhance>
  <input type="email" name="email" value="" />
  <input type="text" name="token" value="" />
  <button type="submit">log in</button>
</form>

<button
  style="background-color: {tmp};"
  on:click={() => {
    tmp = tmp == 'red' ? 'blue' : 'red';
  }}>click</button>
<div id="uppy-dashboard"></div>

<style>
  /**
  * Hide weird "upload # files" button
  */
  :global(.uppy-StatusBar-actions .uppy-StatusBar-actionBtn--upload):not(.uppy-c-btn-primary) {
    visibility: hidden;
  }
</style>
