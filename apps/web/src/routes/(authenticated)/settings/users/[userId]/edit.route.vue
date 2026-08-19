<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { users } from '../users.resource'
import type { UserUpdate } from '../users.schema'

// Not listed in the parent tab array, so it is reachable from the update
// control and by URL, but is never a tab.

const route = useRoute('settings-users-edit')
const userId = computed(() => route.params.userId)
const form = computed(() => {
  const action = users.update({ id: userId.value })
  return {
    ...action,
    run: async (input: UserUpdate) => {
      const current = await users.detail({ id: userId.value }).run()
      if (!current) throw new Error('User not found.')
      if (current.statusCode === 'active' && input.statusCode && input.statusCode !== 'active' && !window.confirm('Disabling this user will end all active sessions. Continue?'))
        throw new Error('Status change cancelled.')
      return action.run(input)
    },
  }
})
</script>

<template>
  <FormView v-bind="form" title="Edit User" />
</template>
