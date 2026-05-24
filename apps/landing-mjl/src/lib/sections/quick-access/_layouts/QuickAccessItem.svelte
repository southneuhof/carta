<script lang="ts">
  const {data} = $props()
</script>

<a href={data.url} class="w-[384px] p-6 outline outline-outline flex flex-row items-start gap-base overlay before:bg-on-surface/5 active:before:bg-on-surface/10">
  <i class="{data.media} text-lg"></i>
  <div class="flex flex-col gap-sm">
    <p class="font-bold">{data.title}</p>
    <p class="text-sm text-outline">{data.description}</p>
  </div>
</a>