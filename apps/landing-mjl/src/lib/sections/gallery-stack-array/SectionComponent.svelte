<script lang="ts">
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import galleryStackArraySchema from "@client/section-schema/sections/gallery-stack-array";
  import type { LandingSectionForSchema } from "@southneuhof/landing-sveltekit-framework/types";

  type Section = LandingSectionForSchema<typeof galleryStackArraySchema>
  type GalleryStackCard = Section['data']['sectionGroup'][number] & {
    content?: Record<string, any> | null;
    gallery?: Record<string, any>[];
  }

  const { section }: { section: Section } = $props()

  const header = $derived(section.data.content)
  const cards = $derived((section.data.sectionGroup ?? []) as GalleryStackCard[])
</script>

<div class="flex w-full items-center justify-center">
  <div class="flex w-full max-w-screen-2xl flex-col gap-8 px-6 py-8 md:gap-10 lg:px-12 lg:py-14">
    {#if header}
      <SectionHeader header={header} defaultAlign="center" titleSize="3xl" />
    {/if}

    {#if cards.length}
      <div class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {#each cards as card (card.id || card.name)}
          {@const content = card.content}
          {@const gallery = card.gallery ?? []}

          <article class="flex min-w-0 flex-col gap-6 rounded-2xl bg-secondary-container px-5 py-8 md:px-6">
            <div class="flex min-h-[156px] flex-col items-center justify-start gap-4 text-center">
              {#if content?.media}
                <img src={content.media} alt={content.title || ''} class="h-16 w-16 object-contain" />
              {/if}

              {#if content?.title || content?.subtitle}
                <div class="flex flex-col gap-2">
                  {#if content.title}
                    <h3 class="text-xl font-bold leading-tight text-on-surface md:text-2xl">{content.title}</h3>
                  {/if}
                  {#if content.subtitle}
                    <p class="text-base leading-snug text-outline md:text-lg">{content.subtitle}</p>
                  {/if}
                </div>
              {/if}
            </div>

            {#if gallery.length}
              <div class="flex flex-col gap-4">
                {#each gallery as item (item.id || item.media || item.title)}
                  {#if item.media}
                    <img
                      src={item.media}
                      alt={item.title || item.subtitle || ''}
                      class="aspect-[16/9] w-full rounded-sm object-cover object-center"
                    />
                  {/if}
                {/each}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {:else}
      <p class="py-8 text-center text-outline">No gallery items available.</p>
    {/if}
  </div>
</div>
