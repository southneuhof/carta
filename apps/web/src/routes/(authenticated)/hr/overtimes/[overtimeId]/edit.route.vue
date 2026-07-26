<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { overtimes } from '@/framework/adapters/resources/overtimes'

definePage({ name: 'overtime-edit', meta: { title: 'Ubah Lembur', moduleName: 'hr' } })

const route = useRoute()
const router = useRouter()
const overtimeId = computed(() => String((route.params as { overtimeId?: string }).overtimeId ?? ''))

// Editing is only possible while the request is a draft; the API answers 409
// otherwise, and the detail screen hides the control once it is submitted.
function onSubmitted() {
  toast.success('Pengajuan lembur diperbarui.')
  void router.push(overtimes.routes.detail!(overtimeId.value))
}
</script>

<template>
  <FormView title="Ubah Lembur" :form="overtimes.form({ id: overtimeId })" @submitted="onSubmitted" />
</template>
