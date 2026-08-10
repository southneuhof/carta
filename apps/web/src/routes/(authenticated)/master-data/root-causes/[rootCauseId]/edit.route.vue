<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { rootCauses } from '../root-causes.resource'

const route = useRoute('master-data-root-causes-edit')
</script>

<template><FormView title="Edit Penyebab QHSSE" :resource="rootCauses" :id="String(route.params.rootCauseId)" /></template>
