<script lang="ts">
  import ArticleItem from "$lib/app/components/app/ArticleItem.svelte";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import IntersectionObserver from "$lib/components/IntersectionObserver.svelte";
  import { m } from "$lib/paraglide/messages";
  import { formatDate } from "@southneuhof/utilities/format";

  const {section} = $props()
</script>

<!-- <IntersectionObserver
  threshold={0.1} 
  animationDelay={100} 
  animationDirection="fade-up"
  once
> -->
{#if (section.data.article.length > 0)}
  <div
    class="flex items-center justify-center w-full"
  >
    <div class="w-full max-w-screen-xl flex flex-col py-6 lg:py-12 gap-6 px-6 lg:px-12">
      <SectionHeader header={section.data.content}/>
      <!-- <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-lg">
        {#if section.data.article && section.data.article.length > 0}
        <a href={`/article/${section.data.article[0].slug}`} class="col-span-1 md:col-span-1 lg:col-span-6 flex flex-col gap-base group">
            <img src="{section.data.article[0].thumbnail}" class="w-full h-[240px] sm:h-[320px] object-center object-cover outline outline-outline-variant" alt={section.data.article[0].title}/>
            <div class="flex flex-col gap-sm w-full">
              <p class="text-sm sm:text-base group-hover:underline">{formatDate(section.data.article[0].created_at)} • {section.data.article[0].categories.join(', ')}</p>
              <p class="text-lg sm:text-xl font-bold group-hover:underline">{section.data.article[0].title}</p>
              <p class="text-sm text-outline group-hover:underline line-clamp-2 overflow-hidden text-ellipsis">{section.data.article[0].excerpt}</p>
            </div>
          </a>
          <div class="flex flex-col gap-sm col-span-1 md:col-span-1 lg:col-span-6 lg:-mt-6">
            {#each section.data.article.slice(1) as articleItem}
              <ArticleItem
                title={articleItem.title}
                excerpt={articleItem.excerpt}
                created_at={new Date(articleItem.created_at).toJSON()}
                categories={articleItem.categories}
                thumbnail={articleItem.thumbnail}
                slug={articleItem.slug}
              />
            {/each}
          </div>
        {:else}
          <p class="col-span-full text-start text-outline">{m.no_articles_to_display()}</p>
        {/if}
      </div>  -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-base w-full">
        {#each section.data.article as article (article.id)}
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
    </div>
  </div>
{/if}
<!-- </IntersectionObserver> -->
