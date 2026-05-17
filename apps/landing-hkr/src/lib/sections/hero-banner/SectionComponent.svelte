<script lang="ts">
  import { browser } from "$app/environment";
  import { debounce } from "@southneuhof/utilities/object";
  import { onDestroy, onMount } from "svelte";
  import { blur, fade } from "svelte/transition";
  import * as Carousel from "$lib/app/components/ui/carousel";
  import { background } from "@southneuhof/landing-sveltekit-framework/client";

  const { section } = $props();

  let activeBannerIndex = $state(0);
  let activeQuickAccessIndex = $state(0);
  let activeProjectCategoryIndex = $state(0);
  let windowWidth = $state(0);
  let isMobile = $state(false);

  // Preload adjacent images
  const preloadIndexes = $derived([
    (activeBannerIndex - 1 + section.data.banner.length) %
      section.data.banner.length,
    activeBannerIndex,
    (activeBannerIndex + 1) % section.data.banner.length,
  ]);

  let initialNavbarTextColor = "var(--colors-surface)";

  const checkMobile = () => {
    if (browser) {
      windowWidth = window.innerWidth;
      isMobile = windowWidth < 768; // md breakpoint
    }
  };

  onMount(() => {
    if (browser) {
      checkMobile();
      window.addEventListener("resize", checkMobile);
      document.documentElement.style.setProperty(
        "--initial-text-color",
        initialNavbarTextColor,
      );
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "block",
      );
    }
    return () => {
      if (browser) {
        window.removeEventListener("resize", checkMobile);
      }
    };
  });

  onDestroy(() => {
    if (browser) {
      document.documentElement.style.removeProperty("--initial-text-color");
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "none",
      );
    }
  });

  const nextQuickAccess = () => {
    activeQuickAccessIndex =
      (activeQuickAccessIndex + 1) % section.data.quickAccess.length;
  };

  const prevQuickAccess = () => {
    activeQuickAccessIndex =
      (activeQuickAccessIndex - 1 + section.data.quickAccess.length) %
      section.data.quickAccess.length;
  };

  const debouncedOnCategoryHover = debounce((index: number) => {
    activeProjectCategoryIndex = index;
  }, 100);

  setInterval(() => {
    activeBannerIndex = (activeBannerIndex + 1) % section.data.banner.length;
  }, 10000);
</script>

<svelte:window bind:innerWidth={windowWidth} />

<!-- Mobile Layout (hidden on md and up) -->
<div
  class="lg:hidden h-screen flex flex-col overflow-hidden bg-black/80 text-white"
