<script lang="ts">
  import { onMount } from 'svelte';
  import { UppyDecrypt } from 'uppy-encrypt';

  export let data;
  console.log(data);

  onMount(() => {
    const password = window.location.hash.substring(1);
    // TODO replace timeout with sodium ready handler
    setTimeout(() => {
      // Verify password
      if (!UppyDecrypt.verifyPassword(data.upload.hash, password)) {
        // TODO error
      }

      for (const file of data.files) {
        const decrypt = new UppyDecrypt(password, file.salt, file.header);
        console.log(decrypt.getDecryptedMetaData(file.meta_header, file.meta_data));
      }
    }, 1000);
  });
</script>

<div class="text-white">here</div>
