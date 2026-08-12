<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { divisions } from '../divisions.resource'

const route = useRoute('master-data-divisions-detail')
</script>

<template><DetailView v-bind="divisions.detail({ id: String(route.params.divisionId) })" title="Divisi" :back-to="{ name: 'master-data-divisions' }" /></template>
