<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'

definePage({ name: 'roles-update', meta: { title: 'Ubah Role', moduleName: 'settings' } })

const route = useRoute()
const router = useRouter()
const roleId = computed(() => String((route.params as { roleId?: string }).roleId ?? ''))

function onSubmitted() {
  toast.success('Role berhasil diperbarui.')
  void router.push(roles.routes.detail!(roleId.value))
}
</script>

<template>
  <FormView title="Ubah Role" :form="roles.form({ id: roleId })" @submitted="onSubmitted" />
</template>
