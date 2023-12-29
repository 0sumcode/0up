<script lang="ts">
  import { onMount } from 'svelte';
  import Dashboard from '@uppy/dashboard';
  import { Uppy, type UppyFile } from '@uppy/core';
  import AwsS3Multipart from '@uppy/aws-s3-multipart';
  import { UppyEncryptPlugin, UppyEncrypt } from 'uppy-encrypt';
  import { filesize } from 'filesize';
  import { PUBLIC_UPLOAD_EXPIRE_OPTIONS, PUBLIC_UPLOAD_MAX_DOWNLOAD_OPTIONS, PUBLIC_MAX_UPLOAD_FILES, PUBLIC_MAX_UPLOAD_SIZE } from '$env/static/public';

  import '@uppy/core/dist/style.css';
  import '@uppy/dashboard/dist/style.css';

  const maxUploadFiles = Number(PUBLIC_MAX_UPLOAD_FILES);
  const maxUploadSize = Number(PUBLIC_MAX_UPLOAD_SIZE) * 1_000_000;
  const expireOptions = JSON.parse(PUBLIC_UPLOAD_EXPIRE_OPTIONS);
  const maxDownloadOptions = JSON.parse(PUBLIC_UPLOAD_MAX_DOWNLOAD_OPTIONS);

  let expires: number, downloads: number;

  // Create/sign an upload request
  const createUpload = async (isMultipart = false) => {
    const response = await fetch(`/_api/upload/s3${isMultipart ? '/multipart' : ''}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    return data;
  };

  let uppy: Uppy;
  onMount(async () => {
    const uppy = new Uppy({
      allowMultipleUploadBatches: false,
      restrictions: {
        maxFileSize: maxUploadSize,
        maxTotalFileSize: maxUploadSize,
        maxNumberOfFiles: maxUploadFiles,
      },
    })
      .use(UppyEncryptPlugin)
      .use(Dashboard, {
        width: 2432,
        theme: 'dark',
        inline: true,
        target: '#uppy-dashboard',
        showProgressDetails: true,
        disableThumbnailGenerator: true,
        note: `${filesize(maxUploadSize, { round: 1 })} max upload size. Up to ${maxUploadFiles} files per upload.`,
        proudlyDisplayPoweredByUppy: false,
      })
      .use(AwsS3Multipart, {
        shouldUseMultipart: (file) => file.size > 100 * 2 ** 20,
        allowedMetaFields: ['name', 'type'],
        getUploadParameters: async (file: UppyFile) => {
          const data = await createUpload();
          return {
            method: data.method,
            url: data.url,
            fields: {}, // For presigned PUT uploads, this should be left empty.
            headers: {
              'Content-Type': 'application/octet-stream', // encrypted data, so always octet-stream
            },
          };
        },
        createMultipartUpload: async (file: UppyFile) => {
          const data = await createUpload(true);
          return data;
        },
        signPart: async (file, { uploadId, key, partNumber, signal }) => {
          signal?.throwIfAborted();

          if (uploadId == null || key == null || partNumber == null) {
            throw new Error('Cannot sign without a key, an uploadId, and a partNumber');
          }

          const response = await fetch(`/_api/upload/s3/multipart/${uploadId}/${partNumber}?key=${encodeURIComponent(key)}`, { signal });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          const data = await response.json();
          return data;
        },
        listParts: async (file, { key, uploadId, signal }) => {
          signal?.throwIfAborted();

          const response = await fetch(`/_api/upload/s3/multipart/${encodeURIComponent(uploadId)}?key=${encodeURIComponent(key)}`, { signal });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          const data = await response.json();
          return data;
        },
        completeMultipartUpload: async (file, { key, uploadId, parts, signal }) => {
          signal?.throwIfAborted();

          const response = await fetch(`/_api/upload/s3/multipart/${encodeURIComponent(uploadId)}/complete?key=${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: {
              accept: 'application/json',
            },
            body: JSON.stringify(parts),
            signal,
          });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          const data = await response.json();
          return data;
        },
        abortMultipartUpload: async (file: UppyFile, { key, uploadId, signal }) => {
          const response = await fetch(`/_api/upload/s3/multipart/${encodeURIComponent(uploadId)}?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
            signal,
          });

          if (!response.ok) {
            throw new Error('Request failed');
          }
        },
      })
      .on('complete', async (result) => {
        console.log(result);
        const files = [];

        if (!result.successful.length) return;

        for (const file of result.successful) {
          files.push({ path: file.uploadURL.split('/').slice(-2).join('/'), data: file.meta.encryption });
        }

        const response = await fetch(`/_api/upload/complete`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
          },
          body: JSON.stringify({
            expires,
            downloads,
            files,
          }),
        });

        // Construct URL
        const data = await response.json();
        const url = `${window.location.protocol}//${window.location.host}/${data.upload.replace(/-/g, '')}#${result.successful[0].meta.password}`;
        console.log(url);

        // Generate new password for future upload
        uppy.getPlugin('UppyEncryptPlugin')?.setOptions({ password: UppyEncrypt.generatePassword() });
      });
  });
</script>

