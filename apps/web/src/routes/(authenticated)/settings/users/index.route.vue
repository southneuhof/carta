<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { users } from './users.resource'
import { useResourceRuntime } from '@southneuhof/is-vue-framework'

const canCreate = useResourceRuntime().adapters.access.allows({ operation: 'create', permission: 'create-users' })
</script>

<template>
  <div>
    <RouterLink v-if="canCreate" :to="{ name: 'settings-users-create' }">Create User</RouterLink>
    <ListView title="Users" :resource="users" />
  </div>
</template>
