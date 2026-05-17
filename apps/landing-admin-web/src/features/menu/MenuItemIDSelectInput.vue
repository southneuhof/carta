<script setup lang="ts">
import services from '@/utils/services'
import { computed, ref, type PropType } from 'vue'

const modelValue = defineModel<string | undefined>()

const props = defineProps({
  onConfirm: {
    type: Function as PropType<(id: string | undefined) => Promise<void> | void>,
    default: () => {},
  },
})

const open = ref(false)
const selectedId = ref<string | undefined>(undefined)
const { data: menuItemsRaw } = await services.list('menuItem', { limit: 1000 })
const menuItems = computed(() => (menuItemsRaw ?? []).map((item: any) => ({ id: String(item.id), name: item.translations?.find((t: any) => t.language === 'id')?.name || item.slug || item.id })))

async function confirmSelection() {
  await props.onConfirm(selectedId.value)
  modelValue.value = selectedId.value
  open.value = false
}
</script>

<template>
  <Modal v-model:open="open">
    <template #trigger>
      <div @click="() => (open = true)">
        <slot name="trigger" />
      </div>
    </template>
    <template #content>
      <div class="flex flex-col gap-4">
        <p class="text-lg font-semibold">Pilih Menu</p>
        <div class="max-h-[360px] overflow-auto flex flex-col gap-2">
          <Card v-for="item in menuItems" :key="item.id" :color="selectedId === item.id ? 'primary' : 'surface'" @click="() => (selectedId = item.id)">
            {{ item.name }}
          </Card>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outlined" @click="() => (open = false)">Batal</Button>
          <Button :disabled="!selectedId" @click="confirmSelection">Pilih</Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
