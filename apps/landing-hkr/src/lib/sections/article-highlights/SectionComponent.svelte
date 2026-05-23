<script lang="ts">
  import ArticleItem from "$lib/app/components/app/ArticleItem.svelte";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  const {section} = $props()
  const articles = section?.data?.articles ?? []
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-xl flex flex-col py-6 lg:py-12 gap-6 px-6 lg:px-12">
    <SectionHeader header={section?.data?.content ?? {}}/>
    {#if (articles.length > 0)}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-base w-full">
        {#each articles as article (article.id)}
          <ArticleItem
            title={article.title}
            excerpt={article.excerpt}
            created_at={article.created_at}
            categories={article.categories}
            thumbnail={article.thumbnail}
            slug={article.slug}
          />
        {/each}
      </div>
    {:else}
      <p class="text-center text-outline">Tidak ada artikel untuk ditampilkan.</p>
    {/if}
  </div>
</div>
