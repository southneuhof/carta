<script lang="ts">
  const {section} = $props()
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-md flex flex-col gap-sm py-6 lg:py-12 px-6 lg:px-12">
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
      <div class="flex flex-col gap-sm">
        {#each section.data.gallery as item}
          <div class="flex flex-col gap-sm rounded-lg p-6 relative" style="overflow: hidden;">
            <!-- <div class="absolute inset-0 z-[5]" style="background: linear-gradient(to left, transparent 92%, rgba(255, 249, 245, 1) 100%);"></div> -->
            <i class="{item.media} text-primary/[24%] z-[4]" style="position: absolute; font-size: 120px; left: -20px; top: 0px;"></i>
            <div class="flex flex-col sm:flex-row sm:items-end justify-between w-full z-[6]">
              <p class="text-xl font-bold">
                {#if item.title && item.title.length > 0}
                  <span style="font-size: 48px;">{item.title.charAt(0)}</span>{item.title.substring(1)}
                {/if}
              </p>
              <p>{item.description}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>