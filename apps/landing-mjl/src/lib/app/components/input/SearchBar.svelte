<script lang="ts">
  import { Label } from "bits-ui";
  import TextInput from "./TextInput.svelte";
  import { debounce as debounceFn } from "@southneuhof/utilities/object"; // Renamed import to avoid conflict
  import { get } from "svelte/store";
  import { m } from "$lib/paraglide/messages";

  let {
    value = $bindable(),
    icon,
    placeholder = `${m.search()}...`,
    debounce = true, // New prop, defaults to true
    debounceMs = 300, // Optional: allow customizing debounce time
    ...restProps
  }: {
    value?: string | number | undefined | null,
    debounce?: boolean, // New prop
    placeholder?: string,
    debounceMs?: number,
    [key: string]: any;
  } = $props();

  let internalValue = $state(value);

  const commitChange = debounceFn((newValue: typeof value) => {
    value = newValue;
  }, debounceMs);

  function getValue() {
    return internalValue;
  }

  function setValue(newValue: string | number | undefined | null) {
    internalValue = newValue;
    if (debounce) {
      commitChange(newValue);
    } else {
      value = newValue;
    }
  }
</script>

<TextInput bind:value={getValue, setValue} {...restProps} {placeholder}>
  {#snippet icon()}
    <i class="{icon ?? 'ri-search-line'}"></i>
  {/snippet}
</TextInput>
