<script lang="ts">
  import { Label } from "bits-ui";

  let {
    value = $bindable(),
    label = null,
    required = false,
    placeholder = '',
    helperMessage = null, // New prop
    errorMessage = null,         // New prop
    ...restProps
  }: {
    value?: string | undefined | null,
    label?: string | null,
    required?: boolean,
    placeholder?: string,
    helperMessage?: string | null, // New prop
    errorMessage?: string | null,         // New prop
    [key: string]: any;
  } = $props();
</script>

<div class="flex flex-col gap-xs">
  {#if label}
    <Label.Root class="font-medium text-xs">
      {label}
      {#if required}<span class="text-xs text-primary">*</span>{/if}
    </Label.Root>
  {/if}
  <div class="px-4 py-3 rounded-sm outline outline-outline-variant focus-within:outline-outline select-none flex flex-row items-center justify-between text-sm tracking-[0.01em]">
    <textarea
      bind:value={value}
      class="p-0 w-full border-none bg-transparent outline-none focus:ring-0 focus:ring-offset-0"
      rows="3"
      {placeholder}
      {...restProps}
    ></textarea>
  </div>
  {#if errorMessage}
    <p class="text-xs text-error">{errorMessage}</p>
  {:else if helperMessage}
    <p class="text-xs text-outline">{helperMessage}</p>
  {/if}
</div>