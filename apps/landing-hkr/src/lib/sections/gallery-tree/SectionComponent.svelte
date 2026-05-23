<script lang="ts">
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";
  import { Accordion } from "bits-ui";

  const { section } = $props()

  const groups = $derived(section.data.sectionGroups ?? [])
  const firstLeaf = $derived(groups.find((group: any) => group.leafSections?.length)?.leafSections?.[0] ?? null)
  const selectedLeaf = $derived(findSelectedLeaf())

  let selectedLeafId = $state('')
  let openItems = $state<string[]>([])
  let hasInitialized = $state(false)

  $effect(() => {
    if (hasInitialized) return

    selectedLeafId = firstLeaf?.id ?? ''
    openItems = groups.map((group: any) => group.id || group.name)
    hasInitialized = true
  })

  function findSelectedLeaf() {
    for (const group of groups) {
      const leaf = group.leafSections?.find((item: any) => item.id === selectedLeafId)
      if (leaf) return leaf
    }

    return firstLeaf
  }

  function selectLeaf(leaf: any) {
    selectedLeafId = leaf.id
  }
</script>

<div class="flex w-full flex-col items-center">
  <div class="flex w-full max-w-screen-xl flex-col gap-8 px-6 py-6 lg:px-12 lg:py-12">
    {#if section.data.content}
      <SectionHeader header={section.data.content} />
    {/if}

    <div class="grid w-full grid-cols-1 md:grid-cols-3">
      <aside class="flex flex-col gap-4 border-outline-variant pb-6 md:col-span-1 md:border-r md:pb-0 md:pr-6 lg:pr-8">
        {#if groups.length}
          <Accordion.Root type="multiple" bind:value={openItems} class="flex w-full flex-col gap-3">
            {#each groups as group (group.id || group.name)}
              <Accordion.Item value={group.id || group.name} class="flex flex-col">
                <Accordion.Header>
                  <Accordion.Trigger class="group flex w-full flex-row items-center justify-between gap-3 py-2 text-left">
                    <span class="font-bold text-on-surface">{group.name}</span>
                    <i class="ri-arrow-down-s-line text-xl text-outline transition-transform group-data-[state=open]:rotate-180"></i>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div class="flex flex-col gap-1 py-1 pl-4">
                    {#each group.leafSections ?? [] as leaf (leaf.id || leaf.name)}
                      <button
                        type="button"
                        class="border-l-2 py-2 pl-4 text-left transition-colors {selectedLeaf?.id === leaf.id ? 'border-primary font-semibold text-on-surface underline underline-offset-4' : 'border-outline-variant text-outline hover:border-outline hover:text-on-surface'}"
                        onclick={() => selectLeaf(leaf)}
                      >
                        {leaf.name}
                      </button>
                    {/each}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            {/each}
          </Accordion.Root>
        {:else}
          <p class="py-6 text-center text-outline">No gallery items available.</p>
        {/if}
      </aside>

      <div class="flex min-w-0 flex-col gap-8 pt-6 md:col-span-2 md:py-0 md:pl-8 lg:pl-12">
        {#if selectedLeaf}
          {@const content = selectedLeaf.content}
          {@const gallery = selectedLeaf.gallery ?? []}

          {#if content?.title || content?.subtitle || content?.description}
            <div class="flex flex-col gap-4">
              {#if content.subtitle}
                <p class="text-outline">{content.subtitle}</p>
              {/if}
              {#if content.title}
                <h3 class="text-2xl font-bold md:text-3xl">{content.title}</h3>
              {/if}
              {#if content.description}
                <div class="rtf-content m-base text-outline">
                  {@html content.description}
                </div>
              {/if}
            </div>
          {/if}

          {#if gallery.length}
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {#each gallery as item (item.id || item.media || item.title)}
                <div class="flex min-w-0 flex-col gap-3">
                  {#if item.media}
                    <div class="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-sm outline outline-1 outline-outline-variant">
                      <img src={item.media} alt={item.title || ''} class="h-full w-full object-contain object-center" />
                    </div>
                  {/if}
                  {#if item.title || item.subtitle}
                    <div class="flex flex-col gap-1">
                      {#if item.title}<p class="font-semibold">{item.title}</p>{/if}
                      {#if item.subtitle}<p class="text-sm text-outline">{item.subtitle}</p>{/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {:else}
          <p class="py-10 text-center text-outline">No gallery items available.</p>
        {/if}
      </div>
    </div>
  </div>
</div>
