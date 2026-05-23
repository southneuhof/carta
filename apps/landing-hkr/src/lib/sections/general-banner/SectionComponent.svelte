<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, onDestroy } from "svelte";
  import { background } from "@southneuhof/landing-sveltekit-framework/client";

  const { section } = $props();

  const isEmptyDescription =
    !section.data.contents[0].description ||
    section.data.contents[0].description.trim() === "";
  const bgImage = section.meta.add_overlay
    ? `linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), url('${section.data.contents[0].media}')`
    : `url('${section.data.contents[0].media}')`;

  let initialNavbarTextColor = section.meta.add_overlay
    ? "var(--colors-surface)"
    : "var(--colors-on-surface)"; // Or your specific color values

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
  });

  onDestroy(() => {
    if (browser) {
      // Optional: Reset the variable when the component is destroyed if needed
      document.documentElement.style.removeProperty("--initial-text-color");
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "none",
      );
    }
  });
</script>

<div
  class="flex flex-col {section.meta.add_overlay
    ? 'text-surface text-shadow-outline-variant'
    : 'text-on-surface'}"
>
  <div
    class="h-fit min-h-[260px] lg:h-[45vh] lg:min-h-[350px] flex items-center justify-center bg-cover bg-center border-b border-outline-variant"
    style="background-image: {bgImage}"
    use:background={section.data.contents[0].media}
  >
    <div
      class="px-6 mt-[48px] lg:mt-0 lg:px-12 py-12 lg:py-16 flex flex-col items-start text-left gap-4 max-w-screen-xl w-full"
    >
      <div class="max-w-[720px] flex flex-col gap-sm">
        <p class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          {section.data.contents[0].title}
        </p>
        {#if !isEmptyDescription}
          <div class="text-base md:text-lg opacity-90 rtf-content mt-2 leading-relaxed">
            {@html section.data.contents[0].description}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
