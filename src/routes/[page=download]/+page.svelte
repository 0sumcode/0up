<script lang="ts">
  import { UppyDecrypt, uppyEncryptReady, type DecryptedMetaData } from 'uppy-encrypt';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { getFileTypeIcon } from '$lib';
  import { filesize } from 'filesize';
  import { ModalConfirm, Error } from '$lib/components';
  import { PUBLIC_SHOW_DOWNLOAD_WARNING } from '$env/static/public';
  import { NewUploadStore } from '$lib/stores/NewUploadStore.js';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  dayjs.extend(relativeTime);

  export let data;

  $NewUploadStore.showButton = true;
  const expiresIn = dayjs().to(data.upload.expire_at);

  interface FileDownload {
    file: (typeof data.files)[number];
    decryptor: UppyDecrypt;
    meta: DecryptedMetaData;
    decrypted?: Blob;
  }

  let files: FileDownload[] = [];
  let showDownloadWarning = PUBLIC_SHOW_DOWNLOAD_WARNING === 'true' ? true : false;
  let showDeleteConfirm = false;
  let showReportConfirm = false;
  let downloading = false;
  let progress = 0;
  let reader: ReadableStreamDefaultReader | null = null;
  let reportInput = '';
  let error = { message: '', description: '' };

  // Updates file list as necessary
  const invalidateFiles = (dataFiles: typeof data.files) => {
    if (dataFiles.length === 0) {
      error.message = 'No files found';
      error.description = 'Maximum downloads reached.';
      return;
    }
    if (dataFiles.length < files.length) {
      // we need to remove file(s)
      const ids = dataFiles.map((item) => item.id);
      files = files.filter((file) => ids.includes(file.file.id));
    }
  };
  $: invalidateFiles(data.files);

  onMount(async () => {
    await uppyEncryptReady();
    // Verify password
    const password = window.location.hash.substring(1);
    if (!UppyDecrypt.verifyPassword(data.upload.hash, password)) {
      error.message = 'Decryption failed';
      error.description = 'Invalid or no decryption key provided.';
      return;
    }

    // Decrypt meta-data
    for (const i in data.files) {
      const file = data.files[i];
      const decryptor = new UppyDecrypt(password, file.salt, file.header);
      const meta = decryptor.getDecryptedMetaData(file.meta_header, file.meta_data);
      files[i] = { file, decryptor, meta };
    }
  });

  const cancelDownload = () => {
    reader?.cancel();
    downloading = false;
  };

  const handleDownload = async (file: FileDownload) => {
    if (downloading) return; //magic is already happening

    // Get signed download URL
    if (!file.decrypted) {
      downloading = true;
      const s3url = await fetch(`/api/download/s3/${data.upload.id}/${file.file.id}`, {
        cache: 'no-store',
      });
      if (!s3url.ok) {
        error.message = 'Download failed';
        error.description = 'Unable to fetch download URL.';
        invalidateAll();
        return;
      }
      const { url } = await s3url.json();
      const res = await fetch(url);

      // We create a reader so we can track the download status
      reader = res.body?.getReader() || null;
      if (!reader) {
        error.message = 'Decryption failed';
        error.description = 'Unable to initialize decryption.';
        invalidateAll();
        return;
      }
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
        }
        progress = Math.round((received / Number(file.file.size)) * 100);
      }
      downloading = false;
      progress = 0;

      // Download canceled
      if (received < file.file.size) {
        invalidateAll();
        return;
      }

      // Re-assemble download chunks so they can be blobbed
      let chunksAll = new Uint8Array(received);
      let position = 0;
      for (let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Decrypt blob chunks (that's nasty)
      try {
        file.decrypted = await file.decryptor.decryptFile(new Blob([chunksAll]));
      } catch (e) {
        error.message = 'Decryption failed';
        error.description = 'Unable to decrypt selected file.';
        invalidateAll();
        return;
      }
    }

    await invalidateAll();
    if (file.decrypted) {
      const aElement = document.createElement('a');
      aElement.setAttribute('download', file.meta.name);
      const href = URL.createObjectURL(file.decrypted);
      aElement.href = href;
      aElement.setAttribute('target', '_blank');
      aElement.click();
      URL.revokeObjectURL(href);
    }
  };

  const confirmDelete = async () => {
    await fetch(`/api/download/${data.upload.id}`, { method: 'DELETE' });
    invalidateAll();
  };

  const confirmReport = async () => {
    await fetch(`/api/download/${data.upload.id}`, { method: 'PUT', body: JSON.stringify({ report: reportInput || 'Reported' }) });
    invalidateAll();
  };
</script>

<svelte:head>
  <title>0up - encrypted file sharing</title>
</svelte:head>

