<script lang="ts">
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import { m } from "$lib/paraglide/messages";

  const {section} = $props()
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-xl flex flex-col gap-6 py-6 lg:py-12 px-6 lg:px-12">
    <SectionHeader header={section.data.content} defaultAlign="center"/>
    <div class="flex flex-wrap gap-base items-stretch justify-center">
      {#each section.data.gallery as item, i (item.id || `testimonial-${i}`)}
        {@render testimonialItem(item)}
      {/each}
    </div>
  </div>
</div>

{#snippet testimonialItem(data: any)}
  <svelte:element this={data.url ? 'a' : 'div'} href={data.url || ''} target="_blank" class="outline outline-outline-variant relative overflow-hidden flex flex-col gap-6 justify-between p-8 rounded-sm w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] before:content-[''] before:absolute before:inset-0 before:z-0 before:pointer-events-none before:bg-gradient-to-br before:from-red-500/5 before:to-orange-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:ease-in-out transition-colors duration-300 {section.meta.content_align === 'vertical' ? 'items-center' : ''} {data.url ? 'cursor-pointer' : ''}">
    <p class="rtf-content m-base relative z-10">{@html data.description}</p>
    <div class="flex flex-row items-center gap-base relative z-10">
      {#if data.media}
        <img src="{data.media}" class="w-[48px] h-[48px] rounded-full object-cover" alt="{data.title}" />
      {:else}
        <div class="w-[48px] h-[48px] rounded-full bg-gray-200 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gray-500">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </div>
      {/if}
      <div>
        <p>{data.title}</p>
        {#if data.url}<p class="bottom-0 right-0 text-sm text-outline">{data.url_text || m.learn_more()} <i class="ri-arrow-right-line"></i></p>{/if}
      </div>
    </div>
  </svelte:element>
{/snippet}

<!-- <div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-xl flex flex-col gap-6 py-6 lg:py-12 px-6 lg:px-12">
    {#if section.data.content.subtitle || section.data.content.title || section.data.content.description}
      <div class="flex flex-col gap-base w-full items-center justify-center">
        <div class="flex flex-col gap-xs items-center">
          {#if section.data.content.subtitle}<p class="text-center">{section.data.content.subtitle}</p>{/if}
          {#if section.data.content.title}<p class="text-2xl md:text-3xl font-bold text-center">{section.data.content.title}</p>{/if}
        </div>
        {#if section.data.content.description}<p class="rtf-content m-base text-center">{@html section.data.content.description}</p>{/if}
      </div>
    {/if}
    {#if section.data.gallery?.length}
      {@const itemsPerRowDesktop = 6}
      {@const itemsPerRowTablet = 4} 

      <div class="flex flex-col gap-6">
        <div class="hidden lg:flex flex-col gap-6">
          {#each Array(Math.ceil(section.data.gallery.length / itemsPerRowDesktop)) as _, rowIndex}
            {@const rowItems = section.data.gallery.slice(rowIndex * itemsPerRowDesktop, (rowIndex + 1) * itemsPerRowDesktop)}
            <div class="flex flex-row gap-6">
              {#each Array(3) as _, colIndex}
                {@const colStartIndex = colIndex * 2}
                {@const colItems = rowItems.slice(colStartIndex, colStartIndex + 2)}
                {#if colItems.length > 0}
                  <div class="flex flex-col gap-6 flex-1">
                    {#each colItems as item, itemIdx (item.id || `desktop-${rowIndex}-${colIndex}-${itemIdx}`)}
                      <div class="h-fit outline outline-outline-variant flex flex-col gap-6 p-8 rounded-lg">
                        <p class="rtf-content m-base">{@html item.description}</p>
                        <div class="flex flex-row items-center gap-base">
                          <img src="{item.media}" class="w-[48px] rounded-full" alt="{item.title}"/>
                          <p>{item.title}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              {/each}
            </div>
          {/each}
        </div>

        <div class="hidden md:flex lg:hidden flex-col gap-6">
          {#each Array(Math.ceil(section.data.gallery.length / itemsPerRowTablet)) as _, rowIndex}
            {@const rowItems = section.data.gallery.slice(rowIndex * itemsPerRowTablet, (rowIndex + 1) * itemsPerRowTablet)}
            <div class="flex flex-row gap-6">
              {#each Array(2) as _, colIndex}
                {@const colStartIndex = colIndex * 2}
                {@const colItems = rowItems.slice(colStartIndex, colStartIndex + 2)}
                {#if colItems.length > 0}
                  <div class="flex flex-col gap-6 flex-1">
                    {#each colItems as item, itemIdx (item.id || `tablet-${rowIndex}-${colIndex}-${itemIdx}`)}
                       <div class="h-fit outline outline-outline-variant flex flex-col gap-6 p-8 rounded-lg">
                        <p class="rtf-content m-base">{@html item.description}</p>
                        <div class="flex flex-row items-center gap-base">
                          <img src="{item.media}" class="w-[48px] rounded-full" alt="{item.title}"/>
                          <p>{item.title}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              {/each}
            </div>
          {/each}
        </div>

        <div class="flex md:hidden flex-col gap-6">
          {#each section.data.gallery as item, i (item.id || `mobile-${i}`)}
            <div class="h-fit outline outline-outline-variant flex flex-col gap-6 p-8 rounded-lg">
              <p class="rtf-content m-base">{@html item.description}</p>
              <div class="flex flex-row items-center gap-base">
                <img src="{item.media}" class="w-[48px] rounded-full" alt="{item.title}"/>
                <p>{item.title}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div> -->