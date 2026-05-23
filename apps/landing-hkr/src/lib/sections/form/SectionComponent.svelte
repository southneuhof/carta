<script lang="ts">
  import { setContext } from "svelte";
  import FormView from "./_layouts/FormView.svelte";
  import SuccessView from "./_layouts/SuccessView.svelte";
  import SectionHeader from "$lib/app/components/app/SectionHeader.svelte";

  const {section} = $props();
  setContext('section', section)
  let viewIndex = $state<0 | 1>(0)
  const header = section.data?.header ?? {}
  const contactDetails = Array.isArray(section.data?.contactDetails) ? section.data.contactDetails : []
</script>

<div id="contact-form" class="flex w-full items-center justify-center">
  <div class="w-full max-w-screen-xl grid grid-cols-1 {section.meta.type === 'one-column' ? 'md:grid-cols-6 gap-lg' : 'md:grid-cols-2 gap-x-xl gap-y-lg'} py-6 lg:py-12 px-6 lg:px-12">
    {#if section.meta.type === 'two-column'}
      <div class="flex flex-col gap-lg">
        <SectionHeader header={header}/>
        {#if contactDetails.length > 0}
          {@render contactDetail()}
        {/if}
      </div>
    {/if}
    <div class="flex flex-col {section.meta.type === 'one-column' ? 'col-span-4' : 'col-span-1'}">
      {#if viewIndex === 0}
        <div class="flex flex-col gap-lg">
          {#if section.meta.type === 'one-column'}
            <div class="flex flex-col gap-xs">
              <div class="flex flex-col gap-xs">
                {#if header.subtitle}<p class="text-xs md:text-sm">{header.subtitle}</p>{/if}
                {#if header.title}<p class="text-lg md:text-xl font-bold">{header.title}</p>{/if}
              </div>
              {#if header.description}<p class="rtf-content m-base text-outline">{@html header.description}</p>{/if}
            </div>
          {/if}
          <FormView onSubmit={() => viewIndex = 1}/>
        </div>
      {:else}
        <SuccessView onPrevious={() => viewIndex = 0}/>
      {/if}
    </div>
    {#if section.meta.type === 'one-column' && contactDetails.length > 0}
      {@render contactDetail()}
    {/if}
  </div>
</div>

{#snippet contactDetail()}
  <div class="col-span-2 outline outline-outline-variant p-6 flex flex-col gap-lg rounded-sm">
    <div class="flex flex-col gap-base">
      {#each contactDetails as contactItem}
        <div class="flex flex-col gap-xs">
          <p class="text-xs text-outline">{contactItem.title}</p>
          <div class="flex flex-row items-center gap-sm">
            {#if contactItem.media}<i class={contactItem.media}></i>{/if}
            {#if contactItem.url}
              <a href={contactItem.url} data-analytics-contact={contactItem.url} aria-label="Contact" target="_blank" class="underline text-sm">{contactItem.url}</a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/snippet}
