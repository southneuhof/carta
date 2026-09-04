<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { users } from '../users.resource'
import { user } from '@southneuhof/api/routes/users/users.entity'
import type { z } from 'zod/v4'

type UserUpdate = z.input<typeof user.schemas.update>

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
