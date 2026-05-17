<script lang="ts">
  import { Label } from "bits-ui";

  let {
    value = $bindable(), // URL of the file
    label = null,
    required = false,
    placeholder = 'No file chosen',
    accept = '', // e.g., "image/*,application/pdf"
    helperMessage = null, // New prop
    errorMessage = null,         // New prop
    ...restProps
  }: {
    value?: string,
    label?: string | null,
    required?: boolean,
    placeholder?: string,
    accept?: string,
    helperMessage?: string | null, // New prop
    errorMessage?: string | null,         // New prop
    [key: string]: any;
  } = $props();

  let selectedFile = $state<File | null>(null);
  let inputElement: HTMLInputElement;
  let isUploading = $state(false);

  let displayFileName = $derived.by(() => {
    if (selectedFile) {
      return selectedFile.name;
    }
    if (value) {
      try {
        // Assuming the URL format from your server is /.../timestamp-originalname
        const urlParts = value.split('/');
        const encodedNameWithTimestamp = urlParts[urlParts.length - 1];
        const nameWithoutTimestamp = encodedNameWithTimestamp.substring(encodedNameWithTimestamp.indexOf('-') + 1);
        return decodeURIComponent(nameWithoutTimestamp || 'File selected');
      } catch (e) {
        return 'File selected'; // Fallback
      }
    }
    return placeholder;
  });

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      selectedFile = file;
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
          selectedFile = null; 
          value = ''; // Clear value on failure
        }
      } catch (err) {
        selectedFile = null; 
        value = ''; // Clear value on error
      } finally {
        isUploading = false;
      }
    } else {
      // If user cancels file dialog, and a file was previously selected (but not yet uploaded)
      // or a value (URL) already exists, we don't want to clear it.
      // Only clear selectedFile if no file was chosen in this interaction.
      if (!target.files || target.files.length === 0) {
        selectedFile = null;
      }
    }
  }

  function clearFile(event?: MouseEvent) {
    event?.stopPropagation(); // Prevent the main div's click from triggering inputElement.click()
    value = '';
    selectedFile = null;
    if (inputElement) {
      inputElement.value = ''; // Reset the file input so the same file can be re-selected
    }
  }
</script>

<div class="flex flex-col gap-xs">
  {#if label}
    <Label.Root class="font-medium text-xs">
      {label}
      {#if required}<span class="text-xs text-primary">*</span>{/if}
    </Label.Root>
  {/if}
  <div
    class="px-4 py-3 rounded-sm outline outline-outline-variant focus-within:outline-outline select-none flex flex-row items-center justify-between text-sm tracking-[0.01em] cursor-pointer"
    onclick={() => inputElement.click()}
    onkeypress={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        inputElement.click();
      }
    }}
    tabindex="0"
    role="button"
    aria-label={label || 'File input'}
  >
    <span class:text-outline={!value && !selectedFile && placeholder === displayFileName} class="truncate">
      {displayFileName}
    </span>
    <input
      type="file"
      bind:this={inputElement}
      onchange={handleFileChange}
      class="hidden"
      {accept}
      disabled={isUploading}
      {...restProps}
    />
    {#if isUploading}
      <i class="ri-loader-4-line animate-spin ml-2 text-lg"></i>
    {:else}
      <i class="ri-upload-2-line ml-2 text-lg"></i>
    {/if}
  </div>
  {#if errorMessage}
    <p class="text-xs text-error">{errorMessage}</p>
  {:else if helperMessage}
    <p class="text-xs text-outline">{helperMessage}</p>
  {/if}
</div>