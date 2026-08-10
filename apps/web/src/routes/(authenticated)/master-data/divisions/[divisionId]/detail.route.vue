<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { divisions } from '../../master-data.resources'

const route = useRoute('master-data-divisions-detail')
</script>

<template><DetailView title="Divisions" :back-to="{ name: 'master-data-divisions' }" :resource="divisions" :id="String(route.params.divisionId)" /></template>