<!-- Modals-->
{#if showDownloadWarning}
  <ModalConfirm
    title="Confirm Download"
    cancelButton="Cancel download"
    confirmButton="I know and trust the sender"
    allowEscape={false}
    on:close={() => {
      goto('/');
    }}
    on:confirm={() => {
      showDownloadWarning = false;
    }}>
    <span class="underline">Never</span> download files from someone you don't personally know and trust!
  </ModalConfirm>
{:else if showDeleteConfirm}
  <ModalConfirm
    title="Delete Upload?"
    confirmButton="Delete"
    on:close={() => {
      showDeleteConfirm = false;
    }}
    on:confirm={confirmDelete}>
    Are you sure you wish to delete this upload? You will lose access to all files. This action cannot be undone!
  </ModalConfirm>
{:else if showReportConfirm}
  <ModalConfirm
    title="Report Upload"
    confirmButton="Report"
    on:close={() => {
      showReportConfirm = false;
    }}
    on:confirm={confirmReport}>
    Once reported, this upload will be deleted. This action cannot be reversed!

    <textarea
      rows="4"
      name="comment"
      id="comment"
      placeholder="Report reason (malware, phishing, etc.)"
      required
      maxlength="1024"
      bind:value={reportInput}
      class="mt-4 block w-full rounded-md border-0 bg-zinc-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 md:w-96"
    ></textarea>
  </ModalConfirm>
{/if}

{#if downloading}
  <!-- Notification -->
  <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <div transition:fade class="pointer-events-auto flex w-full max-w-md rounded-lg bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5">
        <div class="w-0 flex-1 p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0 pt-0.5">
              <svg class="animate-pulse" xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 512 512"
                ><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path
                  fill="#ffffff"
                  d="M256 464a208 208 0 1 1 0-416 208 208 0 1 1 0 416zM256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM376.9 294.6c4.5-4.2 7.1-10.1 7.1-16.3c0-12.3-10-22.3-22.3-22.3H304V160c0-17.7-14.3-32-32-32l-32 0c-17.7 0-32 14.3-32 32v96H150.3C138 256 128 266 128 278.3c0 6.2 2.6 12.1 7.1 16.3l107.1 99.9c3.8 3.5 8.7 5.5 13.8 5.5s10.1-2 13.8-5.5l107.1-99.9z" /></svg>
            </div>
            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium text-white">Downloading&hellip;</p>
              <!-- Progress bar -->
              <div class="mt-2 h-1.5 w-full rounded-full bg-zinc-700">
                <div class="h-1.5 rounded-full bg-blue-600" style="width: {progress}%"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex border-l border-zinc-800">
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            on:click|preventDefault={cancelDownload}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if error.message}
  <Error title={error.message}>{error.description}</Error>
{:else}
  <div class="px-4">
    <div class="mx-auto mt-12 max-w-2xl rounded-md bg-zinc-800 px-6 lg:px-8">
      <ul role="list" class="divide-y divide-zinc-700">
        {#if files.length}
          {#each files as file}
            <li class="flex items-center justify-between gap-x-6 py-5">
              <div class="flex min-w-0 gap-x-4">
                <div class="h-12 w-12 flex-none">
                  {@html file.meta.type ? getFileTypeIcon(file.meta.type).icon : ''}
                </div>
                <div class="min-w-0 flex-auto">
                  <p class="break-all text-sm font-semibold leading-6 text-white">
                    <a
                      on:click|preventDefault={() => {
                        handleDownload(file);
                      }}
                      class="hover:underline"
                      href={$page.url.href}>{file.meta.name}</a>
                  </p>
                  <p class="mt-1 truncate text-xs leading-5 text-zinc-500">{filesize(Number(file.file.size))}</p>
                </div>
              </div>
              <button
                on:click|preventDefault={() => {
                  handleDownload(file);
                }}
                disabled={downloading}
                class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-white/20 disabled:opacity-50">Download</button>
            </li>
          {/each}
        {:else}
          <li class="flex animate-pulse items-center justify-between gap-x-6 py-5">
            <div class="flex min-w-0 gap-x-4">
              <div class="flex-none">
                {@html getFileTypeIcon('application/octet-stream').icon}
              </div>
              <div class="min-w-0 flex-auto">
                <p class="text-sm font-semibold leading-6 text-white">Loading files&hellip;</p>
              </div>
            </div>
          </li>
        {/if}
      </ul>
    </div>
    <div class="mx-auto mt-2 flex max-w-2xl rounded-md">
      <div class="flex-1 text-sm italic leading-6 text-zinc-400">Expires {expiresIn}</div>
      <div>
        <button
          type="button"
          on:click={() => {
            showReportConfirm = true;
          }}
          class="rounded bg-white/10 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-white/20">Report</button>
        <button
          type="button"
          on:click={() => {
            showDeleteConfirm = true;
          }}
          class="rounded bg-red-600/40 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-600/50">Delete</button>
      </div>
    </div>
  </div>
{/if}
