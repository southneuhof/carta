<script lang="ts">
  import { getContext } from "svelte";
  import { formatData } from "$lib/utils/format";
  import { mathjs } from "$lib/utils/math";
  import { isEmptyObject } from "$lib/utils/common";
  import { trackEvent } from "$lib/utils/analytics";
  const {formData, onPrevious} = $props()

  let section = getContext<Record<string, any>>('section')

  let isTracked = $state(false)

  const isFormValid = $derived.by(() => {
    return section.data.calculatorType.fields.every((field: any) => {
      if (!field.required) return true;
      const value = formData[field.code];
      return value !== undefined && value !== null && value !== '';
    });
  });

  $effect(() => {
    if (isFormValid && !isTracked) {
      isTracked = true
      trackEvent('calculator_usage', {
        source: window.location.pathname,
      })
    }
  })
</script>


<div class="flex flex-col gap-base border-t md:border-t-0 md:border-l border-outline-variant px-0 sm:px-6 py-6">
  {#if isFormValid}
    <div class="flex flex-col gap-base">
      <!-- <button class="text-sm text-start max-w-fit" onclick={onPrevious}><i class="ri-arrow-left-line"></i> <span class="underline">Kembali</span></button> -->
      <div class="flex flex-col">
        <p class="text-outline font-semibold">{section.data.calculatorType.details[0].label}</p>  
        <p class="text-xl font-bold">{formatData(mathjs.evaluate(section.data.calculatorType.details[0].formula, formData), section.data.calculatorType.details[0].type)} {section.data.calculatorType.details[0].unit}</p>
      </div>
    </div>
    <table>
      <tbody>
        {#each section.data.calculatorType.details.slice(1) as detailField}
          <tr>
            <td class="w-[1%] whitespace-nowrap">{detailField.label}</td>
            <td class="w-[1%] px-2">:</td>
            <td>{formatData(mathjs.evaluate(detailField.formula, formData), detailField.type)} {detailField.unit}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="flex flex-row items-center gap-base lg:gap-xs text-outline">
      <i class="ri-calculator-fill"></i>
      <p>Lengkapi formulir untuk mendapatkan simulasi kredit</p>
    </div>
  {/if}
</div>