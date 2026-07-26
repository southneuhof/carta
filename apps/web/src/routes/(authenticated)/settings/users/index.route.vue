<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ListView, standardControls } from '@southneuhof/is-vue-framework'
import { users } from '@/framework/adapters/resources/users'

definePage({ name: 'users', meta: { title: 'Pengguna', moduleName: 'settings' } })

const router = useRouter()
const controls = standardControls({ resource: users, surface: 'list' })
</script>

<template>
  <ListView title="Pengguna" :table="users.table()" :controls="controls">
    <template #cell:name="{ value, record }">
      <a :href="users.routes.detail?.(String(record.id))" @click.prevent="router.push(users.routes.detail!(String(record.id)))">
        {{ value }}
      </a>
    </template>
  </ListView>
</template>
