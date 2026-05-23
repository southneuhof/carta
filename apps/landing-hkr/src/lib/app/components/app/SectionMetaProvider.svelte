<script lang="ts">
  import type { LandingSection } from '@southneuhof/landing-sveltekit-framework/types'

  type SectionWrapperOverflow = 'hidden' | 'visible' | 'clip-x'
  type SectionMetaProviderSchema = {
    render?: {
      wrapper?: {
        overflow?: SectionWrapperOverflow
      }
      resolveWrapper?: (input: { section: LandingSection }) => {
        overflow?: SectionWrapperOverflow
      }
    }
  }

  let { section, schema, children } = $props<{
    section: LandingSection & { meta?: Record<string, unknown> | null }
    schema?: SectionMetaProviderSchema
    children: any
  }>()

  const wrapperOverflowClassMap: Record<SectionWrapperOverflow, string> = {
    hidden: 'overflow-hidden',
    visible: 'overflow-visible',
    'clip-x': 'overflow-x-clip overflow-y-visible',
  }

  const ornamentBackgroundOffsetClassMap: Record<string, string> = {
    sm: 'w-[90%]',
    md: 'w-full',
    xl: 'w-[110%]',
  }

  const backgroundColor = $derived(
    typeof section?.meta?.section_background_color === 'string'
      ? section.meta.section_background_color.trim()
      : '',
  )

  const ornamentMedia = $derived(
    typeof section?.meta?.section_ornament_media === 'string'
      ? section.meta.section_ornament_media.trim()
      : '',
  )

  const ornamentOffset = $derived(
    typeof section?.meta?.section_ornament_offset === 'string'
      && section.meta.section_ornament_offset in ornamentBackgroundOffsetClassMap
      ? section.meta.section_ornament_offset
      : 'md',
  )

  const sectionStyle = $derived(backgroundColor ? `background-color: ${backgroundColor};` : undefined)

  const wrapperOverflow = $derived(
    (schema?.render?.resolveWrapper?.({ section }).overflow
      ?? schema?.render?.wrapper?.overflow
      ?? 'hidden') as SectionWrapperOverflow,
  )

  const wrapperOverflowClass = $derived(wrapperOverflowClassMap[wrapperOverflow] ?? wrapperOverflowClassMap.hidden)
</script>

<div class="relative w-full {wrapperOverflowClass}" style={sectionStyle}>
  {#if ornamentMedia}
    <img
      src={ornamentMedia}
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-0 z-0 h-auto max-w-none -translate-x-1/2 {ornamentBackgroundOffsetClassMap[ornamentOffset]}"
    />
  {/if}
  <div class="relative z-10">
    {@render children()}
  </div>
</div>
