<script lang="ts">
  import Button from "$lib/app/components/ui/Button.svelte";
  import * as Carousel from "$lib/app/components/ui/carousel";
  import CenterNavigation from "$lib/app/components/ui/carousel/carousel-center-navigation.svelte";
  import { m } from "$lib/paraglide/messages";
  import { widthPresetClassMap } from "$lib/utils/uicommon";
  import contentGallerySchema from "@client/section-schema/sections/content-gallery";
  import type { LandingSectionForSchema } from "@southneuhof/landing-sveltekit-framework/types";

  type Section = LandingSectionForSchema<typeof contentGallerySchema>
  type Content = NonNullable<Section['data']['content']>

  const { section }: { section: Section } = $props()

  const content = (section.data.content || {}) as Content
  const galleryHeader = (section.data.gallery_header || {}) as Content
  const gallery = section.data.gallery || []

  const contentAlignClassMap: any = {
    left: {
      container: 'items-start',
      content: 'text-left',
    },
    center: {
      container: 'items-center',
      content: 'text-center',
    },
    right: {
      container: 'items-end',
      content: 'text-right',
    },
  }

  const urlJustifyClassMap: any = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
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
    all: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
    },
    diagonal: {
      none: 'rounded-none',
      sm: 'rounded-tl-sm rounded-br-sm',
      md: 'rounded-tl-2xl rounded-br-2xl',
      lg: 'rounded-tl-[3rem] rounded-br-[3rem]',
      xl: 'rounded-tl-[4rem] rounded-br-[4rem] md:rounded-tl-[7rem] md:rounded-br-[7rem]',
    },
    top: {
      none: 'rounded-none',
      sm: 'rounded-t-sm',
      md: 'rounded-t-md',
      lg: 'rounded-t-lg',
      xl: 'rounded-t-xl',
    },
    bottom: {
      none: 'rounded-none',
      sm: 'rounded-b-sm',
      md: 'rounded-b-md',
      lg: 'rounded-b-lg',
      xl: 'rounded-b-xl',
    },
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
    'content-heavy': 'grid-cols-1 md:grid-cols-[0.85fr_1.15fr]',
    'gallery-heavy': 'grid-cols-1 md:grid-cols-[0.7fr_1.3fr]',
  }

  const reversedHorizontalLayoutClassMap: any = {
    equal: 'grid-cols-1 md:grid-cols-2',
    'content-heavy': 'grid-cols-1 md:grid-cols-[1.15fr_0.85fr]',
    'gallery-heavy': 'grid-cols-1 md:grid-cols-[1.3fr_0.7fr]',
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

  const galleryGridClassMap: any = {
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  const galleryGapClassMap: any = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8 md:gap-10',
    xl: 'gap-10 md:gap-14',
  }

  const galleryItemAlignClassMap: any = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }

  const galleryIconSizeClassMap: any = {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-5xl',
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

  const carouselItemWidthClassMap: any = {
    narrow: 'basis-[82%] sm:basis-1/2 lg:basis-1/4',
    medium: 'basis-[86%] sm:basis-1/2 lg:basis-1/3',
    wide: 'basis-[90%] lg:basis-1/2',
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
  const galleryHeaderAlign = section.meta.gallery_header_align || 'left'
  const contentOrder = section.meta.content_order || 'content-gallery'
  const layoutDirection = section.meta.layout_direction || 'horizontal'
  const columnRatio = section.meta.column_ratio || 'content-heavy'
  const contentGap = section.meta.content_gap || 'xl'
  const containerVariant = section.meta.container_variant || 'panel'
  const containerColor = section.meta.container_color || 'surface-container'
  const containerRadius = section.meta.container_radius || 'xl'
  const containerRadiusPattern = section.meta.container_radius_pattern || 'diagonal'
  const containerPadding = section.meta.container_padding || 'xl'
  const textColorScheme = section.meta.text_color_scheme || 'default'
  const titleSize = section.meta.title_size || 'md'
  const galleryTitleSize = section.meta.gallery_title_size || 'md'
  const galleryColumns = section.meta.gallery_columns || '3'
  const galleryGap = section.meta.gallery_gap || 'xl'
  const galleryItemAlign = section.meta.gallery_item_align || 'left'
  const galleryIconSize = section.meta.gallery_icon_size || 'md'
  const galleryMediaRadius = section.meta.gallery_media_radius || 'sm'
  const galleryMediaAspectRatio = section.meta.gallery_media_aspect_ratio || 'auto'
  const galleryDisplayMode = section.meta.gallery_display_mode || 'static'
  const isCarouselMode = galleryDisplayMode === 'carousel'
  const carouselNavigationPosition = section.meta.carousel_navigation_position || 'bottom'
  const carouselNavigationStyle = section.meta.carousel_navigation_style || 'arrows'
  const carouselItemWidth = section.meta.carousel_item_width || 'medium'
  const ornamentScope = section.meta.ornament_scope || 'container'
  const ornamentLayer = section.meta.ornament_layer || 'inside'
  const ornamentPosition = section.meta.ornament_position || 'top-left'
  const ornamentOffset = section.meta.ornament_offset || 'md'
  const ornamentSize = section.meta.ornament_size || 'md'

  const horizontalGridClass = contentOrder === 'gallery-content'
    ? reversedHorizontalLayoutClassMap[columnRatio]
    : horizontalLayoutClassMap[columnRatio]

  const layoutClass = layoutDirection === 'horizontal'
    ? `grid ${horizontalGridClass} ${gapClassMap[contentGap]}`
    : `flex flex-col ${gapClassMap[contentGap]}`

  const panelRadiusClass = containerRadiusClassMap[containerRadiusPattern]?.[containerRadius] || containerRadiusClassMap.all[containerRadius]
  const carouselItemWidthClass = carouselItemWidthClassMap[carouselItemWidth] || carouselItemWidthClassMap.medium
</script>

<div class="relative flex w-full items-center justify-center {isCarouselMode ? 'overflow-visible' : 'overflow-hidden'}">
  {@render Ornament('section')}
  <div class="relative z-10 w-full {widthPresetClassMap[section.meta.width_preset || 'xl']} py-6 lg:py-12 px-6 lg:px-12">
    {#if containerVariant === 'panel'}
      <div
        class="relative {isCarouselMode ? 'overflow-visible' : 'overflow-hidden'} {containerColorClassMap[containerColor]} {panelRadiusClass} {containerPaddingClassMap[containerPadding]} {textColorClassMap[textColorScheme]}"
      >
        {@render Ornament('container')}
        <div class="relative z-10 {layoutClass} justify-center">
          {@render OrderedContent()}
        </div>
      </div>
    {:else}
      <div class="relative {layoutClass} justify-center {textColorClassMap[textColorScheme]}">
        {@render Ornament('container')}
        {@render OrderedContent()}
      </div>
    {/if}
  </div>
</div>

{#snippet OrderedContent()}
  {#if contentOrder === 'gallery-content'}
    {@render GalleryColumn()}
    {@render MainContent()}
  {:else}
    {@render MainContent()}
    {@render GalleryColumn()}
  {/if}
{/snippet}

{#snippet MainContent()}
  <div class="relative z-10 flex min-w-0 flex-col justify-center">
    {@render Ornament('content')}
    {@render ContentText(content, contentAlign, titleSize)}
  </div>
{/snippet}

{#snippet GalleryColumn()}
  <div class="relative z-10 flex min-w-0 flex-col {gapClassMap.md}">
    {@render Ornament('gallery')}
    {@render ContentText(galleryHeader, galleryHeaderAlign, galleryTitleSize)}
    {@render ContentMedia()}
  </div>
{/snippet}

{#snippet ContentText(item: Content, align: string, currentTitleSize: string)}
  {#if item.title || item.subtitle || item.description}
    <div class="relative z-10 flex flex-col gap-4 {contentAlignClassMap[align].container}">
      {#if item.title || item.subtitle}
        <div class="flex flex-col gap-xs {contentAlignClassMap[align].container}">
          {#if item.subtitle}
            <p class="{contentAlignClassMap[align].content}">{item.subtitle}</p>
          {/if}
          {#if item.title}
            <p class="{titleSizeClassMap[currentTitleSize]} font-bold {contentAlignClassMap[align].content}">{item.title}</p>
          {/if}
        </div>
      {/if}
      {#if item.description}
        <div class="rtf-content {section.meta.remove_margin ? 'm-base' : ''} {contentAlignClassMap[align].content}">
          {@html item.description}
        </div>
      {/if}
      {#if item.url}
        {#if section.meta.button_type === 'text'}
          <div class="flex w-full flex-row items-center {(urlJustifyClassMap as any)[section.meta.url_justify || 'left']}">
            <a href={item.url} class="font-semibold underline">{item.url_text || m.learn_more()}</a>
            <i class="ri-arrow-right-line"></i>
          </div>
        {:else}
          <div class="flex w-full flex-row items-center {(urlJustifyClassMap as any)[section.meta.url_justify || 'left']}">
            <a href={item.url}>
              <Button>{item.url_text || m.learn_more()} <i class="ri-arrow-right-line"></i></Button>
            </a>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet ContentIcon()}
  <div class="grid w-full {galleryGridClassMap[galleryColumns]} {galleryGapClassMap[galleryGap]}">
    {#each gallery as icon}
      {@render IconGalleryItem(icon)}
    {/each}
  </div>
{/snippet}

{#snippet ContentImage()}
  <div class="grid w-full {galleryGridClassMap[galleryColumns]} {galleryGapClassMap[galleryGap]}">
    {#each gallery as image}
      {@render ImageGalleryItem(image)}
    {/each}
  </div>
{/snippet}

{#snippet ContentEmbed()}
  <div class="grid w-full {galleryGridClassMap[galleryColumns]} {galleryGapClassMap[galleryGap]}">
    {#each gallery as embed}
      {@render EmbedGalleryItem(embed)}
    {/each}
  </div>
{/snippet}

{#snippet ContentMedia()}
  {#if gallery.length}
    {#if galleryDisplayMode === 'carousel'}
      {@render CarouselGallery()}
    {:else}
      {@render StaticGallery()}
    {/if}
  {/if}
{/snippet}

{#snippet StaticGallery()}
  {#if section.meta.gallery_media_type === 'embed'}
    {@render ContentEmbed()}
  {:else if section.meta.gallery_media_type === 'image'}
    {@render ContentImage()}
  {:else}
    {@render ContentIcon()}
  {/if}
{/snippet}

{#snippet CarouselGallery()}
  <div class="relative left-1/2 w-screen max-w-none -translate-x-1/2">
    <Carousel.Root
      opts={{
        containScroll: false,
        dragFree: section.meta.carousel_drag_free ?? true,
        loop: Boolean(section.meta.carousel_loop),
        watchDrag: gallery.length > 1,
      }}
      class="w-full flex flex-col {galleryGapClassMap[galleryGap]}"
    >
      {#if carouselNavigationPosition === 'top'}
        {@render CarouselNavigation()}
      {/if}
      <div class="relative w-full">
        <Carousel.Content>
          {#each gallery as item, i (item.id || `content-gallery-carousel-${i}`)}
            <Carousel.Item class="{carouselItemWidthClass} pl-4 first:pl-px">
              {@render GalleryItem(item)}
            </Carousel.Item>
          {/each}
        </Carousel.Content>
        {#if carouselNavigationPosition === 'center' && carouselNavigationStyle !== 'none'}
          <CenterNavigation />
        {/if}
      </div>
      {#if carouselNavigationPosition === 'bottom'}
        {@render CarouselNavigation()}
      {/if}
    </Carousel.Root>
  </div>
{/snippet}

{#snippet GalleryItem(item: any)}
  {#if section.meta.gallery_media_type === 'embed'}
    {@render EmbedGalleryItem(item)}
  {:else if section.meta.gallery_media_type === 'image'}
    {@render ImageGalleryItem(item)}
  {:else}
    {@render IconGalleryItem(item)}
  {/if}
{/snippet}

{#snippet IconGalleryItem(icon: any)}
  <div class="flex min-w-0 flex-col gap-sm {galleryItemAlignClassMap[galleryItemAlign]}">
    {#if icon.media}<i class="{icon.media} {galleryIconSizeClassMap[galleryIconSize]}"></i>{/if}
    {#if icon.title}<p class="font-bold text-lg">{icon.title}</p>{/if}
    {#if icon.subtitle}<p>{icon.subtitle}</p>{/if}
  </div>
{/snippet}

{#snippet ImageGalleryItem(image: any)}
  <div class="flex min-w-0 flex-col gap-base {galleryItemAlignClassMap[galleryItemAlign]}">
    {#if image.media}
      <div class="w-full overflow-hidden {mediaRadiusClassMap[galleryMediaRadius]} {mediaAspectRatioClassMap[galleryMediaAspectRatio]}">
        <img
          src={image.media}
          alt={image.title || ''}
          class="h-full w-full object-cover object-center {!section.meta.remove_outline_on_images ? 'outline outline-outline-variant' : ''}"
        />
      </div>
    {/if}
    {#if image.title || image.subtitle}
      <div class="flex flex-col gap-xs {galleryItemAlignClassMap[galleryItemAlign]}">
        {#if image.title}<p class="font-bold text-lg">{image.title}</p>{/if}
        {#if image.subtitle}<p>{image.subtitle}</p>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet EmbedGalleryItem(embed: any)}
  <div class="flex min-w-0 flex-col gap-base {galleryItemAlignClassMap[galleryItemAlign]}">
    {#if embed.media}
      <div class="min-h-[300px] w-full overflow-hidden {mediaRadiusClassMap[galleryMediaRadius]}">
        <div class="embed-preview">
          <div class="h-full w-full">{@html embed.media}</div>
        </div>
      </div>
    {/if}
    {#if embed.title || embed.subtitle}
      <div class="flex flex-col gap-xs {galleryItemAlignClassMap[galleryItemAlign]}">
        {#if embed.title}<p class="font-bold text-lg">{embed.title}</p>{/if}
        {#if embed.subtitle}<p>{embed.subtitle}</p>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet CarouselNavigation()}
  {#if carouselNavigationStyle === 'title'}
    <Carousel.Navigation>
      {#snippet navigation({ handleClick, currentIndex }: any)}
        <div class="flex flex-wrap items-center justify-center gap-4">
          {#each gallery as item, i}
            <button onclick={() => handleClick(i)} class="{currentIndex === i ? 'text-on-surface font-semibold' : 'text-outline'}">{item.title}</button>
          {/each}
        </div>
      {/snippet}
    </Carousel.Navigation>
  {:else if carouselNavigationStyle === 'arrows-dots'}
    <Carousel.Navigation />
  {:else if carouselNavigationStyle === 'arrows'}
    <Carousel.Navigation>
      {#snippet navigation({ scrollPrev, scrollNext }: any)}
        <div class="flex items-center justify-center gap-4">
          <button
            onclick={scrollPrev}
            aria-label="Previous slide"
            class="flex aspect-square h-12 items-center justify-center rounded-full outline outline-1 outline-primary text-outline transition-colors hover:bg-primary hover:text-on-primary"
          >
            <i class="ri-arrow-left-s-line text-2xl"></i>
          </button>
          <button
            onclick={scrollNext}
            aria-label="Next slide"
            class="flex aspect-square h-12 items-center justify-center rounded-full outline outline-1 outline-primary text-outline transition-colors hover:bg-primary hover:text-on-primary"
          >
            <i class="ri-arrow-right-s-line text-2xl"></i>
          </button>
        </div>
      {/snippet}
    </Carousel.Navigation>
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
