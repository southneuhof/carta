<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
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

  function scrollToHash(hash: string) {
    if (!hash) return;

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
  }

  afterNavigate((navigation) => {
    if (!browser) return;
    if (navigation.type === 'popstate') return;

    return scrollToHash(navigation.to?.url.hash ?? '');
  });
</script>

<div class={className}>
  {#each sections as section, index (section.id)}
    <SectionRenderer {section} {sections} {index} {sectionComponents} />
  {/each}
</div>
