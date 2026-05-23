<script lang="ts">
  import * as Carousel from '$lib/app/components/ui/carousel';
  import type { LandingSectionForSchema } from '@southneuhof/landing-sveltekit-framework/types';
  import productShowcase from '@southneuhof/landing-section-schema/sections/product-showcase';
  import { widthPresetClassMap } from '$lib/utils/uicommon';

  type Section = LandingSectionForSchema<typeof productShowcase>;

  const { section }: { section: Section } = $props();

  const product = $derived(section?.data?.product ?? null);
  const images = $derived(Array.isArray(product?.images) ? product.images : []);
  const normalizedImages = $derived(
    images
      .map((image) => {
        if (typeof image === 'string') return image;
        if (!image || typeof image !== 'object') return '';

        const item = image as Record<string, unknown>;
        if (typeof item.url === 'string' && item.url.length > 0) return item.url;
        if (typeof item.path === 'string' && item.path.length > 0) return item.path;
        if (typeof item.data === 'string' && item.data.length > 0) return item.data;
        return '';
      })
      .filter((item) => item.length > 0),
  );
  let activeImageIndex = $state(0);
  const activeImage = $derived(
    normalizedImages[activeImageIndex] ??
      normalizedImages[0] ??
      (product?.thumbnail || ''),
  );

  // Safely cast section.meta to any to support dynamic theme/metadata properties
  const meta = $derived((section?.meta ?? {}) as any);

  // Ornament configuration and mapping to align with other sections
  const ornamentSizeClassMap: any = {
    sm: 'w-24 md:w-32',
    md: 'w-36 md:w-48',
    lg: 'w-48 md:w-64',
    xl: 'w-64 md:w-80',
  };

  const ornamentBackgroundOffsetClassMap: any = {
    sm: 'w-[90%]',
    md: 'w-full',
    xl: 'w-[110%]',
  };

  const ornamentBackgroundSizeClassMap: any = {
    sm: 'w-[110%]',
    md: 'w-[120%]',
    lg: 'w-[130%]',
    xl: 'w-[140%]',
  };

  const ornamentPositionClassMap: any = {
    'top-left': '-top-8 -left-8',
    'top-right': '-top-8 -right-8',
    'bottom-left': '-bottom-8 -left-8',
    'bottom-right': '-bottom-8 -right-8',
    'left-center': 'top-1/2 -translate-y-1/2 -left-8',
    'right-center': 'top-1/2 -translate-y-1/2 -right-8',
  };

  const ornamentCornerClassList = [
    '-top-8 -left-8',
    '-bottom-8 -right-8 rotate-180',
  ];

  const ornamentScope = $derived(meta.ornament_scope || 'container');
  const ornamentLayer = $derived(meta.ornament_layer || 'inside');
  const ornamentPosition = $derived(meta.ornament_position || 'top-left');
  const ornamentOffset = $derived(meta.ornament_offset || 'md');
  const ornamentSize = $derived(meta.ornament_size || 'md');

  // Dynamic colors for thumbnails using system design theme colors
  const thumbnailColors = [
    {
      bg: 'bg-tertiary-container',
      activeBorder: 'border-tertiary/10',
    },
    {
      bg: 'bg-secondary-container',
      activeBorder: 'border-secondary',
    },
    {
      bg: 'bg-primary-container',
      activeBorder: 'border-primary',
    },
    {
      bg: 'bg-error-container',
      activeBorder: 'border-error',
    },
  ];
</script>

{#if product}
  <div class="relative flex w-full items-center justify-center overflow-hidden">
    {@render Ornament('section')}
    <div class="relative z-10 w-full {widthPresetClassMap[meta.width_preset || 'xl']} py-6 lg:py-12 px-6 lg:px-12">
      {@render Ornament('container')}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start justify-center">
        <!-- Left Column: Main Image & Carousel -->
        <div class="flex flex-col gap-4 min-w-0">
          <div class="rounded-[2rem] bg-[#F4E8EA] p-4 md:p-6 lg:p-8 flex items-center justify-center">
            {#if activeImage}
              <img
                src={activeImage}
                alt={product.name}
                class="mx-auto h-[200px] sm:h-[260px] md:h-[300px] w-full object-contain"
              />
            {:else}
              <div class="flex h-[200px] sm:h-[260px] md:h-[300px] items-center justify-center rounded-2xl bg-white/70 text-sm text-outline">
                No Image
              </div>
            {/if}
          </div>

          {#if normalizedImages.length > 0}
            <Carousel.Root
              opts={{
                align: 'start',
                containScroll: false,
                dragFree: true,
              }}
              class="w-full flex flex-col gap-2"
            >
              <Carousel.Content>
                {#each normalizedImages as image, index (`product-thumb-${index}`)}
                  {@const color = thumbnailColors[index % thumbnailColors.length]}
                  <Carousel.Item class="basis-[44%] sm:basis-[31%] lg:basis-[24%] pl-4 first:pl-px">
                    <button
                      type="button"
                      onclick={() => (activeImageIndex = index)}
                      class="w-full rounded-[1.5rem] border-2 p-3 transition-all duration-300 {color.bg} {activeImageIndex === index ? color.activeBorder : 'border-transparent opacity-80 hover:opacity-100'}"
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} class="h-16 w-full object-contain sm:h-20" />
                    </button>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
              <div class="mt-2">
                <Carousel.Navigation />
              </div>
            </Carousel.Root>
          {/if}
        </div>

        <!-- Right Column: Product Info -->
        <div class="flex flex-col gap-4 min-w-0">
          {#if product.category}
            <span class="w-fit rounded-full border border-outline-variant px-3 py-0.5 text-xs text-on-surface/70 bg-surface-container-low font-medium">
              {product.category}
            </span>
          {/if}

          <h2 class="text-2xl md:text-3xl font-bold leading-tight text-on-surface/90">{product.name}</h2>

          <div class="border-t border-outline-variant/60"></div>

          <h3 class="text-base md:text-lg font-semibold leading-tight text-[#F43C35]">Detail Produk</h3>

          {#if product.description}
            <div class="rtf-content text-sm md:text-base leading-relaxed text-on-surface/70">
              {@html product.description}
            </div>
          {:else}
            <p class="text-sm md:text-base text-on-surface/60">Deskripsi produk belum tersedia.</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

{#snippet Ornament(scope: string)}
  {#if meta.ornament_enabled && meta.ornament_media && ornamentScope === scope}
    {#if ornamentLayer === 'behind' && scope === 'container'}
      <img
        src={meta.ornament_media}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-0 z-0 h-auto max-w-none -translate-x-1/2 {ornamentBackgroundOffsetClassMap[ornamentOffset]}"
      />
    {:else if ornamentLayer === 'behind'}
      <img
        src={meta.ornament_media}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-1/2 z-0 h-auto max-w-none -translate-x-1/2 -translate-y-1/2 {ornamentBackgroundSizeClassMap[ornamentSize]}"
      />
    {:else if ornamentPosition === 'corners'}
      {#each ornamentCornerClassList as cornerClass}
        <img
          src={meta.ornament_media}
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute z-[1] {ornamentSizeClassMap[ornamentSize]} {cornerClass}"
        />
      {/each}
    {:else}
      <img
        src={meta.ornament_media}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute z-[1] {ornamentSizeClassMap[ornamentSize]} {ornamentPositionClassMap[ornamentPosition]}"
      />
    {/if}
  {/if}
{/snippet}
