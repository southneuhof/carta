<script lang="ts">
  import ProductShowcaseSection from '$lib/sections/product-showcase/SectionComponent.svelte';

  const { data } = $props();
</script>

<div class="flex flex-col w-full min-h-screen h-full text-on-surface">
  <div class="w-full" style="margin-top: var(--topbarHeight);">
    <ProductShowcaseSection section={data.section} />
  </div>
</div>
