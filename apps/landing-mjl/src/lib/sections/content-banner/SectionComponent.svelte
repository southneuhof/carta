<script lang="ts">
  import gallery from "$lib/app/api/models/gallery";
  import Button from "$lib/app/components/ui/Button.svelte";
  import { background } from "@southneuhof/landing-sveltekit-framework/client";

  const { section } = $props();

  const bgImage = section.meta.add_overlay
    ? `linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), linear-gradient(${section.meta.content_align === "vertical" ? "to top" : "to right"}, rgba(17,31,85,0.2) 0%, rgba(17,31,85,0) 100%), url('${section.meta.background_image}')`
    : `linear-gradient(${section.meta.content_align === "vertical" ? "to top" : "to right"}, rgba(17,31,85,0.2) 0%, rgba(17,31,85,0) 50%), url('${section.meta.background_image}')`;

  const contentAlignClassMap = {
    vertical: {
      container: "flex-col items-center justify-between",
      content: {
        container: "flex flex-col items-center justify-center",
        content: "text-center",
      },
      gallery: {
        container:
          "flex-col md:flex-row items-center justify-center md:divide-x md:divide-y-0 divide-y divide-surface/50 md:divide-surface w-full mt-8 md:mt-12",
        content: {
          container: "flex flex-col items-center justify-center text-center",
        },
      },
    },
    horizontal: {
      container:
        "flex-col md:flex-row items-center md:items-center justify-between",
      content: {
        container: "flex flex-col items-center md:items-start justify-start",
        content: "text-start",
      },
      gallery: {
        container:
          "flex-col items-center md:items-stretch justify-center md:divide-y-0 divide-y divide-surface/50 md:divide-surface w-full md:w-auto mt-8 md:mt-0 md:pl-6 lg:pl-12",
        content: {
          container:
            "flex flex-col h-full items-center md:items-end justify-center text-center md:text-right",
        },
      },
    },
  };
</script>

<div
  class="flex flex-col w-full bg-cover bg-center bg-no-repeat {section.meta
    .add_overlay
    ? 'text-surface text-shadow-outline-variant'
    : 'text-on-surface'}"
  style="background-image: {bgImage}"
  use:background={section.meta.background_image}
>
  <div
    class="flex gap-lg px-6 lg:px-12 min-h-[40vh] {section.data.gallery.length >
      0 && section.meta.content_align === 'vertical'
      ? 'pt-6 md:pt-12 lg:pt-16'
      : 'p-6 md:p-12 lg:p-16'} {(contentAlignClassMap as any)[
      section.meta.content_align
    ].container}"
  >
    <div
      class={section.meta.content_align === "vertical" ? "block" : "hidden"}
    ></div>
    <div
      class="flex flex-col gap-lg w-full {section.meta.content_align ===
        'horizontal' && section.data.gallery.length > 0
        ? 'md:w-1/2'
        : 'w-full'} {section.data.gallery.length > 0 ? '' : 'pb-6 md:pb-0'} {(
        contentAlignClassMap as any
      )[section.meta.content_align].content.container}"
    >
      <div class="flex flex-col gap-base">
        <div class="flex flex-col gap-xs">
          <p
            class="text-sm {(contentAlignClassMap as any)[
              section.meta.content_align
            ].content.content}"
          >
            {section.data.content.subtitle}
          </p>
          <p
            class="text-2xl md:text-3xl font-bold {(
              contentAlignClassMap as any
            )[section.meta.content_align].content.content}"
          >
            {section.data.content.title}
          </p>
        </div>
        {#if section.data.content.description}
          <div class="w-full">
            <p
              class="rtf-content m-base max-w-[80ch] {(
                contentAlignClassMap as any
              )[section.meta.content_align].content.content}"
            >
              {@html section.data.content.description}
            </p>
          </div>
        {/if}
      </div>
      {#if section.data.content.url}
        <Button
          data-analytics-cta={section.data.content.url}
          href={section.data.content.url}
          class="max-w-fit"
          >{section.data.content.url_text}
          <i class="ri-arrow-right-line"></i></Button
        >
      {/if}
    </div>
    {#if section.data.gallery.length > 0}
      <div
        class="flex h-full items-center {section.meta.content_align ===
        'horizontal'
          ? 'md:w-1/2'
          : 'w-full'} {(contentAlignClassMap as any)[section.meta.content_align]
          .gallery.container}"
      >
        {#each section.data.gallery as item}
          <div
            class="flex flex-col gap-sm px-6 py-4 md:px-8 w-full md:w-auto lg:px-12 {(
              contentAlignClassMap as any
            )[section.meta.content_align].gallery.content.container}"
          >
            <p class="text-3xl font-bold">{item.title}</p>
            <p class="">{item.subtitle}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
