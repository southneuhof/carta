<script lang="ts">
	import { browser } from '$app/environment';
	import { formatDate } from '@southneuhof/utilities/format';
	import { page } from '$app/stores';

  export let data

  const baseUrl = browser ? window.location.origin : '';
  const articleUrl = baseUrl + $page.url.pathname;
</script>

<svelte:head>
  <meta name="description" content="{data.article.excerpt}"/>
</svelte:head>

<div class="flex flex-col w-full min-h-screen h-full text-on-surface">
  <div class="flex items-center justify-center w-full bg-center bg-cover py-6 lg:py-12" style="margin-top: var(--topbarHeight);">
    <div class="flex flex-col gap-16 max-w-screen-xl px-12 w-full justify-center pt-8 lg:pt-0">
      <div class="flex flex-col items-center justify-center gap-8">
        <div class="flex flex-col gap-4 max-w-[680px]">
          <p class="text-sm">{formatDate(new Date(data.article.created_at).toJSON())} • {data.article.categories?.map(category => category.name).join(', ')}</p>
          <p class="text-2xl lg:text-3xl font-semibold font-title">{data.article.title}</p>
          <p class="text-muted">{data.article?.excerpt}</p>
        </div>
        {#if data.article.thumbnail}<img src={data.article.thumbnail} alt={data.article.title} class="max-w-full outline outline-outline-variant"/>{/if}
        <div class="rtf-content max-w-[60ch]">{@html data.article.content}</div>
        <!-- Social Share Buttons -->
        <div class="flex gap-4 justify-end w-full max-w-[60ch]">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            class="hover:opacity-80 transition"
          >
            <i class="ri-facebook-fill"></i>
          </a>
          <a
            href={`https://x.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(data.article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Twitter"
            class="hover:opacity-80 transition"
          >
            <i class="ri-twitter-x-fill"></i>
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(data.article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on LinkedIn"
            class="hover:opacity-80 transition"
          >
            <i class="ri-linkedin-box-fill"></i>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(data.article.title + ' ' + articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            class="hover:opacity-80 transition"
          >
            <i class="ri-whatsapp-fill"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
