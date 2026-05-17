<script lang="ts">
  import { parseSearchParams } from "$lib/utils/common";
  import { getContext, onMount } from "svelte";
  import { page } from "$app/state";
  import Button from "$lib/app/components/ui/Button.svelte";
  import { api } from "$lib/utils/services";
  import DateInput from "$lib/app/components/input/DateInput.svelte";
  import FileInput from "$lib/app/components/input/FileInput.svelte";
  import ImageInput from "$lib/app/components/input/ImageInput.svelte";
  import NumberInput from "$lib/app/components/input/NumberInput.svelte";
  import SelectInput from "$lib/app/components/input/SelectInput.svelte";
  import TextareaInput from "$lib/app/components/input/TextareaInput.svelte";
  import TextInput from "$lib/app/components/input/TextInput.svelte";
  import {Recaptcha, recaptcha, observer} from "$lib/app/components/util/Recaptcha";
  import { PUBLIC_RECAPTCHA_SITEKEY } from "$env/static/public";
  import { getLocale } from "$lib/paraglide/runtime";
  import { m } from "$lib/paraglide/messages";

  const {onSubmit} = $props()

  let section = getContext<Record<string, any>>('section')

  let isLoading = $state(false)

  let formData = $state<Record<string, any>>(section.data.formDataTemplate)

  const componentTypeMap: Record<string, any> = {
    text: TextInput,
    textarea: TextareaInput,
    number: NumberInput,
    image: ImageInput,
    file: FileInput,
    date: DateInput,
    select: SelectInput
  }

  onMount(() => {
    // loop through formData, and if "code" is found in page.data.currentPageSearchParams, set the value of the form field to the value of the search param
    const searchParams = parseSearchParams(page.url.searchParams)
    for (const key in searchParams) {
      if (Object.prototype.hasOwnProperty.call(searchParams, key)) {
        const element = searchParams[key];
        const formField = formData.data.find((formField: any) => formField.code === key)
        console.log('formField', formField, element)
        if (formField) {
          formField.value = element
        }
      }
    }
  })

  let formError: Record<string, any> = $state({})

  let isFormClientValid = $derived.by(() => {
    return formData.data.every((field: any) => {
      // If field is not required, it's always valid
      if (!field.required) return true;
      
      // Get the field value
      const value = field.value;
      
      // Check if the value exists and is not empty
      if (value === undefined || value === null || value === '') {
        return false;
      }
      
      // For arrays, check if it has at least one item
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      
      return true;
    });
  });

  async function validateReCaptchaToken(token: string) {
    const {success, error} = await api.post('/api/public/recaptcha/verify', {token})
    recaptchaError = error
    return success
  }

  async function submitForm(e: any) {
    e.preventDefault()
    if (!isFormClientValid) return
    try {
      isLoading = true
      await validateReCaptchaToken(e.detail.token)
      const {data} = await api.post('/api/public/formSubmission/submit', formData)
      isLoading = false
      await onSubmit()
    } catch (error: any) {
      isLoading = false
      formError = error.error
    }
  }

  let recaptchaError = $state<string | null>(null)

  const onCaptchaInitError = (event: any) => {
    console.log("recaptcha init has failed.", event);
  };

  function validateForm(e: any) {
    e.preventDefault()
    recaptcha.execute();
  }
</script>

<Recaptcha
  sitekey={PUBLIC_RECAPTCHA_SITEKEY}
  badge="topright"
  size="invisible"
  on:success={submitForm}
  on:error={onCaptchaInitError}
/>
<div class="grid grid-cols-6 gap-lg">
  <form class="flex flex-col gap-4 {section.meta.show_hkr_contact_detail ? 'col-span-4' : 'col-span-full'}" onsubmit={validateForm}>
    <div class="grid grid-cols-12 gap-4 max-w-screen-xl w-full">
      {#each formData.data as formField}
        {@const InputComponent = componentTypeMap[formField.type]}
        {#if InputComponent}
          <div class="flex flex-col gap-4" style="grid-column: span {formField.col_span} / span {formField.col_span};">
            <InputComponent
              placeholder={formField.placeholder}
              label={getLocale() === 'id' ? formField.label : (formField.label_en || formField.label)}
              helperMessage={getLocale() === 'id' ? formField.helper_message : (formField.helper_message_en || formField.helper_message)}
              errorMessage={formError[formField.code]}
              required={formField.required}
              bind:value={formField.value}
              data={formField.data?.map((item: any) => ({value: item.value, label: item.value}))}
              pick="value"
              view="label"
            />
          </div>
        {/if}
      {/each}
    </div> 
    <div class="flex flex-row items-center justify-end w-full">
      <Button disabled={!isFormClientValid || isLoading} type="submit">{m.send()} <i class="ml-2 ri-arrow-right-line"></i></Button>
    </div>
  </form>
  <!-- {#if section.meta.show_hkr_contact_detail}
    <div class="col-span-2 outline outline-outline-variant p-6 flex flex-col gap-lg">
      <div class="flex flex-col gap-sm">
        <p class="text-xl font-bold">Detail Kontak</p>
        <p class="text-sm text-outline">Hubungi atau kunjungi kami secara langsung untuk mendapatkan bantuan komprehensif</p>
      </div>
      <div class="flex flex-col gap-base">
        <div class="flex flex-row gap-sm">
          <i class="ri-mail-line"></i>
          <p>{page.data.companyProfile.email}</p>
        </div>
        <div class="flex flex-row gap-sm">
          <i class="ri-phone-line"></i>
          <p>{page.data.companyProfile.phone}</p>
        </div>
        <div class="flex flex-row items-center gap-2">
          {#if page.data.companyProfile?.facebook}<a href="https://{page.data.companyProfile?.facebook}" aria-label="Facebook" target="_blank"><i class="ri-facebook-circle-fill text-xl"></i></a>{/if}
          {#if page.data.companyProfile?.instagram}<a href="https://{page.data.companyProfile?.instagram}" aria-label="Instagram"><i class="ri-instagram-fill text-xl"></i></a>{/if}
          {#if page.data.companyProfile?.twitter}<a href="https://{page.data.companyProfile?.twitter}" aria-label="LinkedIn"><i class="ri-linkedin-box-fill text-xl"></i></a>{/if}
          {#if page.data.companyProfile?.youtube}<a href="https://{page.data.companyProfile?.youtube}" aria-label="YouTube"><i class="ri-youtube-fill text-xl"></i></a>{/if}
        </div>
      </div>
    </div>
  {/if} -->
</div>
