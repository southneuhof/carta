<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getAddSectionOptions,
  getSupportedSectionSchemaGroup,
  type SupportedSectionSchemaCode,
} from '@/features/sections/schemaAdapter'

const props = defineProps<{
  onSubmit: (schemaCode: string) => Promise<void> | void
}>()

const options = getAddSectionOptions()

const groupedOptions = computed(() =>
  Object.entries(
    options.reduce<Record<string, typeof options>>((groups, option) => {
      const group = getSupportedSectionSchemaGroup(option.code)
      groups[group] ||= []
      groups[group].push(option)
      return groups
    }, {}),
  ).map(([name, types]) => ({ name, types })),
)

const selectedCode = ref<SupportedSectionSchemaCode | null>(null)
const loading = ref(false)

async function handleSubmitConfig() {
  if (!selectedCode.value) return
  loading.value = true
  try {
    await props.onSubmit(selectedCode.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal>
    <template #title>
      <div class="flex flex-col gap-2">
        <p>Tambah Section</p>
        <p class="text-sm font-normal text-muted">Pilih dari pilihan section yang ada di bawah ini</p>
      </div>
    </template>
    <template #trigger>
      <Button class="w-full" variant="standard">
        <Icon>add</Icon>Tambah
      </Button>
    </template>
    <template #content>
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-6">
          <div v-for="category in groupedOptions" :key="category.name" class="space-y-4">
            <div class="text-lg font-bold text-muted">{{ category.name }}</div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="option in category.types"
                :key="option.code"
                :color="selectedCode === option.code ? 'primaryContainer' : 'surface'"

                class="cursor-pointer gap-1 border border-outline p-4"
                @click="() => (selectedCode = selectedCode === option.code ? null : option.code)"
              >
                <div>
                  <div class="text-lg font-semibold">{{ option.name }} <span class="text-xs font-normal text-muted">{{ option.code }}</span></div>
                  <div class="line-clamp-2 text-sm text-muted">{{ option.description }}</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex flex-row items-center justify-end">
        <Button :disabled="!selectedCode || loading" class="px-6 py-2" @click="handleSubmitConfig"> Tambah </Button>
      </div>
    </template>
  </Modal>
</template>
