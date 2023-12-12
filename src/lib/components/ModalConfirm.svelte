<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { createEventDispatcher } from 'svelte';

  export let title = 'Confirm';
  export let cancelButton = 'Cancel';
  export let confirmButton = 'Confirm';
  export let danger = true; // Red warning theme or blue question theme
  export let showX = true;

  const dispatch = createEventDispatcher();

  const closeModal = () => {
    dispatch('close', {});
  };

  const confirm = () => {
    dispatch('confirm', {});
  };
</script>

<div transition:fade={{ duration: 300, easing: linear }} class="relative z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="fixed inset-0 bg-zinc-800 bg-opacity-75 transition-opacity"></div>

  <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
    <div
      transition:scale={{ duration: 300, easing: linear, start: 0.95 }}
      class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-lg bg-zinc-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
        <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
          {#if showX}
            <button
              on:click={closeModal}
              type="button"
              class="rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
        <div class="sm:flex sm:items-start">
          <div
            class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full {danger
              ? 'bg-red-500/20'
              : 'bg-blue-500/20'} sm:mx-0 sm:h-10 sm:w-10">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 class="text-base font-semibold leading-6 text-white">{title}</h3>
            <div class="mt-2">
              <p class="text-sm text-zinc-500"><slot /></p>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            on:click={confirm}
            type="button"
            class="inline-flex w-full justify-center rounded-md {danger
              ? 'bg-red-600/50 hover:bg-red-500/50'
              : ' bg-blue-600/50 hover:bg-blue-500/50'}  px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto">{confirmButton}</button>
          <button
            on:click={closeModal}
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-zinc-700 hover:bg-zinc-50/20 sm:mt-0 sm:w-auto"
            >{cancelButton}</button>
        </div>
      </div>
    </div>
  </div>
</div>
