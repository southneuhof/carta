<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { overtimes } from './overtimes.resource'
import type { Overtime } from './overtimes.operations'

</script>

<template>
  <ListView title="Lembur" :resource="overtimes">
    <template #controls>
      <RouterLink :to="overtimes.actions.create!.to as never"><Button>Tambah</Button></RouterLink>
    </template>
    <template #cell:date="{ value, record }">
      <RouterLink :to="overtimes.rowLink!(record as Overtime)">
        {{ value }}
      </RouterLink>
    </template>
  </ListView>
</template>
