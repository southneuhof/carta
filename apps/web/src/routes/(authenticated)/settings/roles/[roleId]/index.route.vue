<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, standardControls } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'

definePage({ name: 'roles-detail', meta: { title: 'Detail Role', moduleName: 'settings' } })

const route = useRoute()
const router = useRouter()
const roleId = computed(() => String((route.params as { roleId?: string }).roleId ?? ''))

async function remove() {
  try {
    await roles.remove(roleId.value)
    toast.success('Role dihapus.')
    void router.push(roles.routes.list!)
  } catch (error) {
    toast.error((error as { message?: string }).message ?? 'Gagal menghapus role.')
  }
}

const controls = computed(() => standardControls({ resource: roles, surface: 'detail', id: roleId.value, onDelete: remove }))
</script>

<template>
  <DetailView title="Detail Role" :detail="roles.detail({ id: roleId })" :controls="controls" />
</template>
