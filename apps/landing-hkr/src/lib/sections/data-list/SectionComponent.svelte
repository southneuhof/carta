<script lang="ts">
  import SearchBar from "$lib/app/components/input/SearchBar.svelte";
  import { Accordion } from "bits-ui";
  import ListView from "./_layouts/ListView.svelte";
  import GalleryView from "./_layouts/GalleryView.svelte";
  import ContentView from "./_layouts/ContentView.svelte";
  import CardView from "./_layouts/CardView.svelte";
  import MediaView from "./_layouts/MediaView.svelte";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import { widthPresetClassMap } from "$lib/utils/uicommon";

  const {section} = $props()

  let searchQuery = $state('')

  const allItemValues = section.data.childSections.map((cs: any) => cs.id || cs.name);
  let openItems = $state(section.meta.closed_on_initial ? [] : allItemValues);

  let filteredChildSections = $derived(getFilteredChildSections());

  function getFilteredChildSections() {
    if (!searchQuery) {
      return section.data.childSections.map((cs: any) => ({ ...cs, filteredContents: cs.contents }));
    }

    const query = searchQuery.toLowerCase();
    return section.data.childSections
      .map((childSection: any) => {
        const filteredContents = childSection.contents.filter((content: any) => 
          content.title?.toLowerCase().includes(query)
        );
        return { ...childSection, filteredContents };
      })
      .filter((childSection: any) => childSection.filteredContents.length > 0);
  }

  $effect(() => {
    if (!searchQuery) {
      openItems = section.meta.closed_on_initial ? [] : allItemValues;
      return;
    }
    openItems = filteredChildSections.map((cs: any) => cs.id || cs.name);
  });

  // const maxWidthMap: any = {
  //   list: 'max-w-screen-lg',
  //   gallery: 'max-w-[1121px]',
  //   content: 'max-w-screen-xl',
  //   card: 'max-w-screen-lg',
  //   media: 'max-w-screen-xl',
  // }
</script>

<div class="w-full flex items-center justify-center">
  <Accordion.Root type="multiple" bind:value={openItems} class="w-full {section.meta.width_preset ? widthPresetClassMap[section.meta.width_preset] : widthPresetClassMap['xl']} flex flex-col gap-lg py-6 lg:py-12 px-6 lg:px-12">
    {#if section.data.content}<SectionHeader header={section.data.content}/>{/if}
    <div class="flex flex-col {section.meta.title ? 'sm:gap-lg gap-sm' : 'gap-base'}">
      {#if section.meta.searchable || section.meta.title}
        <div class="flex flex-col gap-base sm:flex-row items-center justify-between">
          {#if section.meta.title}<p class="text-xl font-bold whitespace-nowrap">{section.meta.title}</p>{/if}
          {#if section.meta.searchable}
            <div class="{section.meta.title ? 'sm:max-w-[284px] w-full' : 'w-full'}">
              <SearchBar bind:value={searchQuery}/>
            </div>
          {/if}
        </div>
      {/if}

      {#if section.data.childSections.length === 0}
        <div class="text-center text-gray-500 py-10">
          <p>No data available.</p>
        </div>
      {:else if filteredChildSections.length === 0 && searchQuery}
        <div class="text-center text-gray-500 py-10">
          <p>Tidak ada hasil untuk "{searchQuery}".</p>
        </div>
      {:else}
        {#each filteredChildSections as childSection (childSection.id || childSection.name)}
          <Accordion.Item value={childSection.id || childSection.name} class="flex flex-col">
            {#if section.data.childSections?.length > 1 || section.meta.collapsible}
              <Accordion.Header>
                <Accordion.Trigger disabled={!section.meta.collapsible} class="w-full flex flex-row items-center justify-center gap-sm">
                  <p class="font-bold min-w-max">{childSection.name}</p>
                  <div class="w-full h-[1px] bg-outline"></div>
                  {#if section.meta.collapsible}
                    <div class="data-[state=open]:rotate-180 transition-all">
                      <i class="ri-arrow-down-s-line text-outline"></i>
                    </div>
                  {/if}
                </Accordion.Trigger>
              </Accordion.Header>
            {/if}
            <Accordion.Content class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              {#if section.meta.type === 'list' || !section.meta.type}
                <div class="h-4 w-full"></div>
                <div class="flex flex-col gap-sm">
                  {#each childSection.filteredContents as content}
                    <ListView {content}/>
                  {/each}
                </div>
              {:else if section.meta.type === 'gallery'}
                <div class="h-4 w-full"></div>
                <div class="flex flex-row items-center justify-center gap-6 flex-wrap">
                  {#each childSection.filteredContents as content}
                    <GalleryView {content}/>
                  {/each}
                </div>
              {:else if section.meta.type === 'media'}
                <div class="h-4 w-full"></div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
                  {#each childSection.filteredContents as content}
                    <MediaView {content} aspectRatio={section.meta.media_aspect_ratio} hideOutline={section.meta.hide_outline}/>
                  {/each}
                </div>
              {:else if section.meta.type === 'content'}
                <div class="flex flex-row gap-8 flex-wrap">
                  <ContentView childSection={childSection.filteredContents}/>
                </div>
              {:else if section.meta.type === 'card'}
                <div class="flex flex-row gap-8 flex-wrap">
                  <CardView childSection={childSection.filteredContents}/>
                </div>
              {/if}
            </Accordion.Content>
          </Accordion.Item>
        {/each}
      {/if}
    </div>
  </Accordion.Root>
</div>