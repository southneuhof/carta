<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { syllabusCategories } from '../syllabus-categories.resource'

const route = useRoute('orientation-syllabus-categories-detail')
const categoryId = String(route.params.syllabusCategoryId)
const tabs = [
  { action: { permission: 'list-syllabus-categories', to: { name: 'orientation-syllabus-categories-detail-syllabi', params: { syllabusCategoryId: categoryId } } as never }, label: 'Silabus' },
  { action: { permission: 'list-syllabus-categories', to: { name: 'orientation-syllabus-categories-detail-roles', params: { syllabusCategoryId: categoryId } } as never }, label: 'Daftar Role' },
] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="syllabusCategories.detail({ id: categoryId })" title="Detail Kategori Silabus" :back-to="{ name: 'orientation-syllabus-categories' }" />
    <Tabs label="Kategori Silabus" :items="tabs" />
    <AppRouterView />
  </div>
</template>
