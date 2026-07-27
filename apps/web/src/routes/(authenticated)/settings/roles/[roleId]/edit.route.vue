<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'

// Not listed in the parent tab array, so it is reachable from the update
// control and by URL, but is never a tab.

const route = useRoute('settings-roles-edit')
const router = useRouter()
const roleId = computed(() => route.params.roleId)

function onSubmitted() {
  toast.success('Role berhasil diperbarui.')
  void router.push((roles.actions.detail!.to as (id: string) => unknown)(roleId.value) as never)
}
</script>

<template>
  <FormView title="Ubah Role" :form="roles.form({ id: roleId })" @submitted="onSubmitted" />
</template>
