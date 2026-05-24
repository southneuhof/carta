<script lang="ts">
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import * as Carousel from "$lib/app/components/ui/carousel";
  import ImagePreview from "$lib/app/components/ui/ImagePreview.svelte";
  import Tabs from "$lib/app/components/ui/tabs/Tabs.svelte";
  import Panorama from "$lib/app/components/util/Panorama.svelte";
  import { m } from "$lib/paraglide/messages";
  import PanoramaView from "./_layouts/PanoramaView.svelte";

  const {section} = $props()

  let activeProductTypeIndex = $state(0)
  let activeProductTypeDetailMenuIndex = $state(0)
</script>

<div class="flex items-center justify-center">
  <!-- {JSON.stringify(section.data)} -->
  <div class="w-full max-w-screen-xl py-6 lg:py-12 px-6 lg:px-12 grid md:grid-cols-4 grid-cols-1 gap-y-lg md:gap-y-0">
    <div class="col-span-1 flex flex-col gap-lg md:border-r md:border-outline-variant">
      <div class="block md:hidden">
        <SectionHeader header={section.data.content} defaultAlign="center"/>
      </div>
      <div class="pr-4 hidden md:block">
        <SectionHeader header={section.data.content} defaultAlign="left"/>
      </div>
      <div class="flex flex-row md:flex-col gap-base items-center overflow-x-auto md:items-start md:justify-start w-full">
        {#each section.data.productType as productType, index}
          <button class="flex flex-row items-center gap-sm md:w-full" onclick={() => activeProductTypeIndex = index}>
            <p class="text-lg min-w-max {activeProductTypeIndex === index ? 'font-semibold' : 'text-outline'}">{productType.name}</p>
            {#if activeProductTypeIndex === index}
              <div class="w-full h-[1px] hidden md:block bg-outline-variant"></div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
    <div class="col-span-3 flex flex-col gap-lg md:border-r md:border-outline-variant">
      {#if section.data.productType[activeProductTypeIndex].sections.length > 0}
        <div class="w-full max-w-full overflow-auto flex items-center justify-center">
          <Tabs data={section.data.productType[activeProductTypeIndex].sections} bind:activeTabIndex={activeProductTypeDetailMenuIndex}>
            {#snippet tabItem(tabItem: any)}
              <p>{tabItem.name}</p>
            {/snippet}
          </Tabs>
        </div>
      {/if}
      {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex]}
        <div class="flex flex-col gap-lg">
          <div class="flex flex-col gap-base md:px-6">
            {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.title || 
                section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.subtitle ||
                section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.url}
              <div class="flex flex-row items-start justify-between gap-base">
                {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.title || section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.subtitle}
                  <div class="flex flex-col gap-xs">
                    <p class="text-2xl md:text-3xl font-bold">{section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.title}</p>
                    {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.subtitle}
                      <p class="font-medium text-lg">{section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.subtitle}</p>
                    {/if}
                  </div>
                {/if}
                {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.url}
                  <a href={section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.url} target="_blank" class="flex flex-row items-center gap-sm flex-shrink-0">
                    <p class="font-semibold underline">{section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.url_text || m.learn_more()}
                    <i class="ri-arrow-right-line"></i>
                  </a>
                {/if}
              </div>
            {/if}
            {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.description}
              <p class="rtf-content m-base">{@html section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.description}</p>
            {/if}
            {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content.media_type}
              {@const content = section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].content}
              {#if content.media_type === 'image' && content.media}
                <img src={content.media} alt={content.title} class="w-full h-full object-cover object-center"/>
              {:else if content.media_type === 'video' && content.media}
                <video src={content.media} class="w-full h-full object-cover object-center">
                  <track kind="captions" src="" srclang="id" label="Indonesia" />
                </video>
              {:else if content.media_type === 'embed' && content.media}
                <div class="min-h-[300px] md:h-[450px]">
                  <div class="embed-preview">
                    <div class="h-full w-full">
                      {@html content.media}
                    </div>
                  </div>
                </div>
              {:else if content.media_type === 'panorama' && content.collection.length > 0}
                <PanoramaView collection={content.collection}/>
              {/if}
            {/if}
          </div>
          {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].feature.length > 0}
            <div class="flex flex-row gap-xl flex-wrap items-center justify-center px-6">
              {#each section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].feature as feature}
                <div class="flex flex-col gap-sm items-center justify-center">
                  <i class={feature.media}></i>
                  <p class="font-bold text-lg">{feature.title}</p>
                  <p>{feature.subtitle}</p>
                </div>
              {/each}
            </div>
          {/if}
          {#if section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].gallery.length > 0}
            <div class="w-full overflow-hidden">
              <Carousel.Root
                opts={{
                  align: 'start',
                  containScroll: false,
                  dragFree: true
                }}
                class="w-full"
              >
                <Carousel.Content class="py-4 ml-4">
                  {#each section.data.productType[activeProductTypeIndex].sections[activeProductTypeDetailMenuIndex].gallery as gallery, i}
                    <ImagePreview src={gallery.media} title={gallery.title} description={gallery.description} class="">
                      {#snippet trigger()}
                        <Carousel.Item class="flex-shrink-0 overlay before:bg-surface/5 active:before:bg-surface/10 w-[192px] basis-[9/2] rounded-sm aspect-square bg-center ml-2 bg-cover" style="background-image: url('{gallery.media}');">
                          <!-- <img class="object-center object-cover w-full h-full" src={gallery.media} alt={gallery.title} /> -->
                        </Carousel.Item>
                      {/snippet}
                    </ImagePreview>
                  {/each}
                </Carousel.Content>
                <Carousel.Navigation/>
              </Carousel.Root>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

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