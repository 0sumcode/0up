<script lang="ts">
  import { onMount } from 'svelte';
  import { UppyDecrypt } from 'uppy-encrypt';

  export let data;
  console.log(data);

  const decryptors: UppyDecrypt[] = [];

  onMount(() => {
    const password = window.location.hash.substring(1);
    // TODO replace timeout with sodium ready handler
    setTimeout(() => {
      // Verify password
      if (!UppyDecrypt.verifyPassword(data.upload.hash, password)) {
        // TODO error
      }

      // Decrypt meta-data
      for (const file of data.files) {
        const decrypt = new UppyDecrypt(password, file.salt, file.header);
        decryptors.push(decrypt);
        console.log(decrypt.getDecryptedMetaData(file.meta_header, file.meta_data));
      }
    }, 1000);
  });

  const handleDownload = async () => {
    // Get signed download URL
    const s3url = await fetch(`/_api/download/s3/${data.files[0].id}`); // TODO remove hard-coded val

    if (!s3url.ok) {
      // TODO error
    }

    const { url } = await s3url.json();
    const res = await fetch(url);
    const blob = await res.blob();
    try {
      const decBlob = await decryptors[0].decryptFile(blob); // TODO remove hard-coded index
    } catch (e) {
      // TODO error
    }
    const aElement = document.createElement('a');
    aElement.setAttribute('download', 'test.enc'); // TODO remove hard-coded name
    const href = URL.createObjectURL(decBlob);
    aElement.href = href;
    aElement.setAttribute('target', '_blank');
    aElement.click();
    URL.revokeObjectURL(href);
  };
</script>

<button class="text-white" on:click={handleDownload}>here</button>
