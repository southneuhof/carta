<script lang="ts">
  const {section} = $props()

  const imageSizeMap: any = {
    small: 'max-w-screen-sm',
    medium:'max-w-screen-md',
    large:'max-w-screen-lg',
    'extra-large':'max-w-screen-xl',
  }
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full {imageSizeMap[section.meta.size_constraint]} flex flex-col gap-6 py-6 lg:py-12 px-6 lg:px-12">
    {#if section.data.content.media}
      <img src={section.data.content.media} alt={section.data.content.title} class="rounded-lg {section.meta.enable_outline ? 'outline outline-outline-variant' : ''} "/>
    {/if}
  </div>
</div>