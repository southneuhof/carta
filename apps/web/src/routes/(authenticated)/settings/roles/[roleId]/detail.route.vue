<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, useResourceRuntime } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { roles } from '../roles.resource'
import type { RouteTab } from '@/router/tabs'
import { rolePermissions } from './detail/permissions/role-permissions.resource'

const route = useRoute('settings-roles-detail')
const router = useRouter()
const roleId = route.params.roleId
const deleting = ref(false)
const updateTarget = (() => {
  const target = roles.capabilities?.update?.to
  return target && { name: target.name, params: target.params(roleId) }
})()

const tabs = rolePermissions.capabilities?.list
  ? [{ action: rolePermissions.capabilities.list, label: 'Permissions' }] as const satisfies readonly RouteTab[]
  : []

function deleteErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && !Array.isArray(error) && 'error' in error && error.error === 'role_in_use') {
    const details = error as { systemAssignmentCount?: unknown; projectAssignmentCount?: unknown }
    const systemCount = typeof details.systemAssignmentCount === 'number' ? details.systemAssignmentCount : 0
    const projectCount = typeof details.projectAssignmentCount === 'number' ? details.projectAssignmentCount : 0
    return 'Role is in use. System assignments: ' + systemCount + '. Project assignments: ' + projectCount + '. Deactivate the role after review.'
  }
  return useResourceRuntime().adapters.data.normalizeError(error).message || 'Role could not be deleted.'
}

async function remove() {
  if (deleting.value) return
  deleting.value = true
  try {
    await roles.delete(roleId)
    toast.success('Data berhasil dihapus.')
    await router.replace({ name: roles.capabilities?.list?.to?.name })
  } catch (error) {
    toast.error(deleteErrorMessage(error))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView title="Detail Role" :back-to="{ name: roles.capabilities?.list?.to?.name }" :resource="roles" :id="roleId">
      <template #controls>
        <RouterLink v-if="updateTarget" :to="updateTarget"><Button>Ubah</Button></RouterLink>
        <Button color="error" :disabled="deleting" @click="remove">Hapus</Button>
      </template>
    </DetailView>
    <Tabs label="Role" :items="tabs" />
    <AppRouterView />
  </div>
</template>
