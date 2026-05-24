<script lang="ts">
  import { m } from "$lib/paraglide/messages";
  import { formatDate } from "$lib/utils/format";

  const {
    title,
    excerpt,
    created_at,
    categories,
    thumbnail,
    slug,
    variant = 'vertical',
    isFeatured = false
  } = $props<{
    title: string,
    excerpt: string,
    created_at: string,
    categories: string[],
    thumbnail?: string,
    slug: string,
    variant?: 'vertical' | 'horizontal',
    isFeatured?: boolean
  }>();
</script>

{#if variant === 'vertical'}
  <a href="/article/{slug}" class="flex flex-col gap-3 group/news w-full">
    {#if thumbnail}
      <img
        src={thumbnail}
        alt={title}
        class="w-full {isFeatured ? 'aspect-[1.8]' : 'aspect-[16/10]'} object-center object-cover rounded-xl outline outline-outline-variant transition-transform duration-300 group-hover/news:scale-[1.01]"
      />
    {/if}
    <div class="flex flex-col gap-2 mt-1">
      <div class="flex flex-row items-center text-xs text-muted font-medium">
        <p>{formatDate(created_at)}</p>
        {#if categories?.length}
          <span class="mx-1.5 font-semibold text-outline-variant">·</span>
          <p>{categories[0]}</p>
        {/if}
      </div>
      <div class="flex flex-col gap-2 group-hover/news:underline decoration-primary decoration-2 underline-offset-4">
        <p class="font-bold text-on-surface leading-snug {isFeatured ? 'text-xl md:text-xl lg:text-2xl' : 'text-base md:text-lg'}">
          {title}
        </p>
        {#if excerpt}
          <p class="text-sm max-w-full line-clamp-2 overflow-ellipsis text-muted leading-relaxed">
            {excerpt}
          </p>
        {/if}
      </div>
    </div>
  </a>
{:else}
  <a href="/article/{slug}" class="flex flex-row items-center justify-between gap-6 w-full group/news py-2">
    <div class="flex flex-col gap-2 flex-1">
      <div class="flex flex-row items-center text-xs text-muted font-medium">
        <p>{formatDate(created_at)}</p>
        {#if categories?.length}
          <span class="mx-1.5 font-semibold text-outline-variant">·</span>
          <p>{categories[0]}</p>
        {/if}
      </div>
      <div class="flex flex-col gap-2 group-hover/news:underline decoration-primary decoration-2 underline-offset-4">
        <p class="font-bold text-on-surface text-base md:text-lg leading-snug line-clamp-2">
          {title}
        </p>
        {#if excerpt}
          <p class="text-xs sm:text-sm max-w-full line-clamp-2 overflow-ellipsis text-muted leading-relaxed hidden sm:block">
            {excerpt}
          </p>
        {/if}
      </div>
    </div>
    {#if thumbnail}
      <img
        src={thumbnail}
        alt={title}
        class="w-[100px] sm:w-[150px] aspect-[1.4] sm:aspect-[1.5] object-center object-cover rounded-xl outline outline-outline-variant transition-transform duration-300 group-hover/news:scale-[1.01] shrink-0"
      />
    {/if}
  </a>
{/if}

