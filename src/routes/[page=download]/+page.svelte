<script lang="ts">
  import { UppyDecrypt, onUppyEncryptReady, type DecryptedMetaData } from 'uppy-encrypt';
  import { browser } from '$app/environment';
  import { getFileTypeIcon } from '$lib';
  import { filesize } from 'filesize';

  export let data;
  //console.log(data);

  interface FileDownload {
    file: (typeof data.files)[number];
    decrypt: UppyDecrypt;
    meta: DecryptedMetaData;
  }

  const files: FileDownload[] = [];
  const decryptors: UppyDecrypt[] = [];

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
        const decrypt = new UppyDecrypt(password, file.salt, file.header);
        const meta = decrypt.getDecryptedMetaData(file.meta_header, file.meta_data);
        files[i] = { file, decrypt, meta };
      }
    });
  }

  const handleDownload = async () => {
    // Get signed download URL
    const s3url = await fetch(`/_api/download/s3/${data.upload.id}/${data.files[0].id}`); // TODO remove hard-coded val

    if (!s3url.ok) {
      // TODO error
    }

    const { url } = await s3url.json();
    const res = await fetch(url);
    const blob = await res.blob();
    try {
      const decBlob = await decryptors[0].decryptFile(blob); // TODO remove hard-coded index
      const aElement = document.createElement('a');
      aElement.setAttribute('download', 'test.enc'); // TODO remove hard-coded name
      const href = URL.createObjectURL(decBlob);
      aElement.href = href;
      aElement.setAttribute('target', '_blank');
      aElement.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      // TODO error
    }
  };
</script>

<button class="text-white" on:click={handleDownload}>here</button>
<span class="fiv-viv fiv-icon-pdf"></span>
<span>{@html getFileTypeIcon('text').icon}</span>

<div class="mx-auto max-w-2xl rounded-md bg-zinc-800 px-6 lg:px-8">
  <ul role="list" class="divide-y divide-zinc-700">
    {#if files.length}
      {#each files as file}
        <li class="flex items-center justify-between gap-x-6 py-5">
          <div class="flex min-w-0 gap-x-4">
            <div class="h-12 w-12 flex-none">
              {@html file.meta.type ? getFileTypeIcon(file.meta.type).icon : ''}
            </div>
            <div class="min-w-0 flex-auto">
              <p class="text-sm font-semibold leading-6 text-white">{file.meta.name}</p>
              <p class="mt-1 truncate text-xs leading-5 text-zinc-500">{filesize(Number(file.file.size))}</p>
            </div>
          </div>
          <a href="#" class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-white/20">Download</a>
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
