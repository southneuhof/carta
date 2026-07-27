<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
import type { Role } from './roles.operations'

</script>

<template>
  <ListView title="Roles" :resource="roles">
    <template #cell:name="{ value, record }">
      <RouterLink :to="roles.rowLink!(record as Role)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
