<script lang="ts">
  import { getContext } from "svelte";

  const {onPrevious} = $props()

  const section = getContext<Record<string, any>>('section')
</script>

<div class="flex flex-col gap-lg">
  <div class="flex flex-col gap-base">
    <button class="text-sm text-start max-w-fit" onclick={onPrevious}><i class="ri-arrow-left-line"></i> <span class="underline">Kembali</span></button>
    <div class="flex flex-col gap-sm">
      <p class="text-2xl font-bold">{section.data?.postSubmission?.title}</p>
      <p class="rtf-content m-base">{@html section.data?.postSubmission?.description}</p>
    </div>
  </div>
  <div class="flex flex-row items-center gap-base flex-wrap">
    {#each (Array.isArray(section.data?.contactDetails) ? section.data.contactDetails : []) as attachment}
      {#if attachment.url}
        <a href={attachment.url?.startsWith('http') ? attachment.url : `https://${attachment.url}`} target="_blank" class="text-sm font-bold"><span class="underline">{attachment.title || attachment.url}</span> <i class="ri-download-line"></i></a>
      {/if}
    {/each}
  </div>
</div>
