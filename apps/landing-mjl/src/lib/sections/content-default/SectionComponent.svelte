<script lang="ts">
  import Button from "$lib/app/components/ui/Button.svelte";
  import { m } from "$lib/paraglide/messages";
  import { widthPresetClassMap } from "$lib/utils/uicommon";
  import contentDefault from "@client/section-schema/sections/content-default";
  import type { LandingSectionForSchema } from "@southneuhof/landing-sveltekit-framework/types";

  type Section = LandingSectionForSchema<typeof contentDefault>

  const { section }: { section: Section } = $props()
  const content = (section.data.content || {}) as NonNullable<Section['data']['content']>

  const contentAlignClassMap: any = {
    left: {
      container: 'items-start',
      content: {
        container: 'flex flex-col items-start justify-center',
        content: 'text-left',
      }
    },
    center: {
      container: 'items-center',
      content: {
        container: 'flex flex-col items-center justify-center',
        content: 'text-center',
      }
    },
    right: {
      container: 'items-end',
      content: {
        container: 'flex flex-col items-end justify-center',
        content: 'text-right',
      }
    }
  }

  const urlJustifyClassMap: any = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  const containerColorClassMap: any = {
    none: '',
    primary: 'bg-primary',
    'primary-container': 'bg-primary-container',
    secondary: 'bg-secondary',
    'secondary-container': 'bg-secondary-container',
    tertiary: 'bg-tertiary',
    'tertiary-container': 'bg-tertiary-container',
    surface: 'bg-surface',
    'surface-container': 'bg-surface-container',
  }

  const containerRadiusClassMap: any = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  }

  const containerPaddingClassMap: any = {
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8',
    lg: 'p-6 md:p-10 lg:p-12',
    xl: 'p-8 md:p-12 lg:p-16',
  }

  const gapClassMap: any = {
    sm: 'gap-4 md:gap-6',
    md: 'gap-6 md:gap-8',
    lg: 'gap-8 md:gap-12',
    xl: 'gap-10 md:gap-16',
  }

  const horizontalLayoutClassMap: any = {
    equal: 'grid-cols-1 md:grid-cols-2',
    'media-heavy': 'grid-cols-1 md:grid-cols-[1.25fr_0.75fr]',
    'text-heavy': 'grid-cols-1 md:grid-cols-[0.75fr_1.25fr]',
  }

  const reversedHorizontalLayoutClassMap: any = {
    equal: 'grid-cols-1 md:grid-cols-2',
    'media-heavy': 'grid-cols-1 md:grid-cols-[0.75fr_1.25fr]',
    'text-heavy': 'grid-cols-1 md:grid-cols-[1.25fr_0.75fr]',
  }

  const mediaAspectRatioClassMap: any = {
    auto: '',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
  }

  const mediaRadiusClassMap: any = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  }

  const textColorClassMap: any = {
    default: '',
    'on-primary': 'text-on-primary',
    'on-secondary': 'text-on-secondary',
  }

  const titleSizeClassMap: any = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-5xl',
  }

  const ornamentSizeClassMap: any = {
    sm: 'w-24 md:w-32',
    md: 'w-36 md:w-48',
    lg: 'w-48 md:w-64',
    xl: 'w-64 md:w-80',
  }

  const ornamentBackgroundOffsetClassMap: any = {
    sm: 'w-[90%]',
    md: 'w-full',
    xl: 'w-[110%]',
  }

  const ornamentBackgroundSizeClassMap: any = {
    sm: 'w-[110%]',
    md: 'w-[120%]',
    lg: 'w-[130%]',
    xl: 'w-[140%]',
  }

  const ornamentPositionClassMap: any = {
    'top-left': '-top-8 -left-8',
    'top-right': '-top-8 -right-8',
    'bottom-left': '-bottom-8 -left-8',
    'bottom-right': '-bottom-8 -right-8',
    'left-center': 'top-1/2 -translate-y-1/2 -left-8',
    'right-center': 'top-1/2 -translate-y-1/2 -right-8',
  }

  const ornamentCornerClassList = [
    '-top-8 -left-8',
    '-bottom-8 -right-8 rotate-180',
  ]

  const contentAlign = section.meta.content_align || 'left'
  const contentOrder = section.meta.content_order || 'image-text'
  const layoutDirection = section.meta.layout_direction || 'horizontal'
  const columnRatio = section.meta.column_ratio || 'equal'
  const contentGap = section.meta.content_gap || 'lg'
  const containerVariant = section.meta.container_variant || 'plain'
  const containerColor = section.meta.container_color || 'none'
  const containerRadius = section.meta.container_radius || 'lg'
  const containerPadding = section.meta.container_padding || 'lg'
  const mediaAspectRatio = section.meta.media_aspect_ratio || 'auto'
  const mediaRadius = section.meta.media_radius || 'lg'
  const textColorScheme = section.meta.text_color_scheme || 'default'
  const titleSize = section.meta.title_size || 'md'
  const ornamentScope = section.meta.ornament_scope || 'media'
  const ornamentLayer = section.meta.ornament_layer || 'behind'
  const ornamentPosition = section.meta.ornament_position || 'bottom-left'
  const ornamentOffset = section.meta.ornament_offset || 'md'
  const ornamentSize = section.meta.ornament_size || 'md'

  const horizontalGridClass = contentOrder === 'text-image'
    ? reversedHorizontalLayoutClassMap[columnRatio]
    : horizontalLayoutClassMap[columnRatio]

  const layoutClass = layoutDirection === 'horizontal'
    ? `grid ${horizontalGridClass} ${gapClassMap[contentGap]}`
    : `flex flex-col ${gapClassMap[contentGap]}`
