<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'
import { learningMaterials } from '../learning-materials.resource'

const route = useRoute('orientation-learning-materials-detail')
const materialId = String(route.params.learningMaterialId)
const tabs = [
  {
    action: { permission: 'detail-learning-materials', to: { name: 'orientation-learning-materials-detail-configuration', params: { learningMaterialId: materialId } } as never },
    label: 'Konfigurasi Ujian',
  },
  { action: { permission: 'detail-learning-materials', to: { name: 'orientation-learning-materials-detail-questions', params: { learningMaterialId: materialId } } as never }, label: 'Soal Ujian' },
] as const satisfies readonly RouteTab[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="learningMaterials.detail({ id: materialId })" title="Detail Materi" :back-to="{ name: 'orientation-learning-materials' }" />
    <Tabs label="Materi" :items="tabs" />
    <AppRouterView />
  </div>
</template>
