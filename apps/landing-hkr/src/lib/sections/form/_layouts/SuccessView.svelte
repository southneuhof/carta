<script lang="ts">
  import Button from "$lib/app/components/ui/Button.svelte";
  import { getContext } from "svelte";

  const {onPrevious} = $props()

  const section = getContext<Record<string, any>>('section')    
</script>

<div class="flex flex-col gap-lg">
  <div class="flex flex-col gap-base">
    <button class="text-sm text-start max-w-fit" onclick={onPrevious}><i class="ri-arrow-left-line"></i> <span class="underline">Kembali</span></button>
    <div class="flex flex-col gap-sm">
      <p class="text-2xl font-bold">{section.data.postSubmission.content.title}</p>
      <p class="rtf-content m-base">{@html section.data.postSubmission.content.description}</p>
    </div>
  </div>
  <div class="flex flex-row items-center gap-base">
    {#each section.data.postSubmission.gallery as attachment}
      <a href={attachment.attachment} target="_blank" class="text-sm font-bold"><span class="underline">{attachment.title}</span> <i class="ri-download-line"></i></a>
    {/each}
  </div>
</div>