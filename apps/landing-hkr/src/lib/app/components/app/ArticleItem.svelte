<script lang="ts">
  import { m } from "$lib/paraglide/messages";
  import { formatDate } from "@southneuhof/utilities/format";

  const {
    title,
    excerpt,
    created_at,
    categories,
    thumbnail,
    slug
  } = $props<{
    title: string,
    excerpt: string,
    created_at: string,
    categories: string[],
    thumbnail?: string,
    slug: string
  }>();
</script>

<!-- <a href="/article/{slug}" class="py-6 flex flex-col md:flex-row items-start md:items-center gap-4 group">
  <img 
    src="{thumbnail}" 
    class="w-full md:w-[160px] aspect-[16/9] object-center object-cover outline outline-outline-variant order-1 md:order-2"
    alt="{title}"
  />
  <div class="flex flex-col gap-sm w-full md:flex-1 order-2 md:order-1">
    <p class="group-hover:underline text-sm">{formatDate(created_at)} • {categories.join(', ')}</p>
    <p class="text-xl font-bold group-hover:underline">{title}</p>
    {#if excerpt}<p class="text-outline text-sm group-hover:underline line-clamp-2 overflow-hidden text-ellipsis">{excerpt}</p>{/if}
  </div>
</a> -->

<a href="/article/{slug}" class="flex flex-col gap-2 group/news">
  <img src={thumbnail} alt="img" class="aspect-square object-center object-cover rounded-sm outline outline-outline-variant"/>
  <div class="flex flex-col gap-1 mt-1">
    <div class="flex flex-col lg:flex-row lg:items-center lg:gap-1 min-w-max">
      <div class="flex flex-row items-center gap-2 text-muted">
        <i class="ri-calendar-line"></i>
        <p class="text-xs">{new Date(created_at).toLocaleDateString(m.locale(), { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      {#if categories?.length}
        <p class="text-muted font-semibold hidden lg:block">⋅</p>
        <p class="text-xs text-muted font-semibold">
          {categories[0]}{#if categories.length > 1}, {categories.length - 1}+{/if}
        </p>
      {/if}
    </div>
    <div class="flex flex-col gap-2 group-hover/news:underline">
      <p class="font-semibold">{title}</p>
      <p class="text-sm max-w-full line-clamp-2 overflow-ellipsis text-muted">{excerpt}</p>
    </div>
  </div>
</a>
