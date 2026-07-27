<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { users, type User } from '@/framework/adapters/resources/users'

</script>

<template>
  <ListView title="Pengguna" :resource="users">
    <template #cell:name="{ value, record }">
      <RouterLink :to="users.rowLink!(record as User)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
