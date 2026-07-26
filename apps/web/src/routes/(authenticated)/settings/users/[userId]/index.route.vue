<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView, standardControls } from '@southneuhof/is-vue-framework'
import { users } from '@/framework/adapters/resources/users'

definePage({ name: 'users-detail', meta: { title: 'Detail Pengguna', moduleName: 'settings' } })

const route = useRoute()
const userId = computed(() => String((route.params as { userId?: string }).userId ?? ''))
const controls = computed(() => standardControls({ resource: users, surface: 'detail', id: userId.value }))
</script>

<template>
  <DetailView title="Detail Pengguna" :detail="users.detail({ id: userId })" :controls="controls" />
</template>