<div class="py-12">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div class="mx-auto sm:text-center">
      <h2 class="text-base font-semibold leading-7 text-blue-400">Free, ephemeral, <a href="#" target="_blank" class="underline">open-source</a></h2>
      <p class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl"><span class="font-audiowide">0</span>-knowledge encrypted file uploads</p>
      <!-- <p class="mt-6 text-lg leading-8 text-zinc-300">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores impedit perferendis suscipit eaque, iste dolor cupiditate blanditiis.
      </p> -->
    </div>
  </div>
  <div class="relative overflow-hidden pt-12">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div id="uppy-dashboard"></div>
      <div class="flex flex-col lg:flex-row">
        <!-- First Column -->
        <div class="lg:w-1/2">
          <div class="p-2 text-zinc-300">
            Expire after:
            <select
              bind:value={expires}
              id="expires"
              name="expires"
              class="mx-2 rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 [&_*]:text-black">
              {#each expireOptions as value}
                <option {value}>{value} Hour{value > 1 ? 's' : ''}</option>
              {/each}
            </select>
            or
            <select
              bind:value={downloads}
              id="downloads"
              name="downloads"
              class="mx-2 rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 [&_*]:text-black">
              {#each maxDownloadOptions as value}
                <option {value}>{value} Download{value > 1 ? 's' : ''}</option>
              {/each}
            </select>
          </div>
        </div>
        <!-- Second Column -->
        <div class="lg:w-1/2">
          <div class="p-2">
            <!-- Content for the second column -->
            <p class="text-right text-xs leading-6 text-zinc-300">
              Use of this service indicates acceptance of the <a href="#" class="font-semibold text-white">terms of service</a>.
            </p>
            <p class="text-right text-xs leading-6 text-zinc-300">
              We care about your data. Read our <a href="#" class="font-semibold text-white">privacy policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div>
  <div class="mx-auto max-w-7xl divide-y divide-zinc-400/10 px-6 py-12 lg:px-8">
    <h2 class="text-2xl font-bold leading-10 tracking-tight text-white">Frequently asked questions</h2>
    <dl class="mt-10 space-y-8 divide-y divide-zinc-400/10">
      <div class="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <dt class="text-base font-semibold leading-7 text-white lg:col-span-5">
          Can <span class="font-audiowide text-sm">0up</span> admins decrypt the files I upload?
        </dt>
        <dd class="mt-4 lg:col-span-7 lg:mt-0">
          <p class="text-base leading-7 text-zinc-300">
            No. The key required for decryption is never sent to <span class="font-audiowide text-sm">0up</span>, meaning we have no ability to decrypt your
            uploads. Your file's meta data (file name, file type, etc) are also encrypted.
          </p>
        </dd>
      </div>

      <div class="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <dt class="text-base font-semibold leading-7 text-white lg:col-span-5">How does <span class="font-audiowide text-sm">0up</span> work?</dt>
        <dd class="mt-4 lg:col-span-7 lg:mt-0">
          <p class="text-base leading-7 text-zinc-300">
            Your files are encrypted by your web browser, with a key that is generated on your browser. The key is never sent to <span
              class="font-audiowide text-sm">0up</span
            >, meaning only you and those you share the link with can download the decrypted files.
          </p>
        </dd>
      </div>

      <div class="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <dt class="text-base font-semibold leading-7 text-white lg:col-span-5">Could you be sneaky and take a peak at our keys?</dt>
        <dd class="mt-4 lg:col-span-7 lg:mt-0">
          <p class="text-base leading-7 text-zinc-300">
            Your keys are passed as an anchor component in the URL (#YOUR_KEY_HERE). The anchor data is not sent as part of the request to the server and isn't
            logged by the server. While that doesn't mean it's impossible for nefarious or bad code to leak the key, we're <a
              href="#"
              class="underline"
              target="_blank">open source</a> and encourage you to check our work!
          </p>
        </dd>
      </div>

      <div class="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <dt class="text-base font-semibold leading-7 text-white lg:col-span-5">How do you make money?</dt>
        <dd class="mt-4 lg:col-span-7 lg:mt-0">
          <p class="text-base leading-7 text-zinc-300">
            We don't collect or sell user data, we don't include ads, and we don't have a paid plan. So, the short answer is, we don't make money. This is
            simply a passion project. <a href="#" class="underline" target="_blank">Starring us on Github</a> and/or
            <a href="#" class="underline" target="_blank">Product Hunt</a> would be much appreciated!
          </p>
        </dd>
      </div>

      <div class="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <dt class="text-base font-semibold leading-7 text-white lg:col-span-5">Do I have to trust you?</dt>
        <dd class="mt-4 lg:col-span-7 lg:mt-0">
          <p class="text-base leading-7 text-zinc-300">
            Nope. <a href="#" class="underline" target="_blank">Clone <span class="font-audiowide text-sm">0up</span></a> and host it on your own infrastructure.
          </p>
        </dd>
      </div>

      <div class="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <dt class="text-base font-semibold leading-7 text-white lg:col-span-5">What features will be added?</dt>
        <dd class="mt-4 lg:col-span-7 lg:mt-0">
          <p class="text-base leading-7 text-zinc-300">
            You tell us (and see what's in the works) on <a href="#" class="underline" target="_blank">Github</a>.
          </p>
        </dd>
      </div>
    </dl>
  </div>
</div>

<style>
  /**
  * Hide weird "upload # files" button
  */
  :global(.uppy-StatusBar-actions .uppy-StatusBar-actionBtn--upload):not(.uppy-c-btn-primary) {
    visibility: hidden;
  }

  :global(.uppy-Dashboard-inner) {
    border: none;
    opacity: 0.8;
  }
</style>
