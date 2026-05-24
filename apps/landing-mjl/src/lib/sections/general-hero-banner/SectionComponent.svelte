<script lang="ts">
  import { browser } from "$app/environment";
  import Button from "$lib/app/components/ui/Button.svelte";
  import { onDestroy, onMount } from "svelte";
	import { blur, fade, fly } from "svelte/transition";

  const {section} = $props()

  let activeBannerIndex = $state(0)
  
  // Preload adjacent images
  const preloadIndexes = $derived([
    (activeBannerIndex - 1 + section.data.banner.length) % section.data.banner.length,
    activeBannerIndex,
    (activeBannerIndex + 1) % section.data.banner.length
  ]);

  let initialNavbarTextColor = 'var(--colors-surface)';

  onMount(() => {
    if (browser) {
      document.documentElement.style.setProperty('--initial-text-color', initialNavbarTextColor);
      document.documentElement.style.setProperty('--navbar-overlay-display', 'block');
    }
  });

  onDestroy(() => {
    if (browser) {
      document.documentElement.style.removeProperty('--initial-text-color');
      document.documentElement.style.setProperty('--navbar-overlay-display', 'none');
    }
  });

  setInterval(() => {
    activeBannerIndex = (activeBannerIndex + 1) % section.data.banner.length
  }, 10000)

  let contactForm = $state<boolean | null>(null)

  $effect(() => {
    if (!browser) return
    setTimeout(() => {
      contactForm = !!document.getElementById('contact-form') || section.meta.has_contact_form
    }, (100));
  })
</script>

<div class="h-screen flex items-end bg-black/80 text-white w-full relative">
  <!-- Preload adjacent images -->
  {#each section.data.banner as banner, i}
    {#if preloadIndexes.includes(i) && banner?.media}
      {#if (!banner?.media_type || banner?.media_type === 'image')}
        {#if i === activeBannerIndex}
          <img 
            transition:fade={{duration: 250}} 
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
      {:else if banner?.media_type === 'video' && i === activeBannerIndex}
        <video 
          transition:fade={{duration: 250}} 
          autoplay 
          muted 
          loop 
          playsinline 
          class="w-full h-full absolute object-cover object-center"
        >
          <source src={banner.media} type="video/mp4"/>
        </video>
      {/if}
    {/if}
  {/each}
  <!-- <div class="w-full h-full absolute z-[1]" style="background-image: linear-gradient(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.16));"></div>
  <div class="w-full h-full absolute z-[1]" style="background-image: linear-gradient(to top, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0) 100%);"></div> -->
  <div class="w-full h-full absolute bottom-0 left-0 z-[1]" style="background: linear-gradient(to top right, rgba(0, 0, 0, 0.36) 0%, rgba(0, 0, 0, 0.0) 30%);"></div>
  <div class="w-full h-full absolute bottom-0 left-0 z-10 p-8">
    <div class="absolute bottom-8 right-8 hidden lg:flex">
      {@render contactButton()}
    </div>
    {#each section.data.banner as banner, i (i)}
      <div 
        class="absolute pr-4 pt-4 bottom-4 left-4 sm:bottom-8 sm:left-8 max-w-[90ch] flex flex-col gap-4"
      >
        <div class="flex flex-col gap-4 text-left transition-all duration-500 text-shadow-outline-variant {activeBannerIndex === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
          style="
            transition-property: opacity, filter;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: {activeBannerIndex === i ? '500ms' : '250ms'};
            transition-delay: {activeBannerIndex === i ? '150ms' : '0ms'};
            filter: {activeBannerIndex === i ? 'none' : 'blur(8px)'};
            will-change: opacity, filter;
          "
        >
          {#if section.meta.logo}<img src="{section.meta.logo}" class="max-w-[72px]" alt="{banner.subtitle}"/>{/if}
          {#if banner?.subtitle}<p class="text-lg md:text-xl">{banner.subtitle}</p>{/if}
          {#if banner?.title}<h1 class="text-4xl md:text-5xl 2xl:text-6xl font-bold">{banner.title}</h1>{/if}
          {#if banner?.description}<div class="rtf-content mt-4 text-sm">{@html banner.description}</div>{/if}
        </div>
        <div class="flex lg:hidden">
          {@render contactButton()}
        </div>
      </div>
    {/each}
  </div>
</div>

{#snippet contactButton()}
  {#if contactForm}
    <Button
      class="flex flex-row items-center gap-2 max-w-fit"
      onclick={() => {
        const el = document.getElementById('contact-form');
        if (el) {
          const yOffset = -88;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }}
      >
      <span>Contact Us</span>
      <i class="ri-customer-service-line"></i>
    </Button>
  {/if}
{/snippet}