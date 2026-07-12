<script setup lang="ts">
definePage({ name: 'not-found', meta: { title: 'Page Not Found' } })
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background p-8 text-on-surface">
    <div class="flex max-w-xl flex-col items-center gap-4 text-center">
      <p class="text-sm font-semibold uppercase tracking-wide text-muted">404</p>
      <h1 class="text-3xl font-semibold">Page Not Found</h1>
      <p class="text-muted">The page you’re looking for doesn’t exist or may have moved.</p>
      <RouterLink class="text-primary underline underline-offset-4" to="/">Return to the home page</RouterLink>
    </div>
  </main>
</template>
