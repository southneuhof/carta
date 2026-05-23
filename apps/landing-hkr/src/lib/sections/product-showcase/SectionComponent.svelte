<script lang="ts">
  import type { LandingSectionForSchema } from '@southneuhof/landing-sveltekit-framework/types';
  import productShowcase from '@southneuhof/landing-section-schema/sections/product-showcase';

  type Section = LandingSectionForSchema<typeof productShowcase>;

  const { section }: { section: Section } = $props();

  const product = $derived(section?.data?.product ?? null);
  const images = $derived(Array.isArray(product?.images) ? product.images : []);
</script>

{#if product}
  <div class="flex w-full items-center justify-center">
    <div class="w-full max-w-screen-xl px-6 py-8 lg:px-12 lg:py-12">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="rounded-3xl bg-[#F6ECEC] p-6 lg:p-10">
          {#if product.thumbnail}
            <img src={product.thumbnail} alt={product.name} class="mx-auto h-full max-h-[420px] w-full object-contain" />
          {:else}
            <div class="flex min-h-[280px] items-center justify-center rounded-2xl bg-white/70 text-sm text-outline">No Image</div>
          {/if}
        </div>

        <div class="flex flex-col gap-5">
          {#if product.category}
            <span class="w-fit rounded-full border border-outline-variant px-4 py-1 text-sm text-on-surface/70">{product.category}</span>
          {/if}
          <h2 class="text-3xl font-bold text-on-surface lg:text-5xl">{product.name}</h2>

          {#if product.description}
            <div class="border-t border-outline-variant pt-5">
              <p class="rtf-content whitespace-pre-wrap text-on-surface/80">{product.description}</p>
            </div>
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

      {#if images.length > 1}
        <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {#each images.slice(1, 5) as image, index (`product-image-${index}`)}
            {@const imageUrl = typeof image === 'string'
              ? image
              : image && typeof image === 'object' && 'url' in image && typeof image.url === 'string'
                ? image.url
                : image && typeof image === 'object' && 'path' in image && typeof image.path === 'string'
                  ? image.path
                  : ''}
            <div class="rounded-2xl bg-[#F4F4F6] p-4">
              {#if imageUrl}
                <img src={imageUrl} alt={product.name} class="h-28 w-full object-contain" />
              {:else}
                <div class="flex h-28 items-center justify-center text-xs text-outline">No Image</div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
