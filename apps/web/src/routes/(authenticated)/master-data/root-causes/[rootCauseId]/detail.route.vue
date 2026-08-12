<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { rootCauses } from '../root-causes.resource'

const route = useRoute('master-data-root-causes-detail')
</script>

<template><DetailView v-bind="rootCauses.detail({ id: String(route.params.rootCauseId) })" title="Penyebab QHSSE" :back-to="{ name: 'master-data-root-causes' }" /></template>
