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

<div class="h-screen w-full relative overflow-hidden">
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

  <div class="w-full h-full absolute bottom-0 left-0 z-10 p-6 sm:p-10 lg:p-16 flex items-center">
    <div class="relative w-full h-full z-[1]">
      {#each section.data.banner as banner, i (i)}
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 max-w-[640px] flex flex-col gap-4 lg:gap-5 transition-opacity duration-500 {activeBannerIndex ===
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
            class="flex flex-col gap-4 text-left text-[#1F2937]"
            style="
              transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
              transform: translateZ(0);
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
              filter: {activeBannerIndex === i ? 'none' : 'blur(8px)'};
            "
          >
            {#if banner?.subtitle}
              <p class="text-base sm:text-lg lg:text-xl">{banner.subtitle}</p>
            {/if}
            {#if banner?.title}
              <h1 class="text-4xl lg:text-6xl font-bold leading-tight">
                {banner.title}
              </h1>
            {/if}
            {#if banner?.description}
              <div class="rtf-content mt-2 text-sm sm:text-base max-w-[56ch]">
                {@html banner.description}
              </div>
            {/if}
            {#if banner?.cta || banner?.url}
              <div class="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                {#if banner?.cta}
                  <a
                    href={banner.cta}
                    class="inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold text-lg bg-[#EF4444] text-white"
                  >
                    {banner.cta_text || "Hubungi Kami"}
                  </a>
                {/if}
                {#if banner?.url}
                  <a
                    href={banner.url}
                    class="inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold text-lg bg-[#3B82F6] text-white"
                  >
                    {banner.url_text || "Produk"}
                  </a>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
