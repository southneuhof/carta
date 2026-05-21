<script lang="ts">
  import type { LandingSection, SectionComponentRegistry } from '@southneuhof/landing-sveltekit-framework/types';
  import SectionWrapper from '@southneuhof/landing-sveltekit-framework/components/SectionWrapper.svelte';
  import SectionMetaProvider from './SectionMetaProvider.svelte';

  let {
    section,
    index = 0,
    sectionComponents,
  } = $props<{
    section: LandingSection;
    index?: number;
    sectionComponents: SectionComponentRegistry;
  }>();

  const loadedComponents: Record<string, any> = {};

  async function getSectionComponent(sectionTypeCode: string) {
    if (!loadedComponents[sectionTypeCode]) {
      const mod = await sectionComponents[sectionTypeCode]();
      loadedComponents[sectionTypeCode] = mod.default;
    }

    return loadedComponents[sectionTypeCode];
  }
</script>

{#if section?.section_type_code && section.visible !== false}
  {@const sectionComponentPromise = sectionComponents[section.section_type_code] ? getSectionComponent(section.section_type_code) : null}
  {#if sectionComponentPromise}
    {#await sectionComponentPromise then SectionComponent}
      <SectionWrapper {index}>
        <SectionMetaProvider {section}>
          <SectionComponent {section} />
        </SectionMetaProvider>
      </SectionWrapper>
    {/await}
  {:else}
    <div class="landing-sveltekit-framework-missing-section">
      <p>Section Missing</p>
    </div>
  {/if}
{/if}

