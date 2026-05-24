<script lang="ts">
  import SearchBar from "$lib/app/components/input/SearchBar.svelte";
  import SelectInput from "$lib/app/components/input/SelectInput.svelte";
  import Tabs from "$lib/app/components/ui/tabs/Tabs.svelte";
  import { getLocale } from "$lib/paraglide/runtime";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";

  const {section} = $props()

  // State for search and filters
  let searchQuery = $state('')
  let categoryActiveTabIndex = $state(0)
  let locationActiveCode = $state('')

  // Get initial values from URL query params
  onMount(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Set initial category from URL
    const categoryCode = params.get('category_code');
    if (categoryCode) {
      const allCategories = [{code: '', name_id: 'Semua Kategori'}, ...(section.data.filter.category || [])];
      const categoryIndex = allCategories.findIndex(cat => cat.code === categoryCode);
      if (categoryIndex !== -1) {
        categoryActiveTabIndex = categoryIndex;
      }
    }
    
    // Set initial location from URL
    const locationCode = params.get('location_code');
    if (locationCode) {
      locationActiveCode = locationCode;
    }
  });
  
  // Get the currently selected category code
  const selectedCategoryCode = $derived.by(() => {
    const allCategories = [{code: '', name_id: 'Semua Kategori'}, ...(section.data.filter.category || [])]
    return allCategories[categoryActiveTabIndex]?.code || ''
  })

  // Filter projects based on search query, category, and location
  const filteredProjects = $derived.by(() => {
    if (!section.data.projects) return [];
    
    return section.data.projects.filter((project: any) => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.collection?.some((item: any) => 
          item?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      // Filter by category (if any category is selected)
      const matchesCategory = !selectedCategoryCode || 
        project.meta?.category === selectedCategoryCode
      
      // Filter by location (if any location is selected)
      const matchesLocation = !locationActiveCode || 
        project.meta?.location === locationActiveCode;
      
      return matchesSearch && matchesCategory && matchesLocation;
    });
  })

  let locale = $derived.by(getLocale)

  const categoryFilterNameMap: Record<string, string> = $derived.by(() => {
    return Object.fromEntries(section.data.filter.category?.map((item: any) => [item.code, locale === 'id' ? item.name_id : item.name_en]) || []);
  })

  const locationFilterNameMap: Record<string, string> = $derived.by(() => {
    return Object.fromEntries(section.data.filter.location?.map((item: any) => [item.code, item.name]) || []);
  })
</script>

<div class="flex items-center justify-center" id="project-list">
  <!-- <a href="#project-list">test</a> -->
  <div class="flex flex-col gap-6 w-full max-w-screen-xl mx-auto px-6 lg:px-12 py-6 lg:py-12">
    <SectionHeader header={section.data.header}/>
    {#if section.meta.enable_filter}
      <div class="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-between">
        <SelectInput 
          data={[{code: '', name: 'Semua Lokasi'}, ...(section.data.filter.location || [])]} 
          bind:value={locationActiveCode} 
          view="name" 
          pick="code" 
          placeholder="Semua Lokasi"
          class="w-full sm:w-[280px]"
        />
        <SearchBar bind:value={searchQuery} placeholder="Cari proyek..." class="min-w-[280px] w-full sm:w-[280px]"/>
      </div>
      <div class="w-full max-w-full overflow-auto flex items-center justify-center">
        <Tabs data={[{code: '', name_id: 'Semua Kategori'}, ...(section.data.filter.category || [])]} bind:activeTabIndex={categoryActiveTabIndex}>
          {#snippet tabItem(item: Record<string, any>)}
            <p>{item.name_id}</p>
          {/snippet}
        </Tabs>
      </div>
    {/if}
    {#if filteredProjects?.length}
      {#if section.meta.style === 'image-card'}
        <div class="flex flex-row flex-wrap items-center justify-center gap-sm">
          {#each filteredProjects as project}
            {@render ProjectItemImageCard(project)}
          {/each}
        </div>
      {:else if section.meta.style === 'content-card'}
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center justify-center">
          {#each filteredProjects as project}
            {@render ProjectItemContentCard(project)}
          {/each}
        </div>
      {/if}
    {:else}
      <p class="text-outline text-center py-6 lg:py-12">Proyek tidak ditemukan</p>
    {/if}
  </div>
</div>

{#snippet ProjectItemImageCard(project: Record<string, any>)}
  <a href={project.url} class="group/projectItem overlay before:bg-surface/5 active:before:bg-surface/10 flex flex-col p-6 items-start justify-end w-[290px] aspect-square bg-center bg-cover text-surface relative overflow-hidden" style="background-image: linear-gradient(rgba(0,0,0,0.24), rgba(0,0,0,0.24)), linear-gradient(to top, rgba(17,31,85,0.2) 0%, rgba(17,31,85,0) 50%), url('{project.media}');">
    <div class="flex flex-col gap-xs z-10 w-full transition-all translate-y-[0px] group-hover/projectItem:translate-y-[-28px]">
      <p class="text-lg font-bold">{project.title}</p>
      <div class="flex flex-row items-center gap-base">
        <div class="flex flex-row items-center gap-xs">
          <i class="ri-building-4-line"></i>
          <p class="text-xs">{categoryFilterNameMap[project.meta?.category]}</p>
        </div>
        <div class="flex flex-row items-center gap-xs">
          <i class="ri-map-pin-line"></i>
          <p class="text-xs">{locationFilterNameMap[project.meta?.location]}</p>
        </div>
      </div>
    </div>
    <div class="absolute bottom-6 left-6 right-6 flex flex-row items-center gap-2 text-sm font-medium opacity-0 group-hover/projectItem:opacity-100 translate-y-[28px] group-hover/projectItem:translate-y-0 transition-all">
      <p>Lihat Selengkapnya</p>
      <i class="ri-arrow-right-up-line"></i>
    </div>
  </a>
{/snippet}

{#snippet ProjectItemContentCard(project: Record<string, any>)}
  <a href={project.url} class="group flex flex-col h-full gap-base overlay before:bg-on-surface/5 active:before:bg-on-surface/10 transition-colors p-3 rounded-sm">
    <div class="w-full aspect-square overflow-hidden rounded-sm">
      <img 
        src="{project.media}" 
        class="w-full h-full object-cover object-center transition-transform duration-300" 
        alt="{project.title}"
      />
    </div>
    <div class="flex flex-col items-center gap-xs">
      <p class="font-semibold text-center flex items-center">{project.title}</p>
      {#if project.meta?.category || project.meta?.location}
        <div class="flex flex-col sm:flex-row items-center gap-xs sm:gap-base">
          {#if project.meta?.category}
            <div class="flex flex-row items-center gap-xs">
              <i class="ri-building-4-line"></i>
              <p class="text-xs whitespace-nowrap">{categoryFilterNameMap[project?.meta.category]}</p>
            </div>
          {/if}
          {#if project.meta?.location}
            <div class="flex flex-row items-center gap-xs">
              <i class="ri-map-pin-line"></i>
              <p class="text-xs whitespace-nowrap">{locationFilterNameMap[project?.meta.location]}</p>
            </div>
          {/if}
        </div>
      {/if}
      {#if project.description}<p class="text-xs text-muted rtf-content m-base">{@html project.description}</p>{/if}
    </div>
  </a>
{/snippet}