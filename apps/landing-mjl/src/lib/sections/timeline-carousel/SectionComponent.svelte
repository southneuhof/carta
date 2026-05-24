<script lang="ts">
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import * as Carousel from "$lib/app/components/ui/carousel";
  import CenterNavigation from "$lib/app/components/ui/carousel/carousel-center-navigation.svelte";

  const {section} = $props()

  const aspectRatioMap: any = {
    '1/1': 'aspect-[1/1]',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]',
  }
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full flex flex-col items-center justify-center gap-8 py-6 lg:py-12">
    <div class="relative w-full">
      <Carousel.Root
        opts={{
          containScroll: false,
          dragFree: true,
          loop: section.meta.loop,
        }}
        class="w-full flex flex-col gap-8"
      >
        {#if section.meta.navigation_position == 'top'}
          {@render carouselNavigation()}
        {/if}
        <div class="relative w-full">
          <Carousel.Content>
            {#each section.data.gallery as item, i (item.id || `carousel-${i}`)}
              {@render carouselItem(item, i)}
            {/each}
          </Carousel.Content>
          {#if section.meta.navigation_position == 'center'}
            <CenterNavigation />
          {/if}
        </div>
        {#if section.meta.navigation_position == 'bottom'}
          {@render carouselNavigation()}
        {/if}
      </Carousel.Root>
    </div>
  </div>
</div>

<!-- {#snippet carouselItem(item: any, index: number)}
  <Carousel.Item 
    class="min-[124rem]:basis-1/3 2xl:basis-1/2 lg:basis-[67%] basis-[85%] p-0 before:bg-white/5 active:before:bg-white/10 relative overflow-hidden {item.url ? 'overlay' : ''} {section.meta.preserve_aspect_ratio ? aspectRatioMap[section.meta.aspect_ratio || '4/3'] : 'h-[80vh]'}"
  >
    <div class="absolute inset-0 flex flex-col items-center">
      <div class="w-full relative h-full">
        <div class="absolute top-1/2 left-0 right-0 h-[1px] bg-outline-variant -translate-y-1/2"></div>
        <div class="w-[12px] aspect-square bg-outline absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full"></div>
        <div class="absolute left-1/2 -translate-x-1/2 w-[90vw] max-w-3xl flex flex-col items-center {index % 2 === 0 ? 'top-[calc(50%-2rem)]' : 'bottom-[calc(50%-2rem)]'}">
          <p class="whitespace-nowrap">{item.subtitle}</p>
          <div class="absolute w-full {index % 2 === 0 ? 'top-full mt-8' : 'bottom-full mb-8'}">
            <div class="outline outline-outline p-6 bg-background gap-2 flex flex-col">
              {#if item.media}
                <img src="{item.media}" alt="{item.title}" class="h-[20%] object-center object-cover"/>
              {/if}
              <p class="text-lg font-bold">{item.title}</p>
              {#if item.description}
                <div class="text-sm text-muted rtf-content">{@html item.description}</div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Carousel.Item>
{/snippet} -->

{#snippet carouselItem(item: any, index: number)}
  <Carousel.Item 
    class="min-[124rem]:basis-1/4 2xl:basis-1/3 lg:basis-1/2 md:basis-[67%] basis-[85%] p-0 before:bg-white/5 active:before:bg-white/10 relative overflow-hidden {item.url ? 'overlay' : ''} {section.meta.preserve_aspect_ratio ? aspectRatioMap[section.meta.aspect_ratio || '4/3'] : 'h-[450px]'}"
  >
    <div class="relative inset-0 flex flex-col items-center">
      <div class="w-full relative h-[1px] mt-[6px]">
        <div class="absolute h-full bg-outline {index === 0 ? 'left-1/2 right-0' : index === section.data.gallery.length - 1 ? 'left-0 right-1/2' : 'left-0 right-0'}"></div>
      </div>
      <div class="w-[12px] aspect-square bg-outline absolute mx-auto rounded-full"></div>
      <div class="flex flex-col gap-base items-center justify-center mt-2 px-2">
        <p>{item.subtitle}</p>
        <div class="flex flex-col items-center justify-center gap-base max-w-[48ch]">
          <img class="rounded-sm object-center object-cover aspect-[18.5/9] w-full" src="{item.media}" alt="{item.title}"/>
          <div class="flex flex-col items-center justify-center gap-xs">
            <p class="text-lg font-bold">{item.title}</p>
            <p class="rtf-content m-base text-center text-sm sm:text-base text-outline">{@html item.description}</p>
          </div>
        </div>
      </div>
    </div>
  </Carousel.Item>
{/snippet}

{#snippet carouselNavigation()}
  {#if section.meta.use_title_as_navigation}
    <Carousel.Navigation>
      {#snippet navigation({scrollPrev, handleClick, scrollNext, currentIndex}: any)}
        <div class="flex items-center justify-center space-x-4">
          {#each section.data.gallery as item, i}
            <button onclick={() => handleClick(i)} class="{currentIndex === i ? 'text-on-surface font-semibold' : 'text-outline'}">{item.title}</button>
          {/each}
        </div>
      {/snippet}
    </Carousel.Navigation>
  {:else}
    <Carousel.Navigation/>
  {/if}
{/snippet}