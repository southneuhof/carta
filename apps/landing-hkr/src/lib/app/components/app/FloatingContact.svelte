<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { contactFABContent } from '$lib/app/states/contactFABContent.svelte';
  
  const socialLinks = [
    { 
      name: 'Facebook',
      icon: 'i-mdi-facebook',
      url: 'https://facebook.com/yourpage',
      color: 'text-blue-600 hover:bg-blue-100'
    },
    { 
      name: 'Youtube', 
      icon: 'i-mdi-youtube',
      url: 'https://youtube.com/yourchannel',
      color: 'text-red-600 hover:bg-red-100'
    },
    { 
      name: 'Instagram', 
      icon: 'i-mdi-instagram',
      url: 'https://instagram.com/yourprofile',
      color: 'text-pink-600 hover:bg-pink-100'
    }
  ];
  
  let isOpen = $state(false)
  let windowScrollY = $state(0)
  let windowHeight = $state(0)
  let isAtTop = $derived.by(() => {
    if (!browser) return false
    return windowScrollY < (0.1*windowHeight)
  })
  let isAtBottom = $derived.by(() => {
    if (!browser) return false
    return windowScrollY > (document.documentElement.scrollHeight - windowHeight - (0.20*windowHeight))
  })
  let showFAB = $derived(!isAtTop && !isAtBottom)
  // let showFAB = true

  let contactData = $derived.by(() => {
    if (!contactFABContent.data) return page.data.collection.find((item: any) => item.code === 'contact-detail')?.data
    else return contactFABContent.data
  })
</script>

<svelte:window bind:scrollY={windowScrollY} bind:outerHeight={windowHeight}/>

<div
  id="contact-fab"
  role="region"
  aria-label="Contact options"
  class="group/fab fixed bottom-6 left-6 z-50 p-2 -m-2 rounded-2xl hover:bg-surface-container-highest/50 transition-all hidden lg:block {showFAB ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}"
  onmouseenter={() => isOpen = true}
  onmouseleave={() => isOpen = false}
>
  <div class="flex flex-col-reverse md:flex-row gap-2">
  <a
    class="flex flex-row items-center gap-sm bg-outline text-surface w-[64px] h-[64px] rounded-full transition-all {isOpen ? 'w-[156px]' : 'w-[64px]'}"
    aria-label="Contact us"
    onclick={() => isOpen = !isOpen}
    href={page.data.helpCenterMenuPath}
  >
    <div class="flex items-center justify-center h-full pl-5">
      <i class="ri-chat-smile-2-line text-2xl"></i>
    </div>
    <span class="whitespace-nowrap pr-5 text-sm font-medium transition-opacity duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}">
      Contact Us
    </span>
  </a>

  {#each contactData as contactDetail}
    <a 
      href={contactDetail?.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
      aria-label="{contactDetail?.name}"
    >
      <i class="{contactDetail.media} text-2xl"></i>
    </a>
  {/each}
  
  <!-- {#if contactData?.email}
    <a 
      href={`mailto:${contactData?.email}`}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
      aria-label="Email"
    >
      <i class="ri-mail-line text-2xl"></i>
    </a>
  {/if}
  {#if contactData?.whatsapp}
    <a 
      href={`https://wa.me/${contactData?.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
      aria-label="Whatsapp"
    >
      <i class="ri-whatsapp-line text-2xl"></i>
    </a>
  {/if}
  {#if contactData?.phone}
    <a 
      href={`tel:${contactData?.phone}`}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
      aria-label="Phone"
    >
      <i class="ri-phone-line text-2xl"></i>
    </a>
  {/if}
  {#if contactData?.facebook}
  <a 
    href={contactData?.facebook}
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
    aria-label="Facebook"
  >
    <i class="ri-facebook-circle-line text-2xl"></i>
  </a>
  {/if}
  {#if contactData?.instagram}
  <a 
    href={contactData?.instagram}
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
    aria-label="Instagram"
  >
    <i class="ri-instagram-line text-2xl"></i>
  </a>
  {/if}
  {#if contactData?.twitter}
  <a 
    href={contactData?.twitter}
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
    aria-label="Twitter"
  >
    <i class="ri-twitter-x-line text-2xl"></i>
  </a>
  {/if}
  {#if contactData?.linkedin}
  <a 
    href={contactData?.linkedin}
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
    aria-label="LinkedIn"
  >
    <i class="ri-linkedin-box-line text-2xl"></i>
  </a>
  {/if}
  {#if contactData?.youtube}
    <a 
      href={contactData?.youtube}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-surface outline outline-outline-variant bg-surface-container-high hover:bg-surface-container-highest transition-all duration-150 {isOpen ? 'opacity-100' : 'opacity-0'}"
      aria-label="Youtube"
    >
      <i class="ri-youtube-line text-2xl"></i>
    </a>
  {/if} -->
  </div>
</div>

<style>
  
</style>