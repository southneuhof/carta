<script lang="ts">
  import { Label } from "bits-ui";
  import ImagePreview from "$lib/app/components/ui/ImagePreview.svelte";

  let {
    value = $bindable(), // URL of the image
    label = null,
    required = false,
    placeholder = 'Click to upload image',
    alt = 'Uploaded image',
    previewClass = 'w-full h-48 object-cover rounded-sm border border-outline-variant',
    helperMessage,
    errorMessage,
    ...restProps
  }: {
    value?: string,
    label?: string | null,
    required?: boolean,
    placeholder?: string,
    alt?: string,
    previewClass?: string,
    helperMessage?: string,
    errorMessage?: string,
    [key: string]: any;
  } = $props();

  let inputElement: HTMLInputElement;
  let isUploading = $state(false);

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      isUploading = true;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/public/upload/private', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const publicUrl = await response.json();
          value = publicUrl;
        } else {
          console.error('Image upload failed:', await response.text());
          // Do not clear value here, allow user to see previous image if upload fails
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        isUploading = false;
      }
    }
  }

  function clearImage() {
    value = '';
    if (inputElement) {
      inputElement.value = ''; // Reset file input so the same file can be re-selected
    }
  }
</script>

<div class="flex flex-col gap-xs">
  {#if label}
    <Label.Root>
      {label}
      {#if required}<span class="text-xs text-primary">*</span>{/if}
    </Label.Root>
  {/if}

  {#if value && !isUploading}
    <div class="relative group aspect-square max-w-[192px]">
      <ImagePreview src={value} {alt} title="" description="" class="h-full w-full"/>
      <button 
        onclick={clearImage} 
        class="absolute top-2 right-2 bg-black/60 aspect-square flex items-center justify-center text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 focus:opacity-100"
        aria-label="Remove image"
      >
        <i class="ri-close-line text-base leading-none"></i>
      </button>
      <button 
        onclick={() => inputElement?.click()}
        class="absolute bottom-2 right-2 bg-black/60 text-white py-1 px-2 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 focus:opacity-100"
        aria-label="Change image"
      >
        Change
      </button>
    </div>
  {:else}
    <div 
      class="aspect-square max-w-[192px] px-4 py-3 rounded-sm select-none flex flex-col items-center justify-center text-sm tracking-[0.01em] cursor-pointer h-48 border-dashed border-2 border-outline-variant {isUploading ? 'cursor-default' : 'cursor-pointer'}"
      onclick={() => !isUploading && inputElement?.click()}
      role="button"
      tabindex="0"
      onkeypress={(e) => { if (!isUploading && (e.key === 'Enter' || e.key === ' ')) inputElement?.click(); }}
      aria-disabled={isUploading}
    >
      {#if isUploading}
        <div class="flex flex-col items-center gap-1 text-muted">
          <i class="ri-loader-4-line text-3xl animate-spin"></i>
          <span>Uploading...</span>
        </div>
      {:else if value}
         <!-- This case handles if value exists but we are in uploading state (which is now covered by the first #if isUploading) -->
         <!-- Or if value exists and we want to show a loading state for the preview itself, not implemented here -->
         <div class="flex flex-col items-center gap-1 text-muted">
          <i class="ri-loader-4-line text-3xl animate-spin"></i>
          <span>Loading preview...</span>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-1 text-muted">
          <i class="ri-upload-cloud-2-line text-3xl"></i>
          <span>{placeholder}</span>
        </div>
      {/if}
    </div>
  {/if}
  
  <input
    type="file"
    bind:this={inputElement}
    onchange={handleFileChange}
    class="hidden"
    accept="image/*" 
    disabled={isUploading}
    {...restProps}
  />
  {#if errorMessage}
    <p class="text-xs text-error">{errorMessage}</p>
  {:else if helperMessage}
    <p class="text-xs text-outline">{helperMessage}</p>
  {/if}
</div>