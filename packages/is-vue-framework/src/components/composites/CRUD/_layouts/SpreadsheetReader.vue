<script setup lang="ts">
import UploadDropzone from '@southneuhof/is-vue-framework/components/inputs/UploadDropzone.vue'
import * as XLSX from 'xlsx'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  fields: {
    type: Array<string>,
    required: true,
  },
})

const modelValue = defineModel<any>()

async function handleFileDrop(files: File[]) {
  const file = files[0]
  if (!file) return

  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json(worksheet, { header: props.fields })
  json.shift()
  console.log(json)
  modelValue.value = json
}
</script>

<template>
  <UploadDropzone
    v-if="!modelValue"
    :accept="['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']"
    @update:modelValue="(files: File[] | File) => handleFileDrop(Array.isArray(files) ? files : [files])"
  />
  <Card v-else class="flex flex-row items-center justify-between outline outline-1 outline-outline/[24%]">
    <p>
      <span class="font-bold">{{ modelValue.length }}</span> data terbaca
    </p>
    <button @click="() => (modelValue = null)" class="text-warning"><span class="underline">Ulangi</span> <Icon size="sm" name="refresh"></Icon></button>
  </Card>
</template>
