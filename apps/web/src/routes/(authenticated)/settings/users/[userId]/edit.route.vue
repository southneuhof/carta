<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { users } from '@/framework/adapters/resources/users'

definePage({ name: 'users-update', meta: { title: 'Ubah Pengguna', moduleName: 'settings' } })

const route = useRoute()
const router = useRouter()
const userId = computed(() => String((route.params as { userId?: string }).userId ?? ''))

function onSubmitted() {
  toast.success('Pengguna berhasil diperbarui.')
  void router.push(users.routes.detail!(userId.value))
}
</script>

<template>
  <FormView title="Ubah Pengguna" :form="users.form({ id: userId })" @submitted="onSubmitted" />
</template>
