<script lang="ts">
  import { getLocale } from "$lib/paraglide/runtime";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";

  const {section} = $props()

  const gridSizeClassMap: any = {
    'sm': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    'md': 'grid-cols-2 lg:grid-cols-3',
    'lg': 'grid-cols-2',
  }
</script>

<div class="flex items-center justify-center" id="project-list">
  <div class="flex flex-col gap-6 w-full max-w-screen-xl mx-auto px-6 lg:px-12 py-6 lg:py-12">
    <SectionHeader header={section.data.header}/>
    {#if section.data.menu?.length}
      <div class="grid {gridSizeClassMap[section.meta.grid_size]} gap-4 lg:gap-6">
        {#each section.data.menu as menu}
          <a href={menu.url} class="group/projectItem overlay rounded-lg w-full before:bg-surface/5 active:before:bg-surface/10 flex flex-col p-6 hover:p-8 hover:scale-[102.5%] active:scale-[97.5%] transition-all duration-300 ease-out items-start justify-end aspect-square bg-center bg-cover text-surface relative overflow-hidden" style="background-image: linear-gradient(rgba(0,0,0,0.00), rgba(0,0,0,0.00)), linear-gradient(to top, rgba(17,31,85,0.2) 0%, rgba(17,31,85,0) 50%), url('{menu.media}');">
            <div class="absolute bottom-0 right-0 w-[100%] md:w-[115%] lg:w-[130%] h-[80%] md:h-[90%] lg:h-[100%] bg-primary/40 blur-3xl rounded-full translate-y-1/2 translate-x-1/2 group-hover/projectItem:w-[150%] group-hover/projectItem:md:w-[165%] group-hover/projectItem:lg:w-[180%] group-hover/projectItem:h-[120%] group-hover/projectItem:md:h-[135%] group-hover/projectItem:lg:h-[150%] group-hover/projectItem:bg-primary/60 transition-all duration-500 ease-out pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-orange-900/40 to-transparent pointer-events-none"></div>
            <p class="text-base md:text-xl lg:text-2xl w-full transition-all font-bold text-end relative z-10">{menu.title}</p>
            {#if menu.description}<p class="text-xs md:text-sm w-full transition-all text-end relative z-10">{@html menu.description}</p>{/if}
          </a>
        {/each}
      </div>
    {:else}
      <p class="text-outline text-center py-6 lg:py-12">Tidak ada data</p>
    {/if}
  </div>
</div>