<script setup lang="ts">
import { computed, ref } from 'vue'
import { Form } from '@southneuhof/is-vue-framework'
import {
  inputCatalogFields,
  inputCatalogInitialData,
  serializeCatalogValue,
  type InputCatalogDraft,
} from './inputCatalogDemo'

const draft = ref<Partial<InputCatalogDraft>>({ ...inputCatalogInitialData })
const submitted = ref<Partial<InputCatalogDraft>>()
const errors = ref<string[]>([])
const liveJson = computed(() => serializeCatalogValue(draft.value))
const submittedJson = computed(() => submitted.value ? serializeCatalogValue(submitted.value) : 'Not submitted yet.')

async function submit(value: InputCatalogDraft) {
  submitted.value = { ...value }
  errors.value = []
  return value
}
</script>

<template>
  <main class="mx-auto grid w-full max-w-screen-2xl gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
    <section class="rounded-xl border border-outline-variant bg-surface-container p-5 sm:p-6">
      <h1 class="text-2xl font-semibold text-on-surface">Input catalog</h1>
      <p class="mt-2 text-sm text-on-surface-variant">Local, unauthenticated renderer inspection. No values leave this page.</p>
      <Form
        v-model="draft"
        class="mt-6"
        :fields="inputCatalogFields"
        :initial-data="inputCatalogInitialData"
        :submit="submit"
      >
        <template #actions="{ submit: submitForm }">
          <button type="button" class="rounded-lg bg-primary px-4 py-2 text-on-primary" @click="submitForm">Submit locally</button>
        </template>
      </Form>
    </section>

    <aside class="grid content-start gap-4 lg:sticky lg:top-6">
      <section class="rounded-xl border border-outline-variant bg-surface-container p-4">
        <h2 class="font-semibold text-on-surface">Form data</h2>
        <pre data-live-debug class="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{{ liveJson }}</pre>
      </section>
      <section class="rounded-xl border border-outline-variant bg-surface-container p-4">
        <h2 class="font-semibold text-on-surface">Submitted snapshot</h2>
        <pre data-submitted-debug class="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs">{{ submittedJson }}</pre>
      </section>
      <section class="rounded-xl border border-outline-variant bg-surface-container p-4">
        <h2 class="font-semibold text-on-surface">Validation errors</h2>
        <pre data-error-debug class="mt-3 whitespace-pre-wrap text-xs">{{ errors.length ? errors.join('\n') : 'None' }}</pre>
      </section>
    </aside>
  </main>
</template>
