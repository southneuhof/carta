<script lang="ts">
  import Panorama from "$lib/app/components/util/Panorama.svelte";

  const {collection} = $props()

  let activePanoramaIndex = $state(0)
</script>

<div class="flex flex-col gap-base">
  {#if collection.length > 1}
    <div class="flex flex-row gap-4 flex-wrap">
      {#each collection as panorama, index}
        <button onclick={() => activePanoramaIndex = index} class="rounded-full {activePanoramaIndex === index ? 'text-on-surface' : 'text-outline'}">{panorama.title}</button>
      {/each}
    </div>
  {/if}
  {#if collection.length > 0}
    {#key activePanoramaIndex}
      <Panorama url={collection[activePanoramaIndex].media} title={collection[activePanoramaIndex].title} class="w-full !min-h-[300px] md:!h-[450px]"/>
    {/key}
  {/if}
</div>