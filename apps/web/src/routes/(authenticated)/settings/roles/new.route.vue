<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'

definePage({ name: 'roles-create', meta: { title: 'Tambah Role', moduleName: 'settings' } })

const router = useRouter()

function onSubmitted() {
  toast.success('Role berhasil dibuat.')
  void router.push(roles.routes.list!)
}
</script>

<template>
  <FormView title="Tambah Role" :form="roles.form()" @submitted="onSubmitted" />
</template>
