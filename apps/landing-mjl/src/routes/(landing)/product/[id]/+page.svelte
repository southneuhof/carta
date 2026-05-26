<script lang="ts">
  import ProductShowcaseSection from '$lib/sections/product-showcase/SectionComponent.svelte';

  const { data } = $props();
</script>

<ProductShowcaseSection section={data.section} />
