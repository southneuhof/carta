<script lang="ts">
  import { Label, Select } from "bits-ui";

  let {
    value = $bindable(),
    label = '',
    required = false,
    data = [],
    pick = 'id',
    view = 'name',
    placeholder = 'Pilih',
    helperMessage = null, // New prop
    errorMessage = null,         // New prop
    ...restProps
  }: {
    value?: any,
    label?: string,
    required?: boolean,
    data?: any[],
    pick?: string,
    view?: string,
    placeholder?: string,
    helperMessage?: string | null, // New prop
    errorMessage?: string | null          // New prop
    [key: string]: any;
  } = $props();

  const selectedLabel = $derived(
    value
      ? data.find((item) => item[pick] === value)?.[view]
      : placeholder
  );

  function getValue() {
    return value;
  }

  function setValue(newValue: string) {
    value = newValue;
  }
</script>

<Select.Root type="single" bind:value={getValue, setValue} items={data}>
  <div class="flex flex-col gap-xs w-full {restProps.class}">
    {#if label}
      <Label.Root class="font-medium text-xs">
        {label}
        {#if required}<span class="text-xs text-primary">*</span>{/if}
      </Label.Root>
    {/if}
    <Select.Trigger
      class="px-4 py-3 rounded-sm outline w-full min-w-full outline-outline-variant focus-within:outline-outline select-none flex flex-row gap-2 items-center justify-between text-sm tracking-[0.01em] {restProps.class}"
      aria-label={placeholder}
    >
      <p class={value ? 'text-on-surface' : 'text-outline'}>{selectedLabel}</p>
      <i class="ri-expand-up-down-line text-outline text-lg"></i>
    </Select.Trigger>
    {#if errorMessage}
      <p class="text-xs text-error">{errorMessage}</p>
    {:else if helperMessage}
      <p class="text-xs text-outline">{helperMessage}</p>
    {/if}
    <Select.Portal>
      <Select.Content
        class="focus-override border-outline-variant bg-surface text-on-surface data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 outline-hidden z-50 h-fit max-h-[var(--bits-select-content-available-height)] w-[var(--bits-select-anchor-width)] min-w-[var(--bits-select-anchor-width)] select-none rounded border p-0 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
        sideOffset={4}
      >
        <Select.Viewport class="p-1">
          {#each data as item, i (i + item[pick])}
            <Select.Item
              class="hover:bg-surface-muted {item[pick] === value ? 'bg-surface-muted' : 'hover:bg-surface-muted'} outline-hidden data-disabled:opacity-50 flex h-10 w-full select-none items-center py-2 pl-3 pr-2 text-sm capitalize rounded-sm"
              value={item[pick]}
              label={item[view]}
            >
              {#snippet children({ selected })}
                {item[view]}
                {#if selected}
                  <div class="ml-auto">
                    <i class="ri-check-line text-lg"></i>
                  </div>
                {/if}
              {/snippet}
            </Select.Item>
          {/each}
        </Select.Viewport>
        <!-- <Select.ScrollDownButton class="flex w-full items-center justify-center">
          <CaretDoubleDown class="size-3" />
        </Select.ScrollDownButton> -->
      </Select.Content>
    </Select.Portal>
  </div>
</Select.Root>