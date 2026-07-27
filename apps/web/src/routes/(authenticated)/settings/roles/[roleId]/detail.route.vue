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
  const target = roles.actions.update?.to
  return typeof target === 'function' ? target(roleId) : target
})()

const tabs = [{ action: rolePermissions.actions.list! as import('@southneuhof/is-vue-framework').NavigableResourceAction, label: 'Permissions' }] as const satisfies readonly RouteTab[]

async function remove() {
  if (deleting.value) return
  deleting.value = true
  try {
    await roles.remove(roleId)
    toast.success('Data berhasil dihapus.')
    await router.replace(roles.actions.list!.to as never)
  } catch (error) {
    toast.error(useResourceRuntime().adapters.data.normalizeError(error).message || 'Gagal menghapus data.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <DetailView title="Detail Role" :resource="roles" :id="roleId">
      <template #controls>
        <RouterLink v-if="updateTarget" :to="updateTarget"><Button>Ubah</Button></RouterLink>
        <Button color="error" :disabled="deleting" @click="remove">Hapus</Button>
      </template>
      <template #footer>
        <RouterLink :to="roles.actions.list!.to as never"><Button variant="text">Kembali</Button></RouterLink>
      </template>
    </DetailView>
    <Tabs label="Role" :items="tabs" />
    <AppRouterView />
  </div>
</template>
