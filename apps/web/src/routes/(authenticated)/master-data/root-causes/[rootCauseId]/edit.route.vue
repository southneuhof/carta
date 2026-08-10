<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { rootCauses } from '../../master-data.resources'

const route = useRoute('master-data-root-causes-edit')
</script>

<template><FormView title="Edit Root Causes" :resource="rootCauses" :id="String(route.params.rootCauseId)" /></template>
