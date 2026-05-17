<script lang="ts">
  import { Dialog } from "bits-ui";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  // import { X } from "lucide-svelte";

  const {section} = $props()

  let shouldPopupOpen = $state(false)
  const cookieName = `has-shown-popup-${section.data.content.id}`

  onMount(() => {
    if (browser) {
      const hasShownPopup = section.meta.show_once && document.cookie.includes(`${cookieName}=true`);
      if (!hasShownPopup) {
        shouldPopupOpen = true;
      }
    }
  });

  $effect(() => {
    if (shouldPopupOpen && browser) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      document.cookie = `${cookieName}=true; expires=${expiryDate.toUTCString()}; path=/`;
    }
  })
</script>

<Dialog.Root bind:open={shouldPopupOpen}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-black/80"
    />
    <Dialog.Content
      class="bg-transparent flex items-center justify-center fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 h-fit data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-[100] w-auto max-w-[98vw] max-h-[98svh] p-0 overflow-visible"
    >
      <div class="relative w-auto bg-transparent flex flex-col md:m-0 md:w-auto md:max-w-none md:max-h-none md:rounded-none">
        <Dialog.Close class="absolute top-2 right-2 flex items-center justify-center rounded-full aspect-square bg-black/50 p-1 text-white hover:bg-black/75 transition-colors">
          <!-- <X class="w-5 h-5" /> -->
          <i class="ri-close-line"></i>
        </Dialog.Close>
        <a href={section.data.content.url} target="_blank">
          <img 
            src={section.data.content.media} 
            alt="Pop-up Banner"
            class="block mx-auto object-contain w-auto h-auto max-w-[98vw] max-h-[98svh]"
          />
        </a>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>