<script lang="ts">
  import * as Carousel from '$lib/app/components/ui/carousel';
  import type { LandingSectionForSchema } from '@southneuhof/landing-sveltekit-framework/types';
  import productShowcase from '@southneuhof/landing-section-schema/sections/product-showcase';

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
</script>

{#if product}
  <div class="relative flex w-full items-center justify-center overflow-hidden bg-[#F7F7F8]">
    <div class="w-full max-w-screen-xl px-6 py-8 lg:px-12 lg:py-12">
      <div class="grid grid-cols-1 gap-8 xl:grid-cols-[1.08fr_1fr]">
        <div class="flex flex-col gap-6">
          <div class="rounded-[2.25rem] bg-[#F4E8EA] p-6 lg:p-12">
            {#if activeImage}
              <img src={activeImage} alt={product.name} class="mx-auto h-[280px] w-full object-contain sm:h-[340px] lg:h-[420px]" />
            {:else}
              <div class="flex h-[280px] items-center justify-center rounded-2xl bg-white/70 text-sm text-outline sm:h-[340px] lg:h-[420px]">No Image</div>
            {/if}
          </div>

          {#if normalizedImages.length > 0}
            <Carousel.Root
              opts={{
                align: 'start',
                containScroll: false,
                dragFree: true,
              }}
              class="w-full"
            >
              <Carousel.Content class="ml-4 py-2">
                {#each normalizedImages as image, index (`product-thumb-${index}`)}
                  <Carousel.Item class="basis-[44%] sm:basis-[31%] lg:basis-[24%] pl-0">
                    <button
                      type="button"
                      onclick={() => (activeImageIndex = index)}
                      class="w-full rounded-[1.75rem] border p-4 transition {activeImageIndex === index ? 'border-[#D1B40A] bg-[#F1EFD8]' : 'border-transparent bg-[#EAF1F5]'}"
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} class="h-24 w-full object-contain sm:h-28" />
                    </button>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
              <div class="mt-3">
                <Carousel.Navigation />
              </div>
            </Carousel.Root>
          {/if}
        </div>

        <div class="flex flex-col gap-6">
          {#if product.category}
            <span class="w-fit rounded-full border border-outline-variant px-4 py-1 text-sm text-on-surface/70">{product.category}</span>
          {/if}

          <h2 class="text-3xl font-bold leading-tight text-on-surface/80 lg:text-6xl">{product.name}</h2>

          <div class="border-t border-outline-variant"></div>

          <h3 class="text-[2rem] font-semibold leading-tight text-[#F43C35]">Detail Produk</h3>

          {#if product.description}
            <div class="rtf-content text-xl leading-relaxed text-on-surface/70">
              {@html product.description}
            </div>
          {:else}
            <p class="text-lg text-on-surface/60">Deskripsi produk belum tersedia.</p>
          {/if}

          {#if product.url}
            <a
              href={product.url}
              class="inline-flex w-fit items-center gap-2 rounded-full bg-[#F43C35] px-6 py-3 font-semibold text-white"
            >
              Lihat Produk
              <i class="ri-arrow-right-line text-xl"></i>
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
