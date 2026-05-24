<script lang="ts">
  import { api } from "$lib/utils/services";
  import { debounce } from "@southneuhof/utilities/object";
  import SearchBar from "$lib/app/components/input/SearchBar.svelte";
  import ArticleItem from "$lib/app/components/app/ArticleItem.svelte";
  import Spinner from "$lib/app/components/ui/Spinner.svelte";
  import Button from "$lib/app/components/ui/Button.svelte";
  import TabItem from "$lib/app/components/ui/tabs/TabItem.svelte";
  import { getLocale } from "$lib/paraglide/runtime";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";

  const {section} = $props()

  let loading = $state(false);
  let articles = $state<any[]>([]); 
  let articleListMeta = $state<any>({}); 
  let rawSearchInput = $state(''); 

  const articleCategories = section.meta.article_categories_filter?.length
    ? section.meta.article_categories_filter
    : (section.data?.articleCategory ?? []);

  let urlSearchParameters = $state<{
    search?: string,
    article_category_ids?: string[], 
    article_category_main_ids?: string[],
    page?: number,
    limit?: number,
  }>({
    article_category_ids: undefined,
    article_category_main_ids: section.meta.article_categories_main?.map((cat: any) => cat.id) || undefined,
    page: 1,
    limit: 12,
  });

  const fetchArticles = async () => {
    loading = true;
    try {
      const params: Record<string, string | number | (string[]) | undefined> = {};
      if (urlSearchParameters.search) params.search = urlSearchParameters.search;
      if (urlSearchParameters.article_category_ids && urlSearchParameters.article_category_ids.length > 0 && section.meta.allow_filter) {
        params["article_category_ids[]"] = urlSearchParameters.article_category_ids;
      }
      if (urlSearchParameters.article_category_main_ids && urlSearchParameters.article_category_main_ids.length > 0) {
        params["article_category_main_ids[]"] = urlSearchParameters.article_category_main_ids;
      }
      if (urlSearchParameters.page) params.page = urlSearchParameters.page;
      if (urlSearchParameters.limit) params.limit = urlSearchParameters.limit;

      const response = await api.get('/api/public/article/list', params as any);
      articles = response.data || [];
      articleListMeta = response.meta || {};
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      articles = [];
    } finally {
      loading = false;
    }
  };

  const debouncedSetSearchQuery = debounce((value: string) => {
    urlSearchParameters.search = value || undefined; 
    urlSearchParameters.page = 1; 
  }, 500); 

  $effect(() => {
    fetchArticles();
  });

  // onMount is not strictly needed here as $effect handles initial fetch

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    rawSearchInput = target.value;
    debouncedSetSearchQuery(rawSearchInput);
  }

  function handleCategoryClick(category: any, type: 'single' | 'multi') {
    switch (type) {
      case 'single':
        if (urlSearchParameters.article_category_ids?.length === 1 && urlSearchParameters.article_category_ids[0] === category.id) {
          if (section.meta.allow_select_all) {
            urlSearchParameters.article_category_ids = undefined;
          }
        } else {
          urlSearchParameters.article_category_ids = [category.id];
        }
        break;
      case 'multi':
        if (!urlSearchParameters.article_category_ids) {
          urlSearchParameters.article_category_ids = [category.id];
        } else if (urlSearchParameters.article_category_ids.includes(category.id)) {
          urlSearchParameters.article_category_ids = urlSearchParameters.article_category_ids.filter(id => id !== category.id);
          if (urlSearchParameters.article_category_ids.length === 0 && section.meta.allow_select_all) {
            urlSearchParameters.article_category_ids = undefined;
          }
        } else {
          urlSearchParameters.article_category_ids = [...urlSearchParameters.article_category_ids, category.id];
        }
        break;
    }
    urlSearchParameters.page = 1;
  }

  function getFilterType(): 'single' | 'multi' {
    return section.meta.filter_type === 'single' ? 'single' : 'multi';
  }

  function getCategoryName(category: any) {
    if (typeof category?.name === 'string' && category.name.length > 0) {
      return category.name;
    }

    if (Array.isArray(category?.translations)) {
      return category.translations.find((item: any) => item?.language === getLocale())?.name
        || category.translations[0]?.name
        || '';
    }

    return '';
  }

</script>

