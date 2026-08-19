<script setup lang="ts">
import { computed, ref } from 'vue'
import { Form } from '@southneuhof/is-vue-framework'
import { Button, Card, ImagePreview } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'
import type { SubmitQualityInspectionDocumentations } from './quality-inspection.schema'

const props = defineProps<{ initial?: Record<string, unknown>; submit: (input: SubmitQualityInspectionDocumentations) => Promise<unknown>; submitLabel: string }>()
const emit = defineEmits<{ (event: 'submitted', value: unknown): void }>()
const model = ref<Record<string, unknown>>({ ...(props.initial ?? {}) })
const names = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] as const
const fields = Object.fromEntries(names.flatMap((name) => [
  [name, { label: name, form: { renderer: 'image', props: { required: true } } }],
  [`${name}Description`, { label: 'Catatan', form: { renderer: 'textarea' } }],
]))

function path(value: unknown) {
  return value && typeof value === 'object' && typeof (value as { path?: unknown }).path === 'string' ? (value as { path: string }).path : typeof value === 'string' ? value : ''
}

const ready = computed(() => names.every((name) => Boolean(path(model.value[name]))))
const previews = computed(() => names.map((name) => ({ name, value: path(model.value[name]) })))

async function submitForm(value: Record<string, unknown>) {
  if (!names.every((name) => path(value[name]))) throw new Error('Semua empat foto dokumentasi wajib diisi.')
  const result = await props.submit({ documentations: names.map((name) => ({ name, fileAttachment: path(value[name]), description: typeof value[`${name}Description`] === 'string' && value[`${name}Description`] ? value[`${name}Description`] as string : undefined })) })
  emit('submitted', result)
  return result
}
</script>

<template>
  <Card variant="outlined" color="surfaceContainer" class="gap-4 p-4">
    <h3 class="font-semibold">Foto Sudut Pengambilan</h3>
    <p class="text-sm text-on-surface-variant">Unggah empat foto sudut tetap. Catatan bersifat opsional.</p>
    <Form v-model="model" :fields="fields" :submit="submitForm as never">
      <template #actions="{ submit: submitForm, submitting }">
        <Button type="button" :disabled="!ready || submitting" @click="submitForm">{{ props.submitLabel }}</Button>
      </template>
    </Form>
    <div class="grid gap-2 sm:grid-cols-2">
      <div v-for="preview in previews" :key="preview.name" class="rounded-lg border border-outline-variant p-2">
        <p class="mb-2 text-sm font-medium">Foto {{ preview.name }}</p>
        <ImagePreview v-if="preview.value" :image-u-r-l="fileUrl(preview.value)" :disable-controls="true" class="aspect-video w-full" />
        <p v-else class="text-sm text-on-surface-variant">Belum ada foto.</p>
      </div>
    </div>
  </Card>
</template>
