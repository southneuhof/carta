<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'


const router = useRouter()

function onSubmitted() {
  toast.success('Role berhasil dibuat.')
  void router.push(roles.actions.list!.to as never)
}
</script>

<template>
  <FormView title="Tambah Role" :form="roles.form()" @submitted="onSubmitted" />
</template>