>
  <!-- Combined Banner and Quick Access Section (80% height) -->
  <div class="h-4/5 relative">
    {#each section.data.banner as banner, i}
      {#if preloadIndexes.includes(i) && banner?.media}
        {#if !banner?.media_type || banner?.media_type === "image"}
          {#if i === activeBannerIndex}
            <img
              transition:fade={{ duration: 500 }}
              class="w-full h-full object-cover absolute"
              src={banner.media}
              alt="banner"
              loading="eager"
            />
          {:else}
            <img
              class="hidden"
              src={banner.media}
              alt=""
              loading="eager"
              aria-hidden="true"
            />
          {/if}
        {:else if banner?.media_type === "video" && i === activeBannerIndex}
          <video
            transition:fade={{ duration: 250 }}
            autoplay
            muted
            loop
            playsinline
            class="w-full h-full absolute object-cover"
          >
            <source src={banner.media} type="video/mp4" />
          </video>
        {/if}
      {/if}
    {/each}
    <div
      class="absolute inset-0 z-[1]"
      style="background-image: linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), linear-gradient(to top, rgba(0,0,0,0.33) 0%, rgba(0,0,0,0) 50%);"
    ></div>

    <!-- Banner Content -->
    <div
      class="relative w-full h-full flex flex-col items-center justify-center z-[10] px-4"
    >
      {#each section.data.banner as banner, i (i)}
        <div
          class="absolute px-6 inset-0 flex flex-col gap-2 items-center justify-center max-w-[90ch] mx-auto transition-all duration-500 {activeBannerIndex ===
          i
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'}"
          style="
            transition-property: opacity, filter;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: {activeBannerIndex === i ? '500ms' : '250ms'};
            filter: {activeBannerIndex === i ? 'none' : 'blur(8px)'};
            will-change: opacity, filter;
          "
        >
          <div class="flex flex-col gap-1 text-center">
            {#if banner?.subtitle}<p class="text-sm sm:text-base">
                {banner.subtitle}
              </p>{/if}
            {#if banner?.title}<p class="text-3xl sm:text-4xl font-bold">
                {banner.title}
              </p>{/if}
          </div>
          {#if banner?.description}
            <p class="text-xs sm:text-sm text-center mt-2 max-w-prose">
              {@html banner.description}
            </p>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Quick Access Overlay -->
    <div class="absolute bottom-0 left-0 right-0 z-[10] flex items-center">
      <Carousel.Root
        opts={{
          containScroll: false,
          align: "center",
          loop: true,
          dragFree: true,
        }}
        class="w-full"
      >
        <Carousel.Content class="py-2">
          {#each section.data.quickAccess as quickAccess, i}
            <Carousel.Item class="basis-[80%] md:basis-[50%] pl-0">
              <a
                href={quickAccess.url}
                class="w-full p-4 outline outline-outline bg-surface/90 backdrop-blur-sm text-on-surface flex items-center gap-3 transition-all duration-300 h-full"
              >
                <i class="{quickAccess.media} text-lg flex-shrink-0"></i>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-sm truncate">{quickAccess.title}</p>
                  <p class="text-xs text-outline">{quickAccess.description}</p>
                </div>
              </a>
            </Carousel.Item>
          {/each}
        </Carousel.Content>
      </Carousel.Root>
    </div>
  </div>

  <!-- Project Categories Section (20% height) -->
  <div class="h-1/5">
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
        {#each section.data.projectCategory as category, index}
          <Carousel.Item class="basis-[80%] md:basis-[50%] pl-0 h-full">
            <button
              class="h-full w-full flex flex-col justify-end p-3 relative overflow-hidden transition-all duration-300"
              style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url({category.media}); background-size: cover; background-position: center;"
              use:background={category.media}
              onclick={(e) => {
                e.stopPropagation();
                activeProjectCategoryIndex = index;
              }}
              onmouseenter={() => debouncedOnCategoryHover(index)}
              tabindex="0"
            >
              <div class="text-center w-full">
                <p class="font-bold text-sm text-center">{category.title}</p>
                {#if category.description}
                  <p class="text-xs mt-1 text-center">{category.description}</p>
                {/if}
              </div>
            </button>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>
  </div>
</div>

<!-- Desktop Layout (hidden on mobile) -->
<div class="hidden lg:flex flex-col items-center justify-center">
  <div
    class="min-h-[80vh] h-[80vh] flex flex-col items-center justify-center bg-black/80 text-white w-full relative"
  >
    <!-- Preload adjacent images -->
    {#each section.data.banner as banner, i}
      {#if preloadIndexes.includes(i) && banner?.media}
        {#if !banner?.media_type || banner?.media_type === "image"}
          {#if i === activeBannerIndex}
            <img
              transition:fade={{ duration: 500 }}
              class="w-full h-full object-center object-cover absolute"
              src={banner.media}
              alt="banner"
              loading="eager"
            />
          {:else}
            <img
              class="hidden"
              src={banner.media}
              alt=""
              loading="eager"
              aria-hidden="true"
            />
          {/if}
        {:else if banner?.media_type === "video" && i === activeBannerIndex}
          <video
            transition:fade={{ duration: 250 }}
            autoplay
            muted
            loop
            playsinline
            class="w-full h-full absolute object-cover object-center"
          >
            <source src={banner.media} type="video/mp4" />
          </video>
        {/if}
      {/if}
    {/each}
    <div
      class="w-full h-full absolute z-[1]"
      style="background-image: linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), linear-gradient(to top, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 50%);"
    ></div>
    <div class="relative w-full h-full">
      {#each section.data.banner as banner, i (i)}
        <div
          class="absolute inset-0 flex flex-col gap-base items-center justify-center z-[10] max-w-[90ch] mx-auto transition-all duration-500 text-shadow-outline-variant {activeBannerIndex ===
          i
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'}"
          style="
            transition-property: opacity, filter;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: {activeBannerIndex === i ? '500ms' : '250ms'};
            transition-delay: {activeBannerIndex === i ? '150ms' : '0ms'};
            filter: {activeBannerIndex === i ? 'none' : 'blur(8px)'};
            will-change: opacity, filter;
          "
        >
          <div class="flex flex-col gap-xs">
            {#if banner?.subtitle}<p class="text-center">
                {banner.subtitle}
              </p>{/if}
            {#if banner?.title}<p
                class="text-center text-4xl md:text-5xl 2xl:text-6xl font-bold"
              >
                {banner.title}
              </p>{/if}
          </div>
          {#if banner?.description}<p
              class="rtf-content m-base text-center text-sm"
            >
              {@html banner.description}
            </p>{/if}
        </div>
      {/each}
    </div>
    <div
      class="md:px-6 px-12 py-6 lg:py-12 flex flex-row items-center gap-base z-[10]"
    >
      {#each section.data.quickAccess as quickAccess}
        <a
          href={quickAccess.url}
          class="w-[384px] p-6 outline outline-outline bg-surface text-on-surface flex flex-row items-start gap-base overlay before:bg-on-surface/5 active:before:bg-on-surface/10"
        >
          <i class="{quickAccess.media} text-lg"></i>
          <div class="flex flex-col gap-sm">
            <p class="font-bold">{quickAccess.title}</p>
            <p class="text-sm text-outline">{quickAccess.description}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>
  <div class="h-[20vh] w-full flex flex-row items-center gap-[0px]">
    {#each section.data.projectCategory as projectCategory, index}
      <a
        href="{projectCategory.url}?category_code={projectCategory.url_text}#project-list"
        class="flex bg-center overlay before:bg-surface/5 active:before:bg-surface/10 relative bg-cover flex-col text-surface h-full items-start justify-end gap-xs text-shadow-outline-variant {activeProjectCategoryIndex ===
        index
          ? 'px-6 py-4'
          : 'px-1 py-1'} transition-all"
        style="
          background-image: linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), linear-gradient(to top, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 100%), url({projectCategory.media});
          width: {activeProjectCategoryIndex === index
          ? `${windowWidth * 0.475}px`
          : `${(windowWidth - windowWidth * 0.475) / (section.data.projectCategory?.length - 1)}px`};
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
