<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ListView, standardControls } from '@southneuhof/is-vue-framework'
import { overtimes } from '@/framework/adapters/resources/overtimes'

definePage({ name: 'overtimes', meta: { title: 'Lembur', moduleName: 'hr' } })

const router = useRouter()
const controls = standardControls({ resource: overtimes, surface: 'list' })
</script>

<template>
  <ListView title="Lembur" :table="overtimes.table()" :controls="controls">
    <template #cell:date="{ value, record }">
      <a :href="overtimes.routes.detail?.(String(record.id))" @click.prevent="router.push(overtimes.routes.detail!(String(record.id)))">
        {{ value }}
      </a>
    </template>
  </ListView>
</template>
