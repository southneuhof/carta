<script lang="ts">
  import LandingPage from '$lib/app/components/app/LandingPage.svelte';
  import { sectionComponents } from '$lib/sections/index.js';

  const {data} = $props()
</script>

<LandingPage sections={data.sections} {sectionComponents} />
