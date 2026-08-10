<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { rootCauses } from '../root-causes.resource'

const route = useRoute('master-data-root-causes-detail')
</script>

<template><DetailView title="Penyebab QHSSE" :back-to="{ name: 'master-data-root-causes' }" :resource="rootCauses" :id="String(route.params.rootCauseId)" /></template>
