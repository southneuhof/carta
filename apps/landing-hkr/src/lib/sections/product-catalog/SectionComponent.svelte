<script lang="ts">
  import { browser } from '$app/environment';
  import SectionHeader from '$lib/app/components/app/SectionHeader.svelte';
  import productCatalog from '@southneuhof/landing-section-schema/sections/product-catalog';
  import type { LandingSectionForSchema } from '@southneuhof/landing-sveltekit-framework/types';

  type Section = LandingSectionForSchema<typeof productCatalog>;

  type ProductCategory = {
    id: string;
    name: string;
    description?: string;
  };

  type Product = {
    id: string;
    product_category_id: string;
    name: string;
    url?: string;
    category: string;
    thumbnail: string;
    images: unknown[];
  };

  const { section }: { section: Section } = $props();

  let search = $state('');
  let activeCategoryId = $state('');
  let categories = $state<ProductCategory[]>([]);
  let products = $state<Product[]>([]);
  let loading = $state(false);
  let error = $state('');
  let debounceHandle: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;
  let firstFetch = true;

  const pastelClasses = [
    'bg-[#FDEAEA]',
    'bg-[#FFFBEA]',
    'bg-[#F2FAEE]',
    'bg-[#EAF8FD]',
    'bg-[#F0F0F6]',
    'bg-[#FBEAFD]',
  ];

  const initialLimit = $derived(Number(section?.meta?.initialLimit) > 0 ? Number(section.meta.initialLimit) : 8);
  const showSearch = $derived(section?.meta?.showSearch !== false);
  const showCategoryTabs = $derived(section?.meta?.showCategoryTabs !== false);

  async function fetchProducts(includeCategories = false) {
    const currentRequestId = ++requestId;
    const params = new URLSearchParams();
    params.set('limit', String(initialLimit));
    if (includeCategories) params.set('include_categories', 'true');
    if (search.trim()) params.set('search', search.trim());
    if (activeCategoryId) params.set('product_category_id', activeCategoryId);

    loading = true;
    error = '';

    try {
      const response = await fetch(`/api/public/product/list?${params.toString()}`);
      const payload = await response.json();
      if (currentRequestId !== requestId) return;
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Failed to load products');

      const data = payload?.data ?? payload;
      products = Array.isArray(data?.products) ? data.products : [];
      if (includeCategories) categories = Array.isArray(data?.categories) ? data.categories : [];
    } catch (err) {
      if (currentRequestId !== requestId) return;
      error = err instanceof Error ? err.message : 'Failed to load products';
      products = [];
    } finally {
      if (currentRequestId === requestId) loading = false;
    }
  }

  function scheduleFetch() {
    if (!browser) return;
    if (debounceHandle) clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => fetchProducts(false), 275);
  }

  $effect(() => {
    if (!browser) return;
    search;
    activeCategoryId;
    if (firstFetch) {
      firstFetch = false;
      fetchProducts(true);
      return;
    }
    scheduleFetch();
  });
</script>

<div class="flex w-full items-center justify-center">
  <div class="w-full max-w-screen-xl px-6 py-8 lg:px-12 lg:py-12">
    <SectionHeader header={{ ...section?.data?.content, url: undefined }} defaultAlign="left" />

    <div class="mt-8 flex flex-col-reverse gap-5 lg:flex-row lg:items-center">
      {#if showSearch}
        <label class="relative block w-full min-w-0 flex-1">
          <span class="sr-only">Cari produk</span>
          <i class="ri-search-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface/60"></i>
          <input
            bind:value={search}
            class="h-12 w-full rounded-full border border-outline-variant bg-surface py-3 pl-12 pr-5 text-sm outline-none transition focus:border-primary lg:h-14 lg:text-base"
            type="search"
            placeholder="Cari Disini..."
          />
        </label>
      {/if}

      {#if showCategoryTabs}
        <div class="flex w-full flex-shrink-0 items-center gap-2 overflow-x-auto py-1 lg:w-auto lg:max-w-[58%] lg:gap-3">
          <button
            type="button"
            class="h-10 flex-shrink-0 rounded-full px-4 text-sm font-semibold leading-none transition lg:h-11 lg:px-5 {activeCategoryId === '' ? 'bg-[#3489DB] text-white' : 'text-on-surface/70 hover:text-on-surface'}"
            onclick={() => (activeCategoryId = '')}
          >
            Semua
          </button>
          {#each categories as category (category.id)}
            <button
              type="button"
              class="h-10 flex-shrink-0 rounded-full px-3 text-sm leading-none transition lg:h-11 lg:px-4 {activeCategoryId === category.id ? 'bg-[#3489DB] font-semibold text-white' : 'text-on-surface/70 hover:text-on-surface'}"
              onclick={() => (activeCategoryId = category.id)}
            >
              {category.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if error}
      <p class="mt-10 text-center text-error">{error}</p>
    {:else if loading && products.length === 0}
      <p class="mt-10 text-center text-outline">Memuat produk...</p>
    {:else if products.length === 0}
      <p class="mt-10 text-center text-outline">Tidak ada produk yang cocok.</p>
    {:else}
      <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {#each products as product, index (product.id)}
          <article class="relative flex min-h-[290px] flex-col overflow-hidden rounded-[28px] p-6 {pastelClasses[index % pastelClasses.length]}">
            <div class="flex h-36 items-center justify-center">
              {#if product.thumbnail}
                <img src={product.thumbnail} alt={product.name} class="max-h-full max-w-full object-contain drop-shadow-sm" />
              {:else}
                <div class="flex h-28 w-40 items-center justify-center rounded-2xl bg-white/70 text-sm text-outline">No Image</div>
              {/if}
            </div>

            <div class="mt-5 pr-16">
              <h3 class="text-xl font-bold leading-tight text-on-surface/80">{product.name}</h3>
              <p class="mt-2 text-base text-on-surface/45">{product.category}</p>
            </div>

            {#if product.url}
              <a
                href={product.url}
                class="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F43C35] text-2xl text-white transition hover:scale-105 active:scale-95"
                aria-label={`Buka ${product.name}`}
              >
                <i class="ri-arrow-right-line"></i>
              </a>
            {:else}
              <span class="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F43C35]/35 text-2xl text-white" aria-hidden="true">
                <i class="ri-arrow-right-line"></i>
              </span>
            {/if}
          </article>
        {/each}
      </div>
    {/if}

    {#if section?.data?.content?.url}
      <div class="mt-10 flex justify-center lg:mt-12">
        <a
          href={section.data.content.url}
          class="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#F43C35] px-8 py-4 text-center text-base font-semibold text-white transition hover:scale-[1.02] active:scale-95 sm:min-w-[360px]"
        >
          {section.data.content.url_text || 'Lihat Lebih Banyak Produk'}
          <i class="ri-arrow-right-line text-xl"></i>
        </a>
      </div>
    {/if}
  </div>
</div>
