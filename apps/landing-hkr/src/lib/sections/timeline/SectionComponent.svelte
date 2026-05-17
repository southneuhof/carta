<script lang="ts">
  const {section} = $props()
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-md flex flex-col gap-6 py-6 lg:py-12 px-6 lg:px-12">
    {#if section.data.content.title || section.data.content.subtitle}
      <div class="flex flex-col gap-4">
        {#if section.data.content.title || section.data.content.subtitle}
          <div class="flex flex-col gap-xs">
            {#if section.data.content.subtitle}<p>{section.data.content.subtitle}</p>{/if}
            {#if section.data.content.title}<p class="text-2xl font-bold">{section.data.content.title}</p>{/if}
          </div>
        {/if}
      </div>
    {/if}
    {#if section.data.gallery?.length}
      <div>
        {#each section.data.gallery as item}
          <div class="flex flex-row relative">
            <p class="absolute font-semibold">{item.subtitle}</p>
            <div class="absolute w-[9px] rounded-full bg-secondary aspect-square left-[50px] top-[8px]"></div>
            <div class="pl-[54px]">
              <div class="pb-6 border-l border-primary">
                <div class="flex flex-col gap-3 px-4">
                  <p class="text-2xl font-bold">{item.title}</p>
                  <p class="rtf-content m-base">{@html item.description}</p>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>