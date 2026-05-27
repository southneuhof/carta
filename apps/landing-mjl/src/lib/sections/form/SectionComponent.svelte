<script lang="ts">
  import { setContext } from "svelte";
  import FormView from "./_layouts/FormView.svelte";
  import SuccessView from "./_layouts/SuccessView.svelte";
  import Button from "$lib/app/components/ui/Button.svelte";

  const {section} = $props();
  setContext('section', section)
  
  let viewIndex = $state<0 | 1>(0)
  const header = section.data?.header ?? {}
  const contactDetails = Array.isArray(section.data?.contactDetails) ? section.data.contactDetails : []

  // Extract WhatsApp details to render as a prominent button
  const whatsappDetail = contactDetails.find((item: any) => 
    item.media?.includes('whatsapp') || 
    item.url?.includes('wa.me') || 
    item.url?.includes('whatsapp') || 
    item.title?.toLowerCase() === 'whatsapp'
  );

  // Remaining details will be listed under the Information section
  const otherContactDetails = contactDetails.filter((item: any) => item !== whatsappDetail);
</script>

<div id="contact-form" class="flex w-full items-center justify-center py-6 lg:py-16">
  <div class="w-full max-w-screen-xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-6 lg:px-12 items-stretch">
    
    <!-- Left Column: Vibrant primary card with background pattern texture -->
    <div class="relative bg-primary overflow-hidden rounded-2xl p-8 lg:p-12 text-white flex flex-col justify-between gap-10 shadow-lg min-h-[480px] lg:col-span-5">
      <!-- Faint background pattern -->
      <div class="absolute inset-0 opacity-12 bg-repeat pointer-events-none" style="background-image: url('/assets/image/background-texture.png'); background-size: 240px;"></div>
      
      <!-- Content inside the card -->
      <div class="relative z-10 flex flex-col gap-2">
        <div class="flex flex-col gap-3">
          {#if header.subtitle}
            <span class="text-xs uppercase tracking-widest text-white/80 font-semibold">{header.subtitle}</span>
          {/if}
          {#if header.title}
            <h2 class="text-3xl font-bold tracking-tight font-sans text-white">{header.title}</h2>
          {/if}
        </div>
        {#if header.description}
          <div class="rtf-content text-sm lg:text-sm leading-relaxed text-white/90 font-medium">
            {@html header.description}
          </div>
        {/if}
      </div>

      <!-- WhatsApp prominent pill button -->
      {#if whatsappDetail}
        <div class="relative z-10 w-full">
          <Button 
            href={whatsappDetail.url.startsWith('http') ? whatsappDetail.url : `https://${whatsappDetail.url}`} 
            target="_blank" 
            data-analytics-contact={whatsappDetail.url} 
            aria-label="WhatsApp Contact" 
            color="primary-container"
            class="w-full justify-start py-4 px-6 shadow-sm hover:shadow-md hover:scale-[101%] active:scale-[99%] transition duration-200 group"
          >
            <!-- WhatsApp Icon (Remix Icon ri-whatsapp-fill in green) -->
            <i class="ri-whatsapp-fill text-3xl text-[#25D366]"></i>
            <div class="flex flex-col text-left leading-none">
              <span class="text-base font-bold text-neutral-900">WhatsApp</span>
              <span class="text-xs text-[#25D366] font-semibold mt-1">Klik To Chat</span>
            </div>
          </Button>
        </div>
      {/if}

      <!-- Informasi Contact Details list -->
      <div class="relative z-10 flex flex-col gap-4">
        {#if otherContactDetails.length > 0}
          <div class="border-b border-white/20 pb-2"></div>
          <div class="flex flex-col gap-4">
            {#each otherContactDetails as contactItem}
              <div class="flex items-center gap-3.5">
                {#if contactItem.media}
                  <div class="w-6 flex items-center justify-center pt-0.5">
                    <i class="{contactItem.media} text-white"></i>
                  </div>
                {/if}
                {#if contactItem.url}
                  <a 
                    href={contactItem.url.startsWith('http') || contactItem.url.startsWith('mailto:') || contactItem.url.startsWith('tel:') ? contactItem.url : (contactItem.url.includes('@') ? `mailto:${contactItem.url}` : `https://${contactItem.url}`)} 
                    target="_blank" 
                    data-analytics-contact={contactItem.url} 
                    aria-label={contactItem.title || "Contact Information"} 
                    class="text-white hover:underline text-sm font-medium leading-normal break-all"
                  >
                    {contactItem.title || contactItem.url}
                  </a>
                {:else}
                  <span class="text-white text-sm font-medium leading-normal">{contactItem.title}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Column: Form inputs or Success state -->
    <div class="flex flex-col justify-center lg:col-span-7">
      {#if viewIndex === 0}
        <FormView onSubmit={() => viewIndex = 1}/>
      {:else}
        <SuccessView onPrevious={() => viewIndex = 0}/>
      {/if}
    </div>

  </div>
</div>
