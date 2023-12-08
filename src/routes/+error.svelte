<script lang="ts">
  import { page } from '$app/stores';
</script>

<h1 class="text-white">{$page.status}: {$page.error?.message || ''}</h1>