<div class="flex flex-col gap-6 w-full">
  <div class="flex justify-center w-full">
    <div class="w-full max-w-screen-xl grid grid-cols-1 {section.meta.type === 'one-column' ? 'md:grid-cols-1' : 'md:grid-cols-3 gap-0 md:gap-6 lg:gap-8'}">
      <!-- Sidebar: Search and Filters -->
      <div class="md:col-span-1 py-12 px-6 md:px-8 lg:px-12 gap-6 {section.meta.type === 'one-column' ? 'flex sm:flex-row flex-col items-center justify-between pb-0' : 'md:border-r md:border-outline-variant flex flex-col'}">
        <SearchBar bind:value={urlSearchParameters.search} class="w-full {section.meta.allow_filter ? 'sm:w-[unset]' : ''}"/>
        {#if section.meta.allow_filter}
          <div class="{section.meta.filter_style === 'chip' ? 'flex flex-row' : 'w-fit max-w-full overflow-auto flex items-center justify-center'}">
            <div class="w-full flex flex-row items-center {section.meta.filter_style === 'chip' ? 'flex-wrap gap-3' : ''}">
              {#each articleCategories as category (category.id)}
                {@render ArticleCategoryPicker(category)}
              {/each}
            </div>
          </div>
        {/if}
      </div>
  
      <!-- Article List and Pagination -->
      <div class="md:col-span-2 px-6 md:px-8 lg:px-12 pb-12 pt-6 flex flex-col items-center w-full">
        {#if loading && articles.length === 0} <!-- Show spinner only on initial load or if articles are empty -->
          <div class="flex justify-center items-center h-64">
            <Spinner/>
          </div>
        {:else if articles.length === 0}
          <p class="text-outline text-center py-10">No articles found.</p>
        {:else}
          <div class="flex flex-col gap-8 w-full">
            <!-- <div
              class="flex flex-col gap-3 divide-y divide-outline-variant w-full"
            > -->
            <div
              // class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-lg gap-y-[48px] w-full"
              class="flex flex-col gap-4"
            >
              {#each articles as article (article.id)}
                <ArticleItem
                  title={article.title}
                  excerpt={article.excerpt}
                  created_at={article.created_at}
                  categories={article.categories}
                  thumbnail={article.thumbnail}
                  slug={article.slug}
                  variant="horizontal"
                />
              {/each}
            </div>
            {#if articleListMeta && articleListMeta.totalPages > 1}
              <div class="flex justify-between items-center pt-4 border-t border-outline-variant">
                <Button
                  onclick={() => {
                    if (urlSearchParameters.page && urlSearchParameters.page > 1) {
                      urlSearchParameters.page -= 1;
                    }
                  }}
                  disabled={urlSearchParameters.page === 1 || loading}
                  variant="text"
                  aria-label="Previous"
                >
                  <i class="ri-arrow-left-s-line"></i>
                  <span class="hidden sm:inline ml-1">Previous</span>
                </Button>
                <p class="text-sm">{urlSearchParameters.page} <span class="text-outline-variant"> / </span> {articleListMeta.totalPages}</p>
                <Button
                  onclick={() => {
                    if (urlSearchParameters.page && urlSearchParameters.page < articleListMeta.totalPages) {
                       urlSearchParameters.page += 1;
                    }
                  }}
                  disabled={Number(articleListMeta?.totalPages) <= Number(urlSearchParameters.page) || loading} 
                  variant="text"
                  aria-label="Next"
                >
                  <span class="hidden sm:inline mr-1">Next</span>
                  <i class="ri-arrow-right-s-line"></i>
                </Button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
<!-- <div>
  <div class="mb-4 flex flex-wrap gap-2">
    {#each section.data.articleCategory as category (category.id)}
      <button
        type="button"
        class="px-3 py-1 rounded border transition
          {urlSearchParameters.article_category_ids && urlSearchParameters.article_category_ids.includes(category.id)
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-black border-gray-300'}"
        onclick={() => {
          if (!urlSearchParameters.article_category_ids) {
            urlSearchParameters.article_category_ids = [category.id];
          } else if (urlSearchParameters.article_category_ids.includes(category.id)) {
            urlSearchParameters.article_category_ids = urlSearchParameters.article_category_ids.filter(id => id !== category.id);
            if (urlSearchParameters.article_category_ids.length === 0) {
              urlSearchParameters.article_category_ids = undefined;
            }
          } else {
            urlSearchParameters.article_category_ids = [...urlSearchParameters.article_category_ids, category.id];
          }
          urlSearchParameters.page = 1;
        }}
      >
        {category.name}
      </button>
    {/each}
  </div>
  <input
    type="text"
    placeholder="Search articles..."
    value={rawSearchInput}
    oninput={handleInput}
    class="mb-4 p-2 border rounded w-full"
  />
</div>

{#if loading}
  <p>Loading articles...</p>
{:else if articles.length > 0}
  <ul>
    {#each articles as article (article.id)}
      <a href="/article/{article.slug}">
        <li class="mb-2 p-2 border rounded">
          <h3 class="text-lg font-semibold">{article.title}</h3>
          {#if article.categories?.length}
            <p class="text-sm text-gray-600">Category: {article.categories.join(', ')}</p>
          {/if}
          <p class="text-sm">{article.excerpt}</p>
          <small>{new Date(article.created_at).toLocaleDateString()}</small>
        </li>
      </a>
    {/each}
  </ul>
  <div class="mt-4 flex justify-between">
    <button
      onclick={() => {
        if (urlSearchParameters.page && urlSearchParameters.page > 1) {
          urlSearchParameters.page -= 1;
        }
      }}
      disabled={urlSearchParameters.page === 1 || loading}
      class="p-2 border rounded"
    >
      Previous
    </button>
    <span>Page {urlSearchParameters.page}</span>
    <button
      onclick={() => {
        if (urlSearchParameters.page) {
           urlSearchParameters.page += 1;
        }
      }}
      disabled={loading} 
      class="p-2 border rounded"
    >
      Next
    </button>
  </div>
{:else}
  <p>No articles found.</p>
{/if} -->

{#snippet ArticleCategoryPicker(category: any)}
  {#if section.meta.filter_style === 'chip'}
    <button
      type="button"
      class="px-3 py-1.5 rounded border transition text-sm
        {urlSearchParameters.article_category_ids && urlSearchParameters.article_category_ids.includes(category.id)
          ? 'bg-primary text-on-primary border-primary'
          : 'bg-transparent text-on-surface border-outline-variant hover:bg-surface-container-highest'}"
      onclick={() => handleCategoryClick(category, getFilterType())}
    >
      {getCategoryName(category)}
    </button>
  {:else if section.meta.filter_style === 'tab'}
    <TabItem onclick={() => handleCategoryClick(category, getFilterType())} active={urlSearchParameters.article_category_ids && urlSearchParameters.article_category_ids.includes(category.id)}>{getCategoryName(category)}</TabItem>
  {/if}
{/snippet}
