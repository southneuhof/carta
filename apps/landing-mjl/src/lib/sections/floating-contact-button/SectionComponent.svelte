<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { contactFABContent } from '$lib/app/states/contactFABContent.svelte';
  import { onDestroy } from 'svelte';
  import { onMount, tick } from 'svelte';
  
  const { section } = $props();

  onMount(() => {
    contactFABContent.data = section.data.profile
  })

  onDestroy(() => {
    console.log('DESTROYINH')
    contactFABContent.data = null
  })
</script>