<script lang="ts">
  import ArticleItem from "$lib/app/components/app/ArticleItem.svelte";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import Button from "$lib/app/components/ui/Button.svelte";
  import articleHighlights from "@southneuhof/landing-section-schema/sections/article-highlights";
  import type { LandingSectionForSchema } from "@southneuhof/landing-sveltekit-framework/types";

  type Section = LandingSectionForSchema<typeof articleHighlights>

  const { section }: { section: Section } = $props()
  const articles = section?.data?.articles ?? []
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-xl flex flex-col py-4 lg:py-8 gap-6 lg:gap-8 px-6 lg:px-12">
    <SectionHeader header={{ ...section?.data?.content, url: undefined }}/>
    
    {#if (articles.length > 0)}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 w-full items-start">
        <div class="w-full">
          <ArticleItem
            title={articles[0].title}
            excerpt={articles[0].excerpt}
            created_at={articles[0].created_at}
            categories={articles[0].categories}
            thumbnail={articles[0].thumbnail}
            slug={articles[0].slug}
            variant="vertical"
            isFeatured={true}
          />
        </div>

        {#if articles.length > 1}
          <div class="w-full flex flex-col gap-5 sm:gap-6 lg:gap-7">
            {#each articles.slice(1, 4) as article (article.id)}
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
        {/if}
      </div>

      {#if section?.data?.content?.url}
        <div class="flex justify-center mt-6 lg:mt-10 w-full">
          <a href={section.data.content.url}>
            <Button variant="filled" class="font-semibold text-sm shadow-sm transition-transform active:scale-95">
              {section.data.content.url_text || 'Lihat Lebih Banyak Berita & Artikel'}
              <i class="ri-arrow-right-line ml-2 text-base"></i>
            </Button>
          </a>
        </div>
      {/if}
    {:else}
      <p class="text-center text-outline">Tidak ada artikel untuk ditampilkan.</p>
    {/if}
  </div>
</div>

