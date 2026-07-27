<script setup lang="ts">
/**
 * Copying permissions from another role is a custom workflow, so it stays
 * ordinary Vue code behind a custom control rather than a fake CRUD operation.
 */
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { roles } from '../../../roles.resource'
import type { Role } from '../../../roles.operations'

const props = defineProps<{ targetRoleId: string }>()
const emit = defineEmits<{ (event: 'copied'): void }>()

const open = ref(false)
const options = ref<Role[]>([])
const sourceRoleId = ref('')
const busy = ref(false)

async function show() {
  open.value = true
  const result = await roles.table().table.load!({ query: { limit: '100' }, searchParameters: {} })
  options.value = (result as { data: Role[] }).data.filter((role) => role.id !== props.targetRoleId)
}

async function copy() {
  if (!sourceRoleId.value || busy.value) return
  busy.value = true
  try {
    const baseURL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseURL}/custom/mappingrolepermission/copy`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_role_id: sourceRoleId.value, target_role_id: props.targetRoleId }),
    })
    if (!response.ok) throw await response.json().catch(() => new Error(response.statusText))
    toast.success('Berhasil menyalin permission dari role!')
    open.value = false
    emit('copied')
  } catch (error) {
    toast.error((error as { message?: string }).message ?? 'Gagal menyalin permission.')
  } finally {
    busy.value = false
  }
}

defineExpose({ show })
</script>

<template>
  <div>
    <button type="button" data-control="copy-permissions" @click="show">Salin dari Role Lain</button>

    <div v-if="open" role="dialog" aria-label="Pilih Role Sumber">
      <label for="source-role">Role</label>
      <select id="source-role" v-model="sourceRoleId">
        <option value="">Pilih role</option>
        <option v-for="role in options" :key="role.id" :value="role.id">{{ role.name }}</option>
      </select>
      <button type="button" data-control="copy-permissions-confirm" :disabled="!sourceRoleId || busy" @click="copy">Salin</button>
      <button type="button" data-control="copy-permissions-cancel" @click="open = false">Batal</button>
    </div>
  </div>
</template>
