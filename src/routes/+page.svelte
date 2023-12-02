<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import Dashboard from '@uppy/dashboard';
  import { Uppy, type UppyFile } from '@uppy/core';
  import AwsS3Multpart from '@uppy/aws-s3-multipart';
  import Webcam from '@uppy/webcam';
  import { UppyEncryptPlugin } from '$lib';

  import '@uppy/core/dist/style.css';
  import '@uppy/dashboard/dist/style.css';
  import '@uppy/webcam/dist/style.css';

  let uppy: Uppy;
  onMount(async () => {
    const uppy = new Uppy()
      .use(Webcam)
      .use(UppyEncryptPlugin)
      .use(Dashboard, {
        theme: 'dark',
        inline: true,
        target: '#uppy-dashboard',
      })
      .use(AwsS3Multpart, {
        shouldUseMultipart: (file) => file.size > 100 * 2 ** 20,
        // async getTemporarySecurityCredentials(signal) {
        //   const response = await fetch('/_api/upload/sts', signal);
        //   return response.json();
        // },
        async getUploadParameters(file: UppyFile, { signal }) {
          const response = await fetch('/_api/upload/s3', {
            method: 'POST',
            headers: {
              accept: 'application/json',
            },
            // body: serialize({
            //   filename: file.name,
            //   contentType: file.type,
            // }),
            signal,
          });

          if (!response.ok) {
            throw new Error('Not authenticated');
          }

          const data = await response.json();

          return {
            method: data.method,
            url: data.url,
            fields: {}, // For presigned PUT uploads, this should be left empty.
            // Provide content type header required by S3
            headers: {
              'Content-Type': 'application/octet-stream', //file.type,
            },
          };
        },
        // async createMultipartUpload(file: UppyFile, signal: AbortSignal) {
        //   signal?.throwIfAborted();
        //   return '{}';
        // },
        // async abortMultipartUpload(file: UppyFile, { key, uploadId }, signal) {},
        // async signPart(file, options) {
        //   return '{}';
        // },
        // async listParts(file, { key, uploadId }, signal) {
        //   return '{}';
        // },
        // async completeMultipartUpload(file, { key, uploadId, parts }, signal) {
        //   return '{}';
        // },
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
