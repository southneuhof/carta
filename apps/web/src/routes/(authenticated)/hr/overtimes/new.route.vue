<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { overtimes } from '@/framework/adapters/resources/overtimes'

definePage({ name: 'overtime-create', meta: { title: 'Ajukan Lembur', moduleName: 'hr' } })

const router = useRouter()

/**
 * The applicant and section are not on this form: the API derives them from the
 * session. A draft is created here and sent into its chain from the detail screen.
 */
function onSubmitted(result: unknown) {
  toast.success('Pengajuan lembur tersimpan sebagai draft.')
  const id = (result as { data?: { id?: string } } | undefined)?.data?.id
  void router.push(id ? overtimes.routes.detail!(id) : overtimes.routes.list!)
}
</script>

<template>
  <FormView title="Ajukan Lembur" :form="overtimes.form()" @submitted="onSubmitted" />
</template>
