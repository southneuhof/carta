<script lang="ts">
  import { page } from "$app/state";
  import ImagePreview from "$lib/app/components/ui/ImagePreview.svelte";
  import { m } from "$lib/paraglide/messages";

  const {content, aspectRatio, hideOutline} = $props()

  const aspectRatioMap: any = {
    '3/4': 'aspect-[3/4]',
    '1/1': 'aspect-[1/1]',
    '2/3': 'aspect-[2/3]',
  }
</script>

<div class="flex flex-col gap-base">
  <ImagePreview 
    src={content.media}
    class="{aspectRatioMap[aspectRatio]} {hideOutline ? '' : 'border border-outline-variant'} rounded-sm object-center object-cover"
    title={content.title}
    description={content.description}
    subtitle={content.subtitle}
    hideTextOnPreview
  >
  </ImagePreview>
  <!-- <img class="aspect-[3/4] border border-outline-variant rounded-sm object-center object-cover" src={"https://www.wikarealty.co.id/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fweare_hcis_hig%2Fabout%2FC-2225200403259747053.png&w=3840&q=75"} alt={content.title ?? ''}/> -->
  <div class="flex flex-col gap-sm">
    {#if content.title || content.subtitle}
      <div class="flex flex-col gap-xs">
        {#if content.subtitle}<p class="text-outline text-sm">{content.subtitle}</p>{/if}
        {#if content.title}<p class="font-bold">{content.title}</p>{/if}
      </div>
    {/if}
    {#if content.description}<p class="rtf-content m-base text-sm text-outline">{@html content.description}</p>{/if}
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