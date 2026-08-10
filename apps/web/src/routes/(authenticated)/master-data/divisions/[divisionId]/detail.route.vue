<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { divisions } from '../divisions.resource'

const route = useRoute('master-data-divisions-detail')
</script>

<template><DetailView title="Divisi" :back-to="{ name: 'master-data-divisions' }" :resource="divisions" :id="String(route.params.divisionId)" /></template>
