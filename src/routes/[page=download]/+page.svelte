<script lang="ts">
  import { UppyDecrypt, onUppyEncryptReady, type DecryptedMetaData } from 'uppy-encrypt';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getFileTypeIcon } from '$lib';
  import { filesize } from 'filesize';
  import { ModalConfirm } from '$lib/components';
  import { PUBLIC_SHOW_DOWNLOAD_WARNING } from '$env/static/public';

  export let data;
  //console.log(data);

  interface FileDownload {
    file: (typeof data.files)[number];
    decryptor: UppyDecrypt;
    meta: DecryptedMetaData;
    decrypted?: Blob;
    canceled: boolean;
  }

  const files: FileDownload[] = [];
  let showDownloadWarning = PUBLIC_SHOW_DOWNLOAD_WARNING === 'true' ? true : false;
  let downloading = false;
  let progress = 0;
  let reader: ReadableStreamDefaultReader | null = null;

  if (browser) {
    const password = window.location.hash.substring(1);
    onUppyEncryptReady(() => {
      // Verify password
      if (!UppyDecrypt.verifyPassword(data.upload.hash, password)) {
        // TODO error
      }

      // Decrypt meta-data
      for (const i in data.files) {
        const file = data.files[i];
        const decryptor = new UppyDecrypt(password, file.salt, file.header);
        const meta = decryptor.getDecryptedMetaData(file.meta_header, file.meta_data);
        files[i] = { file, decryptor, meta, canceled: false };
      }
    });
  }

  const cancelDownload = (file: FileDownload) => {
    reader?.cancel();
    file.canceled = true;
    downloading = false;
  };

  const handleDownload = async (file: FileDownload) => {
    if (downloading) return; //magic is already happening

    // Get signed download URL
    if (!file.decrypted) {
      downloading = true;
      const s3url = await fetch(`/_api/download/s3/${data.upload.id}/${file.file.id}`, {
        cache: 'no-store',
      });
      if (!s3url.ok) {
        // TODO error
        return;
      }
      const { url } = await s3url.json();
      const res = await fetch(url);

      // We create a reader so we can track the download status
      reader = res.body?.getReader() || null;
      if (!reader) return; // TODO error
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

      // Re-assemble download chunks so they can be blobbed
      let chunksAll = new Uint8Array(received);
      let position = 0;
      for (let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Don't decrypt if we canceled the download
      if (!file.canceled) {
        // Decrypt blob chunks (that's nasty)
        try {
          file.decrypted = await file.decryptor.decryptFile(new Blob([chunksAll]));
        } catch (e) {
          // TODO error
          console.log(e);
        }
      }
    } else {
      file.canceled = false; // reset
    }

    if (file.decrypted) {
      console.log(file.decrypted);
      const aElement = document.createElement('a');
      aElement.setAttribute('download', file.meta.name);
      const href = URL.createObjectURL(file.decrypted);
      aElement.href = href;
      aElement.setAttribute('target', '_blank');
      aElement.click();
      URL.revokeObjectURL(href);
    }
  };
</script>

{#if showDownloadWarning}
  <ModalConfirm
    title="Confirm Download"
    cancelButton="Cancel download"
    confirmButton="I know and trust the sender"
    showX={false}
    on:close={() => {
      goto('/');
    }}
    on:confirm={() => {
      showDownloadWarning = false;
    }}>
    <span class="underline">Never</span> download files from someone you don't personally know and trust!
  </ModalConfirm>
{/if}

{#if downloading}
  <div class="mb-4 h-1.5 w-full rounded-full bg-zinc-700">
    <div class="h-1.5 rounded-full bg-blue-600" style="width: {progress}%"></div>
  </div>
{:else}
  <div class="h-1.5"></div>
{/if}

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
              <p class="text-sm font-semibold leading-6 text-white">
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
