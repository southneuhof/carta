<script lang="ts">
  import sectionSchemas from '@client/section-schema';
  import type { LandingSection } from '@southneuhof/landing-sveltekit-framework/types';

  let {
    section,
    sections = [],
    index = 0,
  } = $props<{
    section: LandingSection;
    sections?: LandingSection[];
    index?: number;
  }>();

  const targetSections = $derived(
    (sections as LandingSection[])
      .slice(index + 1)
      .filter((targetSection: LandingSection) => targetSection.visible !== false)
      .filter((targetSection: LandingSection) => Boolean(targetSection.section_type_code))
      .filter((targetSection: LandingSection) => targetSection.section_type_code !== 'navigator'),
  );

  function getTargetLabel(targetSection: LandingSection): string {
    const sectionName = typeof targetSection?.name === 'string' ? targetSection.name.trim() : '';
    if (sectionName) return sectionName;

    const sectionTypeCode = targetSection.section_type_code ?? '';
    const schema = sectionTypeCode ? sectionSchemas[sectionTypeCode] : null;
    const schemaName = typeof schema?.info?.name === 'string' ? schema.info.name.trim() : '';
    if (schemaName) return schemaName;

    return sectionTypeCode || targetSection.id;
  }
</script>

<div class="border-y border-gray-200 bg-white" style="height: var(--navigatorHeight);">
  <div class="mx-auto flex h-full w-full max-w-7xl items-center gap-2 overflow-x-auto px-4">
    {#if targetSections.length === 0}
      <span class="text-sm text-gray-500">No sections below</span>
    {:else}
      {#each targetSections as targetSection (targetSection.id)}
        <a
          href={`#section-${targetSection.id}`}
          class="inline-flex shrink-0 items-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
        >
          {getTargetLabel(targetSection)}
        </a>
      {/each}
    {/if}
  </div>
</div>
