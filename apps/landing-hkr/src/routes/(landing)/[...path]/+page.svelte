<script lang="ts">
  import LandingPage from '@southneuhof/landing-sveltekit-framework/components/LandingPage.svelte';
  import { sectionComponents } from '$lib/sections/index.js';

  const {data} = $props()
</script>

<LandingPage sections={data.sections} {sectionComponents} />
