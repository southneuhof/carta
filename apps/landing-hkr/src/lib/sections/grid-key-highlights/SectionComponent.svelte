<script lang="ts">
  const {section} = $props()
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full max-w-screen-md flex flex-col gap-6 py-6 lg:py-12 px-6 lg:px-12">
    {#if section.data.content.title || section.data.content.subtitle}
      {#if section.data.content.title || section.data.content.subtitle}
        <div class="flex flex-col items-center justify-center gap-xs">
          {#if section.data.content.subtitle}<p class="text-center">{section.data.content.subtitle}</p>{/if}
          {#if section.data.content.title}<p class="text-2xl font-bold text-center">{section.data.content.title}</p>{/if}
        </div>
      {/if}
    {/if}
    {#if section.data.gallery?.length}
      <div class="grid sm:grid-cols-2 grid-cols-1 gap-6">
        {#each section.data.gallery as item, i}
          <div class="flex flex-col gap-base">
            <div class="flex flex-col items-center justify-center gap-sm">
              <div class="w-[25%] flex flex-row h-[4px]">
                <div class="w-[25%] bg-secondary"></div>
                <div class="w-[75%] bg-primary"></div>
              </div>
              <p class="text-2xl font-bold text-center">{item.title}</p>
            </div>
            <p class="text-center font-semibold">{item.subtitle}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- <div class="flex flex-col gap-sm rounded-lg p-4 relative h-[200px] items-center outline outline-outline-variant" style="overflow: hidden; background: radial-gradient(circle at {i % 3 === 0 ? 'bottom right' : i % 3 === 1 ? 'center' : 'top left'}, {i % 3 === 0 ? 'rgba(251,191,36,0.15)' : i % 3 === 1 ? 'rgba(167,139,250,0.15)' : 'rgba(234,88,12,0.15)'}, {i % 3 === 0 ? 'rgba(234,88,12,0.08)' : i % 3 === 1 ? 'rgba(251,146,60,0.08)' : 'rgba(167,139,250,0.08)'} 50%, transparent 100%), linear-gradient(135deg, {i % 3 === 0 ? 'rgba(167,139,250,0.05)' : i % 3 === 1 ? 'rgba(251,191,36,0.05)' : 'rgba(234,88,12,0.05)'} 0%, {i % 3 === 0 ? 'rgba(251,146,60,0.1)' : i % 3 === 1 ? 'rgba(167,139,250,0.1)' : 'rgba(251,191,36,0.1)'} 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px);">
  <div class="w-full text-center z-[5] {item.title.length <= 36 ? 'max-w-[60%]' : ''}">
    {#if item.title && item.title.length > 0}
      <p class="text font-bold">{item.title}</p>
    {/if}
  </div>
  <i class="{item.media} text-on-surface/[24%] z-[2]" style="position: absolute; font-size: 180px; left: 50%; transform: translateX(-50%); bottom: -110px;"></i>
</div> -->

<!-- <div class="flex items-center justify-center w-full">
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
      <div class="grid sm:grid-cols-2 grid-cols-1 gap-6">
        {#each section.data.gallery as item, i}
          <div class="flex flex-col gap-sm rounded-lg p-4 relative h-[200px] items-center outline outline-outline-variant" style="overflow: hidden; background: radial-gradient(circle at {i % 3 === 0 ? 'bottom right' : i % 3 === 1 ? 'center' : 'top left'}, {i % 3 === 0 ? 'rgba(251,191,36,0.15)' : i % 3 === 1 ? 'rgba(167,139,250,0.15)' : 'rgba(234,88,12,0.15)'}, {i % 3 === 0 ? 'rgba(234,88,12,0.08)' : i % 3 === 1 ? 'rgba(251,146,60,0.08)' : 'rgba(167,139,250,0.08)'} 50%, transparent 100%), linear-gradient(135deg, {i % 3 === 0 ? 'rgba(167,139,250,0.05)' : i % 3 === 1 ? 'rgba(251,191,36,0.05)' : 'rgba(234,88,12,0.05)'} 0%, {i % 3 === 0 ? 'rgba(251,146,60,0.1)' : i % 3 === 1 ? 'rgba(167,139,250,0.1)' : 'rgba(251,191,36,0.1)'} 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px);">
            <div class="w-full text-center z-[5] {item.title.length <= 36 ? 'max-w-[60%]' : ''}">
              {#if item.title && item.title.length > 0}
                <p class="text font-bold">{item.title}</p>
              {/if}
            </div>
            <i class="{item.media} text-on-surface/[24%] z-[2]" style="position: absolute; font-size: 180px; left: 50%; transform: translateX(-50%); bottom: -110px;"></i>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div> -->