<script lang="ts">
  import Button from "$lib/app/components/ui/Button.svelte";
  import { m } from "$lib/paraglide/messages";
  import { widthPresetClassMap } from "$lib/utils/uicommon";

  const {section} = $props()

  const contentAlignClassMap:any  = {
    left: {
      container: 'items-start',
      content: {
        container: 'flex flex-col items-start justify-center',
        content: 'text-left',
      }
    },
    center: {
      container: 'items-center',
      content: {
        container: 'flex flex-col items-center justify-center',
        content: 'text-center',
      }
    },
    right: {
      container: 'items-end',
      content: {
        container: 'flex flex-col items-end justify-center',
        content: 'text-right',
      }
    }
  }

  const urlJustifyClassMap: any = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  const layoutDirectionClassMap: any = {
    horizontal: 'grid md:grid-cols-2 grid-cols-1 gap-lg',
    vertical: 'flex flex-col gap-6'
  }
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full {widthPresetClassMap[section.meta.width_preset]} {section.meta.layout_direction ? layoutDirectionClassMap[section.meta.layout_direction] : layoutDirectionClassMap['vertical']} py-6 lg:py-12 px-6 lg:px-12 {(contentAlignClassMap as any)[section.meta.content_align].container} justify-center">
    {#if section.meta.content_order === 'image-text'}
      {@render ContentMedia()}
    {/if}
    {#if section.data.content.title || section.data.content.subtitle || section.data.content.description}
      <div class="flex flex-col gap-4 {(contentAlignClassMap as any)[section.meta.content_align].content.container}">
        {#if section.data.content.title || section.data.content.subtitle}
          <div class="flex flex-col gap-xs">
            {#if section.data.content.subtitle}<p class="{(contentAlignClassMap as any)[section.meta.content_align].content.content}">{section.data.content.subtitle}</p>{/if}
            {#if section.data.content.title}<p class="text-2xl md:text-3xl font-bold {(contentAlignClassMap as any)[section.meta.content_align].content.content}">{section.data.content.title}</p>{/if}
          </div>
        {/if}
        {#if section.data.content.description}
          <p class="rtf-content -mt-4 {section.meta.remove_margin ? 'm-base' : ''} {(contentAlignClassMap as any)[section.meta.content_align].content.content}">{@html section.data.content.description}</p>
        {/if}
        {#if section.data.content.url}
          {#if section.meta.button_type === 'text'}
            <div class="flex flex-row items-center w-full {(urlJustifyClassMap as any)[section.meta.url_justify]}">
              <a href={section.data.content.url} class="font-semibold underline">{section.data.content.url_text || m.learn_more()}</a>
              <i class="ri-arrow-right-line"></i>
            </div>
          {:else}
            <div class="flex flex-row items-center w-full {(urlJustifyClassMap as any)[section.meta.url_justify]}">
              <a href={section.data.content.url}>
                <Button>{section.data.content.url_text || m.learn_more()} <i class="ri-arrow-right-line"></i></Button>
              </a>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
    {#if section.meta.content_order === 'text-image'}
      {@render ContentMedia()}
    {/if}
  </div>
</div>

{#snippet ContentMedia()}
  {#if section.data.content.media}
    {#if section.data.content.media_type === 'embed'}
      <div class="min-h-[300px] md:h-[450px] w-full">
        <div class="embed-preview">
          <div class="h-full w-full">{@html section.data.content.media}</div>
        </div>
      </div>
    {:else}
      {#if section.data.content.media}
        <img src={section.data.content.media} alt={section.data.content.title} class="w-full object-cover object-center rounded-sm {!section.meta.remove_outline_on_images ? 'outline outline-outline-variant' : ''} "/>
      {/if}
    {/if}
  {/if}
{/snippet}

<style>
  .embed-preview {
    position: relative;
    width: 100%;
    min-height: 300px;
    height: 300px;
  }
  
  @media (min-width: 768px) {
    .embed-preview {
      height: 100%;
      min-height: auto;
    }
  }

  .embed-preview :global(iframe) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px; /* Note: radius might be clipped by parent's overflow:hidden */
  }
</style>
