<script lang="ts">
  import { browser } from "$app/environment";
  import { Image } from "@southneuhof/landing-sveltekit-framework/client";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import heroBannerSchema from "@southneuhof/landing-section-schema/sections/hero-banner";
  import type { LandingSectionForSchema } from "@southneuhof/landing-sveltekit-framework/types";

  type Section = LandingSectionForSchema<typeof heroBannerSchema>;
  const { section }: { section: Section } = $props();

  let activeBannerIndex = $state(0);
  let rotationInterval: ReturnType<typeof setInterval> | undefined;

  const preloadIndexes = $derived([
    (activeBannerIndex - 1 + section.data.banner.length) %
      section.data.banner.length,
    activeBannerIndex,
    (activeBannerIndex + 1) % section.data.banner.length,
  ]);

  const initialNavbarTextColor = "var(--colors-surface)";

  onMount(() => {
    if (browser) {
      document.documentElement.style.setProperty(
        "--initial-text-color",
        initialNavbarTextColor,
      );
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "block",
      );
    }

    if (section.data.banner.length > 1) {
      rotationInterval = setInterval(() => {
        activeBannerIndex =
          (activeBannerIndex + 1) % section.data.banner.length;
      }, 10000);
    }
  });

  onDestroy(() => {
    if (rotationInterval) clearInterval(rotationInterval);

    if (browser) {
      document.documentElement.style.removeProperty("--initial-text-color");
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "none",
      );
    }
  });
</script>

<div class="h-screen flex items-end bg-black/80 text-white w-full relative">
  {#each section.data.banner as banner, i}
    {#if preloadIndexes.includes(i) && banner?.media}
      {#if !banner?.media_type || banner?.media_type === "image"}
        {#if i === activeBannerIndex}
          <Image
            src={banner.media}
            alt="banner"
            priority={true}
            class="w-full h-full object-center object-cover absolute"
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
    class="w-full h-full absolute bottom-0 left-0 z-[1]"
    style="background: linear-gradient(to top right, rgba(0, 0, 0, 0.36) 0%, rgba(0, 0, 0, 0.0) 30%);"
  ></div>

  <div class="w-full h-full absolute bottom-0 left-0 z-10 p-4 sm:p-8 flex items-end">
    <div class="relative w-full h-full z-[1]">
      {#each section.data.banner as banner, i (i)}
        <div
          class="absolute pr-4 pt-4 bottom-0 left-0 max-w-[100ch] flex flex-col gap-4 transition-opacity duration-500 {activeBannerIndex ===
          i
            ? 'opacity-100 z-10'
            : 'opacity-0 pointer-events-none z-0'}"
          style="
            transform: translateZ(0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          "
        >
          <div
            class="flex flex-col gap-4 text-left text-shadow-outline-variant"
            style="
              transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
              transform: translateZ(0);
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
              filter: {activeBannerIndex === i ? 'none' : 'blur(8px)'};
            "
          >
            {#if section.meta.logo}
              <img
                src={section.meta.logo}
                class="max-w-[72px]"
                alt={banner.subtitle}
              />
            {/if}
            {#if banner?.subtitle}<p class="text-lg lg:text-xl">{banner.subtitle}</p>{/if}
            {#if banner?.title}
              <h1 class="text-4xl lg:text-5xl 2xl:text-6xl font-bold">
                {banner.title}
              </h1>
            {/if}
            {#if banner?.description}
              <div class="rtf-content mt-4 text-sm">
                {@html banner.description}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
