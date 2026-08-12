<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { divisions } from '../divisions.resource'

const route = useRoute('master-data-divisions-edit')
</script>

<template><FormView v-bind="divisions.update({ id: String(route.params.divisionId) })" title="Edit Divisi" /></template>
