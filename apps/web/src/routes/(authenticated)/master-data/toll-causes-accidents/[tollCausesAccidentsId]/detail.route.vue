<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { tollCausesAccidents } from '../toll-causes-accidents.resource'

const route = useRoute('master-data-toll-causes-accidents-detail')
</script>

<template>
  <DetailView
    v-bind="tollCausesAccidents.detail({ id: String(route.params.tollCausesAccidentsId) })"
    title="Detail Faktor Kecelakaan"
    :back-to="{ name: 'master-data-toll-causes-accidents' }"
  />
</template>
