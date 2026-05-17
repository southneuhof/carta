<script lang="ts">
  import { page } from '$app/state';
  import Button from '$lib/app/components/ui/Button.svelte';

</script>

<main class="min-h-screen flex flex-col items-center justify-center p-4 text-center">
  <div class="flex flex-col gap-lg items-center justify-center max-w-md w-full space-y-6">
    <div class="flex flex-col gap-xs">
      <h1 class="text-6xl font-bold text-on-surface">{page.status}</h1>
      <h2 class="text-2xl font-medium text-on-surface">The page you're looking for doesn't exist or has been moved.</h2>
      <p class="text-outline">{page.error?.message}</p>
    </div>
    <a href={page.data.primaryMenuPath}>
      <Button>Return to Home</Button>
    </a>
  </div>
</main>