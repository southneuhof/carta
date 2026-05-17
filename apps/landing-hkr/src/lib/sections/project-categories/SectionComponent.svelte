<script lang="ts">
  import { debounce } from "@southneuhof/utilities/object";
  import { blur } from "svelte/transition";
  import * as Carousel from "$lib/app/components/ui/carousel";
  import { page } from "$app/state";
  import { background } from "@southneuhof/landing-sveltekit-framework/client";

  const { section } = $props();

  let activeProjectCategoryIndex = $state(0);
  let windowWidth = $state(0);

  const debouncedOnCategoryHover = debounce((index: number) => {
    activeProjectCategoryIndex = index;
  }, 100);
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="lg:hidden flex flex-col overflow-hidden bg-black/80 text-white">
  <div class="h-[20vh]">
    <Carousel.Root
      opts={{
        containScroll: false,
        align: "center",
        loop: true,
        dragFree: true,
      }}
      class="w-full h-full"
    >
      <Carousel.Content class="h-full">
        {#each section.data.gallery as projectCategory, index}
          <Carousel.Item class="basis-[80%] md:basis-[50%] pl-0 h-full">
            <button
              class="h-full w-full flex flex-col justify-end p-3 relative overflow-hidden transition-all duration-300"
              style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url({projectCategory.media}); background-size: cover; background-position: center;"
              use:background={projectCategory.media}
              onclick={(e) => {
                e.stopPropagation();
                activeProjectCategoryIndex = index;
              }}
              onmouseenter={() => debouncedOnCategoryHover(index)}
              tabindex="0"
            >
              <div class="text-center w-full">
                <p class="font-bold text-sm text-center">
                  {projectCategory.title}
                </p>
                {#if projectCategory.description}
                  <p class="text-xs mt-1 text-center">
                    {projectCategory.description}
                  </p>
                {/if}
              </div>
            </button>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>
  </div>
</div>

<div class="hidden lg:flex flex-col items-center justify-center">
  <div class="h-[20vh] w-full flex flex-row items-center gap-[0px]">
    {#each section.data.gallery as projectCategory, index}
      <a
        href="{page.data
          .projectListMenuPath}?category_code={projectCategory.url_text}#project-list"
        class="flex bg-center overlay before:bg-surface/5 active:before:bg-surface/10 relative bg-cover flex-col text-surface h-full items-start justify-end gap-xs text-shadow-outline-variant {activeProjectCategoryIndex ===
        index
          ? 'px-6 py-4'
          : 'px-1 py-1'} transition-all"
        style="
          background-image: linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), linear-gradient(to top, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 100%), url({projectCategory.media});
          width: {activeProjectCategoryIndex === index
          ? `${windowWidth * 0.475}px`
          : `${(windowWidth - windowWidth * 0.475) / (section.data.gallery?.length - 1)}px`};
        "
        use:background={projectCategory.media}
        onmouseover={() => debouncedOnCategoryHover(index)}
        role="button"
        onfocus={() => {}}
        tabindex={index}
      >
        {#if activeProjectCategoryIndex === index}
          <div
            in:blur={{ duration: 100, delay: 100 }}
            out:blur={{ duration: 100 }}
            class="flex flex-col gap-sm absolute bottom-4 left-6"
          >
            <div class="flex flex-col">
              <p class="font-bold">{projectCategory.title}</p>
              {#if projectCategory.description}<p>
                  {projectCategory.description}
                </p>{/if}
            </div>
            <p class="text-xs">
              Lihat Selengkapnya <i class="ri-arrow-right-up-line"></i>
            </p>
          </div>
        {:else}
          <p
            in:blur={{ duration: 100 }}
            out:blur={{ duration: 100 }}
            class="font-bold bottom-1 left-1"
          >
            {projectCategory.title}
          </p>
        {/if}
      </a>
    {/each}
  </div>
</div>
