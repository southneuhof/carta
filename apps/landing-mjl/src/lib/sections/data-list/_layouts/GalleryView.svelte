<script lang="ts">
  import ImagePreview from "$lib/app/components/ui/ImagePreview.svelte";

  const {content} = $props()
</script>

<div class="relative group aspect-square max-w-[320px]">
  <ImagePreview src={content.media} title={content.title} description={content.description} subtitle={content.subtitle} class="h-full w-full">
    {#snippet trigger()}
      <div class="aspect-square w-[320px] text-white outline outline-outline-variant bg-center h-full bg-cover flex flex-col text-start items-start group/item justify-end p-6 text-shadow-outline-variant" style="background-image: {(content.title || content.description) ? `linear-gradient(to top, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0) 75%), ` : ``} url('{content.media}');">
        {#if content.subtitle}<p class="text-sm translate-y-5 group-hover/item:translate-y-0 transition-all">{content.subtitle}</p>{/if}
        {#if content.title}<p class="font-semibold translate-y-5 group-hover/item:translate-y-0 transition-all">{content.title}</p>{/if}
        <p class="text-xs mt-2 opacity-0 translate-y-5 transition-all group-hover/item:opacity-100 group-hover/item:translate-y-0"><i class="ri-arrow-right-up-line"></i></p>
      </div>
    {/snippet}
  </ImagePreview>
</div>