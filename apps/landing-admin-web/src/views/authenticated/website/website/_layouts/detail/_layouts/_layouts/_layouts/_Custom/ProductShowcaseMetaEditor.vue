<script setup lang="ts">
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import TextInput from '@southneuhof/is-vue-framework/components/inputs/TextInput.vue'
import { keyManager } from '@/stores/keyManager'
import { getSmallestChildObject } from '@/utils/common'
import services from '@/utils/services'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps({
  sectionData: {
    type: Object,
    required: true,
  },
})

const productId = ref(typeof props.sectionData?.meta?.product_id === 'string' ? props.sectionData.meta.product_id : '')
const saving = ref(false)
const topmostSection = computed(() => getSmallestChildObject(props.sectionData, 'parentSectionData'))

async function save() {
  saving.value = true
  try {
    const mergedMeta = {
      ...(props.sectionData?.meta || {}),
      product_id: productId.value?.trim() || '',
    }

    await services.update('section', {
      ...props.sectionData,
      meta: mergedMeta,
    })

    toast.success('Berhasil menyimpan product id!')
    keyManager().triggerChange(`section-${props.sectionData.id}`)
    keyManager().triggerChange(`section-update-time-${topmostSection.value.id}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Card class="gap-4">
    <p class="text-sm text-muted">Product ID (UUID)</p>
    <TextInput v-model="productId" placeholder="Masukkan Product ID" />
    <div class="flex justify-end">
      <Button :disabled="saving" @click="save">Simpan</Button>
    </div>
  </Card>
</template>
