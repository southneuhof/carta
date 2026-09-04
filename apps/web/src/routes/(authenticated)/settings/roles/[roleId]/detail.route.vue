<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import ConfirmationDialog from '@southneuhof/loom/components/composites/ConfirmationDialog.vue'
import { DetailView } from '@southneuhof/loom'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import { errorMessage } from '@/framework/adapters/data/normalize'
import { roles } from '../roles.resource'
import type { RouteTab } from '@/router/tabs'

const route = useRoute('settings-roles-detail')
const router = useRouter()
const roleId = route.params.roleId
const detail = roles.detail({ id: roleId })
const canDelete = detail.can?.('delete') ?? false
const deleting = ref(false)
const updateTarget = roles.list().updateRoute?.({ id: roleId } as never)

const tabs = [
  { action: { permission: 'view-role-permissions', to: { name: 'settings-roles-detail-permissions', params: { roleId: String(roleId) } } as never }, label: 'Permissions' },
] as const satisfies readonly RouteTab[]

async function remove() {
  if (deleting.value) return
  deleting.value = true
  try {
    await roles.delete({ id: roleId }).run()
    toast.success('Data berhasil dihapus.')
    await router.replace({ name: 'settings-roles' })
  } catch (error) {
    toast.error(errorMessage(error, 'Role could not be deleted.'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="roles.detail({ id: roleId })">
      <template #controls>
        <RouterLink v-if="updateTarget" :to="updateTarget"><Button>Ubah</Button></RouterLink>
        <ConfirmationDialog v-if="canDelete" title="Hapus role?" message="Data yang dihapus tidak dapat dikembalikan." :on-confirm="remove">
          <template #trigger>
            <Button color="error" :disabled="deleting">Hapus</Button>
          </template>
        </ConfirmationDialog>
      </template>
    </DetailView>
    <Tabs label="Role" :items="tabs" />
    <AppRouterView />
  </div>
</template>
