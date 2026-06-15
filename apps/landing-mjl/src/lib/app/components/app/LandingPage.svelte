<script lang="ts">
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import type { LandingSection, SectionComponentRegistry } from '@southneuhof/landing-sveltekit-framework/types';
  import SectionRenderer from './SectionRenderer.svelte';

  let {
    sections,
    sectionComponents,
    class: className = 'flex flex-col col-span-4',
  } = $props<{
    sections: LandingSection[];
    sectionComponents: SectionComponentRegistry;
    class?: string;
  }>();

  let lastNavigationType: 'enter' | 'form' | 'link' | 'goto' | 'popstate' | 'leave' = 'enter';

  beforeNavigate((navigation) => {
    lastNavigationType = navigation.type;
  });

  $effect(() => {
    if (!browser) return;

    const hash = $page.url.hash;
    if (!hash) return;
    if (lastNavigationType === 'popstate') return;

    const id = hash.substring(1);
    const scrollToElement = () => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    scrollToElement();

    const observer = new MutationObserver((_mutations, obs) => {
      if (document.getElementById(id)) {
        scrollToElement();
        obs.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
</script>

<div class={className}>
  {#each sections as section, index (section.id)}
    <SectionRenderer {section} {sections} {index} {sectionComponents} />
  {/each}
</div>
