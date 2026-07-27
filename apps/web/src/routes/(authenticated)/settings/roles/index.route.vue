<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
import type { Role } from './roles.operations'
</script>

<template>
  <ListView title="Roles" :resource="roles">
    <template #controls>
      <RouterLink :to="roles.actions.create!.to as never"><Button>Tambah</Button></RouterLink>
    </template>
    <template #cell:name="{ value, record }">
      <RouterLink :to="roles.rowLink!(record as Role)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
