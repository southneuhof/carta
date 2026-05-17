<script lang="ts">
  import QuickAccessItem from "./_layouts/QuickAccessItem.svelte";

  const {section} = $props()
</script>

<div class="flex w-full items-center justify-center">
  <div class="flex flex-row flex-wrap items-center justify-center gap-base w-full max-w-screen-xl px-12 py-6 lg:py-12">
    {#each section.data.gallery as item}
      <QuickAccessItem data={item} />
    {/each}
  </div>
</div>