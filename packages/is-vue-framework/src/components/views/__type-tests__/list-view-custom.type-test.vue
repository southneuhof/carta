<script setup lang="ts">
import ListView from '../ListView.vue'
import type { CollectionLoadContext, CollectionResult } from '../../../contracts'

type Role = { id: string; name: string }
type RoleQuery = { state?: 'active' | 'archived' }

const table = {
  fields: { name: { label: 'Name' } },
  run: async (_context: CollectionLoadContext<RoleQuery>): Promise<CollectionResult<Role>> => ({ data: [] }),
}
</script>

<template>
  <ListView v-bind="table" presentation="custom">
    <template #custom="{ records, query, meta, loading, error, empty, refresh, updateQuery }">
      <span>{{ records[0]?.name }}</span>
      <span>{{ query.state }}</span>
      <span>{{ meta?.total }} {{ loading }} {{ error?.message }} {{ empty }}</span>
      <button type="button" @click="refresh()">Refresh</button>
      <button type="button" @click="updateQuery({ page: 1 })">Page</button>
    </template>
  </ListView>
</template>
