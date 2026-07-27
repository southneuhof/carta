<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { users } from '@/framework/adapters/resources/users'

// Not listed in the parent tab array, so it is reachable from the update
// control and by URL, but is never a tab.

const route = useRoute('settings-users-edit')
const router = useRouter()
const userId = computed(() => route.params.userId)

function onSubmitted() {
  toast.success('Pengguna berhasil diperbarui.')
  void router.push((users.actions.detail!.to as (id: string) => unknown)(userId.value) as never)
}
</script>

<template>
  <FormView title="Ubah Pengguna" :form="users.form({ id: userId })" @submitted="onSubmitted" />
</template>
