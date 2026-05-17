<script lang="ts">
  import { page } from "$app/state";
  import { m } from "$lib/paraglide/messages";

  const {content} = $props()
</script>

<div class="border border-outline-variant p-4 flex flex-col md:flex-row md:gap-4 items-center md:justify-center">
  <!-- Row 1 (Mobile): Image and Title -->
  <div class="w-full flex flex-row items-center gap-4 md:w-auto md:contents">
    {#if content.media}
      <img src={content.media} alt={content.title ?? ''} class="w-16 h-16 md:w-[96px] md:h-[96px] aspect-square rounded-sm object-cover flex-shrink-0"/>
    {/if}
    <p class="font-semibold md:hidden">{content.title}{#if content.status}<span class="ml-2"><i class="ri-lock-line"></i></span>{/if}</p>
  </div>

  <div class="w-full flex flex-col gap-sm">
    {#if content.title || content.status || content.description}
      <div class="flex flex-col gap-xs">
        {#if content.title || content.status}<p class="font-semibold hidden md:block">{content.title}{#if content.status}<span class="ml-2"><i class="ri-lock-line"></i></span>{/if}</p>{/if}
        {#if content.description}<p class="py-2 md:py-0">{content.description}</p>{/if}
      </div>
    {/if}
    <!-- Row 3 (Mobile): Actions -->
    <div class="flex flex-row items-center gap-base flex-wrap text-sm">
      {#if content.url}<a href={content.url} target="_blank" rel="noopener noreferrer"><span class="underline">{content.url_text || m.learn_more()}</span> <i class="ri-arrow-right-up-line"></i></a>{/if}
      {#if content.attachment && !content.status}
        <a href="/media-preview?url={content.attachment}&title={content.title}&description={content.description}"><span class="underline">Preview</span> <i class="ri-eye-line"></i></a>
        <a href={content.attachment} target="_blank" rel="noopener noreferrer"><span class="underline">Download</span> <i class="ri-download-line"></i></a>
      {/if}
      {#if content.status}<a href={`${page.data.documentRequestMenuPath}?nama_dokumen=${encodeURIComponent(content.title ?? '')}`}><span class="underline">{m.request_access()}</span> <i class="ri-arrow-right-up-line"></i></a>{/if}
    </div>
  </div>
</div>