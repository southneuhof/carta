<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { users } from './users.resource'
import type { User } from './users.operations'

</script>

<template>
  <ListView title="Pengguna" :resource="users" :table-options="{ pagination: 'always' }">
    <template #cell:name="{ value, record }">
      <RouterLink :to="users.rowLink!(record as User)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
