<script lang="ts">
  import Button from '$lib/app/components/ui/Button.svelte';
  import { m } from '$lib/paraglide/messages';

  const {section} = $props()
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-xl py-6 lg:py-12 px-6 lg:px-12 grid md:grid-cols-2 grid-cols-1 gap-lg">
    <div class="col-span-1 flex items-center justify-center">
      <img src="{section.data.content.media}" alt="{section.data.content.title}" class="w-full object-center object-cover"/>
    </div>
    <div class="col-span-1 flex flex-col gap-sm">
      <div class="flex flex-col gap-xs">
        {#if section.data.content.subtitle}<p class="text-sm">{section.data.content.subtitle}</p>{/if}
        {#if section.data.content.title}<p class="text-2xl md:text-3xl font-bold ">{section.data.content.title}</p>{/if}
      </div>
      {#if section.data.content.description}<p class="rtf-content m-base">{@html section.data.content.description}</p>{/if}
      {#if section.data.content.url}
        {#if section.meta.button_type === 'text'}
          <div class="flex flex-row items-center justify-end">
            <a href={section.data.content.url} class="font-semibold underline">{section.data.content.url_text || m.learn_more()}</a>
            <i class="ri-arrow-right-line"></i>
          </div>
        {:else if section.meta.button_type === 'button'}
          <div class="flex flex-row items-center justify-end mt-[0.5rem]">
            <a href={section.data.content.url}>
              <Button>{section.data.content.url_text || m.learn_more()} <i class="ri-arrow-right-line"></i></Button>
            </a>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>