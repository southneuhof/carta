<script lang="ts">
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";

  const {section} = $props()
</script>

<div class="flex items-center justify-center">
  <div class="w-full max-w-screen-xl px-6 lg:px-12 py-6 lg:py-12 flex flex-col gap-lg">
    <SectionHeader header={section.data.content}/>
    <div class="flex flex-col md:grid md:grid-cols-3 lg:grid-cols-4 outline outline-outline-variant min-h-[300px] md:h-[450px] rounded-sm">
      <div class="embed-preview {section.data.childSections.length > 0 ? 'md:col-span-2 lg:col-span-3' : 'col-span-full'}">
        <div class="h-full w-full">
          {@html section.data.embed}
        </div>
      </div>
      {#if section.data.childSections.length > 0}
        <div class="w-full md:w-auto md:col-span-1 border-t md:border-t-0 md:border-l border-outline-variant flex flex-col gap-lg md:max-h-full md:overflow-y-scroll">
          <div class="flex flex-row md:flex-col gap-base overflow-x-auto max-w-full py-4">
            {#each section.data.childSections as childSection}
              <div class="flex flex-col gap-x-lg gap-y-base">
                <div class="flex flex-row items-center justify-center gap-sm pl-4 sticky left-0 ">
                  <p class="font-semibold whitespace-nowrap min-w-max">{childSection.name}</p>
                  <div class="h-[1px] flex-grow w-full bg-outline-variant"></div>
                </div>
                <div class="flex flex-row md:flex-col gap-sm gap-x-lg whitespace-nowrap min-w-max px-4">
                  {#each childSection.gallery as galleryItem}
                    <div class="inline-flex flex-row items-center gap-sm flex-shrink-0 md:w-full md:flex">
                      <img src={galleryItem.media} alt={galleryItem.title} class="w-16 h-16 aspect-square object-cover flex-shrink-0"/>
                      <p class="text-sm">{galleryItem.title}</p>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .embed-preview {
    position: relative;
    width: 100%;
    min-height: 300px;
    height: 300px;
  }
  
  @media (min-width: 768px) {
    .embed-preview {
      height: 100%;
      min-height: auto;
    }
  }

  .embed-preview :global(iframe) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px; /* Note: radius might be clipped by parent's overflow:hidden */
  }
</style>