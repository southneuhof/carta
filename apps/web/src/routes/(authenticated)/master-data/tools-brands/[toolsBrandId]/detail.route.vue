<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { toolsBrands } from '../tools-brands.resource'

const route = useRoute('master-data-tools-brands-detail')
</script>

<template><DetailView v-bind="toolsBrands.detail({ id: String(route.params.toolsBrandId) })" title="Detail Merk Alat Berat &amp; Alat Ukur/Uji" :back-to="{ name: 'master-data-tools-brands' }" /></template>