</script>

<div class="relative flex w-full items-center justify-center overflow-hidden">
  {@render Ornament('section')}
  <div class="relative z-10 w-full {widthPresetClassMap[section.meta.width_preset]} py-6 lg:py-12 px-6 lg:px-12">
    {#if containerVariant === 'panel'}
      <div
        class="relative overflow-hidden {containerColorClassMap[containerColor]} {containerRadiusClassMap[containerRadius]} {containerPaddingClassMap[containerPadding]}"
      >
        {@render Ornament('container')}
        <div class="relative z-10 {layoutClass} {(contentAlignClassMap as any)[contentAlign].container} justify-center">
          {@render OrderedContent()}
        </div>
      </div>
    {:else}
      <div class="relative {layoutClass} {(contentAlignClassMap as any)[contentAlign].container} justify-center">
        {@render Ornament('container')}
        <div class="contents">
          {@render OrderedContent()}
        </div>
      </div>
    {/if}
  </div>
</div>

{#snippet OrderedContent()}
  {#if contentOrder === 'image-text'}
    {@render ContentMedia()}
    {@render ContentText()}
  {:else}
    {@render ContentText()}
    {@render ContentMedia()}
  {/if}
{/snippet}

{#snippet ContentText()}
  {#if content.title || content.subtitle || content.description}
    <div
      class="relative z-10 flex flex-col gap-4 {(contentAlignClassMap as any)[contentAlign].content.container} {textColorClassMap[textColorScheme]}"
    >
      {#if content.title || content.subtitle}
        <div class="flex flex-col gap-xs">
          {#if content.subtitle}
            <p class="{(contentAlignClassMap as any)[contentAlign].content.content}">{content.subtitle}</p>
          {/if}
          {#if content.title}
            <p class="{titleSizeClassMap[titleSize]} font-bold {(contentAlignClassMap as any)[contentAlign].content.content}">{content.title}</p>
          {/if}
        </div>
      {/if}
      {#if content.description}
        <div class="rtf-content {(contentAlignClassMap as any)[contentAlign].content.content}">
          {@html content.description}
        </div>
      {/if}
      {#if content.url}
        {#if section.meta.button_type === 'text'}
          <div class="flex flex-row items-center w-full {(urlJustifyClassMap as any)[section.meta.url_justify || 'left']}">
            <a href={content.url} class="font-semibold underline">{content.url_text || m.learn_more()}</a>
            <i class="ri-arrow-right-line"></i>
          </div>
        {:else}
          <div class="flex flex-row items-center w-full {(urlJustifyClassMap as any)[section.meta.url_justify || 'left']}">
            <Button href={content.url} color="primary">{content.url_text || m.learn_more()} <i class="ri-arrow-right-line"></i></Button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet ContentMedia()}
  {#if content.media}
    <div class="relative z-10 w-full">
      {@render Ornament('media')}
      <div class="relative z-10 w-full overflow-hidden {mediaRadiusClassMap[mediaRadius]} {mediaAspectRatioClassMap[mediaAspectRatio]}">
        {#if content.media_type === 'embed'}
          <div class="embed-preview">
            <div class="h-full w-full">{@html content.media}</div>
          </div>
        {:else}
          <img
            src={content.media}
            alt={content.title || ''}
            class="h-full w-full object-cover object-center"
          />
        {/if}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet Ornament(scope: string)}
  {#if section.meta.ornament_enabled && section.meta.ornament_media && ornamentScope === scope}
    {#if ornamentLayer === 'behind' && scope === 'container'}
      <img
        src={section.meta.ornament_media}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-0 z-0 h-auto max-w-none -translate-x-1/2 {ornamentBackgroundOffsetClassMap[ornamentOffset]}"
      />
    {:else if ornamentLayer === 'behind'}
      <img
        src={section.meta.ornament_media}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-1/2 z-0 h-auto max-w-none -translate-x-1/2 -translate-y-1/2 {ornamentBackgroundSizeClassMap[ornamentSize]}"
      />
    {:else if ornamentPosition === 'corners'}
      {#each ornamentCornerClassList as cornerClass}
        <img
          src={section.meta.ornament_media}
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute z-[1] {ornamentSizeClassMap[ornamentSize]} {cornerClass}"
        />
      {/each}
    {:else}
      <img
        src={section.meta.ornament_media}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute z-[1] {ornamentSizeClassMap[ornamentSize]} {ornamentPositionClassMap[ornamentPosition]}"
      />
    {/if}
  {/if}
{/snippet}

<style>
  .embed-preview {
    position: relative;
    width: 100%;
    min-height: 300px;
    height: 300px;
  }

  :global(.aspect-video) .embed-preview,
  :global(.aspect-\[4\/3\]) .embed-preview,
  :global(.aspect-square) .embed-preview {
    height: 100%;
    min-height: 100%;
  }

  @media (min-width: 768px) {
    .embed-preview {
      height: 100%;
      min-height: 300px;
    }
  }

  .embed-preview :global(iframe) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: inherit;
  }
</style>
