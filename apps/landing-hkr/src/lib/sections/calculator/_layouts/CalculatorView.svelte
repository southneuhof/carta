<script lang="ts">
  import SelectInput from "$lib/app/components/input/SelectInput.svelte";
  import TextInput from "$lib/app/components/input/TextInput.svelte";
  import Button from "$lib/app/components/ui/Button.svelte";
  import { getContext } from "svelte";

  const {formData = $bindable(), onCalculate} = $props()
  let section = getContext<Record<string, any>>('section')

  const componentTypeMap: Record<string, any> = {
    text: TextInput,
    select: SelectInput
  }

  // Check if all required fields are filled
  const isFormValid = $derived.by(() => {
    return section.data.calculatorType.fields.every((field: any) => {
      if (!field.required) return true;
      const value = formData[field.code];
      return value !== undefined && value !== null && value !== '';
    });
  });

  function submitForm(e: any) {
    e.preventDefault();
    if (isFormValid) {
      onCalculate();
    }
  }
</script>

<form class="flex flex-col gap-4 {section.meta.show_hkr_contact_detail ? 'col-span-4' : 'col-span-full'}" onsubmit={submitForm}>
  <div class="grid grid-cols-12 gap-4 max-w-screen-xl w-full">
    {#each section.data.calculatorType.fields as calculatorField}
      {@const InputComponent = componentTypeMap[calculatorField.type]}
      <div class="flex flex-col gap-4" style="grid-column: span {calculatorField.col_span} / span {calculatorField.col_span};">
        <InputComponent
          placeholder={calculatorField.placeholder}
          label={calculatorField.label}
          required={calculatorField.required}
          helperMessage={calculatorField.helper_message}
          bind:value={formData[calculatorField.code]}
          data={calculatorField.data}
          pick="value"
          view="label"
        />
      </div>
    {/each}
  </div>
  <!-- <div class="flex flex-row items-center justify-end w-full">
    <Button type="submit" disabled={!isFormValid}>
      Hitung <i class="ml-2 ri-arrow-right-line"></i>
    </Button>
  </div> -->
</form>