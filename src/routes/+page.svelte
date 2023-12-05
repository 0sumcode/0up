<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import Dashboard from '@uppy/dashboard';
  import { Uppy, type UppyFile } from '@uppy/core';
  import AwsS3Multipart from '@uppy/aws-s3-multipart';
  import UppyEncryptPlugin from 'uppy-encrypt';

  import '@uppy/core/dist/style.css';
  import '@uppy/dashboard/dist/style.css';

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
    const uppy = new Uppy()
      .use(UppyEncryptPlugin)
      .use(Dashboard, {
        theme: 'dark',
        inline: true,
        target: '#uppy-dashboard',
      })
      .use(AwsS3Multipart, {
        shouldUseMultipart: (file) => file.size > 10_000, //100 * 2 ** 20,
        allowedMetaFields: ['name', 'type'],
        async getUploadParameters(file: UppyFile) {
          const data = await createUpload();
          return {
            method: data.method,
            url: data.url,
            fields: {}, // For presigned PUT uploads, this should be left empty.
            headers: {
              'Content-Type': 'application/octet-stream', //file.type,
            },
          };
        },
        async createMultipartUpload(file: UppyFile) {
          const data = await createUpload(true);
          return data;
        },
        async signPart(file, { uploadId, key, partNumber, signal }) {
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
        async listParts(file, { key, uploadId, signal }) {
          signal?.throwIfAborted();

          const response = await fetch(`/_api/upload/s3/multipart/${encodeURIComponent(uploadId)}?key=${encodeURIComponent(key)}`, { signal });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          const data = await response.json();
          return data;
        },
        async completeMultipartUpload(file, { key, uploadId, parts, signal }) {
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
        async abortMultipartUpload(file: UppyFile, { key, uploadId, signal }) {
          const response = await fetch(`/_api/upload/s3/multipart/${encodeURIComponent(uploadId)}?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
            signal,
          });

          if (!response.ok) {
            throw new Error('Request failed');
          }
        },
      })
      .on('upload-success', (file, response) => {
        console.log(file, response);
      });
  });

  let tmp = 'red';
</script>

<div id="uppy-dashboard"></div>

<style>
  /**
  * Hide weird "upload # files" button
  */
  :global(.uppy-StatusBar-actions .uppy-StatusBar-actionBtn--upload):not(.uppy-c-btn-primary) {
    visibility: hidden;
  }
</style>
