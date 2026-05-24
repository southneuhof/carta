<script lang="ts">
  import * as Carousel from "$lib/app/components/ui/carousel";
  import Autoplay from "embla-carousel-autoplay";
  import { background } from "@southneuhof/landing-sveltekit-framework/client";
  const { section } = $props();
</script>

<div
  class="w-full {section.meta.add_overlay ? 'text-surface' : 'text-on-surface'}"
>
  <div class="relative min-h-[50vh] md:min-h-[40vh]">
    <Carousel.Root
      opts={{
        containScroll: false,
        dragFree: true,
        loop: section.meta.loop,
        watchDrag: section.data.gallery.length > 1,
      }}
      plugins={[Autoplay({ delay: 5000 })]}
      class="w-full h-full"
    >
      <Carousel.Content class="h-full">
        {#each section.data.gallery as item, i (item.id || `carousel-${i}`)}
          <Carousel.Item class="w-full h-full min-h-[50vh] md:min-h-[40vh]">
            <div
              class="grid grid-cols-1 md:grid-cols-2 min-h-[50vh] md:min-h-[40vh]"
            >
              <div
                class="p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center relative order-2 md:order-1"
              >
                <div
                  class="relative flex flex-col gap-4 sm:gap-6 w-full max-w-3xl mx-auto"
                >
                  <div
                    class="absolute -left-6 md:-left-12 -top-4 md:-top-8 text-6xl md:text-8xl text-gray-200 -z-10"
                  >
                    "
                  </div>
                  <p
                    class="relative z-10 text-xl sm:text-2xl md:text-3xl font-bold rtf-content m-base"
                  >
                    {@html item?.description || ""}
                  </p>
                  <div class="flex flex-col w-full mt-2 sm:mt-4">
                    {#if item.title}<p class="font-medium text-base sm:text-lg">
                        {item.title}
                      </p>{/if}
                    {#if item.subtitle}<p
                        class="text-xs sm:text-sm text-outline"
                      >
                        {item.subtitle}
                      </p>{/if}
                  </div>
                  <div
                    class="absolute -right-6 md:-right-12 -bottom-4 md:-bottom-8 text-6xl md:text-8xl text-gray-200 -z-10 text-right w-full"
                  >
                    "
                  </div>
                </div>
              </div>
              <div class="relative h-48 sm:h-64 md:h-full order-1 md:order-2">
                <div
                  class="absolute inset-0 bg-cover bg-center image-mask"
                  style="background-image: url('{item.media}')"
                  use:background={item.media}
                ></div>
              </div>
            </div>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>
  </div>
</div>

<style>
  .image-mask {
    mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
  }

  @media (min-width: 768px) {
    .image-mask {
      mask-image: linear-gradient(90deg, transparent 0%, black 70%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 70%);
    }
  }
</style>
