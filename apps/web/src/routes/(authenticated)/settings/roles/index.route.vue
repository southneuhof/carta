<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ListView, standardControls } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'

definePage({ name: 'roles', meta: { title: 'Roles', moduleName: 'settings' } })

const router = useRouter()
const controls = standardControls({ resource: roles, surface: 'list' })
</script>

<template>
  <ListView title="Roles" :table="roles.table()" :controls="controls">
    <template #cell:name="{ value, record }">
      <a :href="roles.routes.detail?.(String(record.id))" @click.prevent="router.push(roles.routes.detail!(String(record.id)))">
        {{ value }}
      </a>
    </template>
  </ListView>
</template>
